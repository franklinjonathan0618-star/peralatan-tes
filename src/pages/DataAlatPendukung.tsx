import React, { useState, useMemo, useCallback, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Printer, Trash, FileDown, Upload } from 'lucide-react';
import { AddAlatPendukungDialog } from '@/components/dialogs/AddAlatPendukungDialog';
import { ViewAlatPendukungDialog } from '@/components/dialogs/ViewAlatPendukungDialog';
import { EditAlatPendukungDialog } from '@/components/dialogs/EditAlatPendukungDialog';
import { useToast } from '@/components/ui/use-toast';
import { useAlatPendukung, useAddAlatPendukung, useDeleteAlatPendukung, useUpdateAlatPendukung } from '@/hooks/useAlatPendukung';
import { usePagePermission } from '@/hooks/usePagePermission';
import { exportToExcel, importFromExcel, validateImportedData } from '@/lib/excelUtils';
import { SimplePagination, paginateData, getTotalPages } from '@/components/ui/SimplePagination';
import AlatDetailPopup from '@/components/AlatDetailPopup';
import FotoViewerModal from '@/components/FotoViewerModal';
import { parseFotoList } from '@/utils/fotoUtils';
import { TableScrollWrapper } from '@/components/ui/TableScrollWrapper';

import type { AlatPendukung } from '@/types';

// Custom print implementation

const DataAlatPendukung = () => {
  const { toast } = useToast();

  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [isPrinting, setIsPrinting] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [expandedRowId, setExpandedRowId] = useState<string | null>(null);
  const [fotoModal, setFotoModal] = useState<{ src: string | string[]; alt: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleRowClick = useCallback((id: string) => {
    setExpandedRowId(prev => (prev === id ? null : id));
  }, []);

  const { can_create: canCreate, can_edit: canEdit, can_delete: canDelete, can_import: canImport, can_export_excel: canExportExcel, can_print: canPrint } = usePagePermission('dataAlatPendukung');
  const canShowActions = canEdit || canDelete;

  const { data: alatData = [], isLoading } = useAlatPendukung();
  const addAlatMutation = useAddAlatPendukung();
  const updateAlatMutation = useUpdateAlatPendukung();
  const deleteAlatMutation = useDeleteAlatPendukung();

  const getKondisiColor = (kondisi: string | null | undefined): string => {
    if (!kondisi) return 'bg-gray-100 text-gray-800';
    switch (kondisi.toLowerCase()) {
      case 'baik':
        return 'bg-green-100 text-green-800';
      case 'maintenance':
        return 'bg-yellow-100 text-yellow-800';
      case 'rusak':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getKondisiIcon = (kondisi: string | null | undefined) => {
    if (!kondisi) return <div className="w-2 h-2 rounded-full bg-gray-500" />;
    switch (kondisi.toLowerCase()) {
      case 'baik':
        return <div className="w-2 h-2 rounded-full bg-green-500" />;
      case 'maintenance':
        return <div className="w-2 h-2 rounded-full bg-yellow-500" />;
      case 'rusak':
        return <div className="w-2 h-2 rounded-full bg-red-500" />;
      default:
        return <div className="w-2 h-2 rounded-full bg-gray-500" />;
    }
  };

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>): void => {
    setSearchQuery(e.target.value);
    setCurrentPage(1);
  };

  const handleAddAlat = async (data: any) => {
    // We let the mutation throw so the AddAlatPendukungDialog's catch handles error toast.
    await addAlatMutation.mutateAsync(data);
  };

  const handleUpdate = async (data: any) => {
    try {
      await updateAlatMutation.mutateAsync(data);
      toast({
        title: 'Berhasil',
        description: 'Data alat pendukung berhasil diupdate',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Gagal mengupdate data alat pendukung',
        variant: 'destructive',
      });
      throw error; // Rethrow so the Edit dialog knows not to close!
    }
  };

  const handleDelete = async (id: string): Promise<void> => {
    if (confirm('Apakah Anda yakin ingin menghapus data ini?')) {
      try {
        await deleteAlatMutation.mutateAsync(id);
        toast({
          title: 'Berhasil',
          description: 'Data alat pendukung berhasil dihapus',
        });
      } catch (error) {
        toast({
          title: 'Error',
          description: 'Gagal menghapus data alat pendukung',
          variant: 'destructive',
        });
      }
    }
  };

  const filteredData = useMemo((): AlatPendukung[] => {
    if (!searchQuery.trim()) return alatData;
    const query = searchQuery.toLowerCase();
    return alatData.filter((item: AlatPendukung) =>
      (item.namaAlat?.toLowerCase().includes(query)) ||
      (item.jenisAlat?.toLowerCase().includes(query)) ||
      (item.noLambung?.toLowerCase().includes(query)) ||
      (item.lokasi?.toLowerCase().includes(query)) ||
      (item.lokasiSebelumnya?.toLowerCase().includes(query)) ||
      (item.lokasi_sebelumnya?.toLowerCase().includes(query)) ||
      (item.kondisi?.toLowerCase().includes(query))
    );
  }, [alatData, searchQuery]);

  const handlePrint = useCallback((): void => {
    if (filteredData.length === 0) {
      toast({
        title: "Tidak ada data",
        description: "Tidak ada data yang bisa dicetak.",
        variant: "destructive" as const,
      });
      return;
    }

    setIsPrinting(true);

    try {
      // Create a new window for printing
      const printWindow = window.open('', '_blank');
      if (!printWindow) {
        throw new Error('Gagal membuka jendela cetak');
      }

      // Get current date
      const currentDate = new Date().toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });

      // Create table rows
      const tableRows = filteredData.map(item => `
        <tr>
          <td style="border: 1px solid #ddd; padding: 8px;">${item.noLambung || '-'}</td>
          <td style="border: 1px solid #ddd; padding: 8px;">${item.namaAlat || '-'}</td>
          <td style="border: 1px solid #ddd; padding: 8px;">${item.jenisAlat || '-'}</td>
          <td style="border: 1px solid #ddd; padding: 8px;">${item.merk || '-'}</td>
          <td style="border: 1px solid #ddd; padding: 8px;">${item.tipe || '-'}</td>
          <td style="border: 1px solid #ddd; padding: 8px;">${item.lokasi || '-'}</td>
          <td style="border: 1px solid #ddd; padding: 8px;">${item.lokasiSebelumnya || item.lokasi_sebelumnya || '-'}</td>
          <td style="border: 1px solid #ddd; padding: 8px;">${item.kondisi || '-'}</td>
          <td style="border: 1px solid #ddd; padding: 8px;">${item.foto ? 'Ada' : '-'}</td>
        </tr>
      `).join('');

      // Create the HTML content
      const printContent = `
        <!DOCTYPE html>
        <html>
          <head>
            <title>Cetak Data Alat Pendukung</title>
            <style>
              @page { 
                size: A4 landscape;
                margin: 1cm;
              }
              body { 
                font-family: Arial, sans-serif;
                margin: 0;
                padding: 20px;
                color: #333;
              }
              .header {
                text-align: left;
                margin-bottom: 20px;
                border-bottom: 2px solid #000;
                padding-bottom: 10px;
              }
              .company-name {
                font-weight: bold;
                font-size: 14px;
                margin-bottom: 2px;
              }
              .company-division {
                font-size: 12px;
                margin-bottom: 15px;
              }
              .title-section {
                text-align: center;
                margin-bottom: 20px;
              }
              h1 { 
                text-align: center;
                margin: 0 0 10px 0;
                color: #1a1a1a;
                font-size: 16px;
              }
              .print-date {
                color: #666;
                margin-bottom: 10px;
                font-size: 11px;
              }
              table { 
                width: 100%;
                border-collapse: collapse;
                margin-top: 20px;
                font-size: 14px;
              }
              th { 
                background-color: #f5f5f5;
                text-align: left;
                font-weight: bold;
                padding: 8px;
                border: 1px solid #ddd;
              }
              td { 
                padding: 8px;
                border: 1px solid #ddd;
              }
              tr:nth-child(even) {
                background-color: #f9f9f9;
              }
              .footer {
                margin-top: 20px;
                text-align: right;
                font-size: 12px;
                color: #666;
              }
              @media print {
                @page { 
                  margin: 1cm;
                  size: A4 landscape;
                }
                body { 
                  margin: 0;
                  padding: 20px;
                }
              }
            </style>
          </head>
          <body>
            <div class="header">
              <div class="company-name">IPTA PERDANA</div>
              <div class="company-division">Divisi Infrastruktur - Peralatan</div>
            </div>
            <div class="title-section">
              <h1>Data Alat Pendukung</h1>
              <div class="print-date">Dicetak pada: ${currentDate}</div>
            </div>
            
            <table>
              <thead>
                <tr>
                  <th>No. Lambung</th>
                  <th>Nama Alat</th>
                  <th>Jenis</th>
                  <th>Merk</th>
                  <th>Type</th>
                  <th>Lokasi</th>
                  <th>Lokasi Sebelumnya</th>
                  <th>Kondisi</th>
                  <th>Foto</th>
                </tr>
              </thead>
              <tbody>
                ${tableRows}
              </tbody>
            </table>
            
            <div class="footer">
              Total Data: ${filteredData.length}
            </div>
            
            <script>
              // Auto-print when the window loads
              window.onload = function() {
                try {
                  setTimeout(function() {
                    window.print();
                    // Close the window after printing
                    setTimeout(function() {
                      window.close();
                    }, 500);
                  }, 500);
                } catch (e) {
                  console.error('Print error:', e);
                  window.close();
                }
              };
              
              // Close the window if user cancels print
              const beforeUnloadHandler = function(e) {
                e.preventDefault();
                // For modern browsers
                e.returnValue = '';
                return '';
              };
              window.addEventListener('beforeunload', beforeUnloadHandler, { capture: true });
            </script>
          </body>
        </html>
      `;

      // Write the content to the new window
      printWindow.document.open();
      printWindow.document.write(printContent);
      printWindow.document.close();

      // Handle print completion
      printWindow.onafterprint = function () {
        printWindow.close();
        setIsPrinting(false);
        toast({
          title: "Pencetakan selesai",
          description: "Dokumen berhasil dicetak.",
          variant: "default" as const,
        });
      };

    } catch (error) {
      console.error('Error saat mencetak:', error);
      setIsPrinting(false);
      toast({
        title: "Gagal mencetak",
        description: "Terjadi kesalahan saat mencetak dokumen. Pastikan pop-up diizinkan.",
        variant: "destructive" as const,
      });
    }
  }, [filteredData, getKondisiColor, toast]);

  const handleExportPDF = useCallback(async () => {
    if (filteredData.length === 0) {
      toast({
        title: "Tidak ada data",
        description: "Tidak ada data yang bisa diekspor.",
        variant: "destructive" as const,
      });
      return;
    }

    setIsExporting(true);

    try {
      // Load jsPDF and autoTable
      const { jsPDF } = await import('jspdf');
      const autoTable = (await import('jspdf-autotable')).default;

      // Create a new PDF document in landscape mode
      const doc = new jsPDF({
        orientation: 'landscape',
        unit: 'mm',
        format: 'a4'
      });

      // Add header with company info
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text('Cabang Papua', 14, 15);

      doc.setFontSize(12);
      doc.setFont('helvetica', 'normal');
      doc.text('Peralatan', 14, 22);

      // Add a line below header
      doc.setLineWidth(0.5);
      doc.line(14, 26, 270, 26);

      // Add title
      doc.setFontSize(16);
      doc.setFont('helvetica', 'bold');
      doc.text('Data Alat Pendukung', 142, 35, { align: 'center' });

      // Add date
      const currentDate = new Date().toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.text(`Dicetak pada: ${currentDate}`, 14, 42);

      // Prepare data for the table
      const tableColumn = ['No', 'Nama Alat', 'No. Lambung', 'Jenis', 'Kondisi', 'Lokasi', 'Keterangan'];
      const tableRows: any[] = [];

      filteredData.forEach((item: AlatPendukung, index: number) => {
        const rowData = [
          (index + 1).toString(),
          item.namaAlat || '-',
          item.noLambung || '-',
          item.jenisAlat || '-',
          item.kondisi || '-',
          item.lokasi || '-',
          item.keterangan || '-',
        ];
        tableRows.push(rowData);
      });

      // Add table to PDF using autoTable
      autoTable(doc, {
        head: [tableColumn],
        body: tableRows,
        startY: 50,
        styles: {
          fontSize: 8,
          cellPadding: 2,
          lineWidth: 0.1,
        },
        headStyles: {
          fillColor: [59, 130, 246], // blue-500
          textColor: 255,
          fontStyle: 'bold',
        },
        alternateRowStyles: {
          fillColor: [245, 245, 245],
        },
      });

      // Add total count
      doc.setFontSize(10);
      doc.text(`Total Data: ${filteredData.length}`, 14, (doc as any).lastAutoTable.finalY + 10);

      // Save the PDF
      doc.save(`data-alat-pendukung-${new Date().toISOString().split('T')[0]}.pdf`);

      toast({
        title: "Ekspor berhasil",
        description: "Data berhasil diekspor ke PDF.",
        variant: "default" as const,
      });

    } catch (error) {
      console.error('Error saat mengekspor PDF:', error);
      toast({
        title: "Gagal mengekspor",
        description: "Terjadi kesalahan saat mengekspor data ke PDF.",
        variant: "destructive" as const,
      });
    } finally {
      setIsExporting(false);
    }
  }, [filteredData, toast]);

  // Export to Excel handler
  const handleExportToExcel = useCallback(() => {
    if (filteredData.length === 0) {
      toast({
        title: "Tidak ada data",
        description: "Tidak ada data yang bisa diekspor.",
        variant: "destructive" as const,
      });
      return;
    }

    try {
      const dataToExport = filteredData.map((item: AlatPendukung) => ({
        'No Lambung': item.noLambung || '-',
        'Nama Alat': item.namaAlat || '-',
        'Jenis Alat': item.jenisAlat || '-',
        'Merk': item.merk || '-',
        'Type': item.tipe || '-',
        'Lokasi': item.lokasi || '-',
        'Lokasi Sebelumnya': item.lokasiSebelumnya || item.lokasi_sebelumnya || '-',
        'Kondisi': item.kondisi || '-',
        'Status': item.status ? item.status.charAt(0).toUpperCase() + item.status.slice(1).toLowerCase() : 'Standby',
        'Keterangan': item.keterangan || '-',
      }));

      exportToExcel(dataToExport, 'data_alat_pendukung');
    } catch (error) {
      console.error('Error exporting to Excel:', error);
      toast({
        title: "Error",
        description: "Gagal mengekspor data ke Excel",
        variant: "destructive" as const,
      });
    }
  }, [filteredData, toast]);

  // Import from Excel handler
  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsImporting(true);
    try {
      const importedData = await importFromExcel(file);

      // Validate expected columns — hanya Nama Alat yang wajib
      const expectedColumns = ['Nama Alat'];
      const validation = validateImportedData(importedData, expectedColumns);

      if (!validation.valid) {
        toast({
          title: "Error: Kolom Tidak Ditemukan",
          description: `Kolom wajib yang hilang: ${validation.missingColumns.join(', ')}. Pastikan file Excel menggunakan header yang benar.`,
          variant: "destructive" as const,
        });
        setIsImporting(false);
        if (fileInputRef.current) fileInputRef.current.value = '';
        return;
      }

      // Process imported data
      let successCount = 0;
      let errorCount = 0;
      const errors: string[] = [];

      for (let i = 0; i < importedData.length; i++) {
        try {
          const item = importedData[i];

          // Validate required fields — hanya Nama Alat
          if (!item['Nama Alat']) {
            throw new Error('Kolom "Nama Alat" kosong');
          }

          // Map imported data to AlatPendukung structure
          const newAlatPendukung: any = {
            namaAlat: String(item['Nama Alat'] || '').trim(),
            jenisAlat: String(item['Jenis Alat'] || '').trim() || null,
            noLambung: String(item['No Lambung'] || item['No. Lambung'] || '').trim() || null,
            kondisi: String(item['Kondisi'] || 'Baik').trim(),
            lokasi: String(item['Lokasi'] || '').trim() || null,
            lokasiSebelumnya: String(item['Lokasi Sebelumnya'] || item['Lokasi_Sebelumnya'] || item['lokasi_sebelumnya'] || '').trim() || null,
            keterangan: String(item['Keterangan'] || '').trim() || null,
            merk: String(item['Merk'] || '').trim() || null,
            tipe: String(item['Type'] || item['Tipe'] || '').trim() || null,
            status: String(item['Status'] || 'standby').trim(),
          };

          // Add to database
          await addAlatMutation.mutateAsync(newAlatPendukung);

          successCount++;
        } catch (error) {
          errorCount++;
          const errorMsg = `Baris ${i + 2}: ${error instanceof Error ? error.message : 'Error tidak diketahui'}`;
          errors.push(errorMsg);
          console.error(`Error processing row ${i + 1}:`, error);
        }
      }

      // Show result message with error details
      const statusTitle = successCount > 0 && errorCount === 0
        ? 'Import Berhasil'
        : successCount > 0 && errorCount > 0
          ? 'Import Sebagian Berhasil'
          : 'Import Gagal';

      let description = `${successCount} data berhasil diimpor`;
      if (errorCount > 0) {
        description += `, ${errorCount} data gagal.`;
        // Tampilkan detail error (maks 3 baris pertama)
        const shownErrors = errors.slice(0, 3);
        description += '\n' + shownErrors.join('\n');
        if (errors.length > 3) description += `\n...dan ${errors.length - 3} error lainnya (lihat console).`;
      }

      toast({
        title: statusTitle,
        description,
        variant: errorCount > 0 && successCount === 0 ? 'destructive' : 'default',
      });

      if (errors.length > 0) {
        console.log('Import errors detail:', errors);
      }
    } catch (error) {
      console.error('Error importing Excel:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Gagal mengimpor data dari Excel",
        variant: "destructive" as const,
      });
    } finally {
      setIsImporting(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      e.target.value = '';
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="container mx-auto py-6">
          <div className="flex justify-center items-center h-64">
            <div className="text-lg">Loading...</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto py-6 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <h1 className="text-2xl font-bold text-gray-800">Data Alat Pendukung</h1>
          <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx,.xls,.csv"
              onChange={handleFileChange}
              className="hidden"
            />
            {canImport && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleImportClick}
                disabled={isImporting}
                className="flex items-center gap-2 w-full sm:w-auto"
              >
                <Upload className="h-4 w-4" />
                {isImporting ? 'Mengimpor...' : 'Import Excel'}
              </Button>
            )}
            {canExportExcel && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleExportToExcel}
                className="flex items-center gap-2 w-full sm:w-auto"
              >
                <FileDown className="h-4 w-4" />
                Export Excel
              </Button>
            )}
            {canPrint && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleExportPDF}
                disabled={isExporting}
                className="flex items-center gap-2 w-full sm:w-auto"
              >
                <FileDown className="h-4 w-4" />
                {isExporting ? 'Mengekspor...' : 'Export PDF'}
              </Button>
            )}
            {canPrint && (
              <Button
                variant="outline"
                size="sm"
                onClick={handlePrint}
                disabled={isPrinting}
                className="flex items-center gap-2 w-full sm:w-auto"
              >
                <Printer className="h-4 w-4" />
                {isPrinting ? 'Mencetak...' : 'Cetak'}
              </Button>
            )}
            {canCreate && <AddAlatPendukungDialog onSubmit={handleAddAlat} className="w-full sm:w-auto" />}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <h3 className="font-semibold text-gray-500">Total Alat</h3>
            <p className="text-3xl font-bold">{alatData.length}</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <h3 className="font-semibold text-gray-500">Kondisi Baik</h3>
            <p className="text-3xl font-bold text-green-600">
              {alatData.filter(item => item.kondisi && item.kondisi.toLowerCase() === 'baik').length}
            </p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <h3 className="font-semibold text-gray-500">Dalam Maintenance</h3>
            <p className="text-3xl font-bold text-yellow-600">
              {alatData.filter(item => item.kondisi && item.kondisi.toLowerCase() === 'maintenance').length}
            </p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <h3 className="font-semibold text-gray-500">Rusak</h3>
            <p className="text-3xl font-bold text-red-600">
              {alatData.filter(item => item.kondisi && item.kondisi.toLowerCase() === 'rusak').length}
            </p>
          </div>
        </div>

        <div className="flex gap-4">
          <Input
            placeholder="Cari alat..."
            value={searchQuery}
            onChange={handleSearch}
            className="max-w-sm"
          />
        </div>

        <TableScrollWrapper className="border rounded-lg">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>No. Lambung</TableHead>
                <TableHead>Nama Alat</TableHead>
                <TableHead>Jenis</TableHead>
                <TableHead>Merk</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Lokasi</TableHead>
                <TableHead>Lokasi Sebelumnya</TableHead>
                <TableHead>Kondisi</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Foto</TableHead>
                {canShowActions && <TableHead className="text-right">Aksi</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginateData(filteredData, currentPage, pageSize).map((item: AlatPendukung) => (
                <React.Fragment key={item.id}>
                  <TableRow className={expandedRowId === item.id ? 'bg-blue-50/40' : ''}>
                    <TableCell
                      className="cursor-pointer hover:text-blue-600 hover:underline font-mono text-sm"
                      onClick={() => handleRowClick(item.id)}
                      title="Klik untuk melihat detail alat"
                    >
                      {item.noLambung || '-'}
                    </TableCell>
                    <TableCell
                      className="font-medium cursor-pointer hover:text-blue-600 hover:underline"
                      onClick={() => handleRowClick(item.id)}
                      title="Klik untuk melihat detail alat"
                    >
                      {item.namaAlat}
                    </TableCell>
                    <TableCell>{item.jenisAlat}</TableCell>
                    <TableCell>{item.merk || '-'}</TableCell>
                    <TableCell>{item.tipe || '-'}</TableCell>
                    <TableCell>{item.lokasi || '-'}</TableCell>
                    <TableCell>{item.lokasiSebelumnya || item.lokasi_sebelumnya || '-'}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {getKondisiIcon(item.kondisi)}
                        <span className={`px-2 py-1 rounded-full text-xs ${getKondisiColor(item.kondisi)}`}>
                          {item.kondisi}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${item.status === 'sedang digunakan'
                        ? 'bg-blue-100 text-blue-800'
                        : item.status === 'kanibal' || item.status === 'pemutihan'
                          ? 'bg-red-100 text-red-800'
                          : 'bg-green-100 text-green-800'
                        }`}>
                        {item.status ? item.status.charAt(0).toUpperCase() + item.status.slice(1).toLowerCase() : 'Standby'}
                      </span>
                    </TableCell>
                    <TableCell>
                      {(() => {
                        const fotos = parseFotoList(item.foto || item.gambar);
                        if (fotos.length === 0) {
                          return <span className="text-slate-400 text-xs italic">—</span>;
                        }
                        return (
                          <button
                            onClick={() => setFotoModal({ src: fotos, alt: item.namaAlat || 'Foto Alat' })}
                            className="group relative block h-10 w-10 rounded-md overflow-hidden border border-slate-200 hover:border-blue-400 hover:ring-2 hover:ring-blue-300 transition-all shadow-sm cursor-pointer"
                            title={`Klik untuk melihat galeri (${fotos.length} Foto)`}
                          >
                            <img
                              src={fotos[0]}
                              alt={`Foto ${item.namaAlat}`}
                              className="h-full w-full object-cover group-hover:scale-105 transition-transform"
                            />
                            {fotos.length > 1 ? (
                              <span className="absolute bottom-0 right-0 bg-blue-600 text-white text-[9px] font-bold px-1 rounded-tl shadow">
                                +{fotos.length - 1}
                              </span>
                            ) : (
                              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                                <span className="opacity-0 group-hover:opacity-100 text-white text-[9px] font-bold">🔍</span>
                              </div>
                            )}
                          </button>
                        );
                      })()}
                    </TableCell>
                    {canShowActions && <TableCell className="text-right">
                      <div className="flex justify-end space-x-2">
                        <ViewAlatPendukungDialog alatPendukung={item} />
                        {canEdit && <EditAlatPendukungDialog alatPendukung={item} onSubmit={handleUpdate} />}
                        {canDelete && <Button
                          variant="ghost"
                          size="icon"
                          title="Hapus"
                          onClick={() => handleDelete(item.id)}
                          disabled={deleteAlatMutation.isPending}
                        >
                          <Trash className="h-4 w-4" />
                        </Button>}
                      </div>
                    </TableCell>}
                  </TableRow>
                  {expandedRowId === item.id && (
                    <AlatDetailPopup
                      key={`detail-${item.id}`}
                      noLambung={item.noLambung || ''}
                      namaAlat={item.namaAlat || ''}
                      colSpan={canShowActions ? 10 : 9}
                      onClose={() => setExpandedRowId(null)}
                    />
                  )}
                </React.Fragment>
              ))}
              {filteredData.length === 0 && (
                <TableRow>
                  <TableCell colSpan={canShowActions ? 10 : 9} className="text-center py-4">
                    {searchQuery ? 'Tidak ada data yang sesuai dengan pencarian' : 'Belum ada data alat pendukung'}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>

          {/* Foto Lightbox */}
          {fotoModal && (
            <FotoViewerModal
              src={fotoModal.src}
              alt={fotoModal.alt}
              onClose={() => setFotoModal(null)}
            />
          )}

          <SimplePagination
            currentPage={currentPage}
            totalPages={getTotalPages(filteredData.length, pageSize)}
            onPageChange={setCurrentPage}
            pageSize={pageSize}
            onPageSizeChange={(size) => { setPageSize(size); setCurrentPage(1); }}
            totalItems={filteredData.length}
          />
        </TableScrollWrapper>
      </div>
    </div>
  );
};

export default DataAlatPendukung;

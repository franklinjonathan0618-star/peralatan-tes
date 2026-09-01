import React, { useState, useRef, useCallback, useMemo } from 'react';
import { exportToExcel } from '@/utils/excelUtils';

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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Plus, Pencil, Trash2, Search } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { useSewaAlatEksternal, useAddSewaAlatEksternal, useUpdateSewaAlatEksternal, useDeleteSewaAlatEksternal } from '../hooks/useSewaAlatEksternal';
import { useToast } from '@/components/ui/use-toast';
import { usePagePermission } from '@/hooks/usePagePermission';
import { SimplePagination, paginateData, getTotalPages } from '@/components/ui/SimplePagination';
import { formatDateDisplay, normalizeDateOnly } from '@/utils/dateUtils';
import { TableScrollWrapper } from '@/components/ui/TableScrollWrapper';

interface SewaAlat {
  id?: string;
  nama_alat: string;
  vendor: string;
  lokasi_proyek: string;
  lokasi_sebelumnya?: string | null;
  tanggal_sewa: string;
  tanggal_kembali: string;
  biaya_sewa: number;
  biaya_mobilisasi: number;
  biaya_demobilisasi: number;
  biaya_uang_makan_operator: number;
  total_biaya: number;
  keterangan: string;
  status: string;
}

export default function SewaAlatEksternal() {
  const { toast } = useToast();
  const componentRef = useRef<HTMLDivElement>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [formData, setFormData] = useState({
    nama_alat: '',
    vendor: '',
    lokasi_proyek: '',
    lokasi_sebelumnya: '',
    tanggal_sewa: '',
    tanggal_kembali: '',
    biaya_sewa: '',
    biaya_mobilisasi: '',
    biaya_demobilisasi: '',
    biaya_uang_makan_operator: '',
    total_biaya: '',
    keterangan: '',
  });

  const { data: sewaAlatList = [], isLoading, refetch } = useSewaAlatEksternal();

  const filteredList = useMemo(() => {
    if (!searchQuery.trim()) return sewaAlatList;
    const q = searchQuery.toLowerCase();
    return sewaAlatList.filter((item: SewaAlat) =>
      (item.nama_alat || '').toLowerCase().includes(q) ||
      (item.vendor || '').toLowerCase().includes(q) ||
      (item.lokasi_proyek || '').toLowerCase().includes(q) ||
      (item.lokasi_sebelumnya || '').toLowerCase().includes(q) ||
      (item.status || '').toLowerCase().includes(q) ||
      (item.keterangan || '').toLowerCase().includes(q)
    );
  }, [sewaAlatList, searchQuery]);
  const addSewaAlat = useAddSewaAlatEksternal();
  const updateSewaAlat = useUpdateSewaAlatEksternal();
  const deleteSewaAlat = useDeleteSewaAlatEksternal();

  const { can_create: canCreate, can_edit: canEdit, can_delete: canDelete, can_print: canPrint, can_export_excel: canExportExcel } = usePagePermission('sewaAlatEksternal');
  const canShowActions = canEdit || canDelete;
  console.log('Permissions:', { canCreate, canEdit, canDelete, canShowActions });

  // State untuk edit mode
  const [editingId, setEditingId] = useState<string | null>(null);

  const handleEdit = (sewaAlat: SewaAlat) => {
    if (!sewaAlat.id) return;

    setEditingId(sewaAlat.id);
    setFormData({
      nama_alat: sewaAlat.nama_alat,
      vendor: sewaAlat.vendor,
      lokasi_proyek: sewaAlat.lokasi_proyek,
      lokasi_sebelumnya: sewaAlat.lokasi_sebelumnya || '',
      tanggal_sewa: normalizeDateOnly(sewaAlat.tanggal_sewa),
      tanggal_kembali: normalizeDateOnly(sewaAlat.tanggal_kembali),
      biaya_sewa: sewaAlat.biaya_sewa.toString(),
      biaya_mobilisasi: sewaAlat.biaya_mobilisasi.toString(),
      biaya_demobilisasi: sewaAlat.biaya_demobilisasi.toString(),
      biaya_uang_makan_operator: sewaAlat.biaya_uang_makan_operator.toString(),
      total_biaya: sewaAlat.total_biaya.toString(),
      keterangan: sewaAlat.keterangan || '',
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Apakah Anda yakin ingin menghapus data ini?')) return;

    try {
      await deleteSewaAlat.mutateAsync(id);
      await refetch();

      toast({
        title: "Sukses",
        description: "Data sewa alat berhasil dihapus",
        variant: "default",
      });
    } catch (error) {
      console.error('Gagal menghapus data:', error);
      toast({
        title: "Error",
        description: "Gagal menghapus data sewa alat",
        variant: "destructive",
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    try {
      // Validasi field yang wajib diisi
      if (!formData.nama_alat || !formData.vendor || !formData.tanggal_sewa || !formData.tanggal_kembali) {
        toast({
          title: "Error",
          description: "Harap isi semua field yang wajib diisi",
          variant: "destructive"
        });
        return;
      }

      // Validasi format tanggal
      const startDate = new Date(formData.tanggal_sewa);
      const endDate = new Date(formData.tanggal_kembali);

      if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
        toast({
          title: "Error",
          description: "Format tanggal tidak valid",
          variant: "destructive"
        });
        return;
      }

      // Validasi tanggal sewa tidak boleh setelah tanggal kembali
      if (startDate > endDate) {
        toast({
          title: "Error",
          description: "Tanggal sewa tidak boleh setelah tanggal kembali",
          variant: "destructive"
        });
        return;
      }

      // Konversi nilai ke number dengan default 0 jika kosong
      const biaya_sewa = Number(formData.biaya_sewa) || 0;
      const biaya_mobilisasi = Number(formData.biaya_mobilisasi) || 0;
      const biaya_demobilisasi = Number(formData.biaya_demobilisasi) || 0;
      const biaya_uang_makan_operator = Number(formData.biaya_uang_makan_operator) || 0;
      let total_biaya = Number(formData.total_biaya) || 0;

      // Hitung status berdasarkan tanggal
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const kembaliParts = formData.tanggal_kembali.split('-');
      const kembaliLocal = new Date(Number(kembaliParts[0]), Number(kembaliParts[1]) - 1, Number(kembaliParts[2]));

      const status = today > kembaliLocal ? 'Selesai' : 'Aktif';

      // Auto-calculate total_biaya jika belum diisi/0
      if (total_biaya === 0) {
        total_biaya = biaya_sewa + biaya_mobilisasi + biaya_demobilisasi + biaya_uang_makan_operator;
      }

      const newSewaAlat: SewaAlat = {
        nama_alat: formData.nama_alat.trim(),
        vendor: formData.vendor.trim(),
        lokasi_proyek: formData.lokasi_proyek.trim(),
        lokasi_sebelumnya: formData.lokasi_sebelumnya.trim() || null,
        tanggal_sewa: normalizeDateOnly(formData.tanggal_sewa),
        tanggal_kembali: normalizeDateOnly(formData.tanggal_kembali),
        biaya_sewa,
        biaya_mobilisasi,
        biaya_demobilisasi,
        biaya_uang_makan_operator,
        total_biaya,
        keterangan: formData.keterangan.trim(),
        status,
      };

      if (editingId) {
        // Update existing data
        await updateSewaAlat.mutateAsync({ ...newSewaAlat, id: editingId });
        toast({
          title: "Sukses",
          description: "Data sewa alat berhasil diperbarui",
          variant: "default",
        });
      } else {
        // Add new data
        await addSewaAlat.mutateAsync(newSewaAlat);
        toast({
          title: "Sukses",
          description: "Data sewa alat berhasil ditambahkan",
          variant: "default",
        });
      }

      // Reset form, tutup dialog, dan reset editing state
      setEditingId(null);
      setIsDialogOpen(false);
      setFormData({
        nama_alat: '',
        vendor: '',
        lokasi_proyek: '',
        lokasi_sebelumnya: '',
        tanggal_sewa: '',
        tanggal_kembali: '',
        biaya_sewa: '',
        biaya_mobilisasi: '',
        biaya_demobilisasi: '',
        biaya_uang_makan_operator: '',
        total_biaya: '',
        keterangan: '',
      });

    } catch (error) {
      console.error('Error in handleSubmit:', error);
      // Error handling sudah ditangani di useAddSewaAlatEksternal
    }
  };

  const [isPrinting, setIsPrinting] = useState(false);

  const handlePrint = useCallback(() => {
    if (sewaAlatList.length === 0) {
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

      // Format currency
      const formatCurrency = (value: number) => {
        return new Intl.NumberFormat('id-ID', {
          style: 'currency',
          currency: 'IDR',
          minimumFractionDigits: 0,
          maximumFractionDigits: 0
        }).format(value);
      };

      // Create table rows
      const tableRows = sewaAlatList.map((item: SewaAlat) => `
        <tr>
          <td style="border: 1px solid #ddd; padding: 8px;">${item.nama_alat || '-'}</td>
          <td style="border: 1px solid #ddd; padding: 8px;">${item.vendor || '-'}</td>
          <td style="border: 1px solid #ddd; padding: 8px;">${item.lokasi_proyek || '-'}</td>
          <td style="border: 1px solid #ddd; padding: 8px;">${item.lokasi_sebelumnya || '-'}</td>
          <td style="border: 1px solid #ddd; padding: 8px;">${item.tanggal_sewa ? formatDateDisplay(item.tanggal_sewa) : '-'}</td>
          <td style="border: 1px solid #ddd; padding: 8px;">${item.tanggal_kembali ? formatDateDisplay(item.tanggal_kembali) : '-'}</td>
          <td style="border: 1px solid #ddd; padding: 8px; text-align: right;">${formatCurrency(item.biaya_sewa)}</td>
          <td style="border: 1px solid #ddd; padding: 8px; text-align: right;">${formatCurrency(item.biaya_mobilisasi)}</td>
          <td style="border: 1px solid #ddd; padding: 8px; text-align: right;">${formatCurrency(item.biaya_demobilisasi)}</td>
          <td style="border: 1px solid #ddd; padding: 8px; text-align: right;">${formatCurrency(item.biaya_uang_makan_operator)}</td>
          <td style="border: 1px solid #ddd; padding: 8px; text-align: right; font-weight: bold;">${formatCurrency(item.total_biaya)}</td>
        </tr>
      `).join('');

      // Create the HTML content
      const printContent = `
        <!DOCTYPE html>
        <html>
          <head>
            <title>Cetak Data Sewa Alat Eksternal</title>
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
              .company-name {
                font-weight: bold;
                margin-bottom: 5px;
              }
              table { 
                width: 100%;
                border-collapse: collapse;
                margin-top: 20px;
                font-size: 12px;
              }
              th { 
                background-color: #3b82f6;
                color: white;
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
              <div class="company-name">Cabang Papua</div>
              <div class="company-division">Peralatan</div>
            </div>
            <div class="title-section">
              <h1>Data Sewa Alat Eksternal</h1>
              <div class="print-date">Dicetak pada: ${currentDate}</div>
            </div>
            
            <table>
              <thead>
                <tr>
                  <th>Nama Alat</th>
                  <th>Vendor</th>
                  <th>Lokasi Proyek</th>
                  <th>Lokasi Sebelumnya</th>
                  <th>Tgl. Mulai</th>
                  <th>Tgl. Selesai</th>
                  <th>Biaya/Hari</th>
                  <th>B.Mobilisasi</th>
                  <th>B.Demobilisasi</th>
                  <th>Uang Makan</th>
                  <th>Total</th>
                </tr>
              </thead>
              <tbody>
                ${tableRows}
              </tbody>
            </table>
            
            <div class="footer">
              Total Data: ${sewaAlatList.length}
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
  }, [sewaAlatList, toast]);

  const handleExportExcel = () => {
    if (sewaAlatList.length === 0) {
      toast({
        title: "Tidak ada data",
        description: "Tidak ada data yang bisa diekspor.",
        variant: "destructive",
      });
      return;
    }

    const dataToExport = sewaAlatList.map((item: SewaAlat, index: number) => ({
      'No': index + 1,
      'Nama Alat': item.nama_alat,
      'Vendor': item.vendor,
      'Lokasi Proyek': item.lokasi_proyek,
      'Lokasi Sebelumnya': item.lokasi_sebelumnya || '-',
      'Tgl. Mulai': item.tanggal_sewa ? formatDateDisplay(item.tanggal_sewa) : '-',
      'Biaya/Hari (Rp)': item.biaya_sewa,
      'Mobilisasi (Rp)': item.biaya_mobilisasi,
      'Demobilisasi (Rp)': item.biaya_demobilisasi,
      'Uang Makan (Rp)': item.biaya_uang_makan_operator,
      'Total (Rp)': item.total_biaya,
      'Status': item.status,
    }));

    try {
      exportToExcel(dataToExport, 'Data_Sewa_Alat_Eksternal');
      toast({
        title: "Sukses",
        description: "Data berhasil diekspor ke Excel",
        variant: "default",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Gagal mengekspor data ke Excel",
        variant: "destructive",
      });
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  if (isLoading) {
    return (

      <div className="flex justify-center items-center h-64">
        <div className="text-lg">Loading...</div>
      </div>

    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div ref={componentRef} className="container mx-auto pt-10 pb-6 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <h1 className="text-2xl font-bold text-gray-800">Sewa Alat Eksternal</h1>
          <div className="grid grid-cols-1 sm:flex sm:flex-wrap gap-2 w-full sm:w-auto">
            {canPrint && (
              <Button
                variant="outline"
                size="sm"
                onClick={handlePrint}
                disabled={isPrinting}
                className="flex items-center justify-center gap-2 text-xs sm:text-sm px-3 py-2 sm:px-4 sm:py-2 w-full sm:w-auto"
              >
                {isPrinting ? 'Mencetak...' : (
                  <>
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <polyline points="6 9 6 2 18 2 18 9" />
                      <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" />
                      <rect x="6" y="14" width="12" height="8" />
                    </svg>
                    <span>Cetak</span>
                  </>
                )}
              </Button>
            )}
            {canExportExcel && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleExportExcel}
                className="flex items-center justify-center gap-2 text-xs sm:text-sm px-3 py-2 sm:px-4 sm:py-2 w-full sm:w-auto"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                  <polyline points="7 10 12 15 17 10" />
                  <line x1="12" y1="15" x2="12" y2="3" />
                </svg>
                <span>Export Excel</span>
              </Button>
            )}
            <Dialog open={isDialogOpen} onOpenChange={(open) => {
              if (!open) {
                setEditingId(null);
                setFormData({
                  nama_alat: '',
                  vendor: '',
                  lokasi_proyek: '',
                  lokasi_sebelumnya: '',
                  tanggal_sewa: '',
                  tanggal_kembali: '',
                  biaya_sewa: '',
                  biaya_mobilisasi: '',
                  biaya_demobilisasi: '',
                  biaya_uang_makan_operator: '',
                  total_biaya: '',
                  keterangan: '',
                });
              }
              setIsDialogOpen(open);
            }}>
              {canCreate && (
                <DialogTrigger asChild>
                  <Button variant="default" size="sm" className="flex items-center justify-center gap-2 text-xs sm:text-sm px-3 py-2 sm:px-4 sm:py-2 w-full sm:w-auto">
                    <Plus className="h-4 w-4" /> Tambah Sewa Alat
                  </Button>
                </DialogTrigger>
              )}
              <DialogContent className="sm:max-w-[625px] max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>{editingId ? 'Edit' : 'Tambah'} Data Sewa Alat Eksternal</DialogTitle>
                  <DialogDescription>
                    Isi form berikut untuk menambahkan data sewa alat eksternal baru.
                  </DialogDescription>
                </DialogHeader>
                <div role="document" aria-labelledby="sewa-alat-title" aria-describedby="sewa-alat-description">
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid gap-2">
                      <Label htmlFor="nama_alat">Nama Alat</Label>
                      <Input
                        id="nama_alat"
                        name="nama_alat"
                        value={formData.nama_alat}
                        onChange={handleInputChange}
                        required
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="vendor">Vendor</Label>
                      <Input
                        id="vendor"
                        name="vendor"
                        value={formData.vendor}
                        onChange={handleInputChange}
                        required
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="grid gap-2">
                        <Label htmlFor="lokasi_proyek">Lokasi Proyek</Label>
                        <Input
                          id="lokasi_proyek"
                          name="lokasi_proyek"
                          value={formData.lokasi_proyek}
                          onChange={handleInputChange}
                          required
                        />
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="lokasi_sebelumnya">Lokasi Sebelumnya</Label>
                        <Input
                          id="lokasi_sebelumnya"
                          name="lokasi_sebelumnya"
                          value={formData.lokasi_sebelumnya}
                          onChange={handleInputChange}
                        />
                      </div>
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="tanggal_sewa">Tanggal Sewa</Label>
                      <Input
                        id="tanggal_sewa"
                        name="tanggal_sewa"
                        type="date"
                        value={formData.tanggal_sewa}
                        onChange={handleInputChange}
                        required
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="tanggal_kembali">Tanggal Kembali</Label>
                      <Input
                        id="tanggal_kembali"
                        name="tanggal_kembali"
                        type="date"
                        value={formData.tanggal_kembali}
                        onChange={handleInputChange}
                        required
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="biaya_sewa">Biaya Sewa</Label>
                      <Input
                        id="biaya_sewa"
                        name="biaya_sewa"
                        type="number"
                        value={formData.biaya_sewa}
                        onChange={handleInputChange}
                        required
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="biaya_mobilisasi">Biaya Mobilisasi</Label>
                      <Input
                        id="biaya_mobilisasi"
                        name="biaya_mobilisasi"
                        type="number"
                        value={formData.biaya_mobilisasi}
                        onChange={handleInputChange}
                        required
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="biaya_demobilisasi">Biaya Demobilisasi</Label>
                      <Input
                        id="biaya_demobilisasi"
                        name="biaya_demobilisasi"
                        type="number"
                        value={formData.biaya_demobilisasi}
                        onChange={handleInputChange}
                        required
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="biaya_uang_makan_operator">Uang Makan Operator</Label>
                      <Input
                        id="biaya_uang_makan_operator"
                        name="biaya_uang_makan_operator"
                        type="number"
                        value={formData.biaya_uang_makan_operator}
                        onChange={handleInputChange}
                        required
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="keterangan">Keterangan</Label>
                      <textarea
                        id="keterangan"
                        name="keterangan"
                        value={formData.keterangan}
                        onChange={handleInputChange}
                        rows={3}
                        className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Masukkan keterangan (opsional)"
                      />
                    </div>
                    <Button type="submit" className="w-full">
                      Simpan
                    </Button>
                  </form>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Metrics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Total Alat Disewa</p>
                <p className="text-2xl font-semibold">{sewaAlatList.length}</p>
              </div>
              <div className="p-3 rounded-full bg-blue-100">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012 2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Sewa Aktif</p>
                <p className="text-2xl font-semibold text-green-600">
                  {sewaAlatList.filter((item: SewaAlat) => item.status === 'Aktif').length}
                </p>
              </div>
              <div className="p-3 rounded-full bg-green-100">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Sewa Selesai</p>
                <p className="text-2xl font-semibold text-gray-600">
                  {sewaAlatList.filter((item: SewaAlat) => item.status === 'Selesai').length}
                </p>
              </div>
              <div className="p-3 rounded-full bg-gray-100">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Total Biaya Sewa</p>
                <p className="text-2xl font-semibold text-blue-600">
                  {new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(
                    sewaAlatList.reduce((total: number, item: SewaAlat) => total + item.total_biaya, 0)
                  )}
                </p>
              </div>
              <div className="p-3 rounded-full bg-blue-100">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 1.343-3 3 0 .711.215 1.343 3 3v4a3 3 0 003 3h3a3 3 0 003-3v-4c0-1.657-1.343-3-3-3z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h8m-4 0v14" />
                </svg>
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Cari sewa alat..."
              className="pl-8 w-full bg-white"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
            />
          </div>
        </div>

        <TableScrollWrapper className="rounded-lg border bg-white shadow-sm">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="whitespace-nowrap">Nama Alat</TableHead>
                <TableHead className="whitespace-nowrap">Vendor</TableHead>
                <TableHead className="whitespace-nowrap">Lokasi Proyek</TableHead>
                <TableHead className="whitespace-nowrap">Lokasi Sebelumnya</TableHead>
                <TableHead className="whitespace-nowrap">Tanggal Sewa</TableHead>
                <TableHead className="whitespace-nowrap">Tanggal Kembali</TableHead>
                <TableHead className="whitespace-nowrap">Biaya Sewa</TableHead>
                <TableHead className="whitespace-nowrap">Mobilisasi</TableHead>
                <TableHead className="whitespace-nowrap">Demobilisasi</TableHead>
                <TableHead className="whitespace-nowrap">Uang Makan</TableHead>
                <TableHead className="whitespace-nowrap">Total</TableHead>
                <TableHead className="whitespace-nowrap">Status</TableHead>
                {canShowActions && <TableHead className="w-[100px] whitespace-nowrap text-right">Aksi</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={canShowActions ? 13 : 12} className="text-center py-6 text-muted-foreground">
                    Memuat data...
                  </TableCell>
                </TableRow>
              ) : filteredList.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={canShowActions ? 13 : 12} className="text-center py-6 text-muted-foreground">
                    {searchQuery ? 'Tidak ada data yang cocok dengan pencarian' : 'Belum ada data sewa alat eksternal'}
                  </TableCell>
                </TableRow>
              ) : (
                paginateData<SewaAlat>(filteredList as SewaAlat[], currentPage, pageSize).map((sewaAlat: SewaAlat) => (
                  <TableRow key={sewaAlat.id}>
                    <TableCell className="whitespace-nowrap font-medium">{sewaAlat.nama_alat}</TableCell>
                    <TableCell className="whitespace-nowrap">{sewaAlat.vendor}</TableCell>
                    <TableCell className="whitespace-nowrap">{sewaAlat.lokasi_proyek}</TableCell>
                    <TableCell className="whitespace-nowrap">{sewaAlat.lokasi_sebelumnya || '-'}</TableCell>
                    <TableCell className="whitespace-nowrap">{formatDateDisplay(sewaAlat.tanggal_sewa)}</TableCell>
                    <TableCell className="whitespace-nowrap">{formatDateDisplay(sewaAlat.tanggal_kembali)}</TableCell>
                    <TableCell className="whitespace-nowrap">{new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(sewaAlat.biaya_sewa)}</TableCell>
                    <TableCell className="whitespace-nowrap">{new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(sewaAlat.biaya_mobilisasi)}</TableCell>
                    <TableCell className="whitespace-nowrap">{new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(sewaAlat.biaya_demobilisasi)}</TableCell>
                    <TableCell className="whitespace-nowrap">{new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(sewaAlat.biaya_uang_makan_operator)}</TableCell>
                    <TableCell className="whitespace-nowrap font-semibold">{new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(sewaAlat.total_biaya)}</TableCell>
                    <TableCell className="whitespace-nowrap">
                      <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${sewaAlat.status === 'Aktif' ? 'bg-green-100 text-green-800' :
                        sewaAlat.status === 'Selesai' ? 'bg-gray-100 text-gray-800' : 'bg-red-100 text-red-800'
                        }`}>
                        {sewaAlat.status}
                      </span>
                    </TableCell>
                    {canShowActions && (
                      <TableCell className="whitespace-nowrap">
                        <div className="flex items-center justify-end space-x-2">
                          {canEdit && (
                            <Button
                              variant="outline"
                              size="icon"
                              onClick={() => handleEdit(sewaAlat)}
                              className="h-8 w-8 text-blue-600 hover:text-blue-800 hover:bg-blue-50"
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                          )}
                          {canDelete && (
                            <Button
                              variant="outline"
                              size="icon"
                              onClick={() => sewaAlat.id && handleDelete(sewaAlat.id)}
                              className="h-8 w-8 text-red-600 hover:text-red-800 hover:bg-red-50"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    )}
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableScrollWrapper>
        {filteredList.length > 0 && (
          <SimplePagination
            currentPage={currentPage}
            totalPages={getTotalPages(filteredList.length, pageSize)}
            onPageChange={setCurrentPage}
            pageSize={pageSize}
            onPageSizeChange={(size) => { setPageSize(size); setCurrentPage(1); }}
            totalItems={filteredList.length}
          />
        )}
      </div>
    </div>
  );
}

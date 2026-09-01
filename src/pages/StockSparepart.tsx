
import React, { useState } from 'react';
import { Plus, Search, Edit, Trash, ComponentIcon, Upload, Download, Calendar, X, Printer } from 'lucide-react';
import { toast } from 'sonner';

import { useSparepart, useAddSparepart, useUpdateSparepart, useDeleteSparepart, Sparepart } from '@/hooks/useSparepart';
import { usePagePermission } from '@/hooks/usePagePermission';
import ExcelImportButton from '@/components/ui/ExcelImportButton';
import { exportToExcel } from '@/utils/excelUtils';
import { SimplePagination, paginateData, getTotalPages } from '@/components/ui/SimplePagination';
import { formatDateDisplay, getTodayLocalDateString, normalizeDateOnly } from '@/utils/dateUtils';
import { TableScrollWrapper } from '@/components/ui/TableScrollWrapper';

const StockSparepart: React.FC = () => {
  const [showForm, setShowForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [editingItem, setEditingItem] = useState<Sparepart | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);

  const [tableFilterFrom, setTableFilterFrom] = useState('');
  const [tableFilterTo, setTableFilterTo] = useState('');

  const [exportPrintDialog, setExportPrintDialog] = useState<'export' | 'print' | null>(null);
  const [dialogMode, setDialogMode] = useState<'all' | 'range'>('all');
  const now = new Date();
  const firstDayOfMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;
  const lastDayOfMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate()).padStart(2, '0')}`;
  const [dateFrom, setDateFrom] = useState(firstDayOfMonth);
  const [dateTo, setDateTo] = useState(lastDayOfMonth);

  const { can_create: canCreate, can_edit: canEdit, can_delete: canDelete, can_import: canImport, can_export_excel: canExportExcel, can_print: canPrint } = usePagePermission('stockSparepart');
  const canShowActions = canEdit || canDelete;

  const { data: spareparts = [], isLoading } = useSparepart();
  const addSparepartMutation = useAddSparepart();
  const updateSparepartMutation = useUpdateSparepart();
  const deleteSparepartMutation = useDeleteSparepart();

  const [formData, setFormData] = useState({
    namaSparepart: '',
    deskripsi: '',
    satuan: 'pcs',
    harga: 0,
    jumlah: 0,
    sisaStock: 0,
    keterangan: '',
    tanggal: getTodayLocalDateString(),
    jenis: 'Pembelian',
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: name === 'jumlah' || name === 'sisaStock' || name === 'harga' ? parseFloat(value) || 0 : value
    });
  };

  const resetForm = () => {
    setFormData({
      namaSparepart: '',
      deskripsi: '',
      satuan: 'pcs',
      harga: 0,
      jumlah: 0,
      sisaStock: 0,
      keterangan: '',
      tanggal: getTodayLocalDateString(),
      jenis: 'Pembelian',
    });
    setEditingItem(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      if (editingItem) {
        await updateSparepartMutation.mutateAsync({
          id: editingItem.id,
          ...formData
        });
        toast.success('Data sparepart berhasil diperbarui');
      } else {
        await addSparepartMutation.mutateAsync(formData);
        toast.success('Data sparepart berhasil ditambahkan');
      }

      resetForm();
      setShowForm(false);
    } catch (error: any) {
      const action = editingItem ? 'memperbarui' : 'menambah';
      const detail = error?.message || error?.details || JSON.stringify(error);
      console.error(`Error saat ${action} sparepart:`, error);
      toast.error(`Gagal ${action} data sparepart: ${detail}`, {
        duration: 8000,
      });
    }
  };

  const handleEdit = (item: Sparepart) => {
    setEditingItem(item);
    setFormData({
      namaSparepart: item.namaSparepart,
      deskripsi: item.deskripsi,
      satuan: item.satuan,
      harga: item.harga,
      jumlah: item.jumlah,
      sisaStock: item.sisaStock || 0,
      keterangan: item.keterangan,
      tanggal: normalizeDateOnly(item.tanggal) || getTodayLocalDateString(),
      jenis: item.jenis || 'Pembelian',
    });
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm('Apakah Anda yakin ingin menghapus data ini?')) {
      try {
        await deleteSparepartMutation.mutateAsync(id);
        toast.success('Data sparepart berhasil dihapus');
      } catch (error: any) {
        const detail = error?.message || error?.details || JSON.stringify(error);
        console.error('Error saat menghapus sparepart:', error);
        toast.error(`Gagal menghapus data sparepart: ${detail}`, { duration: 8000 });
      }
    }
  };

  // Dynamic stock calculation (like BBM)
  const sparepartStocks = React.useMemo(() => {
    const stocks: Record<string, { pembelian: number; pemakaian: number; harga: number; displayName: string }> = {};

    spareparts.forEach(item => {
      const name = item.namaSparepart;
      if (!name) return;
      const key = name.trim().toLowerCase();
      if (!stocks[key]) {
        stocks[key] = { pembelian: 0, pemakaian: 0, harga: item.harga || 0, displayName: name.trim() };
      }
      if ((item.jenis || '') === 'Pemakaian') {
        stocks[key].pemakaian += (item.jumlah || 0);
      } else {
        stocks[key].pembelian += (item.jumlah || 0);
      }
      if (item.harga > 0) {
        stocks[key].harga = item.harga;
      }
    });

    return stocks;
  }, [spareparts]);

  const uniqueSparepartCount = Object.keys(sparepartStocks).length;
  const totalItems = Object.values(sparepartStocks).reduce((sum, s) => sum + Math.max(0, s.pembelian - s.pemakaian), 0);
  const totalValue = Object.values(sparepartStocks).reduce((sum, s) => sum + (Math.max(0, s.pembelian - s.pemakaian) * s.harga), 0);

  const sparepartsWithSisa = React.useMemo(() => {
    // Sort chronologically by tanggal, and then by id to calculate running balance
    const sorted = [...spareparts].sort((a, b) => {
      const dateA = a.tanggal ? new Date(a.tanggal).getTime() : 0;
      const dateB = b.tanggal ? new Date(b.tanggal).getTime() : 0;
      if (dateA !== dateB) return dateA - dateB;
      return (a.id || '').localeCompare(b.id || '');
    });

    const balances: Record<string, number> = {};
    const mapped = sorted.map(item => {
      const key = item.namaSparepart.trim().toLowerCase();
      if (balances[key] === undefined) {
        balances[key] = 0;
      }
      if (item.jenis === 'Pemakaian') {
        balances[key] -= item.jumlah;
      } else {
        balances[key] += item.jumlah;
      }
      return {
        ...item,
        sisaStock: balances[key]
      };
    });

    // Map back to the original order of spareparts
    const mappedMap = new Map(mapped.map(item => [item.id, item]));
    return spareparts.map(item => mappedMap.get(item.id) || item);
  }, [spareparts]);

  const filteredData = sparepartsWithSisa.filter((item: any) => {
    const matchesSearch = (item.namaSparepart && item.namaSparepart.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (item.deskripsi && item.deskripsi.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (item.keterangan && item.keterangan.toLowerCase().includes(searchTerm.toLowerCase()));
    if (!matchesSearch) return false;

    if (tableFilterFrom && item.tanggal && item.tanggal < tableFilterFrom) return false;
    if (tableFilterTo && item.tanggal && item.tanggal > tableFilterTo) return false;

    return true;
  });

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(value);
  };

  // ── Parsing angka dari Excel (bersihkan ribuan/titik) ──
  const parseNumeric = (val: any): number => {
    if (val === null || val === undefined || val === '') return 0;
    if (typeof val === 'number') return val;
    const cleaned = String(val).replace(/[^\d.,-]/g, '').replace(/\./g, '').replace(',', '.');
    const n = parseFloat(cleaned);
    return isNaN(n) ? 0 : n;
  };

  // ── Import Excel ──
  const expectedSparepartHeaders = ['Tanggal', 'Jenis', 'Nama Sparepart', 'Deskripsi', 'Jumlah Stock', 'Satuan', 'Harga per Item', 'Keterangan'];

  const handleSparepartExcelDataParsed = async (parsedData: any[], fileName?: string) => {
    let successCount = 0;
    let errorCount = 0;
    const errors: string[] = [];

    if (parsedData.length === 0) {
      toast.info(`Tidak ada data untuk diimpor dari file ${fileName || 'Excel'}.`);
      return;
    }

    for (const [index, row] of parsedData.entries()) {
      const normalizedRow: { [key: string]: any } = {};
      for (const key in row) {
        normalizedRow[key.trim().toLowerCase()] = row[key];
      }

      // Helper: find value by fuzzy key match
      const findVal = (keys: string[]): any => {
        for (const k of keys) {
          // Check exact match first
          if (normalizedRow[k] !== undefined && normalizedRow[k] !== '') return normalizedRow[k];
          // Check fuzzy match (key includes or is included)
          for (const nk of Object.keys(normalizedRow)) {
            if ((nk.includes(k) || k.includes(nk)) && normalizedRow[nk] !== undefined && normalizedRow[nk] !== '') {
              return normalizedRow[nk];
            }
          }
        }
        return undefined;
      };

      const namaSparepart = String(
        findVal(['nama sparepart', 'nama_sparepart', 'sparepart']) || ''
      ).trim();

      if (!namaSparepart) {
        errors.push(`Baris ${index + 2}: Nama Sparepart kosong.`);
        errorCount++;
        continue;
      }

      const tanggal = normalizeDateOnly(String(findVal(['tanggal', 'date']) || getTodayLocalDateString()).trim()) || getTodayLocalDateString();
      const jenis = String(findVal(['jenis', 'type', 'kategori']) || 'Pembelian').trim();
      const deskripsi = String(findVal(['deskripsi', 'description']) || '').trim();
      const jumlah = parseNumeric(findVal(['jumlah', 'jumlah_stock', 'jumlah stock', 'stock', 'qty']));
      const sisaStock = parseNumeric(findVal(['sisa stock', 'sisa_stock', 'sisa', 'balance'])) || 0;
      const satuan = String(findVal(['satuan', 'unit']) || 'pcs').trim();
      const harga = parseNumeric(findVal(['harga per item', 'harga', 'price', 'harga satuan']));
      const keterangan = String(findVal(['keterangan', 'catatan', 'note']) || '').trim();

      try {
        await addSparepartMutation.mutateAsync({
          namaSparepart,
          deskripsi,
          jumlah,
          sisaStock,
          satuan,
          harga,
          keterangan,
          tanggal,
          jenis,
        });
        successCount++;
      } catch (error: any) {
        errorCount++;
        errors.push(`Baris ${index + 2}: ${error.message || 'Gagal menyimpan.'}`);
      }
    }

    if (successCount > 0 && errorCount > 0) {
      toast.warning(
        <div>
          <p className="font-semibold">Impor Selesai Sebagian ({fileName})</p>
          <p>Berhasil: {successCount}, Gagal: {errorCount}</p>
          {errors.length > 0 && (
            <details className="mt-2 text-xs">
              <summary className="cursor-pointer font-semibold">Lihat Detail ({errors.length})</summary>
              <ul className="list-disc list-inside max-h-40 overflow-y-auto bg-gray-50 p-2 rounded">
                {errors.slice(0, 10).map((err, i) => <li key={i}>{err}</li>)}
                {errors.length > 10 && <li>Dan {errors.length - 10} lainnya...</li>}
              </ul>
            </details>
          )}
        </div>, { duration: 15000 }
      );
    } else if (successCount > 0) {
      toast.success(`Berhasil mengimpor ${successCount} sparepart dari ${fileName || 'Excel'}.`);
    } else {
      toast.error(
        <div>
          <p className="font-semibold">Impor Gagal ({fileName})</p>
          <p>Tidak ada data yang berhasil diimpor. Gagal: {errorCount}</p>
          {errors.length > 0 && (
            <details className="mt-2 text-xs">
              <summary className="cursor-pointer font-semibold">Lihat Detail ({errors.length})</summary>
              <ul className="list-disc list-inside max-h-40 overflow-y-auto bg-gray-50 p-2 rounded">
                {errors.slice(0, 10).map((err, i) => <li key={i}>{err}</li>)}
                {errors.length > 10 && <li>Dan {errors.length - 10} lainnya...</li>}
              </ul>
            </details>
          )}
        </div>, { duration: 15000 }
      );
    }
  };

  // ── Export Excel ──
  const doExportExcel = (data: Sparepart[], isRange: boolean) => {
    if (data.length === 0) {
      toast.warning('Tidak ada data untuk diekspor');
      return;
    }
    const dataToExport = data.map((item: Sparepart, index: number) => ({
      'No': index + 1,
      'Tanggal': item.tanggal ? formatDateDisplay(item.tanggal) : '',
      'Jenis': item.jenis || '',
      'Nama Sparepart': item.namaSparepart || '',
      'Deskripsi': item.deskripsi || '',
      'Jumlah': item.jumlah || 0,
      'Satuan': item.satuan || '',
      'Harga per Item (Rp)': item.harga || 0,
      'Total Nilai (Rp)': (item.jumlah || 0) * (item.harga || 0),
      'Keterangan': item.keterangan || '',
      'Sisa Stock': item.sisaStock || 0
    }));
    const suffix = isRange && dateFrom && dateTo ? `_${dateFrom}_sd_${dateTo}` : '';
    try {
      exportToExcel(dataToExport, `Stock_Sparepart${suffix}`);
      toast.success(`Berhasil mengekspor ${data.length} data sparepart ke Excel`);
    } catch (error) {
      toast.error('Gagal mengekspor data');
    }
  };

  const doPrintSparepart = (data: Sparepart[], periodeLabel: string) => {
    if (data.length === 0) {
      toast.warning('Tidak ada data untuk dicetak');
      return;
    }
    const printWindow = window.open('', '', 'width=800,height=600');
    if (printWindow) {
      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>Data Stock Sparepart</title>
            <style>
              @page { size: A4 landscape; margin: 1cm; }
              body { font-family: Arial, sans-serif; padding: 20px; font-size: 12px; }
              .header { border-bottom: 2px solid #000; padding-bottom: 10px; margin-bottom: 20px; }
              .company-name { font-weight: bold; font-size: 14px; }
              .company-division { font-size: 12px; margin-bottom: 10px; }
              h1 { color: #1a365d; text-align: center; font-size: 18px; margin-bottom: 5px; }
              .print-date { text-align: center; color: #666; margin-bottom: 5px; font-size: 11px; }
              .print-periode { text-align: center; color: #333; margin-bottom: 20px; font-size: 12px; font-weight: bold; }
              table { width: 100%; border-collapse: collapse; }
              th, td { border: 1px solid #000; padding: 6px 8px; text-align: left; vertical-align: top; }
              th { background-color: #f2f2f2; font-weight: bold; text-align: center; }
              .text-right { text-align: right; }
            </style>
          </head>
          <body>
            <div class="header">
              <div class="company-name">Cabang Papua</div>
              <div class="company-division">Peralatan</div>
            </div>
            <h1>DATA STOCK SPAREPART</h1>
            <div class="print-date">Dicetak pada: ${new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</div>
            ${periodeLabel ? `<div class="print-periode">${periodeLabel}</div>` : ''}
            
            <table>
              <thead>
                <tr>
                  <th>No</th>
                  <th>Tanggal</th>
                  <th>Jenis</th>
                  <th>Nama Sparepart</th>
                  <th>Deskripsi</th>
                  <th>Jumlah</th>
                  <th>Satuan</th>
                  <th>Harga per Item (Rp)</th>
                  <th>Total Nilai (Rp)</th>
                  <th>Keterangan</th>
                  <th>Sisa Stock</th>
                </tr>
              </thead>
              <tbody>
                ${data.map((item: Sparepart, index: number) => `
                  <tr>
                    <td style="text-align: center;">${index + 1}</td>
                    <td>${item.tanggal ? formatDateDisplay(item.tanggal) : '-'}</td>
                    <td>${item.jenis || '-'}</td>
                    <td>${item.namaSparepart || '-'}</td>
                    <td>${item.deskripsi || '-'}</td>
                    <td class="text-right">${(item.jumlah || 0).toLocaleString('id-ID')}</td>
                    <td>${item.satuan || '-'}</td>
                    <td class="text-right">${item.harga ? formatCurrency(item.harga) : '-'}</td>
                    <td class="text-right">${(item.jumlah && item.harga) ? formatCurrency(item.jumlah * item.harga) : '-'}</td>
                    <td>${item.keterangan || '-'}</td>
                    <td class="text-right">${(item.sisaStock || 0).toLocaleString('id-ID')}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
            <script>
              window.onload = function() {
                setTimeout(function() {
                  window.print();
                  window.onafterprint = function() { window.close(); };
                }, 500);
              };
            </script>
          </body>
        </html>
      `);
      printWindow.document.close();
    } else {
      toast.error('Gagal membuka jendela print');
    }
  };

  const handleDialogConfirm = () => {
    let data = filteredData;
    let periodeLabel = '';
    if (dialogMode === 'range') {
      data = spareparts.filter((i: any) => {
        if (!i.tanggal) return false;
        if (dateFrom && i.tanggal < dateFrom) return false;
        if (dateTo && i.tanggal > dateTo) return false;
        const matchesSearch = (i.namaSparepart && i.namaSparepart.toLowerCase().includes(searchTerm.toLowerCase())) ||
          (i.deskripsi && i.deskripsi.toLowerCase().includes(searchTerm.toLowerCase())) ||
          (i.keterangan && i.keterangan.toLowerCase().includes(searchTerm.toLowerCase()));
        return matchesSearch;
      });
      periodeLabel = `Periode: ${formatDateDisplay(dateFrom)} — ${formatDateDisplay(dateTo)}`;
    }
    if (exportPrintDialog === 'export') {
      doExportExcel(data, dialogMode === 'range');
    } else if (exportPrintDialog === 'print') {
      doPrintSparepart(data, periodeLabel);
    }
    setExportPrintDialog(null);
  };

  if (isLoading) {
    return (
      <div className="page-container">
        <div className="flex justify-center items-center h-64">
          <div className="text-lg">Loading...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="page-container">
      <style>{`
          @media print {
            .page-container {
              background: white;
            }
            .print-header {
              display: block !important;
              text-align: left;
              border-bottom: 2px solid #000;
              padding-bottom: 10px;
              margin-bottom: 20px;
              page-break-inside: avoid;
            }
            .company-name {
              font-weight: bold;
              font-size: 14px;
              margin-bottom: 2px;
            }
            .company-division {
              font-size: 12px;
              margin-bottom: 10px;
            }
            .print-title {
              text-align: center;
              font-size: 16px;
              font-weight: bold;
              margin-bottom: 10px;
              page-break-inside: avoid;
            }
            .print-date {
              text-align: center;
              font-size: 11px;
              color: #666;
              margin-bottom: 20px;
              page-break-inside: avoid;
            }
            .page-header,
            .grid,
            .flex.justify-between,
            .btn-primary,
            .glass-card p,
            .glass-card:has(> h2),
            .page-description {
              display: none !important;
            }
            .glass-card {
              box-shadow: none;
              border: none;
              background: white;
              padding: 0;
            }
            .data-table {
              font-size: 12px;
              width: 100%;
              border-collapse: collapse;
            }
            .data-table th,
            .data-table td {
              border: 1px solid #ddd;
              padding: 8px;
              text-align: left;
            }
            .data-table th {
              background-color: #f5f5f5;
              font-weight: bold;
            }
            .data-table tr:nth-child(even) {
              background-color: #f9f9f9;
            }
          }
        `}</style>

      <div className="print-header" style={{ display: 'none' }}>
        <div className="company-name">Cabang Papua</div>
        <div className="company-division">Peralatan</div>
      </div>
      <div className="print-title" style={{ display: 'none' }}>Stock Sparepart</div>
      <div className="print-date" style={{ display: 'none' }}>
        Dicetak pada: {new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
      </div>

      <div className="page-header">
        <h1 className="page-title">Stock Sparepart</h1>
        <p className="page-description">
          Kelola inventaris sparepart untuk alat berat
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <div className="glass-card p-6 flex items-center animate-fade-in">
          <div className="w-12 h-12 rounded-full bg-purple-100 flex items-center justify-center mr-4">
            <ComponentIcon size={24} className="text-purple-600" />
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Jenis Sparepart</p>
            <p className="text-2xl font-bold">{uniqueSparepartCount}</p>
          </div>
        </div>

        <div className="glass-card p-6 flex items-center animate-fade-in" style={{ animationDelay: '0.1s' }}>
          <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center mr-4">
            <ComponentIcon size={24} className="text-blue-600" />
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Total Item</p>
            <p className="text-2xl font-bold">{totalItems.toLocaleString('id-ID')}</p>
          </div>
        </div>

        <div className="glass-card p-6 flex items-center animate-fade-in" style={{ animationDelay: '0.2s' }}>
          <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center mr-4">
            <ComponentIcon size={24} className="text-green-600" />
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Nilai Inventaris</p>
            <p className="text-2xl font-bold">{formatCurrency(totalValue)}</p>
          </div>
        </div>
      </div>

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
        <div className="flex flex-col md:flex-row items-start md:items-center gap-3 w-full md:w-auto">
          <div className="relative w-full md:w-auto">
            <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
              <Search size={18} className="text-gray-400" />
            </div>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              className="form-input pl-10"
              placeholder="Cari berdasarkan nama, deskripsi..."
            />
          </div>
          <div className="flex items-center gap-2 bg-white border rounded-lg px-3 py-1.5 text-sm">
            <Calendar size={16} className="text-gray-400 flex-shrink-0" />
            <input type="date" value={tableFilterFrom} onChange={e => setTableFilterFrom(e.target.value)}
              className="border-0 bg-transparent focus:ring-0 text-sm p-0 w-[120px]" placeholder="Dari" />
            <span className="text-gray-400">—</span>
            <input type="date" value={tableFilterTo} onChange={e => setTableFilterTo(e.target.value)}
              className="border-0 bg-transparent focus:ring-0 text-sm p-0 w-[120px]" placeholder="Sampai" />
            {(tableFilterFrom || tableFilterTo) && (
              <button onClick={() => { setTableFilterFrom(''); setTableFilterTo(''); }}
                className="ml-1 p-0.5 rounded-full text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                title="Reset filter tanggal">
                <X size={14} />
              </button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:flex sm:flex-wrap gap-2 w-full sm:w-auto">
          {canImport && (
            <ExcelImportButton
              onDataParsed={handleSparepartExcelDataParsed}
              expectedHeaders={expectedSparepartHeaders}
              buttonText="Impor Excel"
              className="flex items-center justify-center gap-1 px-3 py-2 text-xs sm:text-sm sm:px-4 sm:py-2 text-white bg-teal-600 rounded hover:bg-teal-700 w-full sm:w-auto"
            >
              <Upload size={16} className="mr-1" />
              Impor
            </ExcelImportButton>
          )}
          {canExportExcel && (
            <button
              onClick={() => { setDialogMode('all'); setExportPrintDialog('export'); }}
              className="flex items-center justify-center gap-1 px-3 py-2 text-xs sm:text-sm sm:px-4 sm:py-2 text-white bg-green-600 rounded hover:bg-green-700 w-full sm:w-auto"
            >
              <Download size={16} />
              Ekspor Excel
            </button>
          )}
          {canPrint && (
            <button
              onClick={() => { setDialogMode('all'); setExportPrintDialog('print'); }}
              className="flex items-center justify-center gap-1 px-3 py-2 text-xs sm:text-sm sm:px-4 sm:py-2 text-white bg-blue-600 rounded hover:bg-blue-700 w-full sm:w-auto"
            >
              <Printer size={16} />
              Cetak
            </button>
          )}
          {canCreate && (
            <button
              onClick={() => {
                resetForm();
                setShowForm(!showForm);
              }}
              className="btn-primary flex items-center justify-center gap-2 text-xs sm:text-sm px-3 py-2 sm:px-4 sm:py-2 w-full sm:w-auto"
            >
              <Plus size={18} />
              <span>Tambah Sparepart</span>
            </button>
          )}
        </div>
      </div>

      {exportPrintDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-lg p-6 max-w-md w-full shadow-xl">
            <h2 className="text-xl font-bold mb-4">
              {exportPrintDialog === 'export' ? 'Ekspor ke Excel' : 'Cetak Data'}
            </h2>
            <div className="space-y-4 mb-6">
              <div>
                <label className="flex items-center gap-2 mb-2 cursor-pointer">
                  <input type="radio" name="dialogMode" value="all" checked={dialogMode === 'all'} onChange={() => setDialogMode('all')} className="w-4 h-4 text-blue-600" />
                  <span className="font-medium">Semua Data</span>
                </label>
                <p className="text-sm text-gray-500 ml-6">Cetak/ekspor seluruh data sparepart yang ada.</p>
              </div>
              <div>
                <label className="flex items-center gap-2 mb-2 cursor-pointer">
                  <input type="radio" name="dialogMode" value="range" checked={dialogMode === 'range'} onChange={() => setDialogMode('range')} className="w-4 h-4 text-blue-600" />
                  <span className="font-medium">Pilih Periode</span>
                </label>
                {dialogMode === 'range' && (
                  <div className="ml-6 grid grid-cols-2 gap-3 mt-2 p-3 bg-gray-50 rounded-lg border">
                    <div className="space-y-1">
                      <label className="text-xs text-gray-500">Dari Tanggal</label>
                      <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} className="form-input text-sm py-1.5" />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs text-gray-500">Sampai Tanggal</label>
                      <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} className="form-input text-sm py-1.5" />
                    </div>
                  </div>
                )}
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <button onClick={() => setExportPrintDialog(null)} className="px-4 py-2 border rounded-lg hover:bg-gray-50">Batal</button>
              <button onClick={handleDialogConfirm} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                {exportPrintDialog === 'export' ? 'Ekspor Sekarang' : 'Cetak Sekarang'}
              </button>
            </div>
          </div>
        </div>
      )}

      {showForm && (
        <div className="glass-card p-6 mb-6 animate-fade-in">
          <h2 className="text-xl font-semibold mb-4">
            {editingItem ? 'Edit Data Sparepart' : 'Tambah Data Sparepart Baru'}
          </h2>

          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label htmlFor="namaSparepart" className="text-sm font-medium">
                Nama Sparepart <span className="text-red-500">*</span>
              </label>
              <input
                id="namaSparepart"
                name="namaSparepart"
                type="text"
                value={formData.namaSparepart}
                onChange={handleInputChange}
                className="form-input"
                placeholder="Contoh: Filter Oli, Baut M10, ..."
                required
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="tanggal" className="text-sm font-medium">
                Tanggal <span className="text-red-500">*</span>
              </label>
              <input
                id="tanggal"
                name="tanggal"
                type="date"
                value={formData.tanggal}
                onChange={handleInputChange}
                className="form-input"
                required
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="jenis" className="text-sm font-medium">
                Jenis <span className="text-red-500">*</span>
              </label>
              <select
                id="jenis"
                name="jenis"
                value={formData.jenis}
                onChange={handleInputChange}
                className="form-input"
                required
              >
                <option value="Pembelian">Pembelian</option>
                {formData.jenis === 'Pemakaian' && (
                  <option value="Pemakaian">Pemakaian</option>
                )}
              </select>
            </div>

            <div className="space-y-2">
              <label htmlFor="deskripsi" className="text-sm font-medium">
                Deskripsi
              </label>
              <input
                id="deskripsi"
                name="deskripsi"
                type="text"
                value={formData.deskripsi}
                onChange={handleInputChange}
                className="form-input"
                placeholder="Deskripsi singkat sparepart"
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="jumlah" className="text-sm font-medium">
                Jumlah
              </label>
              <input
                id="jumlah"
                name="jumlah"
                type="number"
                min="0"
                value={formData.jumlah}
                onChange={handleInputChange}
                className="form-input"
                required
              />
            </div>


            <div className="space-y-2">
              <label htmlFor="harga" className="text-sm font-medium">
                Harga per Item (Rp)
              </label>
              <input
                id="harga"
                name="harga"
                type="number"
                min="0"
                value={formData.harga}
                onChange={handleInputChange}
                className="form-input"
                required
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="satuan" className="text-sm font-medium">
                Satuan
              </label>
              <select
                id="satuan"
                name="satuan"
                value={formData.satuan}
                onChange={handleInputChange}
                className="form-input"
                required
              >
                <option value="pcs">Pcs</option>
                <option value="unit">Unit</option>
                <option value="set">Set</option>
                <option value="box">Box</option>
                <option value="kg">Kg</option>
                <option value="liter">Liter</option>
                <option value="meter">Meter</option>
              </select>
            </div>

            <div className="space-y-2">
              <label htmlFor="keterangan" className="text-sm font-medium">
                Keterangan
              </label>
              <input
                id="keterangan"
                name="keterangan"
                type="text"
                value={formData.keterangan}
                onChange={handleInputChange}
                className="form-input"
                placeholder="Keterangan tambahan (opsional)"
              />
            </div>

            <div className="md:col-span-2 flex justify-end gap-2 mt-4">
              <button
                type="button"
                onClick={() => {
                  setShowForm(false);
                  resetForm();
                }}
                className="px-4 py-2 border rounded-lg"
              >
                Batal
              </button>
              <button
                type="submit"
                className="btn-primary"
                disabled={addSparepartMutation.isPending || updateSparepartMutation.isPending}
              >
                {addSparepartMutation.isPending || updateSparepartMutation.isPending
                  ? 'Menyimpan...'
                  : editingItem ? 'Perbarui' : 'Simpan'}
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="glass-card">
        <TableScrollWrapper>
          <table className="data-table">
            <thead>
              <tr>
                <th>Tanggal</th>
                <th>Jenis</th>
                <th>Nama Sparepart</th>
                <th>Deskripsi</th>
                <th>Jumlah</th>
                <th>Satuan</th>
                <th>Harga per Item</th>
                <th>Total Nilai</th>
                <th>Keterangan</th>
                <th>Sisa Stock</th>
                {canShowActions && <th className="print:hidden">Aksi</th>}
              </tr>
            </thead>
            <tbody>
              {filteredData.length > 0 ? (
                paginateData(filteredData, currentPage, pageSize).map((item) => (
                  <tr key={item.id}>
                    <td>{item.tanggal ? formatDateDisplay(item.tanggal) : '-'}</td>
                    <td>{item.jenis || '-'}</td>
                    <td>{item.namaSparepart}</td>
                    <td>{item.deskripsi || '-'}</td>
                    <td>{(item.jumlah || 0).toLocaleString('id-ID')}</td>
                    <td>{item.satuan || '-'}</td>
                    <td>{formatCurrency(item.harga || 0)}</td>
                    <td>{formatCurrency((item.jumlah || 0) * (item.harga || 0))}</td>
                    <td>{item.keterangan || '-'}</td>
                    <td>{(item.sisaStock || 0).toLocaleString('id-ID')}</td>
                    {canShowActions && (
                      <td className="print:hidden">
                        <div className="flex gap-2">
                          {canEdit && (
                            <button
                              onClick={() => handleEdit(item)}
                              className="p-1 text-blue-600 hover:text-blue-800"
                              disabled={updateSparepartMutation.isPending}
                            >
                              <Edit size={18} />
                            </button>
                          )}
                          {canDelete && (
                            <button
                              onClick={() => handleDelete(item.id)}
                              className="p-1 text-red-600 hover:text-red-800"
                              disabled={deleteSparepartMutation.isPending}
                            >
                              <Trash size={18} />
                            </button>
                          )}
                        </div>
                      </td>
                    )}
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={canShowActions ? 11 : 10} className="text-center py-4">
                    {searchTerm ? 'Tidak ada data yang sesuai dengan pencarian' : 'Belum ada data sparepart tersimpan'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </TableScrollWrapper>
        {filteredData.length > 0 && (
          <SimplePagination
            currentPage={currentPage}
            totalPages={getTotalPages(filteredData.length, pageSize)}
            onPageChange={setCurrentPage}
            pageSize={pageSize}
            onPageSizeChange={(size) => { setPageSize(size); setCurrentPage(1); }}
            totalItems={filteredData.length}
          />
        )}
      </div>
    </div>
  );
};

export default StockSparepart;

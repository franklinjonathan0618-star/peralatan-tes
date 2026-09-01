import { useState, useMemo } from 'react';
import { Plus, Search, Edit, Trash2, Printer, Upload, Download, Calendar, X, ChevronDown } from 'lucide-react';
import { toast } from 'sonner';
import { useBBMStocks, useAddBBMStock, useUpdateBBMStock, useDeleteBBMStock, BBMStockItem } from '../hooks/useBBMStocks';
import { useBBMTransactions, useAddBBMTransaction, useUpdateBBMTransaction, useDeleteBBMTransaction, BBMTransaction } from '../hooks/useBBMTransactions';
import { SelectAlatTimeSheet } from '@/components/SelectAlatTimeSheet';
import { usePagePermission } from '@/hooks/usePagePermission';
import { parse } from 'date-fns';
import ExcelImportButton from '@/components/ui/ExcelImportButton';
import { exportToExcel } from '@/utils/excelUtils';
import { SimplePagination, paginateData, getTotalPages } from '@/components/ui/SimplePagination';
import { formatDateDisplay, getTodayLocalDateString, normalizeDateOnly } from '@/utils/dateUtils';
import { TableScrollWrapper } from '@/components/ui/TableScrollWrapper';

// ─── Komponen Dialog Transaksi ───────────────────────────
function TransactionForm({
  initial,
  onSave,
  onCancel,
  isSaving,
}: {
  initial: Omit<BBMTransaction, 'id'>;
  onSave: (d: Omit<BBMTransaction, 'id'>) => void;
  onCancel: () => void;
  isSaving: boolean;
}) {
  const [form, setForm] = useState(initial);
  const set = (k: keyof typeof form, v: any) => setForm(f => ({ ...f, [k]: v }));

  return (
    <form
      onSubmit={e => { e.preventDefault(); onSave(form); }}
      className="grid grid-cols-1 md:grid-cols-2 gap-4"
    >
      <div className="md:col-span-2 mb-4">
        <div className="inline-flex rounded-md shadow-sm" role="group">
          <button
            type="button"
            onClick={() => set('jenis', 'pembelian')}
            className={`px-4 py-2 text-sm font-medium rounded-l-lg border ${form.jenis === 'pembelian'
              ? 'bg-primary text-white border-primary'
              : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
              }`}
          >
            Pembelian
          </button>
          <button
            type="button"
            onClick={() => set('jenis', 'pemakaian')}
            className={`px-4 py-2 text-sm font-medium border ${(!form.jenis || form.jenis === 'pemakaian')
              ? 'bg-primary text-white border-primary'
              : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
              }`}
          >
            Pemakaian
          </button>
          <button
            type="button"
            onClick={() => set('jenis', 'sisa_stock')}
            className={`px-4 py-2 text-sm font-medium rounded-r-lg border ${form.jenis === 'sisa_stock'
              ? 'bg-primary text-white border-primary'
              : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
              }`}
          >
            Sisa Stock
          </button>
        </div>
      </div>
      <div className="space-y-1">
        <label className="text-sm font-medium">Tanggal <span className="text-red-500">*</span></label>
        <input type="date" value={form.tanggal} onChange={e => set('tanggal', e.target.value)}
          className="form-input" required />
      </div>
      <div className="space-y-1">
        <label className="text-sm font-medium">Jenis BBM <span className="text-red-500">*</span></label>
        <select value={form.jenisBBM} onChange={e => set('jenisBBM', e.target.value)} className="form-input" required>
          <option value="">-- Pilih --</option>
          {['Dexlite', 'Pertalite', 'Pertamax', 'Pertamina Dex', 'Biosolar', 'HSD (BBM Alat Berat)'].map(j => (
            <option key={j} value={j}>{j}</option>
          ))}
        </select>
      </div>
      <div className="space-y-1">
        <label className="text-sm font-medium">Jumlah <span className="text-red-500">*</span></label>
        <input type="number" min="0" step="0.01" value={form.jumlah}
          onChange={e => set('jumlah', parseFloat(e.target.value) || 0)} className="form-input" required />
      </div>
      <div className="space-y-1">
        <label className="text-sm font-medium">Satuan</label>
        <select value={form.satuan} onChange={e => set('satuan', e.target.value)} className="form-input">
          <option value="liter">Liter</option>
          <option value="drum">Drum</option>
          <option value="galon">Galon</option>
        </select>
      </div>
      {form.jenis === 'pemakaian' && (
        <>
          <div className="space-y-1">
            <label className="text-sm font-medium">No. Lambung</label>
            <SelectAlatTimeSheet
              value={form.noLambung}
              onChange={v => set('noLambung', v)}
              onAlatSelected={alat => { if (alat) set('namaAlat', (alat as any).namaAlat || ''); }}
            />
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium">Nama Alat</label>
            <input type="text" value={form.namaAlat} onChange={e => set('namaAlat', e.target.value)}
              className="form-input" placeholder="Otomatis terisi dari No. Lambung" />
          </div>
        </>
      )}
      {(form.jenis === 'pembelian' || form.jenis === 'sisa_stock') && (
        <>
          <div className="space-y-1">
            <label className="text-sm font-medium">Harga Satuan (Rp)</label>
            <input type="number" min="0" value={form.cost}
              onChange={e => set('cost', parseFloat(e.target.value) || 0)} className="form-input" />
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium">Total Biaya (Rp)</label>
            <input type="text" readOnly value={new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format((form.jumlah || 0) * (form.cost || 0))} className="form-input bg-gray-50 text-gray-500 cursor-not-allowed" />
          </div>
        </>
      )}
      <div className="space-y-1">
        <label className="text-sm font-medium">Lokasi Proyek (Opsional)</label>
        <input type="text" value={form.lokasiProyek} onChange={e => set('lokasiProyek', e.target.value)}
          className="form-input" placeholder="Contoh: Proyek A" />
      </div>
      <div className="space-y-1">
        <label className="text-sm font-medium">Keterangan</label>
        <input type="text" value={form.keterangan} onChange={e => set('keterangan', e.target.value)}
          className="form-input" placeholder="Opsional" />
      </div>
      <div className="md:col-span-2 flex justify-end gap-2 mt-2">
        <button type="button" onClick={onCancel} className="px-4 py-2 border rounded-lg">Batal</button>
        <button type="submit" className="btn-primary" disabled={isSaving}>
          {isSaving ? 'Menyimpan...' : 'Simpan'}
        </button>
      </div>
    </form>
  );
}

// ─── Halaman Utama ───────────────────────────────────────
const StockBBM = () => {
  const formatCurrency = (v: number) =>
    new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(v);

  const { can_create: canCreate, can_edit: canEdit, can_delete: canDelete, can_import: canImport, can_export_excel: canExportExcel, can_print: canPrint } = usePagePermission('stockBBM');
  const canShowActions = canEdit || canDelete;

  // ── State umum ──────────────────────────────────────────
  const [activeTab, setActiveTab] = useState<'stock' | 'transaksi'>('transaksi');
  const [selectedBBMType, setSelectedBBMType] = useState('Dexlite');
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPageStock, setCurrentPageStock] = useState(1);
  const [currentPageTrans, setCurrentPageTrans] = useState(1);
  const [pageSizeStock, setPageSizeStock] = useState(25);
  const [pageSizeTrans, setPageSizeTrans] = useState(25);

  // ── State filter rentang tanggal tabel ────────────────
  const [tableFilterFrom, setTableFilterFrom] = useState('');
  const [tableFilterTo, setTableFilterTo] = useState('');

  // ── State Dialog Export/Print ──────────────────────────
  const [exportPrintDialog, setExportPrintDialog] = useState<'export' | 'print' | null>(null);
  const [dialogMode, setDialogMode] = useState<'all' | 'range'>('all');
  const now = new Date();
  const firstDayOfMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;
  const lastDayOfMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate()).padStart(2, '0')}`;
  const [dateFrom, setDateFrom] = useState(firstDayOfMonth);
  const [dateTo, setDateTo] = useState(lastDayOfMonth);

  // ── State Stock (bbm_stocks) ────────────────────────────
  const { data: stockList = [], isLoading: stockLoading } = useBBMStocks();
  const addStockMutation = useAddBBMStock();
  const updateStockMutation = useUpdateBBMStock();
  const deleteStockMutation = useDeleteBBMStock();

  const [showStockForm, setShowStockForm] = useState(false);
  const [editingStock, setEditingStock] = useState<BBMStockItem | null>(null);
  const [deletingStock, setDeletingStock] = useState<BBMStockItem | null>(null);
  const [stockForm, setStockForm] = useState({ jenisBBM: '', jumlahStock: 0, satuan: 'liter', hargaSatuan: 0, keterangan: '' });

  // ── State Transaksi (bbm_transactions) ─────────────────
  const { data: transList = [], isLoading: transLoading } = useBBMTransactions();
  const addTransMutation = useAddBBMTransaction();
  const updateTransMutation = useUpdateBBMTransaction();
  const deleteTransMutation = useDeleteBBMTransaction();

  const emptyTrans: Omit<BBMTransaction, 'id'> = {
    tanggal: getTodayLocalDateString(),
    jenisBBM: selectedBBMType, jumlah: 0, satuan: 'liter',
    noLambung: '', namaAlat: '', cost: 0, keterangan: '', jenis: 'pemakaian', lokasiProyek: ''
  };
  const [showTransForm, setShowTransForm] = useState(false);
  const [editingTrans, setEditingTrans] = useState<BBMTransaction | null>(null);
  const [deletingTrans, setDeletingTrans] = useState<BBMTransaction | null>(null);

  // ══════════════════════════════════════════════════════
  // Handler Stock
  // ══════════════════════════════════════════════════════
  const resetStockForm = () => { setStockForm({ jenisBBM: '', jumlahStock: 0, satuan: 'liter', hargaSatuan: 0, keterangan: '' }); setEditingStock(null); };

  const handleStockSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingStock) {
        await updateStockMutation.mutateAsync({ id: editingStock.id, ...stockForm });
        toast.success('Data stock BBM berhasil diperbarui');
      } else {
        await addStockMutation.mutateAsync(stockForm);
        toast.success('Data stock BBM berhasil ditambahkan');
      }
      resetStockForm(); setShowStockForm(false);
    } catch (error: any) {
      toast.error(`Gagal: ${error?.message || 'Terjadi kesalahan'}`, { duration: 8000 });
    }
  };

  const handleDeleteStock = async () => {
    if (!deletingStock) return;
    try {
      await deleteStockMutation.mutateAsync(deletingStock.id);
      toast.success('Data stock BBM berhasil dihapus');
    } catch (error: any) {
      toast.error(`Gagal menghapus: ${error?.message}`, { duration: 8000 });
    } finally { setDeletingStock(null); }
  };

  // ══════════════════════════════════════════════════════
  // Handler Transaksi
  // ══════════════════════════════════════════════════════
  const handleTransSave = async (data: Omit<BBMTransaction, 'id'>) => {
    try {
      if (editingTrans) {
        await updateTransMutation.mutateAsync({ id: editingTrans.id, ...data });
        toast.success('Transaksi BBM berhasil diperbarui');
        setEditingTrans(null);
      } else {
        await addTransMutation.mutateAsync(data);
        toast.success('Transaksi BBM berhasil ditambahkan');
      }
      setShowTransForm(false);
    } catch (error: any) {
      toast.error(`Gagal: ${error?.message || 'Terjadi kesalahan'}`, { duration: 8000 });
    }
  };

  const handleDeleteTrans = async () => {
    if (!deletingTrans) return;
    try {
      await deleteTransMutation.mutateAsync(deletingTrans.id);
      toast.success('Transaksi BBM berhasil dihapus');
    } catch (error: any) {
      toast.error(`Gagal menghapus: ${error?.message}`, { duration: 8000 });
    } finally { setDeletingTrans(null); }
  };

  // ══════════════════════════════════════════════════════
  // Filter
  // ══════════════════════════════════════════════════════
  const filteredStock = useMemo(() => {
    return stockList
      .filter((i: BBMStockItem) => i.jenisBBM !== 'Bensin')
      .map((i: BBMStockItem) => ({ ...i, jenisBBM: i.jenisBBM === 'Solar' ? 'Dexlite' : i.jenisBBM }))
      .filter((i: BBMStockItem) =>
        i.jenisBBM?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        i.keterangan?.toLowerCase().includes(searchTerm.toLowerCase())
      );
  }, [stockList, searchTerm]);

  const filteredTrans = useMemo(() => {
    return transList
      .filter((i: BBMTransaction) => i.jenisBBM !== 'Bensin')
      .map((i: BBMTransaction) => ({ ...i, jenisBBM: i.jenisBBM === 'Solar' ? 'Dexlite' : i.jenisBBM }))
      .filter((i: BBMTransaction) => i.jenisBBM === selectedBBMType)
      .filter((i: BBMTransaction) => {
        const matchesSearch =
          i.namaAlat?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          i.noLambung?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          i.keterangan?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          i.lokasiProyek?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (i.tanggal || '').includes(searchTerm);
        if (!matchesSearch) return false;
        // Filter rentang tanggal tabel
        if (tableFilterFrom && i.tanggal && i.tanggal < tableFilterFrom) return false;
        if (tableFilterTo && i.tanggal && i.tanggal > tableFilterTo) return false;
        return true;
      });
  }, [transList, selectedBBMType, searchTerm, tableFilterFrom, tableFilterTo]);

  const summary = useMemo(() => {
    let tPembelian = 0;
    let tPemakaian = 0;
    transList.forEach(t => {
      let bbm = t.jenisBBM;
      if (bbm === 'Bensin') return;
      if (bbm === 'Solar') bbm = 'Dexlite';
      if (bbm === selectedBBMType) {
        if (t.jenis === 'pembelian') {
          tPembelian += (t.jumlah || 0);
        } else if (t.jenis === 'pemakaian') {
          tPemakaian += (t.jumlah || 0);
        }
      }
    });
    return {
      totalPembelian: tPembelian,
      totalPemakaian: tPemakaian
    };
  }, [transList, selectedBBMType]);

  const bbmStocks = useMemo(() => {
    const stocks: Record<string, number> = {
      'Dexlite': 0,
      'Pertalite': 0,
      'Pertamax': 0,
      'Pertamina Dex': 0,
      'Biosolar': 0,
      'HSD (BBM Alat Berat)': 0
    };

    // Add initial stock from Master Stock
    stockList.forEach((s: BBMStockItem) => {
      let bbm = s.jenisBBM;
      if (bbm === 'Bensin') return;
      if (bbm === 'Solar') bbm = 'Dexlite';
      if (bbm) {
        if (stocks[bbm] === undefined) stocks[bbm] = 0;
        stocks[bbm] += (s.jumlahStock || 0);
      }
    });
    return stocks;
  }, [stockList]);

  useMemo(() => {
    let tPembelian = 0;
    let tPemakaian = 0;
    let tBiayaPembelian = 0;
    let tBiayaPemakaian = 0;
    transList.forEach(t => {
      if (t.jenis === 'pembelian') {
        tPembelian += (t.jumlah || 0);
        tBiayaPembelian += ((t.jumlah || 0) * (t.cost || 0));
      } else if (t.jenis === 'pemakaian') {
        tPemakaian += (t.jumlah || 0);
        tBiayaPemakaian += ((t.jumlah || 0) * (t.cost || 0));
      }
    });
    return {
      totalPembelianL: tPembelian,
      totalPemakaianL: tPemakaian,
      totalBiayaPembelian: tBiayaPembelian,
      totalBiayaPemakaian: tBiayaPemakaian
    };
  }, [transList]);



  // ══════════════════════════════════════════════════════
  // Import & Export Excel
  // ══════════════════════════════════════════════════════
  const expectedBBMHeaders = ["Tanggal", "Jenis Transaksi", "Jenis BBM", "Jumlah"];

  const handleBBMExcelDataParsed = async (parsedData: any[], fileName?: string) => {
    let successCount = 0;
    let errorCount = 0;
    const errors: string[] = [];

    if (parsedData.length === 0) {
      toast.info(`Tidak ada data untuk diimpor dari file ${fileName || 'Excel'}.`);
      return;
    }

    for (const [index, row] of parsedData.entries()) {
      const normalizedRow: { [key: string]: unknown } = {};
      for (const key in row) {
        normalizedRow[key.trim().toLowerCase()] = row[key];
      }

      const findVal = (keys: string[]): unknown => {
        for (const k of keys) {
          if (normalizedRow[k] !== undefined && normalizedRow[k] !== '') return normalizedRow[k];
          for (const nk of Object.keys(normalizedRow)) {
            if ((nk.includes(k) || k.includes(nk)) && normalizedRow[nk] !== undefined && normalizedRow[nk] !== '') return normalizedRow[nk];
          }
        }
        return undefined;
      };

      // Helper untuk parsing angka (support format Indonesia misal 50.000,00)
      const parseNumeric = (val: unknown): number => {
        if (val === undefined || val === null || val === '') return 0;
        if (typeof val === 'number') return val;
        const str = String(val).trim();
        // Hapus titik (ribuan), ganti koma dengan titik (desimal)
        const cleanStr = str.replace(/\./g, '').replace(/,/g, '.');
        const num = parseFloat(cleanStr);
        return isNaN(num) ? 0 : num;
      };

      const tanggalValue = findVal(['tanggal', 'date']);
      const jenisTransaksiVal = findVal(['jenis transaksi', 'jenis_transaksi', 'jenis', 'type', 'transaction type', 'tipe transaksi', 'tipe']);
      const jenisRaw = jenisTransaksiVal ? jenisTransaksiVal.toString().trim().toLowerCase() : '';
      let jenisTransaksi: 'pembelian' | 'pemakaian' | 'sisa_stock' = 'pemakaian';
      if (jenisRaw === 'pembelian' || jenisRaw === 'purchase' || jenisRaw === 'tambah' || jenisRaw === 'masuk') {
        jenisTransaksi = 'pembelian';
      } else if (jenisRaw === 'pemakaian' || jenisRaw === 'usage' || jenisRaw === 'kurang' || jenisRaw === 'keluar' || jenisRaw === 'use' || jenisRaw === 'pakai') {
        jenisTransaksi = 'pemakaian';
      } else if (
        jenisRaw === 'sisa stock' ||
        jenisRaw === 'sisa_stock' ||
        jenisRaw === 'sisa stok' ||
        jenisRaw === 'sisa' ||
        jenisRaw === 'saldo awal' ||
        jenisRaw === 'stok awal' ||
        jenisRaw === 'balance' ||
        jenisRaw === 'initial stock'
      ) {
        jenisTransaksi = 'sisa_stock';
      } else {
        jenisTransaksi = jenisRaw as any;
      }

      const jenisBBM = findVal(['jenis bbm', 'jenis_bbm', 'bbm', 'fuel type', 'fuel'])?.toString().trim();
      const jumlahStr = findVal(['jumlah', 'volume', 'qty', 'quantity', 'volume (liter)', 'volume (l)', 'liter']);
      const satuan = findVal(['satuan', 'unit'])?.toString().trim() || 'liter';
      const hargaSatuanStr = findVal(['harga satuan (rp)', 'harga satuan', 'harga_satuan', 'harga', 'price', 'cost', 'rate']);

      const keteranganExcel = String(findVal(['keterangan', 'catatan', 'note', 'description']) || '').trim();
      const noLambungExcel = String(findVal(['no. lambung', 'no lambung', 'no_lambung', 'lambung', 'hull number', 'hull_no']) || '').trim();
      const namaAlatExcel = String(findVal(['nama alat', 'nama_alat', 'alat', 'equipment', 'equipment name']) || '').trim();
      const lokasiProyekExcel = String(findVal(['lokasi proyek', 'lokasi_proyek', 'lokasi', 'proyek', 'project', 'project location']) || '').trim();

      let tanggalParsed: Date | null = null;
      let tanggalFormatted: string = '';

      if (tanggalValue instanceof Date && !isNaN(tanggalValue.getTime())) {
        tanggalParsed = tanggalValue;
      } else if (typeof tanggalValue === 'number') {
        const excelEpoch = Date.UTC(1899, 11, 30);
        const jsDate = new Date(excelEpoch + tanggalValue * 24 * 60 * 60 * 1000);
        if (!isNaN(jsDate.getTime())) tanggalParsed = jsDate;
      } else if (typeof tanggalValue === 'string') {
        const tryParseDate = (ds: string, fmt: string) => {
          try { const p = parse(ds, fmt, new Date()); if (!isNaN(p.getTime())) return p; } catch (e) { } return null;
        };
        const ts = String(tanggalValue);
        tanggalParsed = tryParseDate(ts, 'yyyy-MM-dd') || tryParseDate(ts, 'dd/MM/yyyy') || tryParseDate(ts, 'MM/dd/yyyy') || tryParseDate(ts, 'yyyy/MM/dd');
        if (!tanggalParsed && ts) {
          const d = new Date(ts);
          if (!isNaN(d.getTime())) tanggalParsed = d;
        }
      }

      if (tanggalParsed) {
        tanggalFormatted = normalizeDateOnly(tanggalParsed);
      } else {
        errors.push(`Baris ${index + 2}: Format tanggal tidak valid (${tanggalValue}).`);
        errorCount++;
        continue;
      }

      const jumlah = parseNumeric(jumlahStr);
      if (jumlah <= 0) {
        errors.push(`Baris ${index + 2}: Jumlah tidak valid atau nol.`);
        errorCount++;
        continue;
      }

      if (!jenisBBM) {
        errors.push(`Baris ${index + 2}: Jenis BBM wajib diisi.`);
        errorCount++;
        continue;
      }

      const cost = parseNumeric(hargaSatuanStr);

      let jenis: 'pembelian' | 'pemakaian' | 'sisa_stock' = 'pemakaian';
      if (jenisTransaksi === 'pembelian') {
        jenis = 'pembelian';
      } else if (jenisTransaksi === 'pemakaian') {
        jenis = 'pemakaian';
      } else if (jenisTransaksi === 'sisa_stock') {
        jenis = 'sisa_stock';
      } else {
        errors.push(`Baris ${index + 2}: Jenis Transaksi tidak valid ("${jenisTransaksi}"). Gunakan "Pembelian", "Pemakaian", atau "Sisa Stock".`);
        errorCount++;
        continue;
      }

      try {
        await addTransMutation.mutateAsync({
          tanggal: tanggalFormatted,
          jenisBBM: jenisBBM,
          jumlah: jumlah,
          satuan: satuan,
          noLambung: jenis === 'pemakaian' ? (noLambungExcel || '') : '',
          namaAlat: jenis === 'pemakaian' ? (namaAlatExcel || '') : '',
          cost: cost,
          keterangan: keteranganExcel || (jenis === 'sisa_stock' ? 'Sisa Stock' : jenis === 'pembelian' ? 'Pembelian' : 'Pemakaian'),
          jenis: jenis,
          lokasiProyek: lokasiProyekExcel || ''
        });
        successCount++;
      } catch (error: any) {
        errors.push(`Baris ${index + 2}: Gagal menyimpan. ${error.message}`);
        errorCount++;
      }
    }

    if (successCount > 0 && errorCount > 0) {
      toast.warning(
        <div>
          <p className="font-semibold">Impor Selesai Sebagian (File: {fileName})</p>
          <p>Berhasil: {successCount} transaksi.</p>
          <p>Gagal: {errorCount} transaksi.</p>
        </div>, { duration: 10000 }
      );
    } else if (successCount > 0) {
      toast.success(`Berhasil mengimpor ${successCount} transaksi.`);
    } else if (errorCount > 0) {
      toast.error(`Gagal mengimpor. Terdapat ${errorCount} kesalahan.`);
    }
  };

  const doExportExcel = (data: BBMTransaction[], isRange: boolean) => {
    if (data.length === 0) {
      toast.warning('Tidak ada data untuk diekspor');
      return;
    }
    const dataToExport = data.map((item: BBMTransaction, index: number) => ({
      'No': index + 1,
      'Tanggal': item.tanggal ? normalizeDateOnly(item.tanggal) : '-',
      'Jenis Transaksi': item.jenis === 'pembelian' ? 'Pembelian' : item.jenis === 'sisa_stock' ? 'Sisa Stock' : 'Pemakaian',
      'Jenis BBM': item.jenisBBM || '',
      'Jumlah': item.jumlah,
      'Satuan': item.satuan || '',
      'Harga Satuan (Rp)': item.cost || 0,
      'Total Biaya (Rp)': (item.jumlah || 0) * (item.cost || 0),
      'No. Lambung': item.noLambung || '',
      'Nama Alat': item.namaAlat || '',
      'Lokasi Proyek': item.lokasiProyek || '',
      'Keterangan': item.keterangan || ''
    }));
    const suffix = isRange && dateFrom && dateTo ? `_${dateFrom}_sd_${dateTo}` : '';
    try {
      exportToExcel(dataToExport, `Data_Transaksi_BBM${suffix}`);
      toast.success(`Berhasil mengekspor ${data.length} transaksi ke Excel`);
    } catch (error) {
      toast.error('Gagal mengekspor data');
    }
  };

  const doPrintTransaksi = (data: BBMTransaction[], periodeLabel: string) => {
    if (data.length === 0) {
      toast.warning('Tidak ada data untuk dicetak');
      return;
    }

    // Hitung total: Pembelian + Sisa Stock - Pemakaian
    let totalPembelian = 0;
    let totalSisaStock = 0;
    let totalPemakaian = 0;
    let totalBiaya = 0;

    data.forEach((item: BBMTransaction) => {
      const jml = Number(item.jumlah) || 0;
      const c = Number(item.cost) || 0;
      if (item.jenis === 'pembelian') {
        totalPembelian += jml;
        totalBiaya += jml * c;
      } else if (item.jenis === 'sisa_stock') {
        totalSisaStock += jml;
        totalBiaya += jml * c;
      } else if (item.jenis === 'pemakaian') {
        totalPemakaian += jml;
      }
    });

    const totalStokAkhir = (totalPembelian + totalSisaStock) - totalPemakaian;

    const printWindow = window.open('', '', 'width=900,height=650');
    if (printWindow) {
      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>Daftar Transaksi BBM</title>
            <style>
              @page { size: A4 landscape; margin: 10mm; }
              * { box-sizing: border-box; }
              body { font-family: Arial, sans-serif; padding: 15px; font-size: 11px; color: #111; }
              .print-container { width: 100%; margin: 0 auto; }
              .header { border-bottom: 2px solid #000; padding-bottom: 8px; margin-bottom: 16px; width: 100%; }
              .company-name { font-weight: bold; font-size: 14px; }
              .company-division { font-size: 12px; }
              h1 { color: #1a365d; text-align: center; font-size: 16px; margin: 0 0 4px 0; }
              .print-date { text-align: center; color: #555; margin-bottom: 4px; font-size: 10px; }
              .print-periode { text-align: center; color: #222; margin-bottom: 14px; font-size: 11px; font-weight: bold; }
              table { width: 100%; border-collapse: collapse; }
              th, td { border: 1px solid #333; padding: 5px 6px; text-align: left; vertical-align: middle; }
              th { background-color: #f1f5f9; font-weight: bold; text-align: center; }
              .text-right { text-align: right; }
              .text-center { text-align: center; }
              .total-row { background-color: #e2e8f0; font-weight: bold; }
              .summary-box { margin-top: 14px; width: 100%; border: 1px solid #333; background-color: #f8fafc; padding: 10px 14px; border-radius: 4px; display: flex; justify-content: space-between; font-size: 11px; }
            </style>
          </head>
          <body>
            <div class="print-container">
              <div class="header">
                <div class="company-name">Cabang Papua</div>
                <div class="company-division">Peralatan</div>
              </div>
              <h1>DAFTAR TRANSAKSI BBM</h1>
              <div class="print-date">Dicetak pada: ${new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</div>
              ${periodeLabel ? `<div class="print-periode">${periodeLabel}</div>` : ''}
              
              <table>
                <thead>
                  <tr>
                    <th style="width: 35px;">No</th>
                    <th>Tanggal</th>
                    <th>Jenis Transaksi</th>
                    <th>Jenis BBM</th>
                    <th>Jumlah</th>
                    <th>Satuan</th>
                    <th>No. Lambung</th>
                    <th>Nama Alat</th>
                    <th>Lokasi Proyek</th>
                    <th>Harga Satuan (Rp)</th>
                    <th>Total Biaya (Rp)</th>
                    <th>Keterangan</th>
                  </tr>
                </thead>
                <tbody>
                  ${data.map((item: BBMTransaction, index: number) => `
                    <tr>
                      <td style="text-align: center;">${index + 1}</td>
                      <td>${item.tanggal ? formatDateDisplay(item.tanggal) : '-'}</td>
                      <td>${item.jenis === 'pembelian' ? 'Pembelian' : item.jenis === 'sisa_stock' ? 'Sisa Stock' : 'Pemakaian'}</td>
                      <td>${item.jenisBBM || '-'}</td>
                      <td class="text-right font-medium">${item.jumlah.toLocaleString('id-ID')}</td>
                      <td>${item.satuan || '-'}</td>
                      <td>${item.noLambung || '-'}</td>
                      <td>${item.namaAlat || '-'}</td>
                      <td>${item.lokasiProyek || '-'}</td>
                      <td class="text-right">${item.cost ? formatCurrency(item.cost) : '-'}</td>
                      <td class="text-right">${(item.jumlah && item.cost) ? formatCurrency(item.jumlah * item.cost) : '-'}</td>
                      <td>${item.keterangan || '-'}</td>
                    </tr>
                  `).join('')}
                </tbody>
                <tfoot>
                  <tr class="total-row">
                    <td colspan="4" style="text-align: center; font-weight: bold;">
                      Total Sisa Stok (Pembelian + Sisa Stock - Pemakaian)
                    </td>
                    <td class="text-right" style="font-weight: bold; color: #1e3a8a;">
                      ${totalStokAkhir.toLocaleString('id-ID')}
                    </td>
                    <td style="font-weight: bold;">liter</td>
                    <td colspan="6"></td>
                  </tr>
                </tfoot>
              </table>

              <div class="summary-box">
                <div><strong>Ringkasan:</strong></div>
                <div>Pembelian: <strong>${totalPembelian.toLocaleString('id-ID')} L</strong></div>
                <div>Sisa Stock: <strong>${totalSisaStock.toLocaleString('id-ID')} L</strong></div>
                <div>Pemakaian: <strong>${totalPemakaian.toLocaleString('id-ID')} L</strong></div>
                <div style="color: #1e3a8a;">Total Sisa Stok: <strong>${totalStokAkhir.toLocaleString('id-ID')} L</strong></div>
              </div>
            </div>

            <script>
              window.onload = function() {
                setTimeout(function() {
                  window.print();
                  window.onafterprint = function() {
                    window.close();
                  };
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
    let data = filteredTrans;
    let periodeLabel = '';
    if (dialogMode === 'range') {
      data = filteredTrans.filter((i: BBMTransaction) => {
        if (!i.tanggal) return false;
        if (dateFrom && i.tanggal < dateFrom) return false;
        if (dateTo && i.tanggal > dateTo) return false;
        return true;
      });
      periodeLabel = `Periode: ${formatDateDisplay(dateFrom)} — ${formatDateDisplay(dateTo)}`;
    }
    if (exportPrintDialog === 'export') {
      doExportExcel(data, dialogMode === 'range');
    } else if (exportPrintDialog === 'print') {
      doPrintTransaksi(data, periodeLabel);
    }
    setExportPrintDialog(null);
  };

  // ══════════════════════════════════════════════════════
  // Print
  // ══════════════════════════════════════════════════════
  const handlePrintStock = () => {
    const w = window.open('', '_blank');
    if (!w) return;
    const date = new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
    const stockRows = filteredStock.map((item: BBMStockItem, i: number) => `<tr style="background:${i % 2 ? '#f9f9f9' : '#fff'}">
      <td style="border:1px solid #ddd;padding:6px">${i + 1}</td>
      <td style="border:1px solid #ddd;padding:6px">${item.jenisBBM}</td>
      <td style="border:1px solid #ddd;padding:6px;text-align:right">${item.jumlahStock.toLocaleString('id-ID')}</td>
      <td style="border:1px solid #ddd;padding:6px">${item.satuan}</td>
      <td style="border:1px solid #ddd;padding:6px;text-align:right">${formatCurrency(item.hargaSatuan)}</td>
      <td style="border:1px solid #ddd;padding:6px;text-align:right">${formatCurrency(item.jumlahStock * item.hargaSatuan)}</td>
      <td style="border:1px solid #ddd;padding:6px">${item.keterangan || '-'}</td>
    </tr>`).join('');
    w.document.write(`<!DOCTYPE html><html><head><title>Stock BBM</title>
    <style>body{font-family:Arial;padding:20px}table{width:100%;border-collapse:collapse;font-size:12px}
    th{background:#1e40af;color:#fff;padding:8px;border:1px solid #ddd}</style></head><body>
    <b>Cabang Papua</b><br><small>Peralatan</small>
    <h2 style="text-align:center">Stock BBM</h2>
    <p style="text-align:center;font-size:11px;color:#666">Dicetak: ${date}</p>
    <table><thead><tr><th>No</th><th>Jenis BBM</th><th>Jumlah</th><th>Satuan</th><th>Harga Satuan</th><th>Total Nilai</th><th>Keterangan</th></tr></thead>
    <tbody>${stockRows}</tbody></table>
    <script>window.onload=()=>setTimeout(()=>{window.print();setTimeout(()=>window.close(),500)},500)</script>
    </body></html>`);
    w.document.close();
  };



  // ══════════════════════════════════════════════════════
  // Render
  // ══════════════════════════════════════════════════════
  return (
    <div className="page-container">
      <div className="page-header flex flex-col gap-4">
        <div>
          <h1 className="page-title">Stock BBM</h1>
          <p className="page-description">Kelola data stock dan transaksi bahan bakar minyak</p>
        </div>
        <div className="relative w-64">
          <select
            value={selectedBBMType}
            onChange={(e) => {
              setSelectedBBMType(e.target.value);
              setShowTransForm(false);
              setEditingTrans(null);
            }}
            className="w-full p-2 border rounded-md appearance-none bg-white pr-8 cursor-pointer"
          >
            {['Dexlite', 'Pertalite', 'Pertamax', 'Pertamina Dex', 'Biosolar', 'HSD (BBM Alat Berat)'].map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </select>
          <ChevronDown
            className="absolute right-2 top-1/2 transform -translate-y-1/2 pointer-events-none"
            size={20}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <div className="glass-card p-6 flex items-center animate-fade-in">
          <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center mr-4 text-xl">⛽</div>
          <div>
            <p className="text-sm text-muted-foreground">Total Stock {selectedBBMType}</p>
            <p className="text-2xl font-bold">{(bbmStocks[selectedBBMType] || 0).toLocaleString('id-ID')} Liter</p>
          </div>
        </div>
        <div className="glass-card p-6 flex items-center animate-fade-in" style={{ animationDelay: '0.1s' }}>
          <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center mr-4 text-xl">📥</div>
          <div>
            <p className="text-sm text-muted-foreground">Total Pembelian</p>
            <p className="text-2xl font-bold">{summary.totalPembelian.toLocaleString('id-ID')} Liter</p>
          </div>
        </div>
        <div className="glass-card p-6 flex items-center animate-fade-in" style={{ animationDelay: '0.2s' }}>
          <div className="w-12 h-12 rounded-full bg-amber-100 flex items-center justify-center mr-4 text-xl">📤</div>
          <div>
            <p className="text-sm text-muted-foreground">Total Pemakaian</p>
            <p className="text-2xl font-bold">{summary.totalPemakaian.toLocaleString('id-ID')} Liter</p>
          </div>
        </div>
      </div>

      {/* Tabs - Hidden for now */}
      <div className="hidden gap-2 mb-4 border-b">
        {(['stock', 'transaksi'] as const).map(tab => (
          <button key={tab} onClick={() => { setActiveTab(tab); setSearchTerm(''); }}
            className={`px-4 py-2 font-medium border-b-2 transition-colors ${activeTab === tab ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
            {tab === 'stock' ? '⛽ Master Stock' : '📋 Transaksi BBM'}
          </button>
        ))}
      </div>

      {/* Toolbar */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
        <div className="flex flex-col md:flex-row items-start md:items-center gap-3 w-full md:w-auto">
          <div className="relative w-full md:w-auto">
            <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
              <Search size={18} className="text-gray-400" />
            </div>
            <input type="text" value={searchTerm} onChange={e => {
              setSearchTerm(e.target.value);
              setCurrentPageStock(1);
              setCurrentPageTrans(1);
            }}
              className="form-input pl-10" placeholder={`Cari ${activeTab === 'stock' ? 'jenis BBM...' : 'transaksi BBM...'}`} />
          </div>
          {activeTab === 'transaksi' && (
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
          )}
        </div>
        <div className="grid grid-cols-1 sm:flex sm:flex-wrap gap-2 w-full sm:w-auto">
          {activeTab === 'stock' && (
            <>
              {canPrint && (
                <button onClick={handlePrintStock} className="flex items-center justify-center gap-2 px-3 py-2 text-xs sm:text-sm sm:px-4 sm:py-2 border rounded-lg hover:bg-gray-50 w-full sm:w-auto">
                  <Printer size={16} /> Cetak
                </button>
              )}
              {canCreate && (
                <button onClick={() => { resetStockForm(); setShowStockForm(!showStockForm); }}
                  className="btn-primary flex items-center justify-center gap-2 text-xs sm:text-sm px-3 py-2 sm:px-4 sm:py-2 w-full sm:w-auto">
                  <Plus size={18} /> Tambah Stock
                </button>
              )}
            </>
          )}
          {activeTab === 'transaksi' && (
            <>
              {canImport && (
                <ExcelImportButton
                  onDataParsed={handleBBMExcelDataParsed}
                  expectedHeaders={expectedBBMHeaders}
                  buttonText="Impor Excel"
                  className="flex items-center justify-center gap-2 px-3 py-2 text-xs sm:text-sm sm:px-4 sm:py-2 border rounded-lg text-teal-600 border-teal-200 hover:bg-teal-50 w-full sm:w-auto"
                >
                  <Upload size={16} /> Impor
                </ExcelImportButton>
              )}
              {canExportExcel && (
                <button onClick={() => { setDialogMode('all'); setExportPrintDialog('export'); }} className="flex items-center justify-center gap-2 px-3 py-2 text-xs sm:text-sm sm:px-4 sm:py-2 border rounded-lg text-green-600 border-green-200 hover:bg-green-50 w-full sm:w-auto">
                  <Download size={16} /> Ekspor
                </button>
              )}
              {canPrint && (
                <button onClick={() => { setDialogMode('all'); setExportPrintDialog('print'); }} className="flex items-center justify-center gap-2 px-3 py-2 text-xs sm:text-sm sm:px-4 sm:py-2 border rounded-lg hover:bg-gray-50 w-full sm:w-auto">
                  <Printer size={16} /> Cetak
                </button>
              )}
              {canCreate && (
                <button onClick={() => { setEditingTrans(null); setShowTransForm(!showTransForm); }}
                  className="btn-primary flex items-center justify-center gap-2 text-xs sm:text-sm px-3 py-2 sm:px-4 sm:py-2 w-full sm:w-auto">
                  <Plus size={18} /> Tambah Transaksi
                </button>
              )}
            </>
          )}
        </div>
      </div>

      {/* ══ TAB STOCK ══════════════════════════════════════ */}
      {activeTab === 'stock' && (
        <>
          {showStockForm && (
            <div className="glass-card p-6 mb-6 animate-fade-in">
              <h2 className="text-xl font-semibold mb-4">{editingStock ? 'Edit Stock BBM' : 'Tambah Stock BBM'}</h2>
              <form onSubmit={handleStockSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-sm font-medium">Jenis BBM <span className="text-red-500">*</span></label>
                  <select value={stockForm.jenisBBM} onChange={e => setStockForm(f => ({ ...f, jenisBBM: e.target.value }))}
                    className="form-input" required>
                    <option value="">-- Pilih --</option>
                    {['Dexlite', 'Pertalite', 'Pertamax', 'Pertamina Dex', 'Biosolar', 'HSD (BBM Alat Berat)'].map(j => (
                      <option key={j} value={j}>{j}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-medium">Jumlah Stock</label>
                  <input type="number" min="0" step="0.01" value={stockForm.jumlahStock}
                    onChange={e => setStockForm(f => ({ ...f, jumlahStock: parseFloat(e.target.value) || 0 }))}
                    className="form-input" required />
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-medium">Satuan</label>
                  <select value={stockForm.satuan} onChange={e => setStockForm(f => ({ ...f, satuan: e.target.value }))} className="form-input">
                    <option value="liter">Liter</option>
                    <option value="drum">Drum</option>
                    <option value="galon">Galon</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-medium">Harga Satuan (Rp)</label>
                  <input type="number" min="0" value={stockForm.hargaSatuan}
                    onChange={e => setStockForm(f => ({ ...f, hargaSatuan: parseFloat(e.target.value) || 0 }))}
                    className="form-input" />
                </div>
                <div className="md:col-span-2 space-y-1">
                  <label className="text-sm font-medium">Keterangan</label>
                  <input type="text" value={stockForm.keterangan}
                    onChange={e => setStockForm(f => ({ ...f, keterangan: e.target.value }))}
                    className="form-input" placeholder="Opsional" />
                </div>
                <div className="md:col-span-2 flex justify-end gap-2 mt-2">
                  <button type="button" onClick={() => { setShowStockForm(false); resetStockForm(); }} className="px-4 py-2 border rounded-lg">Batal</button>
                  <button type="submit" className="btn-primary" disabled={addStockMutation.isPending || updateStockMutation.isPending}>
                    {addStockMutation.isPending || updateStockMutation.isPending ? 'Menyimpan...' : editingStock ? 'Perbarui' : 'Simpan'}
                  </button>
                </div>
              </form>
            </div>
          )}

          {stockLoading ? <p className="text-center py-8">Memuat data...</p> : (
            <div className="glass-card">
              <TableScrollWrapper>
                <table className="data-table">
                  <thead><tr>
                    <th>Jenis BBM</th><th>Jumlah Stock</th><th>Satuan</th>
                    <th>Harga Satuan</th><th>Total Nilai</th><th>Keterangan</th>
                    {canShowActions && <th>Aksi</th>}
                  </tr></thead>
                  <tbody>
                    {filteredStock.length > 0 ? paginateData(filteredStock, currentPageStock, pageSizeStock).map((item: BBMStockItem) => (
                      <tr key={item.id}>
                        <td className="font-medium">{item.jenisBBM}</td>
                        <td>{item.jumlahStock.toLocaleString('id-ID')}</td>
                        <td>{item.satuan || '-'}</td>
                        <td>{formatCurrency(item.hargaSatuan)}</td>
                        <td>{formatCurrency(item.jumlahStock * item.hargaSatuan)}</td>
                        <td>{item.keterangan || '-'}</td>
                        {canShowActions && (
                          <td><div className="flex gap-2">
                            {canEdit && (
                              <button onClick={() => { setEditingStock(item); setStockForm({ jenisBBM: item.jenisBBM, jumlahStock: item.jumlahStock, satuan: item.satuan, hargaSatuan: item.hargaSatuan, keterangan: item.keterangan }); setShowStockForm(true); }}
                                className="p-1 text-blue-600 hover:text-blue-800"><Edit size={18} /></button>
                            )}
                            {canDelete && (
                              <button onClick={() => setDeletingStock(item)} className="p-1 text-red-600 hover:text-red-800"><Trash2 size={18} /></button>
                            )}
                          </div></td>
                        )}
                      </tr>
                    )) : (
                      <tr><td colSpan={7} className="text-center py-4">{searchTerm ? 'Tidak ditemukan' : 'Belum ada data stock BBM'}</td></tr>
                    )}
                  </tbody>
                </table>
              </TableScrollWrapper>
              {filteredStock.length > 0 && (
                <SimplePagination
                  currentPage={currentPageStock}
                  totalPages={getTotalPages(filteredStock.length, pageSizeStock)}
                  onPageChange={setCurrentPageStock}
                  pageSize={pageSizeStock}
                  onPageSizeChange={(size) => { setPageSizeStock(size); setCurrentPageStock(1); }}
                  totalItems={filteredStock.length}
                />
              )}
            </div>
          )}
        </>
      )}

      {/* ══ TAB TRANSAKSI ══════════════════════════════════ */}
      {activeTab === 'transaksi' && (
        <>
          {(showTransForm || editingTrans) && (
            <div className="glass-card p-6 mb-6 animate-fade-in overflow-visible">
              <h2 className="text-xl font-semibold mb-4">{editingTrans ? 'Edit Transaksi BBM' : 'Tambah Transaksi BBM'}</h2>
              <TransactionForm
                initial={editingTrans ? { tanggal: editingTrans.tanggal, jenisBBM: editingTrans.jenisBBM, jumlah: editingTrans.jumlah, satuan: editingTrans.satuan, noLambung: editingTrans.noLambung, namaAlat: editingTrans.namaAlat, cost: editingTrans.cost, keterangan: editingTrans.keterangan, jenis: editingTrans.jenis, lokasiProyek: editingTrans.lokasiProyek } : emptyTrans}
                onSave={handleTransSave}
                onCancel={() => { setShowTransForm(false); setEditingTrans(null); }}
                isSaving={addTransMutation.isPending || updateTransMutation.isPending}
              />
            </div>
          )}

          {transLoading ? <p className="text-center py-8">Memuat data...</p> : (
            <div className="glass-card">
              <TableScrollWrapper>
                <table className="data-table">
                  <thead><tr>
                    <th>Tanggal</th><th>Jenis</th><th>Jenis BBM</th><th>Jumlah</th><th>Satuan</th>
                    <th>No. Lambung</th><th>Nama Alat</th><th>Lokasi Proyek</th><th>Harga Satuan</th><th>Total Biaya</th><th>Keterangan</th><th>Aksi</th>
                  </tr></thead>
                  <tbody>
                    {filteredTrans.length > 0 ? paginateData(filteredTrans, currentPageTrans, pageSizeTrans).map(item => (
                      <tr key={item.id}>
                        <td>{item.tanggal ? formatDateDisplay(item.tanggal) : '-'}</td>
                        <td>
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${item.jenis === 'pembelian'
                            ? 'bg-blue-100 text-blue-800'
                            : item.jenis === 'sisa_stock'
                              ? 'bg-green-100 text-green-800'
                              : 'bg-amber-100 text-amber-800'
                            }`}>
                            {item.jenis === 'pembelian' ? 'Pembelian' : item.jenis === 'sisa_stock' ? 'Sisa Stock' : 'Pemakaian'}
                          </span>
                        </td>
                        <td>{item.jenisBBM || '-'}</td>
                        <td>{item.jumlah.toLocaleString('id-ID')}</td>
                        <td>{item.satuan || '-'}</td>
                        <td>{item.noLambung || '-'}</td>
                        <td>{item.namaAlat || '-'}</td>
                        <td>{item.lokasiProyek || '-'}</td>
                        <td>{item.cost ? formatCurrency(item.cost) : '-'}</td>
                        <td className="text-right font-medium">{item.cost && item.jumlah ? formatCurrency(item.jumlah * item.cost) : '-'}</td>
                        <td>{item.keterangan || '-'}</td>
                        {canShowActions && (
                          <td><div className="flex gap-2">
                            {canEdit && (
                              <button onClick={() => { setEditingTrans(item); setShowTransForm(true); }}
                                className="p-1 text-blue-600 hover:text-blue-800"><Edit size={18} /></button>
                            )}
                            {canDelete && (
                              <button onClick={() => setDeletingTrans(item)} className="p-1 text-red-600 hover:text-red-800"><Trash2 size={18} /></button>
                            )}
                          </div></td>
                        )}
                      </tr>
                    )) : (
                      <tr><td colSpan={12} className="text-center py-4">{searchTerm ? 'Tidak ditemukan' : 'Belum ada transaksi BBM'}</td></tr>
                    )}
                  </tbody>
                </table>
              </TableScrollWrapper>
              {filteredTrans.length > 0 && (
                <SimplePagination
                  currentPage={currentPageTrans}
                  totalPages={getTotalPages(filteredTrans.length, pageSizeTrans)}
                  onPageChange={setCurrentPageTrans}
                  pageSize={pageSizeTrans}
                  onPageSizeChange={(size) => { setPageSizeTrans(size); setCurrentPageTrans(1); }}
                  totalItems={filteredTrans.length}
                />
              )}
            </div>
          )}
        </>
      )}

      {/* ══ DELETE DIALOGS ═════════════════════════════════ */}
      {deletingStock && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-sm w-full mx-4 shadow-xl">
            <h3 className="text-lg font-semibold mb-2">Konfirmasi Hapus</h3>
            <p className="text-gray-600 mb-1">Hapus data stock BBM ini?</p>
            <p className="font-medium text-red-600 mb-4">{deletingStock.jenisBBM}</p>
            <div className="flex justify-end gap-3">
              <button onClick={() => setDeletingStock(null)} className="px-4 py-2 border rounded-lg">Batal</button>
              <button onClick={handleDeleteStock} disabled={deleteStockMutation.isPending}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50">
                {deleteStockMutation.isPending ? 'Menghapus...' : 'Hapus'}
              </button>
            </div>
          </div>
        </div>
      )}

      {deletingTrans && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-sm w-full mx-4 shadow-xl">
            <h3 className="text-lg font-semibold mb-2">Konfirmasi Hapus</h3>
            <p className="text-gray-600 mb-1">Hapus transaksi BBM ini?</p>
            <p className="font-medium text-red-600 mb-1">{deletingTrans.tanggal} — {deletingTrans.jenisBBM}</p>
            <p className="text-sm text-gray-500 mb-4">Tindakan ini tidak dapat dibatalkan.</p>
            <div className="flex justify-end gap-3">
              <button onClick={() => setDeletingTrans(null)} className="px-4 py-2 border rounded-lg">Batal</button>
              <button onClick={handleDeleteTrans} disabled={deleteTransMutation.isPending}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50">
                {deleteTransMutation.isPending ? 'Menghapus...' : 'Hapus'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ══ EXPORT/PRINT DIALOG ════════════════════════════ */}
      {exportPrintDialog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4 shadow-2xl animate-fade-in">
            <h3 className="text-lg font-semibold mb-1">
              {exportPrintDialog === 'export' ? '📥 Ekspor Data ke Excel' : '🖨️ Cetak Transaksi BBM'}
            </h3>
            <p className="text-sm text-gray-500 mb-5">Pilih data yang ingin {exportPrintDialog === 'export' ? 'diekspor' : 'dicetak'}:</p>

            <div className="flex flex-col gap-3 mb-5">
              <label
                className={`flex items-center gap-3 p-3 border-2 rounded-lg cursor-pointer transition-all ${dialogMode === 'all' ? 'border-blue-500 bg-blue-50/50' : 'border-gray-200 hover:border-gray-300'
                  }`}
                onClick={() => setDialogMode('all')}
              >
                <input type="radio" name="mode" checked={dialogMode === 'all'} onChange={() => setDialogMode('all')} className="accent-blue-600" />
                <div>
                  <p className="font-medium text-sm">Semua Data</p>
                  <p className="text-xs text-gray-500">{filteredTrans.length} transaksi akan di{exportPrintDialog === 'export' ? 'ekspor' : 'cetak'}</p>
                </div>
              </label>
              <label
                className={`flex items-center gap-3 p-3 border-2 rounded-lg cursor-pointer transition-all ${dialogMode === 'range' ? 'border-blue-500 bg-blue-50/50' : 'border-gray-200 hover:border-gray-300'
                  }`}
                onClick={() => setDialogMode('range')}
              >
                <input type="radio" name="mode" checked={dialogMode === 'range'} onChange={() => setDialogMode('range')} className="accent-blue-600" />
                <div>
                  <p className="font-medium text-sm">Rentang Tanggal</p>
                  <p className="text-xs text-gray-500">Pilih periode tanggal tertentu</p>
                </div>
              </label>
            </div>

            {dialogMode === 'range' && (
              <div className="flex items-center gap-2 mb-5 p-3 bg-gray-50 rounded-lg border">
                <Calendar size={16} className="text-gray-400 flex-shrink-0" />
                <div className="flex items-center gap-2 flex-1">
                  <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)}
                    className="form-input text-sm py-1.5 flex-1" />
                  <span className="text-gray-400 text-sm">s/d</span>
                  <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)}
                    className="form-input text-sm py-1.5 flex-1" />
                </div>
              </div>
            )}

            <div className="flex justify-end gap-3">
              <button onClick={() => setExportPrintDialog(null)} className="px-4 py-2 border rounded-lg text-sm hover:bg-gray-50">Batal</button>
              <button onClick={handleDialogConfirm}
                className={`px-4 py-2 text-white rounded-lg text-sm ${exportPrintDialog === 'export' ? 'bg-green-600 hover:bg-green-700' : 'bg-blue-600 hover:bg-blue-700'
                  }`}>
                {exportPrintDialog === 'export' ? 'Ekspor Excel' : 'Cetak Sekarang'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StockBBM;

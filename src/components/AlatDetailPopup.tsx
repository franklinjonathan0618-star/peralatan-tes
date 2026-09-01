import React, { useMemo, useState } from 'react';
import {
  Clock, Fuel, Wrench, ClipboardList, X, TrendingUp, AlertCircle, Loader2, Printer, FileSpreadsheet,
  ShieldCheck, FileText, Plus, Trash2, Edit3, ExternalLink, UploadCloud, Calendar, ChevronLeft, ChevronRight
} from 'lucide-react';
import { useTimeSheet } from '@/hooks/useTimeSheet';
import { usePerbaikan } from '@/hooks/usePerbaikan';
import { useSilo, useCreateSilo, useUpdateSilo, useDeleteSilo, uploadSiloPdf, SiloDokumen } from '@/hooks/useSilo';
import { format } from 'date-fns';
import { exportMultipleSheetsToExcel } from '@/utils/excelUtils';
import { toast } from 'sonner';

let API_URL = (import.meta as any).env?.VITE_API_URL || 'http://localhost:3001';
if (API_URL.endsWith('/')) {
  API_URL = API_URL.slice(0, -1);
}

interface AlatDetailPopupProps {
  noLambung: string;
  namaAlat: string;
  colSpan: number;
  onClose: () => void;
}

type TabId = 'jam' | 'bbm' | 'sparepart' | 'perbaikan' | 'silo';

const formatCurrency = (val: number) =>
  new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(val);

const formatDate = (dateStr: string) => {
  try {
    const d = new Date(dateStr.includes('T') ? dateStr : dateStr + 'T00:00:00');
    if (isNaN(d.getTime())) return dateStr;
    return format(d, 'dd/MM/yyyy');
  } catch {
    return dateStr;
  }
};

const statusConfig: Record<string, { label: string; color: string }> = {
  selesai: { label: 'Selesai', color: 'bg-green-100 text-green-700 border border-green-200' },
  dalam_perbaikan: { label: 'Dalam Proses', color: 'bg-yellow-100 text-yellow-700 border border-yellow-200' },
  menunggu_sparepart: { label: 'Menunggu Sparepart', color: 'bg-orange-100 text-orange-700 border border-orange-200' },
  dibatalkan: { label: 'Dibatalkan', color: 'bg-red-100 text-red-700 border border-red-200' },
  pending: { label: 'Pending', color: 'bg-gray-100 text-gray-700 border border-gray-200' },
  aktif: { label: '✅ Aktif', color: 'bg-emerald-100 text-emerald-800 border border-emerald-300 font-semibold' },
  kadaluarsa: { label: '❌ Kadaluarsa', color: 'bg-rose-100 text-rose-800 border border-rose-300 font-semibold' },
  // 'segera perpanjang' (spasi) = dari view DB
  'segera perpanjang': { label: '⚠️ Segera Perpanjang', color: 'bg-amber-100 text-amber-900 border border-amber-400 font-semibold' },
  // alias dengan underscore (fallback)
  segera_perpanjang: { label: '⚠️ Segera Perpanjang', color: 'bg-amber-100 text-amber-900 border border-amber-400 font-semibold' },
  diajukan: { label: '🔄 Diajukan', color: 'bg-sky-100 text-sky-800 border border-sky-300 font-semibold' },
  ditolak: { label: '🚫 Ditolak', color: 'bg-slate-100 text-slate-700 border border-slate-300 font-semibold' },
};

// Helper: warna badge sisa hari berdasarkan jumlah hari
const getSisaHariBadge = (sisaHari: number | undefined) => {
  if (sisaHari === undefined) return null;
  if (sisaHari < 0) {
    return { text: `Lewat ${Math.abs(sisaHari)} hari`, className: 'text-rose-700 bg-rose-50 border-rose-200' };
  }
  if (sisaHari <= 30) {
    return { text: `⚠️ Sisa ${sisaHari} hari`, className: 'text-amber-800 bg-amber-50 border-amber-300' };
  }
  if (sisaHari <= 60) {
    return { text: `Sisa ${sisaHari} hari`, className: 'text-yellow-700 bg-yellow-50 border-yellow-200' };
  }
  return { text: `Sisa ${sisaHari} hari`, className: 'text-emerald-700 bg-emerald-50 border-emerald-200' };
};

const AlatDetailPopup: React.FC<AlatDetailPopupProps> = ({ noLambung, namaAlat, colSpan, onClose }) => {
  const [activeTab, setActiveTab] = useState<TabId>('jam');

  // SILO Form Modal States
  const [isSiloModalOpen, setIsSiloModalOpen] = useState(false);
  const [editingSilo, setEditingSilo] = useState<SiloDokumen | null>(null);
  const [siloForm, setSiloForm] = useState({
    nama_dokumen: '',
    nomor_silo: '',
    tanggal_berlaku: '',
    tanggal_selesai: '',
    status: 'aktif' as 'aktif' | 'kadaluarsa' | 'diajukan' | 'ditolak',
    keterangan: '',
    file_name: '',
    file_path: '',
  });
  const [isUploadingPdf, setIsUploadingPdf] = useState(false);

  const { data: timesheetAll = [], isLoading: tsLoading } = useTimeSheet();
  const { data: perbaikanAll = [], isLoading: pbLoading } = usePerbaikan();
  const { data: siloList = [], isLoading: siloLoading } = useSilo(noLambung);

  const createSilo = useCreateSilo();
  const updateSilo = useUpdateSilo();
  const deleteSilo = useDeleteSilo();

  // Print Handler
  const handlePrint = () => {
    const printContent = `
      <!DOCTYPE html>
      <html lang="id">
      <head>
        <meta charset="UTF-8" />
        <title>Detail Alat - ${namaAlat} (${noLambung})</title>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { font-family: Arial, sans-serif; font-size: 11px; color: #1e293b; padding: 20px; }
          .header { background: #2563eb; color: white; padding: 12px 16px; border-radius: 8px 8px 0 0; margin-bottom: 0; }
          .header h1 { font-size: 15px; font-weight: bold; }
          .header p { font-size: 11px; opacity: 0.85; margin-top: 2px; }
          .print-date { font-size: 10px; color: #64748b; text-align: right; margin-bottom: 12px; }
          .section { margin-bottom: 20px; border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden; }
          .section-title { background: #f1f5f9; padding: 8px 12px; font-weight: bold; font-size: 12px; color: #334155; border-bottom: 1px solid #e2e8f0; display: flex; align-items: center; gap: 6px; }
          .section-title .icon { font-size: 13px; }
          .stats-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px; padding: 12px; background: #f8fafc; border-bottom: 1px solid #e2e8f0; }
          .stats-grid-2 { grid-template-columns: repeat(2, 1fr); }
          .stat-card { background: white; border: 1px solid #e2e8f0; border-radius: 6px; padding: 8px; text-align: center; }
          .stat-value { font-size: 16px; font-weight: bold; color: #1e40af; }
          .stat-label { font-size: 9px; color: #64748b; margin-top: 2px; }
          table { width: 100%; border-collapse: collapse; }
          th { background: #f8fafc; text-align: left; padding: 6px 10px; font-size: 10px; font-weight: bold; color: #475569; border-bottom: 1px solid #e2e8f0; }
          th.right { text-align: right; }
          td { padding: 5px 10px; font-size: 10px; color: #334155; border-bottom: 1px solid #f1f5f9; }
          td.right { text-align: right; }
          tr:nth-child(even) td { background: #f8fafc; }
          .tfoot td { background: #fef2f2; font-weight: bold; color: #b91c1c; border-top: 2px solid #fecaca; }
          .badge { display: inline-block; padding: 2px 7px; border-radius: 99px; font-size: 9px; font-weight: bold; }
          .badge-green { background: #dcfce7; color: #15803d; }
          .badge-yellow { background: #fef9c3; color: #a16207; }
          .badge-orange { background: #ffedd5; color: #c2410c; }
          .badge-red { background: #fee2e2; color: #b91c1c; }
          .badge-gray { background: #f1f5f9; color: #475569; }
          @media print { body { padding: 12px; } }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>📋 Detail Alat: ${namaAlat}</h1>
          <p>No. Lambung: ${noLambung || '-'}</p>
        </div>
        <div style="height:8px"></div>
        <div class="print-date">Dicetak pada: ${new Date().toLocaleString('id-ID', { dateStyle: 'full', timeStyle: 'short' })}</div>

        <!-- DOKUMEN SILO -->
        <div class="section">
          <div class="section-title"><span class="icon">📜</span> Dokumen SILO</div>
          ${siloList.length === 0 ? '<p style="padding:12px;color:#94a3b8;text-align:center">Belum ada dokumen SILO</p>' : `
          <table>
            <thead><tr>
              <th>Dokumen / No. SILO</th><th>Masa Berlaku</th><th>Status</th><th>File PDF</th>
            </tr></thead>
            <tbody>
              ${siloList.map(s => `<tr>
                <td style="font-weight:bold">${s.nama_dokumen} <br/><span style="font-size:9px;color:#64748b;font-weight:normal">${s.nomor_silo || '-'}</span></td>
                <td>${formatDate(s.tanggal_berlaku)} - ${formatDate(s.tanggal_selesai)}</td>
                <td><span class="badge ${s.status_realtime === 'aktif' ? 'badge-green' : 'badge-red'}">${s.status_realtime || s.status}</span></td>
                <td>${s.file_name || '-'}</td>
              </tr>`).join('')}
            </tbody>
          </table>`}
        </div>

        <!-- JAM PEMAKAIAN -->
        <div class="section">
          <div class="section-title"><span class="icon">🕐</span> Jam Pemakaian</div>
          <div class="stats-grid stats-grid-2">
            <div class="stat-card"><div class="stat-value">${jamStats.totalJam}</div><div class="stat-label">Total Jam</div></div>
            <div class="stat-card"><div class="stat-value">${jamStats.totalEntries}</div><div class="stat-label">Total Entri Timesheet</div></div>
          </div>
        </div>
      </body>
      </html>
    `;

    const win = window.open('', '_blank', 'width=900,height=700');
    if (!win) return;
    win.document.write(printContent);
    win.document.close();
    win.focus();
    setTimeout(() => { win.print(); }, 400);
  };

  // Export Excel Handler
  const handleExportExcel = () => {
    const fileName = `Detail_Lengkap_${namaAlat.replace(/\s+/g, '_')}_${noLambung || ''}`;

    const siloDataSheet = siloList.map((s, idx) => ({
      'No': idx + 1,
      'Nama Dokumen': s.nama_dokumen,
      'No SILO': s.nomor_silo || '-',
      'Tanggal Berlaku': formatDate(s.tanggal_berlaku),
      'Tanggal Selesai': formatDate(s.tanggal_selesai),
      'Status Realtime': s.status_realtime || s.status,
      'Sisa Hari': s.sisa_hari !== undefined ? s.sisa_hari : '-',
      'Keterangan': s.keterangan || '-',
      'File PDF': s.file_name || '-'
    }));

    const jamData = timesheetData
      .slice()
      .sort((a, b) => (b.tanggal > a.tanggal ? 1 : -1))
      .map((ts, index) => ({
        'No': index + 1,
        'Tanggal': ts.tanggal ? formatDate(ts.tanggal) : '-',
        'Operator': ts.namaOperator || '-',
        'Aktivitas': ts.aktivitas || '-',
        'Lokasi': ts.lokasi || '-',
        'Jam Kerja': ts.totalJam || 0
      }));

    const sheets = [
      { data: siloDataSheet, name: 'Dokumen SILO' },
      { data: jamData, name: 'Jam Pemakaian' },
    ];

    try {
      exportMultipleSheetsToExcel(sheets, fileName);
    } catch (error) {
      console.error('Export Excel error:', error);
      alert('Gagal mengekspor data lengkap ke Excel');
    }
  };

  // Filter timesheet
  const timesheetData = useMemo(() => {
    return timesheetAll.filter(ts => {
      if (noLambung && ts.noLambung) {
        return ts.noLambung.toLowerCase() === noLambung.toLowerCase();
      }
      return ts.namaAlat.toLowerCase() === namaAlat.toLowerCase();
    });
  }, [timesheetAll, noLambung, namaAlat]);

  // Filter perbaikan
  const perbaikanData = useMemo(() => {
    return perbaikanAll.filter(pb => {
      if (noLambung && pb.noLambung) {
        return pb.noLambung.toLowerCase() === noLambung.toLowerCase();
      }
      return pb.namaAlat.toLowerCase() === namaAlat.toLowerCase();
    });
  }, [perbaikanAll, noLambung, namaAlat]);

  // === TAB STATS ===
  const jamStats = useMemo(() => {
    const totalJam = timesheetData.reduce((sum, ts) => sum + (ts.totalJam || 0), 0);
    const entries = timesheetData
      .slice()
      .sort((a, b) => (b.tanggal > a.tanggal ? 1 : -1))
      .slice(0, 10);
    return { totalJam: parseFloat(totalJam.toFixed(2)), totalEntries: timesheetData.length, entries };
  }, [timesheetData]);

  const bbmStats = useMemo(() => {
    let bbm = 0, oli40 = 0, oli10 = 0, oli90 = 0;
    timesheetData.forEach(ts => {
      bbm += ts.bbm || 0;
      oli40 += ts.oli40 || 0;
      oli10 += ts.oli10 || 0;
      oli90 += ts.oli90 || 0;
    });
    return {
      bbm: parseFloat(bbm.toFixed(2)),
      oli40: parseFloat(oli40.toFixed(2)),
      oli10: parseFloat(oli10.toFixed(2)),
      oli90: parseFloat(oli90.toFixed(2)),
    };
  }, [timesheetData]);

  const sparepartStats = useMemo(() => {
    const itemMap: Record<string, { nama: string; jumlah: number; satuan: string; harga: number; total: number }> = {};
    let totalHarga = 0;
    perbaikanData.forEach(pb => {
      (pb.items || []).forEach(item => {
        const nama = (item.nama || item.itemName || '').trim();
        if (!nama) return;
        const jumlah = item.jumlah || item.quantity || 0;
        const harga = item.harga || item.price || 0;
        const total = item.total || jumlah * harga;
        if (itemMap[nama]) {
          itemMap[nama].jumlah += jumlah;
          itemMap[nama].total += total;
        } else {
          itemMap[nama] = { nama, jumlah, satuan: item.satuan || item.unit || 'pcs', harga, total };
        }
        totalHarga += total;
      });
    });
    return { items: Object.values(itemMap).sort((a, b) => b.total - a.total), totalHarga };
  }, [perbaikanData]);

  const riwayatPerbaikan = useMemo(() => {
    return perbaikanData.slice().sort((a, b) => (b.tanggal || '') > (a.tanggal || '') ? 1 : -1);
  }, [perbaikanData]);

  // SILO Modal Handlers
  const openAddSiloModal = () => {
    setEditingSilo(null);
    setSiloForm({
      nama_dokumen: '',
      nomor_silo: '',
      tanggal_berlaku: new Date().toISOString().split('T')[0],
      tanggal_selesai: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      status: 'aktif',
      keterangan: '',
      file_name: '',
      file_path: '',
    });
    setIsSiloModalOpen(true);
  };

  const openEditSiloModal = (silo: SiloDokumen) => {
    setEditingSilo(silo);
    setSiloForm({
      nama_dokumen: silo.nama_dokumen || '',
      nomor_silo: silo.nomor_silo || '',
      tanggal_berlaku: silo.tanggal_berlaku ? silo.tanggal_berlaku.split('T')[0] : '',
      tanggal_selesai: silo.tanggal_selesai ? silo.tanggal_selesai.split('T')[0] : '',
      status: silo.status || 'aktif',
      keterangan: silo.keterangan || '',
      file_name: silo.file_name || '',
      file_path: silo.file_path || '',
    });
    setIsSiloModalOpen(true);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsUploadingPdf(true);
      const res = await uploadSiloPdf(file);
      setSiloForm(prev => ({
        ...prev,
        file_name: res.fileName,
        file_path: res.filePath,
      }));
      toast.success('File PDF berhasil diunggah!');
    } catch (err: any) {
      toast.error(err.message || 'Gagal mengunggah file PDF');
    } finally {
      setIsUploadingPdf(false);
    }
  };

  const handleSiloSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!siloForm.nama_dokumen.trim() || !siloForm.tanggal_berlaku || !siloForm.tanggal_selesai) {
      toast.error('Mohon isi nama dokumen, tanggal berlaku, dan tanggal selesai.');
      return;
    }

    try {
      const payload: Partial<SiloDokumen> = {
        no_lambung: noLambung || '',
        nama_alat: namaAlat || '',
        nama_dokumen: siloForm.nama_dokumen,
        nomor_silo: siloForm.nomor_silo,
        tanggal_berlaku: siloForm.tanggal_berlaku,
        tanggal_selesai: siloForm.tanggal_selesai,
        status: siloForm.status,
        keterangan: siloForm.keterangan,
        file_name: siloForm.file_name,
        file_path: siloForm.file_path,
      };

      if (editingSilo && editingSilo.id) {
        await updateSilo.mutateAsync({ id: editingSilo.id, ...payload });
      } else {
        await createSilo.mutateAsync(payload);
      }
      setIsSiloModalOpen(false);
    } catch (err) {
      // toast error handled by mutation
    }
  };

  const handleDeleteSilo = async (id?: number) => {
    if (!id) return;
    if (window.confirm('Apakah Anda yakin ingin menghapus dokumen SILO ini?')) {
      await deleteSilo.mutateAsync(id);
    }
  };

  const isLoading = tsLoading || pbLoading || siloLoading;

  const tabs: { id: TabId; label: string; icon: React.ReactNode; count?: number | string }[] = [
    { id: 'silo', label: 'Dokumen SILO', icon: <ShieldCheck className="h-3.5 w-3.5 text-blue-600" />, count: siloList.length },
    { id: 'jam', label: 'Jam Pemakaian', icon: <Clock className="h-3.5 w-3.5" />, count: `${jamStats.totalJam} jam` },
    { id: 'bbm', label: 'BBM & Oli', icon: <Fuel className="h-3.5 w-3.5" />, count: `${bbmStats.bbm} L` },
    { id: 'sparepart', label: 'Sparepart', icon: <Wrench className="h-3.5 w-3.5" />, count: sparepartStats.items.length },
    { id: 'perbaikan', label: 'Riwayat Perbaikan', icon: <ClipboardList className="h-3.5 w-3.5" />, count: riwayatPerbaikan.length },
  ];

  return (
    <tr className="bg-gradient-to-br from-slate-50 to-blue-50/30">
      <td colSpan={colSpan} className="p-0">
        <div
          className="sticky left-0 my-1.5 mx-2 rounded-xl border border-blue-200 shadow-lg overflow-hidden relative max-w-[calc(100vw-1.5rem)] sm:max-w-full bg-white"
          style={{ animation: 'slideDown 0.18s ease-out' }}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-2.5 bg-gradient-to-r from-blue-600 to-blue-500 text-white">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-white/60 animate-pulse" />
              <span className="font-semibold text-sm">
                Detail: {namaAlat}
                {noLambung && (
                  <span className="ml-2 px-2 py-0.5 bg-white/20 rounded-full text-xs font-normal">
                    {noLambung}
                  </span>
                )}
              </span>
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={handlePrint}
                className="hover:bg-white/20 rounded-full p-1 transition-colors"
                title="Cetak semua tab"
              >
                <Printer className="h-4 w-4" />
              </button>
              <button
                onClick={handleExportExcel}
                className="flex items-center gap-1 bg-green-600 hover:bg-green-700 text-white text-[11px] font-semibold px-2 py-0.5 rounded transition-all shadow-sm mr-1 ml-1"
                title="Ekspor semua data ke Excel"
              >
                <FileSpreadsheet className="h-3 w-3" />
                <span>Export Excel</span>
              </button>
              <button
                onClick={onClose}
                className="hover:bg-white/20 rounded-full p-1 transition-colors"
                title="Tutup"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Tabs - Slider Kesamping (Berdasarkan Ukuran Layar) */}
          <MouseSliderWrapper minWidth="720px" className="border-b border-slate-200 bg-white">
            <div className="flex min-w-max">
              {tabs.map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-1.5 px-4 py-2.5 text-xs font-medium transition-all border-b-2 shrink-0 justify-center whitespace-nowrap ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600 bg-blue-50/60 font-semibold'
                      : 'border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  {tab.icon}
                  <span>{tab.label}</span>
                  {tab.count !== undefined && (
                    <span className={`ml-1 px-1.5 py-0.5 rounded-full text-[10px] font-semibold ${
                      activeTab === tab.id
                        ? 'bg-blue-100 text-blue-600'
                        : 'bg-slate-100 text-slate-500'
                    }`}>
                      {tab.count}
                    </span>
                  )}
                </button>
              ))}
            </div>
          </MouseSliderWrapper>

          {/* Content */}
          <div className="bg-white" style={{ maxHeight: '380px', overflowY: 'auto' }}>
            {isLoading ? (
              <div className="flex items-center justify-center py-10 gap-2 text-slate-500 text-sm">
                <Loader2 className="h-5 w-5 animate-spin text-blue-500" />
                Memuat data...
              </div>
            ) : (
              <>
                {/* TAB 0: DOKUMEN SILO */}
                {activeTab === 'silo' && (
                  <div className="p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <h4 className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                          <ShieldCheck className="h-4 w-4 text-blue-600" />
                          Dokumen SILO (Surat Izin / Lisensi Operasi)
                        </h4>
                        <p className="text-[11px] text-slate-500">Kelola dan upload file PDF dokumen SILO per alat</p>
                      </div>
                      <button
                        onClick={openAddSiloModal}
                        className="flex items-center gap-1 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold px-3 py-1.5 rounded-lg transition-all shadow-sm"
                      >
                        <Plus className="h-3.5 w-3.5" />
                        <span>Tambah SILO</span>
                      </button>
                    </div>

                    {siloList.length === 0 ? (
                      <EmptyState message="Belum ada dokumen SILO yang diunggah untuk alat ini." />
                    ) : (
                      <MouseSliderWrapper minWidth="640px" className="rounded-lg border border-slate-200">
                        <table className="w-full text-xs min-w-[640px]">
                          <thead>
                            <tr className="bg-slate-50 border-b border-slate-200">
                              <th className="text-left px-3 py-2 font-semibold text-slate-600">Dokumen & No. SILO</th>
                              <th className="text-left px-3 py-2 font-semibold text-slate-600">Masa Berlaku</th>
                              <th className="text-center px-3 py-2 font-semibold text-slate-600">Status</th>
                              <th className="text-left px-3 py-2 font-semibold text-slate-600">Dokumen PDF</th>
                              <th className="text-center px-3 py-2 font-semibold text-slate-600">Aksi</th>
                            </tr>
                          </thead>
                          <tbody>
                            {siloList.map((silo, i) => {
                              const realtimeStatus = silo.status_realtime || silo.status;
                              const statusStyle = statusConfig[realtimeStatus] || statusConfig['aktif'];
                              const fullPdfUrl = silo.file_path
                                ? (silo.file_path.startsWith('http') ? silo.file_path : `${API_URL}${silo.file_path}`)
                                : null;
                              const sisaBadge = getSisaHariBadge(silo.sisa_hari);
                              const isUrgent = realtimeStatus === 'segera perpanjang' || realtimeStatus === 'segera_perpanjang';
                              const isExpired = realtimeStatus === 'kadaluarsa';

                              return (
                                <tr
                                  key={silo.id || i}
                                  className={
                                    isUrgent
                                      ? 'bg-amber-50/60 border-l-4 border-l-amber-400'
                                      : isExpired
                                      ? 'bg-rose-50/50 border-l-4 border-l-rose-400'
                                      : i % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'
                                  }
                                >
                                  <td className="px-3 py-2">
                                    <div className="font-semibold text-slate-800">{silo.nama_dokumen}</div>
                                    {silo.nomor_silo ? (
                                      <div className="text-[11px] font-mono text-slate-500">{silo.nomor_silo}</div>
                                    ) : (
                                      <div className="text-[10px] text-slate-400 italic">Tidak ada nomor</div>
                                    )}
                                    {silo.keterangan && (
                                      <div className="text-[10px] text-slate-500 mt-0.5 truncate max-w-[200px]" title={silo.keterangan}>
                                        {silo.keterangan}
                                      </div>
                                    )}
                                  </td>
                                  <td className="px-3 py-2 text-slate-700">
                                    <div className="flex items-center gap-1 text-[11px]">
                                      <Calendar className="h-3 w-3 text-slate-400" />
                                      <span>{formatDate(silo.tanggal_berlaku)}</span>
                                      <span className="text-slate-400">s/d</span>
                                      <span className="font-medium">{formatDate(silo.tanggal_selesai)}</span>
                                    </div>
                                    {sisaBadge && (
                                      <div className="mt-1">
                                        <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded border ${sisaBadge.className}`}>
                                          {sisaBadge.text}
                                        </span>
                                      </div>
                                    )}
                                  </td>
                                  <td className="px-3 py-2 text-center">
                                    <span className={`inline-block text-[11px] px-2.5 py-0.5 rounded-full ${statusStyle.color}`}>
                                      {statusStyle.label}
                                    </span>
                                  </td>
                                  <td className="px-3 py-2">
                                    {fullPdfUrl ? (
                                      <div className="flex items-center gap-1.5">
                                        <a
                                          href={fullPdfUrl}
                                          target="_blank"
                                          rel="noopener noreferrer"
                                          className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 font-medium bg-blue-50 hover:bg-blue-100 border border-blue-200 px-2 py-1 rounded transition-colors"
                                          title="Buka PDF di Tab Baru"
                                        >
                                          <FileText className="h-3.5 w-3.5 text-red-500" />
                                          <span className="max-w-[110px] truncate">{silo.file_name || 'Lihat PDF'}</span>
                                          <ExternalLink className="h-3 w-3" />
                                        </a>
                                      </div>
                                    ) : (
                                      <span className="text-slate-400 italic text-[11px]">Belum ada file</span>
                                    )}
                                  </td>
                                  <td className="px-3 py-2 text-center">
                                    <div className="flex items-center justify-center gap-1">
                                      <button
                                        onClick={() => openEditSiloModal(silo)}
                                        className="p-1 hover:bg-slate-100 rounded text-slate-600 hover:text-blue-600 transition-colors"
                                        title="Edit SILO"
                                      >
                                        <Edit3 className="h-3.5 w-3.5" />
                                      </button>
                                      <button
                                        onClick={() => handleDeleteSilo(silo.id)}
                                        className="p-1 hover:bg-slate-100 rounded text-slate-600 hover:text-rose-600 transition-colors"
                                        title="Hapus SILO"
                                      >
                                        <Trash2 className="h-3.5 w-3.5" />
                                      </button>
                                    </div>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </MouseSliderWrapper>
                    )}
                  </div>
                )}

                {/* TAB 1: JAM PEMAKAIAN */}
                {activeTab === 'jam' && (
                  <div className="p-4">
                    <div className="grid grid-cols-2 gap-3 mb-4">
                      <div className="rounded-lg bg-blue-50 border border-blue-100 p-3 flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                          <Clock className="h-4 w-4 text-blue-600" />
                        </div>
                        <div>
                          <div className="text-xl font-bold text-blue-700">{jamStats.totalJam}</div>
                          <div className="text-xs text-blue-500">Total Jam</div>
                        </div>
                      </div>
                      <div className="rounded-lg bg-slate-50 border border-slate-100 p-3 flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-slate-100 flex items-center justify-center flex-shrink-0">
                          <TrendingUp className="h-4 w-4 text-slate-600" />
                        </div>
                        <div>
                          <div className="text-xl font-bold text-slate-700">{jamStats.totalEntries}</div>
                          <div className="text-xs text-slate-500">Total Entri Timesheet</div>
                        </div>
                      </div>
                    </div>

                    {jamStats.entries.length === 0 ? (
                      <EmptyState message="Belum ada data timesheet untuk alat ini" />
                    ) : (
                      <MouseSliderWrapper minWidth="580px" className="rounded-lg border border-slate-200">
                        <table className="w-full text-xs min-w-[580px]">
                          <thead>
                            <tr className="bg-slate-50 border-b border-slate-200">
                              <th className="text-left px-3 py-2 font-semibold text-slate-600">Tanggal</th>
                              <th className="text-left px-3 py-2 font-semibold text-slate-600">Operator</th>
                              <th className="text-left px-3 py-2 font-semibold text-slate-600">Aktivitas</th>
                              <th className="text-left px-3 py-2 font-semibold text-slate-600">Lokasi</th>
                              <th className="text-right px-3 py-2 font-semibold text-slate-600">Jam</th>
                            </tr>
                          </thead>
                          <tbody>
                            {jamStats.entries.map((ts, i) => (
                              <tr key={ts.id || i} className={i % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'}>
                                <td className="px-3 py-1.5 text-slate-700">{formatDate(ts.tanggal)}</td>
                                <td className="px-3 py-1.5 text-slate-600">{ts.namaOperator || '-'}</td>
                                <td className="px-3 py-1.5 text-slate-600 max-w-[160px] truncate">{ts.aktivitas || '-'}</td>
                                <td className="px-3 py-1.5 text-slate-600">{ts.lokasi || '-'}</td>
                                <td className="px-3 py-1.5 text-right font-semibold text-blue-600">{ts.totalJam}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </MouseSliderWrapper>
                    )}
                  </div>
                )}

                {/* TAB 2: BBM & OLI */}
                {activeTab === 'bbm' && (
                  <div className="p-4">
                    {timesheetData.length === 0 ? (
                      <EmptyState message="Belum ada data konsumsi BBM & Oli untuk alat ini" />
                    ) : (
                      <>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
                          <ConsumptionCard label="Total BBM" value={bbmStats.bbm} unit="Liter" bgColor="bg-orange-50 border-orange-100" icon="⛽" />
                          <ConsumptionCard label="Oli SAE 40" value={bbmStats.oli40} unit="Liter" bgColor="bg-amber-50 border-amber-100" icon="🛢️" />
                          <ConsumptionCard label="Oli SAE 10" value={bbmStats.oli10} unit="Liter" bgColor="bg-yellow-50 border-yellow-100" icon="🛢️" />
                          <ConsumptionCard label="Oli SAE 90" value={bbmStats.oli90} unit="Liter" bgColor="bg-lime-50 border-lime-100" icon="🛢️" />
                        </div>
                        <MouseSliderWrapper minWidth="520px" className="rounded-lg border border-slate-200">
                          <table className="w-full text-xs min-w-[520px]">
                            <thead>
                              <tr className="bg-slate-50 border-b border-slate-200">
                                <th className="text-left px-3 py-2 font-semibold text-slate-600">Tanggal</th>
                                <th className="text-right px-3 py-2 font-semibold text-slate-600">BBM (L)</th>
                                <th className="text-right px-3 py-2 font-semibold text-slate-600">Oli 40 (L)</th>
                                <th className="text-right px-3 py-2 font-semibold text-slate-600">Oli 10 (L)</th>
                                <th className="text-right px-3 py-2 font-semibold text-slate-600">Oli 90 (L)</th>
                              </tr>
                            </thead>
                            <tbody>
                              {timesheetData
                                .filter(ts => (ts.bbm || 0) + (ts.oli40 || 0) + (ts.oli10 || 0) + (ts.oli90 || 0) > 0)
                                .sort((a, b) => (b.tanggal > a.tanggal ? 1 : -1))
                                .slice(0, 10)
                                .map((ts, i) => (
                                  <tr key={ts.id || i} className={i % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'}>
                                    <td className="px-3 py-1.5 text-slate-700">{formatDate(ts.tanggal)}</td>
                                    <td className="px-3 py-1.5 text-right text-orange-600 font-medium">{ts.bbm || '-'}</td>
                                    <td className="px-3 py-1.5 text-right text-amber-600">{ts.oli40 || '-'}</td>
                                    <td className="px-3 py-1.5 text-right text-yellow-600">{ts.oli10 || '-'}</td>
                                    <td className="px-3 py-1.5 text-right text-lime-600">{ts.oli90 || '-'}</td>
                                  </tr>
                                ))
                              }
                            </tbody>
                          </table>
                        </MouseSliderWrapper>
                      </>
                    )}
                  </div>
                )}

                {/* TAB 3: SPAREPART */}
                {activeTab === 'sparepart' && (
                  <div className="p-4">
                    {sparepartStats.items.length === 0 ? (
                      <EmptyState message="Belum ada sparepart yang tercatat untuk alat ini" />
                    ) : (
                      <>
                        <div className="mb-3 flex items-center justify-between">
                          <span className="text-xs text-slate-500">{sparepartStats.items.length} jenis sparepart</span>
                          <span className="text-sm font-bold text-slate-700">
                            Total: <span className="text-red-600">{formatCurrency(sparepartStats.totalHarga)}</span>
                          </span>
                        </div>
                        <MouseSliderWrapper minWidth="520px" className="rounded-lg border border-slate-200">
                          <table className="w-full text-xs min-w-[520px]">
                            <thead>
                              <tr className="bg-slate-50 border-b border-slate-200">
                                <th className="text-left px-3 py-2 font-semibold text-slate-600">Nama Sparepart</th>
                                <th className="text-right px-3 py-2 font-semibold text-slate-600">Jumlah</th>
                                <th className="text-right px-3 py-2 font-semibold text-slate-600">Harga Satuan</th>
                                <th className="text-right px-3 py-2 font-semibold text-slate-600">Total</th>
                              </tr>
                            </thead>
                            <tbody>
                              {sparepartStats.items.map((item, i) => (
                                <tr key={i} className={i % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'}>
                                  <td className="px-3 py-1.5 text-slate-700 font-medium">{item.nama}</td>
                                  <td className="px-3 py-1.5 text-right text-slate-600">{item.jumlah} <span className="text-slate-400">{item.satuan}</span></td>
                                  <td className="px-3 py-1.5 text-right text-slate-600">{formatCurrency(item.harga)}</td>
                                  <td className="px-3 py-1.5 text-right font-semibold text-red-600">{formatCurrency(item.total)}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </MouseSliderWrapper>
                      </>
                    )}
                  </div>
                )}

                {/* TAB 4: RIWAYAT PERBAIKAN */}
                {activeTab === 'perbaikan' && (
                  <div className="p-4">
                    {riwayatPerbaikan.length === 0 ? (
                      <EmptyState message="Belum ada riwayat perbaikan untuk alat ini" />
                    ) : (
                      <div className="space-y-2">
                        {riwayatPerbaikan.map((pb, i) => {
                          const statusInfo = statusConfig[pb.status] || statusConfig['pending'];
                          return (
                            <div key={pb.id || i} className="rounded-lg border border-slate-200 bg-white p-3 hover:border-blue-200 hover:shadow-sm transition-all">
                              <div className="flex items-start justify-between gap-2">
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2 mb-1">
                                    <span className="text-xs font-bold text-slate-500">{formatDate(pb.tanggal)}</span>
                                    {pb.noPerbaikan && (
                                      <span className="text-xs px-1.5 py-0.5 bg-slate-100 text-slate-600 rounded font-mono">{pb.noPerbaikan}</span>
                                    )}
                                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusInfo.color}`}>{statusInfo.label}</span>
                                  </div>
                                  <div className="text-sm font-semibold text-slate-700 mb-0.5">{pb.jenisKerusakan}</div>
                                </div>
                                <div className="text-right flex-shrink-0">
                                  <div className="text-sm font-bold text-red-600">{formatCurrency(pb.totalBiaya || 0)}</div>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        {/* MODAL FORM TAMBAH / EDIT SILO */}
        {isSiloModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-150">
              <div className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-blue-600 to-blue-500 text-white">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="h-5 w-5" />
                  <h3 className="font-semibold text-sm">
                    {editingSilo ? 'Edit Dokumen SILO' : 'Tambah Dokumen SILO baru'}
                  </h3>
                </div>
                <button onClick={() => setIsSiloModalOpen(false)} className="hover:bg-white/20 rounded-full p-1">
                  <X className="h-4 w-4" />
                </button>
              </div>

              <form onSubmit={handleSiloSubmit} className="p-4 space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div className="col-span-2">
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Nama Dokumen <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Contoh: SILO 2025"
                      value={siloForm.nama_dokumen}
                      onChange={e => setSiloForm({ ...siloForm, nama_dokumen: e.target.value })}
                      className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Nomor SILO (opsional)</label>
                    <input
                      type="text"
                      placeholder="SILO/MWT/001/2025"
                      value={siloForm.nomor_silo}
                      onChange={e => setSiloForm({ ...siloForm, nomor_silo: e.target.value })}
                      className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Status</label>
                    <select
                      value={siloForm.status}
                      onChange={e => setSiloForm({ ...siloForm, status: e.target.value as any })}
                      className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="aktif">Aktif</option>
                      <option value="kadaluarsa">Kadaluarsa</option>
                      <option value="diajukan">Diajukan</option>
                      <option value="ditolak">Ditolak</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Tanggal Berlaku <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="date"
                      required
                      value={siloForm.tanggal_berlaku}
                      onChange={e => setSiloForm({ ...siloForm, tanggal_berlaku: e.target.value })}
                      className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Tanggal Selesai (Kadaluarsa) <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="date"
                      required
                      value={siloForm.tanggal_selesai}
                      onChange={e => setSiloForm({ ...siloForm, tanggal_selesai: e.target.value })}
                      className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>

                  <div className="col-span-2">
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Keterangan / Catatan</label>
                    <textarea
                      rows={2}
                      placeholder="Catatan tambahan..."
                      value={siloForm.keterangan}
                      onChange={e => setSiloForm({ ...siloForm, keterangan: e.target.value })}
                      className="w-full text-xs px-3 py-1.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>

                  {/* Upload File PDF */}
                  <div className="col-span-2 border-t border-slate-100 pt-2">
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Dokumen PDF SILO
                    </label>
                    <div className="flex items-center gap-2">
                      <label className="flex-1 flex items-center justify-center gap-2 px-3 py-2 border-2 border-dashed border-slate-300 hover:border-blue-500 rounded-lg cursor-pointer bg-slate-50 hover:bg-blue-50/50 transition-colors">
                        {isUploadingPdf ? (
                          <>
                            <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
                            <span className="text-xs text-blue-600 font-medium">Mengunggah PDF...</span>
                          </>
                        ) : (
                          <>
                            <UploadCloud className="h-4 w-4 text-slate-500" />
                            <span className="text-xs text-slate-600 font-medium">
                              {siloForm.file_name ? siloForm.file_name : 'Pilih File PDF (Max 50MB)'}
                            </span>
                          </>
                        )}
                        <input
                          type="file"
                          accept="application/pdf"
                          onChange={handleFileUpload}
                          disabled={isUploadingPdf}
                          className="hidden"
                        />
                      </label>
                      {siloForm.file_path && (
                        <a
                          href={siloForm.file_path.startsWith('http') ? siloForm.file_path : `${API_URL}${siloForm.file_path}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-2 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 rounded-lg border border-emerald-200"
                          title="Lihat file PDF"
                        >
                          <FileText className="h-4 w-4 text-red-500" />
                        </a>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200">
                  <button
                    type="button"
                    onClick={() => setIsSiloModalOpen(false)}
                    className="px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-lg"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    disabled={createSilo.isPending || updateSilo.isPending || isUploadingPdf}
                    className="flex items-center gap-1.5 px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg shadow-sm disabled:opacity-50"
                  >
                    {(createSilo.isPending || updateSilo.isPending) && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                    <span>{editingSilo ? 'Simpan Perubahan' : 'Tambah SILO'}</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        <style>{`
          @keyframes slideDown {
            from { opacity: 0; transform: translateY(-8px); }
            to { opacity: 1; transform: translateY(0); }
          }
          /* Slider Kesamping (Visible Horizontal Scrollbar untuk Mouse & Touch) */
          .custom-scroll-x {
            scrollbar-width: thin;
            scrollbar-color: #94a3b8 #f1f5f9;
          }
          .custom-scroll-x::-webkit-scrollbar {
            height: 8px;
            display: block;
          }
          .custom-scroll-x::-webkit-scrollbar-track {
            background: #f1f5f9;
            border-radius: 99px;
          }
          .custom-scroll-x::-webkit-scrollbar-thumb {
            background: #94a3b8;
            border-radius: 99px;
            border: 2px solid #f1f5f9;
          }
          .custom-scroll-x::-webkit-scrollbar-thumb:hover {
            background: #2563eb;
          }
        `}</style>
      </td>
    </tr>
  );
};

// Helper sub-component untuk slider mouse (Drag, Scroll wheel, Panah ‹ ›)
interface MouseSliderWrapperProps {
  children: React.ReactNode;
  className?: string;
  minWidth?: string;
}

const MouseSliderWrapper: React.FC<MouseSliderWrapperProps> = ({ children, className = '', minWidth }) => {
  const containerRef = React.useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);
  const [isMouseDown, setIsMouseDown] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollLeftState, setScrollLeftState] = useState(0);

  const checkScroll = React.useCallback(() => {
    const el = containerRef.current;
    if (!el) return;
    const hasScroll = el.scrollWidth > el.clientWidth;
    setCanScrollLeft(hasScroll && el.scrollLeft > 1);
    setCanScrollRight(hasScroll && el.scrollLeft < el.scrollWidth - el.clientWidth - 1);
  }, []);

  React.useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    checkScroll();
    const timer = setTimeout(checkScroll, 100);

    let observer: ResizeObserver | null = null;
    if (typeof ResizeObserver !== 'undefined') {
      observer = new ResizeObserver(() => {
        checkScroll();
      });
      observer.observe(el);
    }

    const handleResize = () => checkScroll();
    window.addEventListener('resize', handleResize);

    return () => {
      clearTimeout(timer);
      if (observer) observer.disconnect();
      window.removeEventListener('resize', handleResize);
    };
  }, [checkScroll, children]);

  const touchStartX = React.useRef(0);
  const touchStartScrollLeft = React.useRef(0);

  // UBAH SCROLL WHEEL MOUSE VERTIKAL JADI HORIZONTAL
  const handleWheel = (e: React.WheelEvent<HTMLDivElement>) => {
    const el = containerRef.current;
    if (!el) return;
    if (el.scrollWidth > el.clientWidth) {
      e.stopPropagation(); // HENTIKAN SCROLL AGAR TABEL UTAMA DI BELAKANG TIDAK IKUT TERGESER!
      if (e.deltaY !== 0) {
        el.scrollLeft += e.deltaY;
        checkScroll();
      }
    }
  };

  // TOUCH GESTURE ISOLATION UNTUK HP / MOBILE
  const handleTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    const el = containerRef.current;
    if (!el) return;
    if (el.scrollWidth > el.clientWidth) {
      e.stopPropagation(); // ISOLASI SWIPE HP
      touchStartX.current = e.touches[0].clientX;
      touchStartScrollLeft.current = el.scrollLeft;
    }
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    const el = containerRef.current;
    if (!el) return;
    if (el.scrollWidth > el.clientWidth) {
      e.stopPropagation(); // ISOLASI SWIPE HP AGAR TABEL UTAMA TIDAK IKUT TERGESER
      const touchX = e.touches[0].clientX;
      const diff = touchStartX.current - touchX;
      el.scrollLeft = touchStartScrollLeft.current + diff;
      checkScroll();
    }
  };

  // MOUSE CLICK & DRAG TO SCROLL
  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    const el = containerRef.current;
    if (!el) return;
    e.stopPropagation();
    // Jangan aktifkan drag jika mengklik tombol/input/link
    const target = e.target as HTMLElement;
    if (target.closest('button, a, input, select, textarea')) return;
    setIsMouseDown(true);
    setStartX(e.pageX - el.offsetLeft);
    setScrollLeftState(el.scrollLeft);
  };

  const handleMouseLeaveOrUp = () => {
    setIsMouseDown(false);
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isMouseDown) return;
    const el = containerRef.current;
    if (!el) return;
    e.stopPropagation();
    e.preventDefault();
    const x = e.pageX - el.offsetLeft;
    const walk = (x - startX) * 1.5;
    el.scrollLeft = scrollLeftState - walk;
    checkScroll();
  };

  const scrollByAmount = (amount: number) => {
    const el = containerRef.current;
    if (!el) return;
    el.scrollBy({ left: amount, behavior: 'smooth' });
    setTimeout(checkScroll, 250);
  };

  return (
    <div className="relative group/slider w-full" onClick={(e) => e.stopPropagation()}>
      {/* Tombol Panah Kiri ‹ */}
      {canScrollLeft && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            scrollByAmount(-220);
          }}
          className="absolute left-1 top-1/2 -translate-y-1/2 z-30 bg-slate-900/80 hover:bg-blue-600 text-white rounded-full p-1.5 shadow-lg transition-all backdrop-blur-sm cursor-pointer"
          title="Geser ke kiri (Klik panah atau putar Roda Mouse)"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
      )}

      {/* Container Scroll */}
      <div
        ref={containerRef}
        onWheel={handleWheel}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onMouseDown={handleMouseDown}
        onMouseLeave={handleMouseLeaveOrUp}
        onMouseUp={handleMouseLeaveOrUp}
        onMouseMove={handleMouseMove}
        onScroll={checkScroll}
        className={`overflow-x-auto custom-scroll-x ${isMouseDown ? 'cursor-grabbing select-none' : ''} ${className}`}
      >
        <div style={{ minWidth: minWidth || 'auto' }}>
          {children}
        </div>
      </div>

      {/* Tombol Panah Kanan › */}
      {canScrollRight && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            scrollByAmount(220);
          }}
          className="absolute right-1 top-1/2 -translate-y-1/2 z-30 bg-slate-900/80 hover:bg-blue-600 text-white rounded-full p-1.5 shadow-lg transition-all backdrop-blur-sm cursor-pointer"
          title="Geser ke kanan (Klik panah atau putar Roda Mouse)"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      )}
    </div>
  );
};

// Helper sub-components
const EmptyState: React.FC<{ message: string }> = ({ message }) => (
  <div className="flex flex-col items-center justify-center py-8 text-slate-400 gap-2">
    <AlertCircle className="h-8 w-8 opacity-40" />
    <span className="text-sm">{message}</span>
  </div>
);

interface ConsumptionCardProps {
  label: string;
  value: number;
  unit: string;
  bgColor: string;
  icon: string;
}
const ConsumptionCard: React.FC<ConsumptionCardProps> = ({ label, value, unit, bgColor, icon }) => (
  <div className={`rounded-lg border p-3 ${bgColor}`}>
    <div className="text-lg mb-0.5">{icon}</div>
    <div className="text-lg font-bold text-slate-700">{value || 0}</div>
    <div className="text-xs text-slate-500">{label}</div>
    <div className="text-xs text-slate-400">{unit}</div>
  </div>
);

export default AlatDetailPopup;

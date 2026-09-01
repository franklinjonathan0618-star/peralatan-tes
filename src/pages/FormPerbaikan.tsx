import React, { useState, useMemo, useEffect, useRef } from 'react';
import { format, parse } from 'date-fns';
import { formatDateDisplay, parseMySQLDate } from '@/utils/dateUtils';
import { toast } from 'sonner';
import { supabase } from '@/integrations/api/client';
import { useQueryClient } from '@tanstack/react-query';
import { Edit, Trash2, Plus, Search, Loader2, Printer, Upload, Download, Calendar, X, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import {
  usePerbaikan,
  useAddPerbaikan,
  useUpdatePerbaikan,
  Perbaikan,
  useDeletePerbaikan
} from '@/hooks/usePerbaikan';
import { useSparepart } from '@/hooks/useSparepart';

import { usePagePermission } from '@/hooks/usePagePermission';
import { usePPA } from '@/hooks/usePPA';
import ExcelImportButton from '@/components/ui/ExcelImportButton';
import { exportToExcel } from '@/utils/excelUtils';
import { SimplePagination, paginateData, getTotalPages } from '@/components/ui/SimplePagination';
import { TableScrollWrapper } from '@/components/ui/TableScrollWrapper';

// Status types
type StatusPerbaikan = 'Selesai' | 'Dalam Proses' | 'Menunggu Sparepart';

// Interface for spare part items
interface SparePartItem {
  id: string;
  nama: string;
  jumlah: number;
  satuan: string;
  harga: number;
  total: number;
}

// Interface for local perbaikan state
interface LocalPerbaikan {
  id?: string;
  noPerbaikan: string;
  noLambung: string;
  namaAlat: string;
  jenisKerusakan: string;
  penyebabKerusakan?: string;
  tindakanPerbaikan?: string;
  lokasiPerbaikan: string;
  items: SparePartItem[];
  totalBiaya: number;
  teknisi: string;
  status: StatusPerbaikan;
  tanggal: string;
  foto_sebelum?: string | null;
  foto_setelah?: string | null;
}

// Convert status from UI to API format
const mapStatus = (status: StatusPerbaikan): string => {
  switch (status) {
    case 'Selesai': return 'selesai';
    case 'Dalam Proses': return 'dalam_perbaikan';
    case 'Menunggu Sparepart': return 'menunggu_sparepart';
    default: return 'dalam_perbaikan';
  }
};

// Convert status from API to UI format
const normalizeStatus = (status: string): StatusPerbaikan => {
  switch (status) {
    case 'selesai': return 'Selesai';
    case 'dalam_perbaikan': return 'Dalam Proses';
    case 'menunggu_sparepart': return 'Menunggu Sparepart';
    case 'dibatalkan': return 'Menunggu Sparepart';
    default: return 'Dalam Proses';
  }
};

const FormPerbaikan: React.FC = () => {
  const queryClient = useQueryClient();
  const { data: perbaikanData = [], isLoading } = usePerbaikan();
  const addPerbaikan = useAddPerbaikan();
  const updatePerbaikan = useUpdatePerbaikan();
  const deletePerbaikan = useDeletePerbaikan();

  const { data: sparepartData = [] } = useSparepart();

  // Role-based access control
  const { can_create: canCreate, can_edit: canEdit, can_delete: canDelete, can_import: canImport, can_export_excel: canExportExcel, can_print: canPrint } = usePagePermission('formPerbaikan');
  const canShowActions = canEdit || canDelete;

  // State
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [formData, setFormData] = useState<LocalPerbaikan>({
    noPerbaikan: '',
    noLambung: '',
    namaAlat: '',
    jenisKerusakan: '',
    penyebabKerusakan: '',
    tindakanPerbaikan: '',
    lokasiPerbaikan: '',
    items: [],
    totalBiaya: 0,
    teknisi: '',
    status: 'Dalam Proses',
    tanggal: format(new Date(), 'yyyy-MM-dd'),
    foto_sebelum: null,
    foto_setelah: null
  });

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [viewingPhotoUrl, setViewingPhotoUrl] = useState<string | null>(null);
  const [viewingPhotoTitle, setViewingPhotoTitle] = useState<string>('');

  // ── State filter rentang tanggal tabel ────────────────
  const [tableFilterFrom, setTableFilterFrom] = useState('');
  const [tableFilterTo, setTableFilterTo] = useState('');

  // ── State Dialog Export/Print ──────────────────────────
  const [exportPrintDialog, setExportPrintDialog] = useState<'export' | 'print' | null>(null);
  const [dialogMode, setDialogMode] = useState<'all' | 'range'>('all');
  const nowD = new Date();
  const firstDayOfMonth = `${nowD.getFullYear()}-${String(nowD.getMonth() + 1).padStart(2, '0')}-01`;
  const lastDayOfMonth = `${nowD.getFullYear()}-${String(nowD.getMonth() + 1).padStart(2, '0')}-${String(new Date(nowD.getFullYear(), nowD.getMonth() + 1, 0).getDate()).padStart(2, '0')}`;
  const [dateFrom, setDateFrom] = useState(firstDayOfMonth);
  const [dateTo, setDateTo] = useState(lastDayOfMonth);
  const [currentSparePartItem, setCurrentSparePartItem] = useState<SparePartItem>({
    id: '',
    nama: '',
    jumlah: 0,
    satuan: 'pcs',
    harga: 0,
    total: 0
  });
  const [showSparepartDropdown, setShowSparepartDropdown] = useState(false);
  const [sparepartSearchTerm, setSparepartSearchTerm] = useState('');

  const fileInputRefSebelum = useRef<HTMLInputElement>(null);
  const fileInputRefSetelah = useRef<HTMLInputElement>(null);
  const [previewUrlSebelum, setPreviewUrlSebelum] = useState<string | null>(null);
  const [previewUrlSetelah, setPreviewUrlSetelah] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, type: 'sebelum' | 'setelah') => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('File harus berupa gambar');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error('Ukuran file maksimal 5MB');
      return;
    }

    const url = URL.createObjectURL(file);
    if (type === 'sebelum') setPreviewUrlSebelum(url);
    else setPreviewUrlSetelah(url);

    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = reader.result as string;
      setFormData(prev => ({
        ...prev,
        [type === 'sebelum' ? 'foto_sebelum' : 'foto_setelah']: base64String
      }));
    };
    reader.readAsDataURL(file);
  };

  const removeImage = (type: 'sebelum' | 'setelah') => {
    if (type === 'sebelum') {
      if (previewUrlSebelum) URL.revokeObjectURL(previewUrlSebelum);
      setPreviewUrlSebelum(null);
      if (fileInputRefSebelum.current) fileInputRefSebelum.current.value = '';
    } else {
      if (previewUrlSetelah) URL.revokeObjectURL(previewUrlSetelah);
      setPreviewUrlSetelah(null);
      if (fileInputRefSetelah.current) fileInputRefSetelah.current.value = '';
    }
    setFormData(prev => ({
      ...prev,
      [type === 'sebelum' ? 'foto_sebelum' : 'foto_setelah']: null
    }));
  };

  useEffect(() => {
    return () => {
      if (previewUrlSebelum) URL.revokeObjectURL(previewUrlSebelum);
      if (previewUrlSetelah) URL.revokeObjectURL(previewUrlSetelah);
    };
  }, [previewUrlSebelum, previewUrlSetelah]);

  const { data: ppaList, isLoading: isLoadingPpa } = usePPA();
  const approvedPpa = useMemo(() => {
    return (ppaList || []).filter((ppa) => ppa.status === 'approved');
  }, [ppaList]);

  // Calculate total cost
  const calculateTotal = () => {
    const total = formData.items.reduce((sum, item) => sum + (item.total || 0), 0);
    setFormData(prev => ({ ...prev, totalBiaya: total }));
  };

  // Auto-calculate total when items change
  useEffect(() => {
    const total = formData.items.reduce((sum, item) => sum + (item.total || 0), 0);
    setFormData(prev => ({ ...prev, totalBiaya: total }));
  }, [formData.items]);

  // Calculate available stock for the currently selected sparepart
  const availableStock = useMemo(() => {
    if (!currentSparePartItem.nama) return null;

    let stock = 0;
    sparepartData.forEach(item => {
      if (item.namaSparepart.trim().toLowerCase() === currentSparePartItem.nama.trim().toLowerCase()) {
        if ((item.jenis || '') === 'Pemakaian') {
          stock -= (item.jumlah || 0);
        } else {
          stock += (item.jumlah || 0);
        }
      }
    });

    // If editing, add back old items (they will be returned)
    if (formData.id) {
      const originalPerbaikan = perbaikanData.find(p => p.id === formData.id);
      if (originalPerbaikan) {
        originalPerbaikan.items.forEach(item => {
          const itemName = item.nama || item.itemName;
          if (itemName?.trim().toLowerCase() === currentSparePartItem.nama.trim().toLowerCase()) {
            stock += (item.jumlah || item.quantity || 0);
          }
        });
      }
    }

    // Subtract items already added in current form
    formData.items.forEach(item => {
      if (item.nama.trim().toLowerCase() === currentSparePartItem.nama.trim().toLowerCase()) {
        stock -= item.jumlah;
      }
    });

    return stock;
  }, [currentSparePartItem.nama, sparepartData, formData.items, formData.id, perbaikanData]);

  // Add spare part item
  const addSparePartItem = () => {
    if (!currentSparePartItem.nama) {
      toast.error('Nama item harus diisi');
      return;
    }

    // Validate stock
    if (availableStock !== null && currentSparePartItem.jumlah > availableStock) {
      toast.error(`Stock "${currentSparePartItem.nama}" tidak mencukupi. Tersedia: ${availableStock}, Dibutuhkan: ${currentSparePartItem.jumlah}`);
      return;
    }

    if (currentSparePartItem.jumlah <= 0) {
      toast.error('Jumlah harus lebih dari 0');
      return;
    }

    const total = currentSparePartItem.jumlah * currentSparePartItem.harga;
    const newItem: SparePartItem = {
      ...currentSparePartItem,
      id: crypto.randomUUID(),
      total
    };

    setFormData(prev => ({
      ...prev,
      items: [...prev.items, newItem]
    }));

    setCurrentSparePartItem({
      id: '',
      nama: '',
      jumlah: 0,
      satuan: 'pcs',
      harga: 0,
      total: 0
    });
    setSparepartSearchTerm('');

    calculateTotal();
  };

  // Handle sparepart selection
  const handleSparepartSelect = (sparepartId: string) => {
    const selected = sparepartData.find(s => s.id === sparepartId);
    if (selected) {
      setCurrentSparePartItem(prev => ({
        ...prev,
        nama: selected.namaSparepart,
        satuan: selected.satuan || 'pcs',
        harga: selected.harga || 0
      }));
      setSparepartSearchTerm(selected.namaSparepart);
      setShowSparepartDropdown(false);
    }
  };

  // Filter and Consolidate sparepart based on search term
  const filteredSparepart = useMemo(() => {
    const map = new Map<string, {
      id: string;
      namaSparepart: string;
      deskripsi: string;
      satuan: string;
      harga: number;
      sisaStock: number;
    }>();

    sparepartData.forEach(item => {
      const key = item.namaSparepart.trim().toLowerCase();
      if (!map.has(key)) {
        map.set(key, {
          id: item.id,
          namaSparepart: item.namaSparepart.trim(),
          deskripsi: item.deskripsi || '',
          satuan: item.satuan || 'pcs',
          harga: item.harga || 0,
          sisaStock: 0
        });
      }

      const entry = map.get(key)!;
      if (item.jenis === 'Pemakaian') {
        entry.sisaStock -= (item.jumlah || 0);
      } else {
        entry.sisaStock += (item.jumlah || 0);
      }

      // Update with latest price if available
      if (item.harga > 0) {
        entry.harga = item.harga;
      }
      if (item.satuan) {
        entry.satuan = item.satuan;
      }
      if (item.deskripsi) {
        entry.deskripsi = item.deskripsi;
      }
    });

    const list = Array.from(map.values());
    if (!sparepartSearchTerm) return list;
    return list.filter(s =>
      s.namaSparepart.toLowerCase().includes(sparepartSearchTerm.toLowerCase())
    );
  }, [sparepartSearchTerm, sparepartData]);

  // Remove spare part item
  const removeSparePartItem = (id: string) => {
    setFormData(prev => ({
      ...prev,
      items: prev.items.filter(item => item.id !== id)
    }));
    calculateTotal();
  };

  // Submit form
  const handleSubmit = async () => {
    try {
      if (!formData.noLambung || !formData.namaAlat || !formData.jenisKerusakan) {
        toast.error('Mohon lengkapi data yang diperlukan');
        return;
      }

      const apiData: Perbaikan = {
        id: formData.id,
        tanggal: formData.tanggal,
        noPerbaikan: formData.noPerbaikan,
        noLambung: formData.noLambung,
        namaAlat: formData.namaAlat,
        jenisKerusakan: formData.jenisKerusakan,
        penyebabKerusakan: formData.penyebabKerusakan || '',
        tindakanPerbaikan: formData.tindakanPerbaikan || '',
        lokasiPerbaikan: formData.lokasiPerbaikan,
        items: formData.items.map(item => ({
          id: 0,
          itemName: item.nama,
          quantity: item.jumlah,
          price: item.harga,
          total: item.total,
          perbaikan_id: 0,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          nama: item.nama,
          jumlah: item.jumlah,
          harga: item.harga,
          satuan: item.satuan,
          unit: item.satuan
        })),
        totalBiaya: formData.totalBiaya,
        teknisi: formData.teknisi,
        status: mapStatus(formData.status) as any,
        foto_sebelum: formData.foto_sebelum || null,
        foto_setelah: formData.foto_setelah || null
      };

      if (formData.id) {
        await updatePerbaikan.mutateAsync(apiData);
        toast.success('Data perbaikan berhasil diperbarui');
      } else {
        await addPerbaikan.mutateAsync(apiData);
        toast.success('Data perbaikan berhasil ditambahkan');
      }

      // If status is selesai, update the asset condition & status to active
      if (apiData.status === 'selesai' && apiData.noLambung) {
        const noLambung = apiData.noLambung;

        // 1. Update in alat_berat
        const { data: beratData, error: beratError } = await supabase
          .from('alat_berat')
          .update({ kondisi: 'Baik', status: 'standby' })
          .eq('no_lambung', noLambung)
          .select();

        if (beratError) console.error('Error updating status on alat_berat:', beratError);

        // 2. If not updated in alat_berat, update in alat_pendukung
        if (!beratData || beratData.length === 0) {
          const { error: pendukungError } = await supabase
            .from('alat_pendukung')
            .update({ kondisi: 'Baik', status: 'standby' })
            .eq('no_lambung', noLambung);

          if (pendukungError) console.error('Error updating status on alat_pendukung:', pendukungError);
        }

        // Invalidate query cache to refresh UI
        queryClient.invalidateQueries({ queryKey: ['alat-berat'] });
        queryClient.invalidateQueries({ queryKey: ['alat-pendukung'] });
      }

      resetForm();
      setIsDialogOpen(false);

    } catch (error: any) {
      console.error('Error submitting perbaikan:', error);
      toast.error(error.message || 'Gagal menyimpan data perbaikan');
    }
  };

  // Reset form
  const resetForm = () => {
    setFormData({
      noPerbaikan: '',
      noLambung: '',
      namaAlat: '',
      jenisKerusakan: '',
      penyebabKerusakan: '',
      tindakanPerbaikan: '',
      lokasiPerbaikan: '',
      items: [],
      totalBiaya: 0,
      teknisi: '',
      status: 'Dalam Proses',
      tanggal: format(new Date(), 'yyyy-MM-dd'),
      foto_sebelum: null,
      foto_setelah: null
    });
    if (previewUrlSebelum) URL.revokeObjectURL(previewUrlSebelum);
    if (previewUrlSetelah) URL.revokeObjectURL(previewUrlSetelah);
    setPreviewUrlSebelum(null);
    setPreviewUrlSetelah(null);
    if (fileInputRefSebelum.current) fileInputRefSebelum.current.value = '';
    if (fileInputRefSetelah.current) fileInputRefSetelah.current.value = '';
  };

  // Edit perbaikan
  const editPerbaikan = (item: Perbaikan) => {
    setFormData({
      id: item.id,
      noPerbaikan: item.noPerbaikan || '',
      noLambung: item.noLambung || '',
      namaAlat: item.namaAlat || '',
      jenisKerusakan: item.jenisKerusakan,
      penyebabKerusakan: item.penyebabKerusakan || '',
      tindakanPerbaikan: item.tindakanPerbaikan || '',
      lokasiPerbaikan: item.lokasiPerbaikan,
      items: item.items.map(i => ({
        id: i.id.toString(),
        nama: i.nama || i.itemName,
        jumlah: i.jumlah || i.quantity,
        satuan: i.satuan || i.unit || 'pcs',
        harga: i.harga || i.price,
        total: i.total
      })),
      totalBiaya: item.totalBiaya,
      teknisi: item.teknisi,
      status: normalizeStatus(item.status),
      tanggal: item.tanggal,
      foto_sebelum: item.foto_sebelum || null,
      foto_setelah: item.foto_setelah || null
    });
    setPreviewUrlSebelum(item.foto_sebelum || null);
    setPreviewUrlSetelah(item.foto_setelah || null);
    setIsDialogOpen(true);
  };

  // Delete perbaikan
  const handleDelete = async (id: string) => {
    try {
      await deletePerbaikan.mutateAsync(id);
      toast.success('Data perbaikan berhasil dihapus');
    } catch (error) {
      toast.error('Gagal menghapus data perbaikan');
    }
  };

  // Helper tanggal
  const getDateStr = (tanggal: any): string => {
    if (!tanggal) return '';
    try {
      const d = parseMySQLDate(tanggal);
      if (!d || isNaN(d.getTime())) return '';
      return format(d, 'yyyy-MM-dd');
    } catch { return ''; }
  };

  // Filter data
  const filteredData = useMemo(() => {
    return perbaikanData.filter(item => {
      const matchesSearch =
        item.noLambung.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.namaAlat.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.teknisi.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (item.noPerbaikan || '').toLowerCase().includes(searchTerm.toLowerCase());
      if (!matchesSearch) return false;
      const ds = getDateStr(item.tanggal);
      if (tableFilterFrom && ds && ds < tableFilterFrom) return false;
      if (tableFilterTo && ds && ds > tableFilterTo) return false;
      return true;
    });
  }, [perbaikanData, searchTerm, tableFilterFrom, tableFilterTo]);

  // ── Import Excel ──
  const expectedPerbaikanHeaders = ['Tanggal', 'No Perbaikan', 'No Lambung', 'Nama Alat', 'Jenis Kerusakan', 'Teknisi'];

  const parseNumeric = (val: any): number => {
    if (val === null || val === undefined || val === '') return 0;
    if (typeof val === 'number') return val;
    const cleaned = String(val).replace(/[^\d.,-]/g, '').replace(/\./g, '').replace(',', '.');
    const n = parseFloat(cleaned);
    return isNaN(n) ? 0 : n;
  };

  const handlePerbaikanExcelDataParsed = async (parsedData: any[], _fileName?: string) => {
    let successCount = 0;
    let errorCount = 0;
    const errors: string[] = [];

    if (parsedData.length === 0) {
      toast.info('Tidak ada data untuk diimpor.');
      return;
    }

    for (const [index, row] of parsedData.entries()) {
      const nr: { [key: string]: any } = {};
      for (const key in row) { nr[key.trim().toLowerCase()] = row[key]; }

      const findVal = (keys: string[]): any => {
        for (const k of keys) {
          if (nr[k] !== undefined && nr[k] !== '') return nr[k];
          for (const nk of Object.keys(nr)) {
            if ((nk.includes(k) || k.includes(nk)) && nr[nk] !== undefined && nr[nk] !== '') return nr[nk];
          }
        }
        return undefined;
      };

      // Parse tanggal
      let tanggalFormatted = format(new Date(), 'yyyy-MM-dd');
      const rawTanggal = findVal(['tanggal', 'date']);
      if (rawTanggal) {
        if (rawTanggal instanceof Date && !isNaN(rawTanggal.getTime())) {
          tanggalFormatted = format(rawTanggal, 'yyyy-MM-dd');
        } else if (typeof rawTanggal === 'number') {
          const excelEpoch = Date.UTC(1899, 11, 30);
          const jsDate = new Date(excelEpoch + rawTanggal * 86400000);
          if (!isNaN(jsDate.getTime())) tanggalFormatted = format(jsDate, 'yyyy-MM-dd');
        } else if (typeof rawTanggal === 'string' && rawTanggal.trim()) {
          const tryParse = (s: string, f: string) => { try { const d = parse(s, f, new Date()); return isNaN(d.getTime()) ? null : d; } catch { return null; } };
          const parsed = tryParse(rawTanggal, 'yyyy-MM-dd') || tryParse(rawTanggal, 'dd/MM/yyyy') || tryParse(rawTanggal, 'MM/dd/yyyy');
          if (parsed) tanggalFormatted = format(parsed, 'yyyy-MM-dd');
          else { const d = new Date(rawTanggal); if (!isNaN(d.getTime())) tanggalFormatted = format(d, 'yyyy-MM-dd'); }
        }
      }

      const noLambung = String(findVal(['no lambung', 'no_lambung', 'no. lambung']) || '').trim();
      const namaAlat = String(findVal(['nama alat', 'nama_alat']) || '').trim();
      const jenisKerusakan = String(findVal(['jenis kerusakan', 'kerusakan', 'jenis_kerusakan']) || '').trim();

      if (!noLambung && !namaAlat) {
        errors.push(`Baris ${index + 2}: No Lambung dan Nama Alat kosong.`);
        errorCount++;
        continue;
      }

      const apiData: Perbaikan = {
        tanggal: tanggalFormatted,
        noPerbaikan: String(findVal(['no perbaikan', 'no_perbaikan', 'no. perbaikan']) || '').trim(),
        noLambung,
        namaAlat,
        jenisKerusakan,
        penyebabKerusakan: String(findVal(['penyebab kerusakan', 'penyebab_kerusakan', 'penyebab']) || '').trim(),
        tindakanPerbaikan: String(findVal(['tindakan perbaikan', 'tindakan_perbaikan', 'tindakan']) || '').trim(),
        lokasiPerbaikan: String(findVal(['lokasi perbaikan', 'lokasi_perbaikan', 'lokasi']) || '').trim(),
        items: [],
        totalBiaya: parseNumeric(findVal(['total biaya', 'total_biaya', 'biaya'])),
        teknisi: String(findVal(['teknisi', 'mechanic']) || '').trim(),
        status: mapStatus('Dalam Proses') as any
      };

      try {
        await addPerbaikan.mutateAsync(apiData);
        successCount++;
      } catch (error: any) {
        errorCount++;
        errors.push(`Baris ${index + 2}: ${error.message || 'Gagal menyimpan.'}`);
      }
    }

    if (successCount > 0 && errorCount > 0) {
      toast.warning(`Impor Selesai Sebagian: ${successCount} berhasil, ${errorCount} gagal`, { duration: 10000 });
    } else if (successCount > 0) {
      toast.success(`Berhasil mengimpor ${successCount} data perbaikan.`);
    } else {
      toast.error(`Impor Gagal: ${errorCount} data tidak bisa diimpor.`, { duration: 10000 });
    }
    if (errors.length > 0) console.log('Import errors:', errors);
  };

  // ── Export Excel ──
  const doExportExcel = (data: Perbaikan[]) => {
    if (data.length === 0) { toast.warning('Tidak ada data untuk diekspor'); return; }
    const dataToExport = data.map((item, index) => ({
      'No': index + 1,
      'Tanggal': item.tanggal ? formatDateDisplay(item.tanggal) : '-',
      'No Perbaikan': item.noPerbaikan || '-',
      'No Lambung': item.noLambung || '-',
      'Nama Alat': item.namaAlat || '-',
      'Jenis Kerusakan': item.jenisKerusakan || '-',
      'Penyebab Kerusakan': item.penyebabKerusakan || '-',
      'Tindakan Perbaikan': item.tindakanPerbaikan || '-',
      'Lokasi Perbaikan': item.lokasiPerbaikan || '-',
      'Teknisi': item.teknisi || '-',
      'Total Biaya': item.totalBiaya || 0,
      'Status': normalizeStatus(item.status)
    }));
    const suffix = dialogMode === 'range' && dateFrom && dateTo ? `_${dateFrom}_sd_${dateTo}` : '';
    try {
      exportToExcel(dataToExport, `Data_Perbaikan${suffix}`);
      toast.success(`Berhasil mengekspor ${data.length} data perbaikan ke Excel`);
    } catch { toast.error('Gagal mengekspor data'); }
  };

  // ── Dialog Confirm ──
  const handleDialogConfirm = () => {
    let data = filteredData;
    let periodeLabel = '';
    if (dialogMode === 'range') {
      data = filteredData.filter((i) => {
        const ds = getDateStr(i.tanggal);
        if (!ds) return false;
        if (dateFrom && ds < dateFrom) return false;
        if (dateTo && ds > dateTo) return false;
        return true;
      });
      const fromD = parseMySQLDate(dateFrom);
      const toD = parseMySQLDate(dateTo);
      periodeLabel = `Periode: ${fromD ? fromD.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }) : ''} \u2014 ${toD ? toD.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }) : ''}`;
    }
    if (exportPrintDialog === 'print') {
      doPrintFiltered(data, periodeLabel);
    } else if (exportPrintDialog === 'export') {
      doExportExcel(data);
    }
    setExportPrintDialog(null);
  };

  // ── Print with filtered data ──
  const doPrintFiltered = (data: Perbaikan[], periodeLabel: string) => {
    if (data.length === 0) { toast.warning('Tidak ada data untuk dicetak'); return; }
    const printWindow = window.open('', '', 'width=800,height=600');
    if (!printWindow) { toast.error('Gagal membuka jendela print'); return; }
    const rows = data.map((item, index) => `
      <tr>
        <td style="text-align: center;">${index + 1}</td>
        <td>${formatDateDisplay(item.tanggal)}</td>
        <td>${item.noPerbaikan || '-'}</td>
        <td>${item.noLambung || '-'}</td>
        <td>${item.namaAlat || '-'}</td>
        <td>${item.jenisKerusakan || '-'}</td>
        <td>${item.teknisi || '-'}</td>
        <td>Rp ${(item.totalBiaya || 0).toLocaleString()}</td>
        <td>${normalizeStatus(item.status)}</td>
      </tr>
    `).join('');
    printWindow.document.write(`
      <!DOCTYPE html><html><head><title>Daftar Perbaikan</title>
      <style>
        @page { size: A4 landscape; margin: 1cm; }
        body { font-family: Arial, sans-serif; padding: 20px; font-size: 12px; }
        .header { border-bottom: 2px solid #000; padding-bottom: 10px; margin-bottom: 20px; }
        .company-name { font-weight: bold; font-size: 14px; }
        .company-division { font-size: 12px; margin-bottom: 10px; }
        h1 { color: #1a365d; text-align: center; font-size: 18px; margin-bottom: 5px; }
        .print-date { text-align: center; color: #666; margin-bottom: 10px; font-size: 11px; }
        .print-periode { text-align: center; font-weight: bold; margin-bottom: 16px; font-size: 13px; }
        table { width: 100%; border-collapse: collapse; }
        th, td { border: 1px solid #000; padding: 6px 8px; text-align: left; vertical-align: top; }
        th { background-color: #f2f2f2; font-weight: bold; text-align: center; }
      </style></head><body>
        <div class="header"><div class="company-name">Cabang Papua</div><div class="company-division">Peralatan</div></div>
        <h1>DAFTAR PERBAIKAN ALAT</h1>
        ${periodeLabel ? `<div class="print-periode">${periodeLabel}</div>` : ''}
        <div class="print-date">Dicetak pada: ${new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</div>
        <table><thead><tr>
          <th>No</th><th>Tanggal</th><th>No. Perbaikan</th><th>No. Lambung</th><th>Nama Alat</th>
          <th>Kerusakan</th><th>Teknisi</th><th>Total Biaya</th><th>Status</th>
        </tr></thead><tbody>${rows}</tbody></table>
        <script>window.onload=function(){setTimeout(function(){window.print();window.onafterprint=function(){window.close();};},500);};</script>
      </body></html>
    `);
    printWindow.document.close();
  };

  // Get status badge color
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'selesai': return 'bg-green-100 text-green-800';
      case 'dalam_perbaikan': return 'bg-yellow-100 text-yellow-800';
      case 'dibatalkan': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };


  const handlePrintSingle = (item: Perbaikan) => {
    const printWindow = window.open('', '', 'width=800,height=600');
    if (printWindow) {
      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>Form Perbaikan - ${item.noPerbaikan || 'Dokumen'}</title>
            <style>
              @page { size: A4 portrait; margin: 1cm; }
              body { font-family: Arial, sans-serif; padding: 20px; font-size: 12px; }
              .header { border-bottom: 2px solid #000; padding-bottom: 10px; margin-bottom: 20px; }
              .company-name { font-weight: bold; font-size: 14px; }
              .company-division { font-size: 12px; margin-bottom: 10px; }
              h1 { color: #1a365d; text-align: center; font-size: 18px; margin-bottom: 5px; }
              .print-date { text-align: center; color: #666; margin-bottom: 20px; font-size: 11px; }
              
              .info-grid { display: grid; grid-template-columns: 150px 1fr; gap: 8px; margin-bottom: 20px; }
              .info-grid strong { font-weight: bold; }
              
              h2 { font-size: 14px; margin-top: 20px; margin-bottom: 10px; border-bottom: 1px solid #ccc; padding-bottom: 5px; }
              
              table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
              th, td { border: 1px solid #000; padding: 6px 8px; text-align: left; }
              th { background-color: #f2f2f2; font-weight: bold; text-align: center; }
              .text-right { text-align: right; }
            </style>
          </head>
          <body>
            <div class="header">
              <div class="company-name">Cabang Papua</div>
              <div class="company-division">Peralatan</div>
            </div>
            <h1>LAPORAN PERBAIKAN ALAT</h1>
            <div class="print-date">Dicetak pada: ${new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</div>
            
            <div class="info-grid">
              <strong>Tanggal:</strong> <span>${formatDateDisplay(item.tanggal)}</span>
              <strong>No. Perbaikan:</strong> <span>${item.noPerbaikan || '-'}</span>
              <strong>No. Lambung:</strong> <span>${item.noLambung || '-'}</span>
              <strong>Nama Alat:</strong> <span>${item.namaAlat || '-'}</span>
              <strong>Teknisi:</strong> <span>${item.teknisi || '-'}</span>
              <strong>Status:</strong> <span>${normalizeStatus(item.status)}</span>
              <strong>Lokasi Perbaikan:</strong> <span>${item.lokasiPerbaikan || '-'}</span>
            </div>

            <h2>Rincian Kerusakan & Perbaikan</h2>
            <div class="info-grid">
              <strong>Jenis Kerusakan:</strong> <span>${item.jenisKerusakan || '-'}</span>
              <strong>Penyebab:</strong> <span>${item.penyebabKerusakan || '-'}</span>
              <strong>Tindakan:</strong> <span>${item.tindakanPerbaikan || '-'}</span>
            </div>

            <h2>Penggunaan Sparepart</h2>
            <table>
              <thead>
                <tr>
                  <th>No</th>
                  <th>Nama Sparepart</th>
                  <th>Jumlah</th>
                  <th>Satuan</th>
                  <th>Harga</th>
                  <th>Total</th>
                </tr>
              </thead>
              <tbody>
                ${!item.items || item.items.length === 0 ? `
                  <tr>
                    <td colspan="6" style="text-align: center; color: #666;">Tidak ada sparepart yang digunakan</td>
                  </tr>
                ` : item.items.map((part, index) => `
                  <tr>
                    <td style="text-align: center;">${index + 1}</td>
                    <td>${part.itemName || (part as any).nama || '-'}</td>
                    <td style="text-align: center;">${part.quantity || (part as any).jumlah || 0}</td>
                    <td style="text-align: center;">${(part as any).unit || (part as any).satuan || 'pcs'}</td>
                    <td class="text-right">Rp ${(part.price || (part as any).harga || 0).toLocaleString()}</td>
                    <td class="text-right">Rp ${(part.total || 0).toLocaleString()}</td>
                  </tr>
                `).join('')}
              </tbody>
              <tfoot>
                <tr>
                  <th colspan="5" class="text-right">Total Biaya Perbaikan:</th>
                  <th class="text-right">Rp ${(item.totalBiaya || 0).toLocaleString()}</th>
                </tr>
              </tfoot>
            </table>

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

  return (
    <div className="container mx-auto pt-10 pb-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Form Perbaikan</h1>
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {formData.id ? 'Edit' : 'Tambah'} Perbaikan
            </DialogTitle>
          </DialogHeader>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="tanggal">Tanggal</Label>
              <Input
                id="tanggal"
                type="date"
                value={formData.tanggal}
                onChange={(e) => setFormData(prev => ({ ...prev, tanggal: e.target.value }))}
              />
            </div>

            <div>
              <Label htmlFor="noPerbaikan">No Perbaikan (Wajib)</Label>
              <Input
                id="noPerbaikan"
                placeholder="Contoh: PRB-2026-001"
                value={formData.noPerbaikan}
                onChange={(e) => setFormData(prev => ({ ...prev, noPerbaikan: e.target.value }))}
              />
            </div>

            <div>
              <Label htmlFor="noLambung">No Lambung</Label>
              <Select
                value={formData.noLambung}
                onValueChange={(val) => {
                  const selectedPpa = approvedPpa.find(p => p.no_lambung === val);
                  setFormData(prev => ({
                    ...prev,
                    noLambung: val,
                    namaAlat: selectedPpa?.nama_alat || prev.namaAlat,
                    jenisKerusakan: prev.jenisKerusakan || selectedPpa?.kerusakan || ''
                  }));
                }}
                disabled={isLoadingPpa}
              >
                <SelectTrigger>
                  <SelectValue placeholder={isLoadingPpa ? "Memuat data PPA..." : "Pilih No Lambung"} />
                </SelectTrigger>
                <SelectContent>
                  {approvedPpa.length === 0 && !isLoadingPpa ? (
                    <SelectItem value="__empty__" disabled>Tidak ada alat dari PPA disetujui</SelectItem>
                  ) : (
                    // Filter for unique no_lambung values
                    Array.from(new Map(approvedPpa.filter(p => p.no_lambung).map(item => [item.no_lambung, item])).values()).map((ppa) => (
                      <SelectItem key={ppa.id} value={ppa.no_lambung}>
                        {ppa.no_lambung} {ppa.nama_alat ? `- ${ppa.nama_alat}` : ''}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="namaAlat">Nama Alat</Label>
              <Input
                id="namaAlat"
                value={formData.namaAlat}
                onChange={(e) => setFormData(prev => ({ ...prev, namaAlat: e.target.value }))}
              />
            </div>

            <div>
              <Label htmlFor="teknisi">Teknisi</Label>
              <Input
                id="teknisi"
                value={formData.teknisi}
                onChange={(e) => setFormData(prev => ({ ...prev, teknisi: e.target.value }))}
              />
            </div>

            <div className="col-span-2">
              <Label htmlFor="jenisKerusakan">Jenis Kerusakan</Label>
              <Textarea
                id="jenisKerusakan"
                value={formData.jenisKerusakan}
                onChange={(e) => setFormData(prev => ({ ...prev, jenisKerusakan: e.target.value }))}
              />
            </div>

            <div className="col-span-2">
              <Label htmlFor="penyebabKerusakan">Penyebab Kerusakan</Label>
              <Textarea
                id="penyebabKerusakan"
                value={formData.penyebabKerusakan}
                onChange={(e) => setFormData(prev => ({ ...prev, penyebabKerusakan: e.target.value }))}
              />
            </div>

            <div className="col-span-2">
              <Label htmlFor="tindakanPerbaikan">Tindakan Perbaikan</Label>
              <Textarea
                id="tindakanPerbaikan"
                value={formData.tindakanPerbaikan}
                onChange={(e) => setFormData(prev => ({ ...prev, tindakanPerbaikan: e.target.value }))}
              />
            </div>

            <div>
              <Label htmlFor="lokasiPerbaikan">Lokasi Perbaikan</Label>
              <Input
                id="lokasiPerbaikan"
                value={formData.lokasiPerbaikan}
                onChange={(e) => setFormData(prev => ({ ...prev, lokasiPerbaikan: e.target.value }))}
              />
            </div>
            <div className="col-span-2">
              <Label htmlFor="status">Status</Label>
              <Select
                value={formData.status}
                onValueChange={(value: StatusPerbaikan) => setFormData(prev => ({ ...prev, status: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Dalam Proses">Dalam Proses</SelectItem>
                  <SelectItem value="Selesai">Selesai</SelectItem>
                  <SelectItem value="Menunggu Sparepart">Menunggu Sparepart</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Foto Section */}
          <div className="grid grid-cols-2 gap-4 mt-6">
            <div className="grid gap-2">
              <Label>Foto Sebelum Pekerjaan</Label>
              <div className="flex items-center gap-2">
                <input
                  type="file"
                  ref={fileInputRefSebelum}
                  accept="image/*"
                  onChange={(e) => handleFileChange(e, 'sebelum')}
                  className="hidden"
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => fileInputRefSebelum.current?.click()}
                  className="flex items-center gap-2"
                >
                  <Upload className="h-4 w-4" />
                  Pilih Foto
                </Button>
              </div>
              {previewUrlSebelum && (
                <div className="relative mt-2 inline-block">
                  <img
                    src={previewUrlSebelum}
                    alt="Preview Sebelum Pekerjaan"
                    className="max-h-[200px] object-contain rounded-md border"
                  />
                  <Button
                    type="button"
                    variant="destructive"
                    size="icon"
                    className="absolute top-2 right-2 h-6 w-6 rounded-full opacity-70 hover:opacity-100"
                    onClick={() => removeImage('sebelum')}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              )}
            </div>

            <div className="grid gap-2">
              <Label>Foto Sesudah Pekerjaan</Label>
              <div className="flex items-center gap-2">
                <input
                  type="file"
                  ref={fileInputRefSetelah}
                  accept="image/*"
                  onChange={(e) => handleFileChange(e, 'setelah')}
                  className="hidden"
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => fileInputRefSetelah.current?.click()}
                  className="flex items-center gap-2"
                >
                  <Upload className="h-4 w-4" />
                  Pilih Foto
                </Button>
              </div>
              {previewUrlSetelah && (
                <div className="relative mt-2 inline-block">
                  <img
                    src={previewUrlSetelah}
                    alt="Preview Sesudah Pekerjaan"
                    className="max-h-[200px] object-contain rounded-md border"
                  />
                  <Button
                    type="button"
                    variant="destructive"
                    size="icon"
                    className="absolute top-2 right-2 h-6 w-6 rounded-full opacity-70 hover:opacity-100"
                    onClick={() => removeImage('setelah')}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              )}
            </div>
          </div>

          {/* Spare Parts Section */}
          <div className="mt-6">
            <h3 className="text-lg font-semibold mb-4">Spare Parts</h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-2 mb-4">
              <div className="relative">
                <Input
                  placeholder="Cari atau ketik nama item"
                  value={sparepartSearchTerm}
                  onChange={(e) => {
                    setSparepartSearchTerm(e.target.value);
                    setCurrentSparePartItem(prev => ({ ...prev, nama: e.target.value }));
                    setShowSparepartDropdown(true);
                  }}
                  onFocus={() => setShowSparepartDropdown(true)}
                  onBlur={() => setTimeout(() => setShowSparepartDropdown(false), 200)}
                />
                {showSparepartDropdown && filteredSparepart.length > 0 && (
                  <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-y-auto">
                    {filteredSparepart.map((sparepart) => (
                      <div
                        key={sparepart.id}
                        className="px-4 py-2 hover:bg-gray-100 cursor-pointer"
                        onClick={() => handleSparepartSelect(sparepart.id)}
                      >
                        <div className="font-medium">{sparepart.namaSparepart}</div>
                        <div className="text-sm text-gray-500">
                          Rp {sparepart.harga.toLocaleString()} / {sparepart.satuan}
                          {' · Stock: '}
                          <span className={sparepart.sisaStock <= 0 ? 'text-red-500 font-semibold' : 'text-green-600 font-semibold'}>
                            {sparepart.sisaStock}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <div>
                <Input
                  type="number"
                  placeholder="Jumlah"
                  min="1"
                  value={currentSparePartItem.jumlah}
                  onChange={(e) => setCurrentSparePartItem(prev => ({ ...prev, jumlah: Number(e.target.value) }))}
                />
                {availableStock !== null && (
                  <p className={`text-xs mt-1 ${availableStock <= 0 ? 'text-red-500' : 'text-green-600'}`}>
                    Tersedia: {availableStock}
                  </p>
                )}
              </div>
              <Input
                placeholder="Satuan"
                value={currentSparePartItem.satuan}
                onChange={(e) => setCurrentSparePartItem(prev => ({ ...prev, satuan: e.target.value }))}
              />
              <Input
                type="number"
                placeholder="Harga"
                value={currentSparePartItem.harga}
                onChange={(e) => setCurrentSparePartItem(prev => ({ ...prev, harga: Number(e.target.value) }))}
              />
              <Button onClick={addSparePartItem} className="w-full">
                <Plus className="h-4 w-4 mr-2 sm:mr-0" />
                <span className="inline sm:hidden">Tambah Item</span>
              </Button>
            </div>

            {formData.items.length > 0 && (
              <TableScrollWrapper className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nama Item</TableHead>
                      <TableHead>Jumlah</TableHead>
                      <TableHead>Satuan</TableHead>
                      <TableHead>Harga</TableHead>
                      <TableHead>Total</TableHead>
                      <TableHead>Aksi</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {formData.items.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell>{item.nama}</TableCell>
                        <TableCell>{item.jumlah}</TableCell>
                        <TableCell>{item.satuan}</TableCell>
                        <TableCell>Rp {item.harga.toLocaleString()}</TableCell>
                        <TableCell>Rp {item.total.toLocaleString()}</TableCell>
                        <TableCell>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => removeSparePartItem(item.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableScrollWrapper>
            )}

            <div className="mt-4 text-right">
              <strong>Total Biaya: Rp {formData.totalBiaya.toLocaleString()}</strong>
            </div>
          </div>

          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Batal
            </Button>
            <Button onClick={handleSubmit}>
              {formData.id ? 'Update' : 'Simpan'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <div className="flex flex-col md:flex-row items-start md:items-center gap-3 mb-2">
        <div className="flex flex-col md:flex-row items-start md:items-center gap-3 flex-1">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
            <Input
              placeholder="Cari no lambung, nama alat, teknisi..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              className="pl-10"
            />
          </div>
          <div className="flex items-center gap-2 bg-white border rounded-lg px-3 py-1.5 text-sm">
            <Calendar size={16} className="text-gray-400 flex-shrink-0" />
            <input type="date" value={tableFilterFrom} onChange={e => setTableFilterFrom(e.target.value)}
              className="border-0 bg-transparent focus:ring-0 text-sm p-0 w-[120px]" />
            <span className="text-gray-400">—</span>
            <input type="date" value={tableFilterTo} onChange={e => setTableFilterTo(e.target.value)}
              className="border-0 bg-transparent focus:ring-0 text-sm p-0 w-[120px]" />
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
              onDataParsed={handlePerbaikanExcelDataParsed}
              expectedHeaders={expectedPerbaikanHeaders}
              buttonText="Impor"
              className="flex items-center justify-center gap-1 px-3 py-2 text-xs sm:text-sm sm:px-4 sm:py-2 text-white bg-teal-600 rounded hover:bg-teal-700 w-full sm:w-auto cursor-pointer"
            >
              <Upload size={16} className="mr-1" />
              Impor
            </ExcelImportButton>
          )}
          {canExportExcel && (
            <Button variant="outline" size="sm" onClick={() => { setDialogMode('all'); setExportPrintDialog('export'); }} className="flex items-center justify-center gap-2 text-xs sm:text-sm px-3 py-2 sm:px-4 sm:py-2 w-full sm:w-auto">
              <Download className="h-4 w-4 mr-1" />
              Ekspor
            </Button>
          )}
          {canPrint && (
            <Button variant="outline" size="sm" onClick={() => { setDialogMode('all'); setExportPrintDialog('print'); }} className="flex items-center justify-center gap-2 text-xs sm:text-sm px-3 py-2 sm:px-4 sm:py-2 w-full sm:w-auto">
              <Printer className="h-4 w-4 mr-1" />
              Cetak
            </Button>
          )}
          {canCreate && (
            <Button size="sm" onClick={() => { resetForm(); setIsDialogOpen(true); }} className="flex items-center justify-center gap-2 text-xs sm:text-sm px-3 py-2 sm:px-4 sm:py-2 w-full sm:w-auto">
              <Plus className="h-4 w-4 mr-1" />
              Tambah Perbaikan
            </Button>
          )}
        </div>
      </div>

      {/* Data Table */}
      <Card>
        <CardHeader>
          <CardTitle>Data Perbaikan</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          ) : (
            <>
              <TableScrollWrapper className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Tanggal</TableHead>
                      <TableHead>No Perbaikan</TableHead>
                      <TableHead>No Lambung</TableHead>
                      <TableHead>Nama Alat</TableHead>
                      <TableHead>Jenis Kerusakan</TableHead>
                      <TableHead>Teknisi</TableHead>
                      <TableHead>Total Biaya</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Foto Sebelum Pekerjaan</TableHead>
                      <TableHead>Foto Sesudah Pekerjaan</TableHead>
                      {canShowActions && <TableHead>Aksi</TableHead>}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginateData(filteredData, currentPage, pageSize).map((item) => (
                      <TableRow key={item.id}>
                        <TableCell>{formatDateDisplay(item.tanggal)}</TableCell>
                        <TableCell>{item.noPerbaikan}</TableCell>
                        <TableCell>{item.noLambung}</TableCell>
                        <TableCell>{item.namaAlat}</TableCell>
                        <TableCell>{item.jenisKerusakan}</TableCell>
                        <TableCell>{item.teknisi}</TableCell>
                        <TableCell>Rp {item.totalBiaya.toLocaleString()}</TableCell>
                        <TableCell>
                          <Badge className={getStatusColor(item.status)}>
                            {normalizeStatus(item.status)}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {item.foto_sebelum ? (
                            <div className="flex items-center space-x-2">
                              <img
                                src={item.foto_sebelum}
                                alt="Sebelum Pekerjaan"
                                className="h-10 w-10 object-cover rounded border cursor-pointer hover:opacity-85 transition-opacity"
                                onClick={() => {
                                  setViewingPhotoUrl(item.foto_sebelum!);
                                  setViewingPhotoTitle(`Foto Sebelum Pekerjaan — ${item.noPerbaikan}`);
                                }}
                              />
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                                title="Lihat Foto Sebelum Pekerjaan"
                                onClick={() => {
                                  setViewingPhotoUrl(item.foto_sebelum!);
                                  setViewingPhotoTitle(`Foto Sebelum Pekerjaan — ${item.noPerbaikan}`);
                                }}
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                            </div>
                          ) : (
                            <span className="text-gray-400">-</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {item.foto_setelah ? (
                            <div className="flex items-center space-x-2">
                              <img
                                src={item.foto_setelah}
                                alt="Sesudah Pekerjaan"
                                className="h-10 w-10 object-cover rounded border cursor-pointer hover:opacity-85 transition-opacity"
                                onClick={() => {
                                  setViewingPhotoUrl(item.foto_setelah!);
                                  setViewingPhotoTitle(`Foto Sesudah Pekerjaan — ${item.noPerbaikan}`);
                                }}
                              />
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                                title="Lihat Foto Sesudah Pekerjaan"
                                onClick={() => {
                                  setViewingPhotoUrl(item.foto_setelah!);
                                  setViewingPhotoTitle(`Foto Sesudah Pekerjaan — ${item.noPerbaikan}`);
                                }}
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                            </div>
                          ) : (
                            <span className="text-gray-400">-</span>
                          )}
                        </TableCell>
                        {canShowActions && (
                          <TableCell>
                            <div className="flex space-x-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handlePrintSingle(item)}
                              >
                                <Printer className="h-4 w-4" />
                              </Button>
                              {canEdit && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => editPerbaikan(item)}
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                              )}
                              {canDelete && (
                                <AlertDialog>
                                  <AlertDialogTrigger asChild>
                                    <Button variant="destructive" size="sm">
                                      <Trash2 className="h-4 w-4" />
                                    </Button>
                                  </AlertDialogTrigger>
                                  <AlertDialogContent>
                                    <AlertDialogHeader>
                                      <AlertDialogTitle>Hapus Data Perbaikan</AlertDialogTitle>
                                      <AlertDialogDescription>
                                        Apakah Anda yakin ingin menghapus data perbaikan ini? Tindakan ini tidak dapat dibatalkan.
                                      </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                      <AlertDialogCancel>Batal</AlertDialogCancel>
                                      <AlertDialogAction onClick={() => handleDelete(item.id!)}>
                                        Hapus
                                      </AlertDialogAction>
                                    </AlertDialogFooter>
                                  </AlertDialogContent>
                                </AlertDialog>
                              )}
                            </div>
                          </TableCell>
                        )}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableScrollWrapper>
              <SimplePagination
                currentPage={currentPage}
                totalPages={getTotalPages(filteredData.length, pageSize)}
                onPageChange={setCurrentPage}
                pageSize={pageSize}
                onPageSizeChange={(size) => { setPageSize(size); setCurrentPage(1); }}
                totalItems={filteredData.length}
              />
            </>
          )}
        </CardContent>
      </Card>
      {/* ══ EXPORT/PRINT DIALOG ════════════════════════════ */}
      {exportPrintDialog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4 shadow-2xl">
            <h3 className="text-lg font-semibold mb-1">
              {exportPrintDialog === 'export' ? '📥 Ekspor Data Perbaikan' : '🖨️ Cetak Data Perbaikan'}
            </h3>
            <p className="text-sm text-gray-500 mb-5">Pilih data yang ingin {exportPrintDialog === 'export' ? 'diekspor' : 'dicetak'}:</p>

            <div className="flex flex-col gap-3 mb-5">
              <label className={`flex items-center gap-3 p-3 border-2 rounded-lg cursor-pointer transition-all ${dialogMode === 'all' ? 'border-blue-500 bg-blue-50/50' : 'border-gray-200 hover:border-gray-300'
                }`} onClick={() => setDialogMode('all')}>
                <input type="radio" name="perbaikanMode" checked={dialogMode === 'all'} onChange={() => setDialogMode('all')} className="accent-blue-600" />
                <div>
                  <p className="font-medium text-sm">Semua Data</p>
                  <p className="text-xs text-gray-500">{filteredData.length} data akan di{exportPrintDialog === 'export' ? 'ekspor' : 'cetak'}</p>
                </div>
              </label>
              <label className={`flex items-center gap-3 p-3 border-2 rounded-lg cursor-pointer transition-all ${dialogMode === 'range' ? 'border-blue-500 bg-blue-50/50' : 'border-gray-200 hover:border-gray-300'
                }`} onClick={() => setDialogMode('range')}>
                <input type="radio" name="perbaikanMode" checked={dialogMode === 'range'} onChange={() => setDialogMode('range')} className="accent-blue-600" />
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
                  <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} className="form-input text-sm py-1.5 flex-1" />
                  <span className="text-gray-400 text-sm">s/d</span>
                  <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} className="form-input text-sm py-1.5 flex-1" />
                </div>
              </div>
            )}

            <div className="flex justify-end gap-3">
              <button onClick={() => setExportPrintDialog(null)} className="px-4 py-2 border rounded-lg text-sm hover:bg-gray-50">Batal</button>
              <button onClick={handleDialogConfirm}
                className={`px-4 py-2 text-white rounded-lg text-sm ${exportPrintDialog === 'export' ? 'bg-green-600 hover:bg-green-700' : 'bg-blue-600 hover:bg-blue-700'}`}>
                {exportPrintDialog === 'export' ? 'Ekspor Excel' : 'Cetak Sekarang'}
              </button>
            </div>
          </div>
        </div>
      )}
      {/* ══ VIEW PHOTO DIALOG ════════════════════════════ */}
      <Dialog open={!!viewingPhotoUrl} onOpenChange={(open) => !open && setViewingPhotoUrl(null)}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle id="view-photo-title" className="text-lg font-bold text-gray-800">
              {viewingPhotoTitle}
            </DialogTitle>
            <DialogDescription id="view-photo-description">
              Pratinjau dokumentasi foto perbaikan alat berat/pendukung
            </DialogDescription>
          </DialogHeader>
          <div role="document" aria-labelledby="view-photo-title" aria-describedby="view-photo-description" className="flex justify-center items-center p-2 bg-gray-50 rounded-lg border min-h-[300px]">
            {viewingPhotoUrl ? (
              <img
                src={viewingPhotoUrl || undefined}
                alt="Pratinjau Foto"
                className="max-h-[70vh] w-auto max-w-full object-contain rounded-md shadow-md"
              />
            ) : (
              <span className="text-gray-400">Tidak ada foto</span>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default FormPerbaikan;
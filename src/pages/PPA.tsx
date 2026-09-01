import React, { useState, useMemo, useRef, useEffect } from 'react';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { toast } from '@/components/ui/use-toast';
import { Search, Edit, Trash2, CheckCircle2, XCircle, Plus, Upload, Download, Printer, Calendar, X } from 'lucide-react';
import * as XLSX from 'xlsx';
import { useNavigate } from 'react-router-dom';
import { usePPA, useUpdatePPA, useDeletePPA, useAddPPA, PPAItem } from '@/hooks/usePPA';
import { usePagePermission } from '@/hooks/usePagePermission';
import { SimplePagination, paginateData, getTotalPages } from '@/components/ui/SimplePagination';
import { formatDateDisplay, parseMySQLDate } from '@/utils/dateUtils';
import { supabase } from '@/integrations/api/client';
import { useQueryClient } from '@tanstack/react-query';
import { useAlatBerat } from '@/hooks/useAlatBerat';
import { useAlatPendukung } from '@/hooks/useAlatPendukung';
import { useSewaAlatEksternal } from '@/hooks/useSewaAlatEksternal';
import { TableScrollWrapper } from '@/components/ui/TableScrollWrapper';
interface PPAFormData {
  tanggal: string;
  no_ppa: string;
  nama_alat: string;
  no_lambung: string;
  kerusakan: string;
  keterangan?: string;
}
export default function PPAPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [selectedAlatInfo, setSelectedAlatInfo] = useState<{ id: string; tipe: 'berat' | 'pendukung' | 'sewa' } | null>(null);
  const [selectedEditAlatInfo, setSelectedEditAlatInfo] = useState<{ id: string; tipe: 'berat' | 'pendukung' | 'sewa' } | null>(null);

  const { data: alatBeratList = [] } = useAlatBerat();
  const { data: alatPendukungList = [] } = useAlatPendukung();
  const { data: sewaAlatList = [] } = useSewaAlatEksternal();

  const [isNamaAlatDropdownOpen, setIsNamaAlatDropdownOpen] = useState(false);
  const [isNoLambungDropdownOpen, setIsNoLambungDropdownOpen] = useState(false);
  const [isEditNamaAlatDropdownOpen, setIsEditNamaAlatDropdownOpen] = useState(false);
  const [isEditNoLambungDropdownOpen, setIsEditNoLambungDropdownOpen] = useState(false);

  const createFormRef = useRef<HTMLDivElement>(null);
  const editFormRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (createFormRef.current && !createFormRef.current.contains(event.target as Node)) {
        setIsNamaAlatDropdownOpen(false);
        setIsNoLambungDropdownOpen(false);
      }
      if (editFormRef.current && !editFormRef.current.contains(event.target as Node)) {
        setIsEditNamaAlatDropdownOpen(false);
        setIsEditNoLambungDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const allAssets = useMemo(() => {
    const list: Array<{ id: string; namaAlat: string; noLambung: string; tipe: 'berat' | 'pendukung' | 'sewa' }> = [];

    alatBeratList.forEach(a => {
      list.push({
        id: a.id,
        namaAlat: a.nama_alat || '',
        noLambung: a.no_lambung || '',
        tipe: 'berat'
      });
    });

    alatPendukungList.forEach(a => {
      list.push({
        id: a.id,
        namaAlat: a.namaAlat || '',
        noLambung: a.noLambung || '',
        tipe: 'pendukung'
      });
    });

    sewaAlatList.forEach((a: any) => {
      list.push({
        id: a.id || '',
        namaAlat: a.nama_alat || '',
        noLambung: a.nama_alat || '', // Sewa uses name as lambung
        tipe: 'sewa'
      });
    });

    return list.sort((a, b) => a.noLambung.localeCompare(b.noLambung));
  }, [alatBeratList, alatPendukungList, sewaAlatList]);


  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const [selectedPpa, setSelectedPpa] = useState<PPAItem | null>(null);
  const [showApproveDialog, setShowApproveDialog] = useState(false);
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deletingItem, setDeletingItem] = useState<PPAItem | null>(null);
  const [tableFilterFrom, setTableFilterFrom] = useState('');
  const [tableFilterTo, setTableFilterTo] = useState('');
  const [exportPrintDialog, setExportPrintDialog] = useState<'export' | 'print' | null>(null);
  const [dialogMode, setDialogMode] = useState<'all' | 'range'>('all');
  const nowD = new Date();
  const firstDayOfMonth = `${nowD.getFullYear()}-${String(nowD.getMonth() + 1).padStart(2, '0')}-01`;
  const lastDayOfMonth = `${nowD.getFullYear()}-${String(nowD.getMonth() + 1).padStart(2, '0')}-${String(new Date(nowD.getFullYear(), nowD.getMonth() + 1, 0).getDate()).padStart(2, '0')}`;
  const [dateFrom, setDateFrom] = useState(firstDayOfMonth);
  const [dateTo, setDateTo] = useState(lastDayOfMonth);

  // Helper to get date string (yyyy-MM-dd) from tanggal field
  const getDateStr = (tanggal: any): string => {
    if (!tanggal) return '';
    try {
      const d = parseMySQLDate(tanggal);
      if (!d || isNaN(d.getTime())) return '';
      return format(d, 'yyyy-MM-dd');
    } catch {
      return '';
    }
  };
  const [formData, setFormData] = useState<PPAFormData>({
    tanggal: format(new Date(), 'yyyy-MM-dd'),
    no_ppa: '',
    nama_alat: '',
    no_lambung: '',
    kerusakan: '',
    keterangan: ''
  });
  const [editFormData, setEditFormData] = useState<PPAFormData>({
    tanggal: format(new Date(), 'yyyy-MM-dd'),
    no_ppa: '',
    nama_alat: '',
    no_lambung: '',
    kerusakan: '',
    keterangan: ''
  });

  // Filtering for Create Form
  const filteredAssetsByName = useMemo(() => {
    const q = (formData?.nama_alat || '').trim().toLowerCase();
    if (!q) return allAssets;
    return allAssets.filter(a => a.namaAlat.toLowerCase().includes(q));
  }, [allAssets, formData?.nama_alat]);

  const filteredAssetsByLambung = useMemo(() => {
    const q = (formData?.no_lambung || '').trim().toLowerCase();
    if (!q) return allAssets;
    return allAssets.filter(a => a.noLambung.toLowerCase().includes(q));
  }, [allAssets, formData?.no_lambung]);

  // Filtering for Edit Form
  const filteredEditAssetsByName = useMemo(() => {
    const q = (editFormData?.nama_alat || '').trim().toLowerCase();
    if (!q) return allAssets;
    return allAssets.filter(a => a.namaAlat.toLowerCase().includes(q));
  }, [allAssets, editFormData?.nama_alat]);

  const filteredEditAssetsByLambung = useMemo(() => {
    const q = (editFormData?.no_lambung || '').trim().toLowerCase();
    if (!q) return allAssets;
    return allAssets.filter(a => a.noLambung.toLowerCase().includes(q));
  }, [allAssets, editFormData?.no_lambung]);

  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const { data: ppaData = [], isLoading } = usePPA();
  const updatePPA = useUpdatePPA();
  const deletePPA = useDeletePPA();
  const addPPA = useAddPPA();

  const { can_create: canCreate, can_edit: canEdit, can_delete: canDelete, can_import: canImport, can_export_excel: canExportExcel, can_print: canPrint, can_approve: canApprove } = usePagePermission('ppa');
  const canShowActions = canEdit || canDelete || canApprove;
  // Filter data based on search term and date range
  const filteredData = useMemo(() => {
    return ppaData.filter((item) => {
      const matchesSearch =
        searchTerm.trim() === '' ||
        item.no_ppa.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (item.nama_alat || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (item.no_lambung || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (item.kerusakan || '').toLowerCase().includes(searchTerm.toLowerCase());

      if (!matchesSearch) return false;

      const ds = getDateStr(item.tanggal);
      if (tableFilterFrom && ds && ds < tableFilterFrom) return false;
      if (tableFilterTo && ds && ds > tableFilterTo) return false;

      return true;
    });
  }, [searchTerm, ppaData, tableFilterFrom, tableFilterTo]);
  // Handle Export to Excel
  const doExportExcel = (data: PPAItem[]) => {
    if (data.length === 0) {
      toast({
        title: 'Info',
        description: 'Tidak ada data PPA untuk diekspor',
      });
      return;
    }
    const worksheet = XLSX.utils.json_to_sheet(data.map(item => ({
      'Tanggal': formatDateDisplay(item.tanggal),
      'No. PPA': item.no_ppa,
      'Nama Alat': item.nama_alat,
      'No. Lambung': item.no_lambung,
      'Kerusakan': item.kerusakan,
      'Keterangan': item.keterangan,
      'Status': item.status === 'approved' ? 'Disetujui' : item.status === 'rejected' ? 'Ditolak' : 'Menunggu',
    })));
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'PPA Data');
    const suffix = dialogMode === 'range' && dateFrom && dateTo ? `_${dateFrom}_sd_${dateTo}` : '';
    XLSX.writeFile(workbook, `PPA_Data${suffix}.xlsx`);
    toast({
      title: 'Berhasil',
      description: `Berhasil mengekspor ${data.length} data PPA ke Excel.`,
    });
  };
  // Handle Print HTML popup (Print Semua)
  const doPrintFiltered = (data: PPAItem[], periodeLabel: string) => {
    if (data.length === 0) {
      toast({
        title: 'Info',
        description: 'Tidak ada data PPA untuk dicetak',
      });
      return;
    }
    const printWindow = window.open('', '', 'width=800,height=600');
    if (printWindow) {
      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>Daftar PPA</title>
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
            </style>
          </head>
          <body>
            <div class="header">
              <div class="company-name">Cabang Papua</div>
              <div class="company-division">Peralatan</div>
            </div>
            <h1>DAFTAR PERMOHONAN PERBAIKAN ALAT (PPA)</h1>
            ${periodeLabel ? `<div class="print-periode">${periodeLabel}</div>` : ''}
            <div class="print-date">Dicetak pada: ${new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</div>
            
            <table>
              <thead>
                <tr>
                  <th>No</th>
                  <th>Tanggal</th>
                  <th>No. PPA</th>
                  <th>Nama Alat</th>
                  <th>No. Lambung</th>
                  <th>Kerusakan</th>
                  <th>Keterangan</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                ${data.map((item, index) => `
                  <tr>
                    <td style="text-align: center;">${index + 1}</td>
                    <td>${formatDateDisplay(item.tanggal)}</td>
                    <td>${item.no_ppa || '-'}</td>
                    <td>${item.nama_alat || '-'}</td>
                    <td>${item.no_lambung || '-'}</td>
                    <td>${item.kerusakan || '-'}</td>
                    <td>${item.keterangan || '-'}</td>
                    <td>${item.status === 'approved' ? 'Disetujui' : item.status === 'rejected' ? 'Ditolak' : 'Menunggu'}</td>
                  </tr>
                `).join('')}
              </tbody>
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
      toast({
        title: 'Error',
        description: 'Gagal membuka jendela print',
        variant: 'destructive'
      });
    }
  };

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
  // Handle Print Single
  const handlePrintSingle = (item: PPAItem) => {
    const printWindow = window.open('', '', 'width=800,height=600');
    if (printWindow) {
      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>PPA - ${item.no_ppa || 'Dokumen'}</title>
            <style>
              @page { size: A4 landscape; margin: 1cm; }
              body { font-family: Arial, sans-serif; padding: 20px; font-size: 12px; }
              .header { border-bottom: 2px solid #000; padding-bottom: 10px; margin-bottom: 20px; }
              .company-name { font-weight: bold; font-size: 14px; }
              .company-division { font-size: 12px; margin-bottom: 10px; }
              h1 { color: #1a365d; text-align: center; font-size: 18px; margin-bottom: 5px; }
              .print-date { text-align: center; color: #666; margin-bottom: 20px; font-size: 11px; }
              table { width: 100%; border-collapse: collapse; }
              th, td { border: 1px solid #000; padding: 6px 8px; text-align: left; vertical-align: top; }
              th { background-color: #f2f2f2; font-weight: bold; text-align: center; }
            </style>
          </head>
          <body>
            <div class="header">
              <div class="company-name">Cabang Papua</div>
              <div class="company-division">Peralatan</div>
            </div>
            <h1>PERMOHONAN PERBAIKAN ALAT (PPA)</h1>
            <div class="print-date">Dicetak pada: ${new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</div>
            
            <table>
              <thead>
                <tr>
                  <th>No</th>
                  <th>Tanggal</th>
                  <th>No. PPA</th>
                  <th>Nama Alat</th>
                  <th>No. Lambung</th>
                  <th>Kerusakan</th>
                  <th>Keterangan</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td style="text-align: center;">1</td>
                  <td>${formatDateDisplay(item.tanggal)}</td>
                  <td>${item.no_ppa || '-'}</td>
                  <td>${item.nama_alat || '-'}</td>
                  <td>${item.no_lambung || '-'}</td>
                  <td>${item.kerusakan || '-'}</td>
                  <td>${item.keterangan || '-'}</td>
                  <td>${item.status === 'approved' ? 'Disetujui' : item.status === 'rejected' ? 'Ditolak' : 'Menunggu'}</td>
                </tr>
              </tbody>
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
      toast({
        title: 'Error',
        description: 'Gagal membuka jendela print',
        variant: 'destructive'
      });
    }
  };
  // Handle file selection for import
  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Reset input
    if (event.target) event.target.value = '';

    try {
      const reader = new FileReader();
      reader.onload = async (e) => {
        try {
          const data = new Uint8Array(e.target?.result as ArrayBuffer);
          const workbook = XLSX.read(data, { type: 'array' });
          const sheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[sheetName];
          const json: any[] = XLSX.utils.sheet_to_json(worksheet, { defval: '' });

          if (json.length === 0) {
            toast({
              title: 'File Kosong',
              description: 'Tidak ada data yang ditemukan di file Excel.',
              variant: 'destructive',
            });
            return;
          }

          const headers = Object.keys(json[0]).map(h => h.trim());
          const requiredHeaders = ['Tanggal', 'No. PPA', 'Nama Alat', 'No. Lambung', 'Kerusakan', 'Keterangan'];
          const missingHeaders = requiredHeaders.filter(h => !headers.includes(h));

          if (missingHeaders.length > 0) {
            throw new Error(`Header kolom yang wajib ada tidak ditemukan: ${missingHeaders.join(', ')}`);
          }

          let successCount = 0;
          let errorCount = 0;
          const errors: string[] = [];

          for (let i = 0; i < json.length; i++) {
            const item: any = json[i];
            try {
              // Mapping kolom fleksibel (cocok dengan header export)
              const tanggal = String(
                item['Tanggal'] || item['tanggal'] || ''
              ).trim();
              const no_ppa = String(
                item['No. PPA'] || item['No PPA'] || item['no_ppa'] || ''
              ).trim();
              const nama_alat = String(
                item['Nama Alat'] || item['nama_alat'] || ''
              ).trim();
              const no_lambung = String(
                item['No. Lambung'] || item['No Lambung'] || item['no_lambung'] || ''
              ).trim();
              const kerusakan = String(
                item['Kerusakan'] || item['kerusakan'] || ''
              ).trim();
              const keterangan = String(
                item['Keterangan'] || item['keterangan'] || ''
              ).trim() || null;

              // Validasi field wajib
              if (!no_ppa) throw new Error('No. PPA tidak boleh kosong');
              if (!nama_alat) throw new Error('Nama Alat tidak boleh kosong');
              if (!kerusakan) throw new Error('Kerusakan tidak boleh kosong');
              // Konversi tanggal: coba parse berbagai format
              let parsedTanggal = tanggal;
              if (!parsedTanggal) {
                parsedTanggal = format(new Date(), 'yyyy-MM-dd');
              } else if (/^\d{2}\/\d{2}\/\d{4}$/.test(parsedTanggal)) {
                // Format DD/MM/YYYY dari export
                const [day, month, year] = parsedTanggal.split('/');
                parsedTanggal = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
              } else if (typeof item['Tanggal'] === 'number') {
                // Excel serial date
                const excelEpoch = new Date(1900, 0, 1);
                const dateObj = new Date(excelEpoch.getTime() + (item['Tanggal'] - 1) * 86400000);
                parsedTanggal = format(dateObj, 'yyyy-MM-dd');
              }
              await addPPA.mutateAsync({
                tanggal: parsedTanggal,
                no_ppa,
                nama_alat,
                no_lambung,
                kerusakan,
                keterangan,
                status: 'pending',
                approved_by: null,
                approved_at: null,
              });
              successCount++;
            } catch (err) {
              errorCount++;
              errors.push(`Baris ${i + 2}: ${err instanceof Error ? err.message : 'Error tidak diketahui'}`);
              console.error(`Error processing row ${i + 1}:`, err);
            }
          }
          toast({
            title: successCount > 0 ? 'Import Berhasil' : 'Import Gagal',
            description: `${successCount} berhasil diimpor${errorCount > 0 ? `, ${errorCount} gagal` : ''}`,
            variant: successCount > 0 ? 'default' : 'destructive',
          });
          if (errors.length > 0) console.log('Import errors:', errors);
        } catch (error: any) {
          console.error('Error importing data:', error);
          console.error('Error importing PPA:', error);
          toast({
            title: 'Error Impor',
            description: error.message || 'Gagal mengimpor data dari file Excel.',
            variant: 'destructive',
          });
        }
      };
      reader.readAsArrayBuffer(file);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Gagal membaca file',
        variant: 'destructive',
      });
    }
    // Reset file input
    if (event.target) {
      event.target.value = '';
    }
  };
  // Handle status update
  const handleStatusUpdate = async (id: string, status: 'approved' | 'rejected') => {
    try {
      await updatePPA.mutateAsync({
        id,
        status,
        approved_by: 'Admin', // Replace with actual user from auth
        approved_at: new Date().toISOString()
      });

      // If approved, navigate to Form Perbaikan with PPA data
      if (status === 'approved' && selectedPpa) {
        const params = new URLSearchParams({
          ppaId: selectedPpa.id,
          noLambung: selectedPpa.no_lambung || '',
          namaAlat: selectedPpa.nama_alat || '',
          jenisKerusakan: selectedPpa.kerusakan || '',
          keterangan: selectedPpa.keterangan || ''
        });
        navigate(`/form-perbaikan?${params.toString()}`);
      } else {
        toast({
          title: 'Berhasil',
          description: `PPA berhasil ${status === 'approved' ? 'disetujui' : 'ditolak'}`,
        });
      }
    } catch (error) {
      console.error('Error updating status:', error);
    } finally {
      setShowApproveDialog(false);
      setShowRejectDialog(false);
      setSelectedPpa(null);
    }
  };
  // Handle create PPA
  const handleCreatePPA = async () => {
    try {
      if (!formData.tanggal || !formData.no_ppa || !formData.nama_alat || !formData.kerusakan) {
        toast({
          title: 'Error',
          description: 'Tanggal, No. PPA, Nama Alat, dan Kerusakan harus diisi',
          variant: 'destructive',
        });
        return;
      }
      await addPPA.mutateAsync({
        tanggal: formData.tanggal,
        no_ppa: formData.no_ppa,
        nama_alat: formData.nama_alat,
        no_lambung: formData.no_lambung,
        kerusakan: formData.kerusakan,
        keterangan: formData.keterangan || null,
        status: 'pending',
        approved_by: null,
        approved_at: null
      });

      // Update asset condition and status directly in the database
      if (selectedAlatInfo) {
        if (selectedAlatInfo.tipe === 'berat') {
          const { error } = await supabase
            .from('alat_berat')
            .update({ kondisi: 'Rusak', status: 'kanibal' })
            .eq('id', selectedAlatInfo.id);
          if (error) console.error('Error updating alat_berat:', error);
        } else if (selectedAlatInfo.tipe === 'pendukung') {
          const { error } = await supabase
            .from('alat_pendukung')
            .update({ kondisi: 'Rusak', status: 'kanibal' })
            .eq('id', selectedAlatInfo.id);
          if (error) console.error('Error updating alat_pendukung:', error);
        }
        // Invalidate react-query cache to show changes instantly
        queryClient.invalidateQueries({ queryKey: ['alat-berat'] });
        queryClient.invalidateQueries({ queryKey: ['alat-pendukung'] });
      }

      // Reset form dan close dialog
      setFormData({
        tanggal: format(new Date(), 'yyyy-MM-dd'),
        no_ppa: '',
        nama_alat: '',
        no_lambung: '',
        kerusakan: '',
        keterangan: ''
      });
      setSelectedAlatInfo(null);
      setShowCreateDialog(false);
      toast({
        title: 'Berhasil',
        description: 'PPA berhasil ditambahkan dan status alat diupdate menjadi Rusak & Tidak Aktif',
      });
    } catch (error: any) {
      console.error('Error creating PPA:', error);
      toast({
        title: 'Error',
        description: error.message || 'Gagal menambahkan PPA',
        variant: 'destructive',
      });
    }
  };
  // Handle delete with confirmation dialog
  const handleDeleteConfirm = async () => {
    if (!deletingItem) return;
    try {
      setIsDeleting(deletingItem.id);
      await deletePPA.mutateAsync(deletingItem.id);

      // Restore asset condition to Baik and status to aktif
      if (deletingItem.no_lambung) {
        const noLambung = deletingItem.no_lambung;

        // 1. Update in alat_berat
        const { data: beratData, error: beratError } = await supabase
          .from('alat_berat')
          .update({ kondisi: 'Baik', status: 'standby' })
          .eq('no_lambung', noLambung)
          .select();

        if (beratError) console.error('Error restoring status on alat_berat:', beratError);

        // 2. If not updated in alat_berat, update in alat_pendukung
        if (!beratData || beratData.length === 0) {
          const { error: pendukungError } = await supabase
            .from('alat_pendukung')
            .update({ kondisi: 'Baik', status: 'standby' })
            .eq('no_lambung', noLambung);

          if (pendukungError) console.error('Error restoring status on alat_pendukung:', pendukungError);
        }

        // Invalidate cache
        queryClient.invalidateQueries({ queryKey: ['alat-berat'] });
        queryClient.invalidateQueries({ queryKey: ['alat-pendukung'] });
      }

      toast({
        title: 'Berhasil',
        description: 'Data PPA berhasil dihapus dan status alat dikembalikan menjadi Baik & Aktif',
      });
    } catch (error) {
      console.error('Error deleting PPA:', error);
      toast({
        title: 'Error',
        description: 'Gagal menghapus data PPA',
        variant: 'destructive',
      });
    } finally {
      setIsDeleting(null);
      setDeletingItem(null);
      setShowDeleteDialog(false);
    }
  };
  // Handle edit - buka dialog dengan data yang dipilih
  const handleEdit = (item: PPAItem) => {
    setSelectedPpa(item);
    setEditFormData({
      tanggal: item.tanggal,
      no_ppa: item.no_ppa,
      nama_alat: item.nama_alat,
      no_lambung: item.no_lambung,
      kerusakan: item.kerusakan,
      keterangan: item.keterangan || '',
    });
    setShowEditDialog(true);
  };
  // Handle update PPA
  const handleUpdatePPA = async () => {
    if (!selectedPpa) return;
    try {
      if (!editFormData.tanggal || !editFormData.no_ppa || !editFormData.nama_alat || !editFormData.kerusakan) {
        toast({
          title: 'Error',
          description: 'Tanggal, No. PPA, Nama Alat, dan Kerusakan harus diisi',
          variant: 'destructive',
        });
        return;
      }
      await updatePPA.mutateAsync({
        id: selectedPpa.id,
        tanggal: editFormData.tanggal,
        no_ppa: editFormData.no_ppa,
        nama_alat: editFormData.nama_alat,
        no_lambung: editFormData.no_lambung,
        kerusakan: editFormData.kerusakan,
        keterangan: editFormData.keterangan || null,
      });

      // Update asset condition and status directly in the database if asset changed
      if (selectedEditAlatInfo) {
        if (selectedEditAlatInfo.tipe === 'berat') {
          const { error } = await supabase
            .from('alat_berat')
            .update({ kondisi: 'Rusak', status: 'kanibal' })
            .eq('id', selectedEditAlatInfo.id);
          if (error) console.error('Error updating alat_berat:', error);
        } else if (selectedEditAlatInfo.tipe === 'pendukung') {
          const { error } = await supabase
            .from('alat_pendukung')
            .update({ kondisi: 'Rusak', status: 'kanibal' })
            .eq('id', selectedEditAlatInfo.id);
          if (error) console.error('Error updating alat_pendukung:', error);
        }
        // Invalidate react-query cache to show changes instantly
        queryClient.invalidateQueries({ queryKey: ['alat-berat'] });
        queryClient.invalidateQueries({ queryKey: ['alat-pendukung'] });
      }

      setShowEditDialog(false);
      setSelectedPpa(null);
      setSelectedEditAlatInfo(null);
      toast({
        title: 'Berhasil',
        description: 'Data PPA berhasil diperbarui dan status alat diupdate menjadi Rusak & Tidak Aktif',
      });
    } catch (error: any) {
      console.error('Error updating PPA:', error);
      toast({
        title: 'Error',
        description: error.message || 'Gagal memperbarui data PPA',
        variant: 'destructive',
      });
    }
  };
  return (
    <div className="container mx-auto py-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <h1 className="text-2xl font-bold">Permohonan Perbaikan Alat (PPA)</h1>
        {canCreate && (
          <Button onClick={() => setShowCreateDialog(true)} className="w-full sm:w-auto text-xs sm:text-sm px-3 py-2 sm:px-4 sm:py-2 flex items-center justify-center">
            <Plus className="mr-2 h-4 w-4" /> Buat PPA Baru
          </Button>
        )}
      </div>
      <Card className="mb-6">
        <CardHeader>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="grid grid-cols-1 sm:flex sm:flex-wrap gap-2 w-full sm:w-auto">
              {canPrint && (
                <Button variant="outline" onClick={() => { setDialogMode('all'); setExportPrintDialog('print'); }} className="flex items-center justify-center gap-2 text-xs sm:text-sm px-3 py-2 sm:px-4 sm:py-2 w-full sm:w-auto"><Printer className="mr-2 h-4 w-4" /> Cetak Semua</Button>
              )}
              {canImport && (
                <Button variant="outline" onClick={() => fileInputRef.current?.click()} className="flex items-center justify-center gap-2 text-xs sm:text-sm px-3 py-2 sm:px-4 sm:py-2 w-full sm:w-auto"><Upload className="mr-2 h-4 w-4" /> Import</Button>
              )}
              {canExportExcel && (
                <Button variant="outline" onClick={() => { setDialogMode('all'); setExportPrintDialog('export'); }} className="flex items-center justify-center gap-2 text-xs sm:text-sm px-3 py-2 sm:px-4 sm:py-2 w-full sm:w-auto"><Download className="mr-2 h-4 w-4" /> Eksport</Button>
              )}
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                className="hidden"
                accept=".xlsx, .xls"
              />
            </div>
            <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3 flex-1 justify-end">
              <div className="relative max-w-xs flex-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
                <Input
                  type="text"
                  placeholder="Cari..."
                  className="pl-10"
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    setCurrentPage(1);
                  }}
                />
              </div>
              <div className="flex items-center gap-2 bg-white border rounded-lg px-3 py-1.5 text-sm h-10">
                <Calendar size={16} className="text-gray-400 flex-shrink-0" />
                <input type="date" value={tableFilterFrom} onChange={e => { setTableFilterFrom(e.target.value); setCurrentPage(1); }}
                  className="border-0 bg-transparent focus:ring-0 text-sm p-0 w-[120px]" />
                <span className="text-gray-400">—</span>
                <input type="date" value={tableFilterTo} onChange={e => { setTableFilterTo(e.target.value); setCurrentPage(1); }}
                  className="border-0 bg-transparent focus:ring-0 text-sm p-0 w-[120px]" />
                {(tableFilterFrom || tableFilterTo) && (
                  <button onClick={() => { setTableFilterFrom(''); setTableFilterTo(''); setCurrentPage(1); }}
                    className="ml-1 p-0.5 rounded-full text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                    title="Reset filter tanggal">
                    <X size={14} />
                  </button>
                )}
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <TableScrollWrapper className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tanggal</TableHead>
                  <TableHead>No. PPA</TableHead>
                  <TableHead>Nama Alat</TableHead>
                  <TableHead>No. Lambung</TableHead>
                  <TableHead>Kerusakan</TableHead>
                  <TableHead>Keterangan</TableHead>
                  <TableHead>Status</TableHead>
                  {canShowActions && <TableHead className="w-[150px]">Aksi</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center py-8">
                      Memuat data...
                    </TableCell>
                  </TableRow>
                ) : filteredData.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center py-8 text-gray-500">
                      {searchTerm || tableFilterFrom || tableFilterTo ? 'Tidak ada data yang cocok dengan filter' : 'Tidak ada data PPA'}
                    </TableCell>
                  </TableRow>
                ) : (
                  paginateData(filteredData, currentPage, pageSize).map((item) => (
                    <TableRow key={item.id}>
                      <TableCell>{formatDateDisplay(item.tanggal)}</TableCell>
                      <TableCell className="font-medium">{item.no_ppa}</TableCell>
                      <TableCell>{item.nama_alat}</TableCell>
                      <TableCell>{item.no_lambung}</TableCell>
                      <TableCell className="max-w-[200px] truncate">{item.kerusakan}</TableCell>
                      <TableCell className="max-w-[200px] truncate">{item.keterangan || '-'}</TableCell>
                      <TableCell>
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${item.status === 'approved'
                          ? 'bg-green-100 text-green-800'
                          : item.status === 'rejected'
                            ? 'bg-red-100 text-red-800'
                            : 'bg-yellow-100 text-yellow-800'
                          }`}>
                          {item.status === 'approved' ? 'Disetujui' : item.status === 'rejected' ? 'Ditolak' : 'Menunggu'}
                        </span>
                      </TableCell>
                      {canShowActions && (
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-gray-600 hover:bg-gray-100 p-1 h-8 w-8"
                              title="Cetak"
                              onClick={() => handlePrintSingle(item)}
                            >
                              <Printer className="h-4 w-4" />
                            </Button>
                            {item.status === 'pending' && canApprove && (
                              <>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="text-green-600 hover:bg-green-50 p-1 h-8 w-8"
                                  title="Setujui"
                                  onClick={() => {
                                    setSelectedPpa(item);
                                    setShowApproveDialog(true);
                                  }}
                                >
                                  <CheckCircle2 className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="text-red-600 hover:bg-red-50 p-1 h-8 w-8"
                                  title="Tolak"
                                  onClick={() => {
                                    setSelectedPpa(item);
                                    setShowRejectDialog(true);
                                  }}
                                >
                                  <XCircle className="h-4 w-4" />
                                </Button>
                              </>
                            )}
                            {canEdit && (
                              <Button
                                variant="ghost"
                                size="sm"
                                className="text-blue-600 hover:bg-blue-50 p-1 h-8 w-8"
                                title="Edit"
                                onClick={() => handleEdit(item)}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                            )}
                            {canDelete && (
                              <Button
                                variant="ghost"
                                size="sm"
                                className="text-red-600 hover:bg-red-50 p-1 h-8 w-8"
                                title="Hapus"
                                onClick={() => {
                                  setDeletingItem(item);
                                  setShowDeleteDialog(true);
                                }}
                                disabled={isDeleting === item.id}
                              >
                                {isDeleting === item.id ? (
                                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-gray-400 border-t-blue-600" />
                                ) : (
                                  <Trash2 className="h-4 w-4" />
                                )}
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
          <SimplePagination
            currentPage={currentPage}
            totalPages={getTotalPages(filteredData.length, pageSize)}
            onPageChange={setCurrentPage}
            pageSize={pageSize}
            onPageSizeChange={(size) => { setPageSize(size); setCurrentPage(1); }}
            totalItems={filteredData.length}
          />
        </CardContent>
      </Card>
      {/* Approve Confirmation Dialog */}
      <Dialog open={showApproveDialog} onOpenChange={setShowApproveDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Konfirmasi Persetujuan</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p>Apakah Anda yakin ingin menyetujui permohonan perbaikan ini?</p>
            <p className="font-medium mt-2">No. PPA: {selectedPpa?.no_ppa}</p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowApproveDialog(false)}>
              Batal
            </Button>
            <Button
              onClick={() => selectedPpa && handleStatusUpdate(selectedPpa.id, 'approved')}
              className="bg-green-600 hover:bg-green-700"
            >
              Setujui
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      {/* Reject Confirmation Dialog */}
      <Dialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Konfirmasi Penolakan</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p>Apakah Anda yakin ingin menolak permohonan perbaikan ini?</p>
            <p className="font-medium mt-2">No. PPA: {selectedPpa?.no_ppa}</p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowRejectDialog(false)}>
              Batal
            </Button>
            <Button
              onClick={() => selectedPpa && handleStatusUpdate(selectedPpa.id, 'rejected')}
              variant="destructive"
            >
              Tolak
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      {/* Create PPA Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={(val) => { setShowCreateDialog(val); if (!val) { setSelectedAlatInfo(null); setIsNamaAlatDropdownOpen(false); setIsNoLambungDropdownOpen(false); } }}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Buat PPA Baru</DialogTitle>
          </DialogHeader>
          <div ref={createFormRef} className="grid gap-4 py-4">
            <div className="grid gap-2">
              <label className="text-sm font-medium">Tanggal</label>
              <Input
                type="date"
                value={formData.tanggal}
                onChange={(e) => setFormData({ ...formData, tanggal: e.target.value })}
              />
            </div>
            <div className="grid gap-2">
              <label className="text-sm font-medium">No. PPA</label>
              <Input
                value={formData.no_ppa}
                onChange={(e) => setFormData({ ...formData, no_ppa: e.target.value })}
                placeholder="Contoh: PPA-001"
                required
              />
            </div>
            {/* Nama Alat Field */}
            <div className="grid gap-2 relative">
              <label className="text-sm font-medium">Nama Alat</label>
              <div className="relative">
                <Input
                  value={formData.nama_alat}
                  onChange={(e) => {
                    const val = e.target.value;
                    setFormData(prev => ({ ...prev, nama_alat: val }));
                    setIsNamaAlatDropdownOpen(true);
                  }}
                  onFocus={() => {
                    setIsNamaAlatDropdownOpen(true);
                    setIsNoLambungDropdownOpen(false);
                  }}
                  placeholder="Ketik nama alat..."
                  required
                  autoComplete="off"
                />
                {isNamaAlatDropdownOpen && (
                  <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-y-auto">
                    {filteredAssetsByName.length === 0 ? (
                      <div className="px-3 py-2 text-sm text-gray-500">Tidak ditemukan</div>
                    ) : (
                      filteredAssetsByName.map((asset) => (
                        <button
                          key={`${asset.tipe}-${asset.id}-name`}
                          type="button"
                          className="w-full text-left px-3 py-2 text-sm hover:bg-blue-50 transition-colors"
                          onClick={() => {
                            setFormData(prev => ({
                              ...prev,
                              nama_alat: asset.namaAlat,
                              no_lambung: asset.noLambung
                            }));
                            setSelectedAlatInfo({ id: asset.id, tipe: asset.tipe });
                            setIsNamaAlatDropdownOpen(false);
                          }}
                        >
                          <span className="font-medium text-gray-900">{asset.namaAlat}</span>
                          <span className="text-xs text-gray-500 ml-2">({asset.noLambung})</span>
                        </button>
                      ))
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* No. Lambung Field */}
            <div className="grid gap-2 relative">
              <label className="text-sm font-medium">No. Lambung</label>
              <div className="relative">
                <Input
                  value={formData.no_lambung}
                  onChange={(e) => {
                    const val = e.target.value;
                    setFormData(prev => ({ ...prev, no_lambung: val }));
                    setIsNoLambungDropdownOpen(true);
                  }}
                  onFocus={() => {
                    setIsNoLambungDropdownOpen(true);
                    setIsNamaAlatDropdownOpen(false);
                  }}
                  placeholder="Ketik nomor lambung..."
                  required
                  autoComplete="off"
                />
                {isNoLambungDropdownOpen && (
                  <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-y-auto">
                    {filteredAssetsByLambung.length === 0 ? (
                      <div className="px-3 py-2 text-sm text-gray-500">Tidak ditemukan</div>
                    ) : (
                      filteredAssetsByLambung.map((asset) => (
                        <button
                          key={`${asset.tipe}-${asset.id}-lambung`}
                          type="button"
                          className="w-full text-left px-3 py-2 text-sm hover:bg-blue-50 transition-colors"
                          onClick={() => {
                            setFormData(prev => ({
                              ...prev,
                              nama_alat: asset.namaAlat,
                              no_lambung: asset.noLambung
                            }));
                            setSelectedAlatInfo({ id: asset.id, tipe: asset.tipe });
                            setIsNoLambungDropdownOpen(false);
                          }}
                        >
                          <span className="font-medium text-gray-900">{asset.noLambung}</span>
                          <span className="text-xs text-gray-500 ml-2">({asset.namaAlat})</span>
                        </button>
                      ))
                    )}
                  </div>
                )}
              </div>
            </div>
            <div className="grid gap-2">
              <label className="text-sm font-medium">Kerusakan</label>
              <Input
                value={formData.kerusakan}
                onChange={(e) => setFormData({ ...formData, kerusakan: e.target.value })}
                placeholder="Deskripsi kerusakan"
                required
              />
            </div>
            <div className="grid gap-2">
              <label className="text-sm font-medium">Keterangan</label>
              <Input
                value={formData.keterangan}
                onChange={(e) => setFormData({ ...formData, keterangan: e.target.value })}
                placeholder="Keterangan tambahan (opsional)"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setShowCreateDialog(false); setSelectedAlatInfo(null); }}>
              Batal
            </Button>
            <Button onClick={handleCreatePPA} disabled={addPPA.isPending}>
              {addPPA.isPending ? 'Menyimpan...' : 'Simpan'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      {/* Edit PPA Dialog */}
      <Dialog open={showEditDialog} onOpenChange={(val) => { setShowEditDialog(val); if (!val) { setSelectedEditAlatInfo(null); setSelectedPpa(null); setIsEditNamaAlatDropdownOpen(false); setIsEditNoLambungDropdownOpen(false); } }}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit PPA</DialogTitle>
          </DialogHeader>
          <div ref={editFormRef} className="grid gap-4 py-4">
            <div className="grid gap-2">
              <label className="text-sm font-medium">Tanggal</label>
              <Input
                type="date"
                value={editFormData.tanggal}
                onChange={(e) => setEditFormData({ ...editFormData, tanggal: e.target.value })}
              />
            </div>
            <div className="grid gap-2">
              <label className="text-sm font-medium">No. PPA</label>
              <Input
                value={editFormData.no_ppa}
                onChange={(e) => setEditFormData({ ...editFormData, no_ppa: e.target.value })}
                placeholder="Contoh: PPA-001"
                required
              />
            </div>
            {/* Nama Alat Field */}
            <div className="grid gap-2 relative">
              <label className="text-sm font-medium">Nama Alat</label>
              <div className="relative">
                <Input
                  value={editFormData.nama_alat}
                  onChange={(e) => {
                    const val = e.target.value;
                    setEditFormData(prev => ({ ...prev, nama_alat: val }));
                    setIsEditNamaAlatDropdownOpen(true);
                  }}
                  onFocus={() => {
                    setIsEditNamaAlatDropdownOpen(true);
                    setIsEditNoLambungDropdownOpen(false);
                  }}
                  placeholder="Ketik nama alat..."
                  required
                  autoComplete="off"
                />
                {isEditNamaAlatDropdownOpen && (
                  <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-y-auto">
                    {filteredEditAssetsByName.length === 0 ? (
                      <div className="px-3 py-2 text-sm text-gray-500">Tidak ditemukan</div>
                    ) : (
                      filteredEditAssetsByName.map((asset) => (
                        <button
                          key={`${asset.tipe}-${asset.id}-edit-name`}
                          type="button"
                          className="w-full text-left px-3 py-2 text-sm hover:bg-blue-50 transition-colors"
                          onClick={() => {
                            setEditFormData(prev => ({
                              ...prev,
                              nama_alat: asset.namaAlat,
                              no_lambung: asset.noLambung
                            }));
                            setSelectedEditAlatInfo({ id: asset.id, tipe: asset.tipe });
                            setIsEditNamaAlatDropdownOpen(false);
                          }}
                        >
                          <span className="font-medium text-gray-900">{asset.namaAlat}</span>
                          <span className="text-xs text-gray-500 ml-2">({asset.noLambung})</span>
                        </button>
                      ))
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* No. Lambung Field */}
            <div className="grid gap-2 relative">
              <label className="text-sm font-medium">No. Lambung</label>
              <div className="relative">
                <Input
                  value={editFormData.no_lambung}
                  onChange={(e) => {
                    const val = e.target.value;
                    setEditFormData(prev => ({ ...prev, no_lambung: val }));
                    setIsEditNoLambungDropdownOpen(true);
                  }}
                  onFocus={() => {
                    setIsEditNoLambungDropdownOpen(true);
                    setIsEditNamaAlatDropdownOpen(false);
                  }}
                  placeholder="Ketik nomor lambung..."
                  required
                  autoComplete="off"
                />
                {isEditNoLambungDropdownOpen && (
                  <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-y-auto">
                    {filteredEditAssetsByLambung.length === 0 ? (
                      <div className="px-3 py-2 text-sm text-gray-500">Tidak ditemukan</div>
                    ) : (
                      filteredEditAssetsByLambung.map((asset) => (
                        <button
                          key={`${asset.tipe}-${asset.id}-edit-lambung`}
                          type="button"
                          className="w-full text-left px-3 py-2 text-sm hover:bg-blue-50 transition-colors"
                          onClick={() => {
                            setEditFormData(prev => ({
                              ...prev,
                              nama_alat: asset.namaAlat,
                              no_lambung: asset.noLambung
                            }));
                            setSelectedEditAlatInfo({ id: asset.id, tipe: asset.tipe });
                            setIsEditNoLambungDropdownOpen(false);
                          }}
                        >
                          <span className="font-medium text-gray-900">{asset.noLambung}</span>
                          <span className="text-xs text-gray-500 ml-2">({asset.namaAlat})</span>
                        </button>
                      ))
                    )}
                  </div>
                )}
              </div>
            </div>
            <div className="grid gap-2">
              <label className="text-sm font-medium">Kerusakan</label>
              <Input
                value={editFormData.kerusakan}
                onChange={(e) => setEditFormData({ ...editFormData, kerusakan: e.target.value })}
                placeholder="Deskripsi kerusakan"
                required
              />
            </div>
            <div className="grid gap-2">
              <label className="text-sm font-medium">Keterangan</label>
              <Input
                value={editFormData.keterangan}
                onChange={(e) => setEditFormData({ ...editFormData, keterangan: e.target.value })}
                placeholder="Keterangan tambahan (opsional)"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setShowEditDialog(false); setSelectedEditAlatInfo(null); setSelectedPpa(null); }}>
              Batal
            </Button>
            <Button onClick={handleUpdatePPA} disabled={updatePPA.isPending}>
              {updatePPA.isPending ? 'Menyimpan...' : 'Simpan Perubahan'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Konfirmasi Hapus</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p>Apakah Anda yakin ingin menghapus data PPA ini?</p>
            {deletingItem && (
              <p className="font-medium mt-2 text-red-600">No. PPA: {deletingItem.no_ppa}</p>
            )}
            <p className="text-sm text-gray-500 mt-1">Tindakan ini tidak dapat dibatalkan.</p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setShowDeleteDialog(false); setDeletingItem(null); }}>
              Batal
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteConfirm}
              disabled={isDeleting !== null}
            >
              {isDeleting !== null ? 'Menghapus...' : 'Hapus'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      {/* ══ EXPORT/PRINT DIALOG ════════════════════════════ */}
      {exportPrintDialog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4 shadow-2xl">
            <h3 className="text-lg font-semibold mb-1 text-gray-900">
              {exportPrintDialog === 'export' ? '📥 Ekspor Data PPA' : '🖨️ Cetak Data PPA'}
            </h3>
            <p className="text-sm text-gray-500 mb-5 font-normal">Pilih data PPA yang ingin {exportPrintDialog === 'export' ? 'diekspor' : 'dicetak'}:</p>

            <div className="flex flex-col gap-3 mb-5">
              <label className={`flex items-center gap-3 p-3 border-2 rounded-lg cursor-pointer transition-all ${dialogMode === 'all' ? 'border-blue-500 bg-blue-50/50' : 'border-gray-200 hover:border-gray-300'
                }`} onClick={() => setDialogMode('all')}>
                <input type="radio" name="ppaExportMode" checked={dialogMode === 'all'} onChange={() => setDialogMode('all')} className="accent-blue-600" />
                <div>
                  <p className="font-medium text-sm text-gray-800">Semua Data</p>
                  <p className="text-xs text-gray-500 font-normal">{filteredData.length} data akan di{exportPrintDialog === 'export' ? 'ekspor' : 'cetak'}</p>
                </div>
              </label>
              <label className={`flex items-center gap-3 p-3 border-2 rounded-lg cursor-pointer transition-all ${dialogMode === 'range' ? 'border-blue-500 bg-blue-50/50' : 'border-gray-200 hover:border-gray-300'
                }`} onClick={() => setDialogMode('range')}>
                <input type="radio" name="ppaExportMode" checked={dialogMode === 'range'} onChange={() => setDialogMode('range')} className="accent-blue-600" />
                <div>
                  <p className="font-medium text-sm text-gray-800">Rentang Tanggal</p>
                  <p className="text-xs text-gray-500 font-normal">Pilih periode tanggal tertentu</p>
                </div>
              </label>
            </div>

            {dialogMode === 'range' && (
              <div className="flex items-center gap-2 mb-5 p-3 bg-gray-50 rounded-lg border">
                <Calendar size={16} className="text-gray-400 flex-shrink-0" />
                <div className="flex items-center gap-2 flex-1">
                  <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} className="form-input text-sm py-1.5 flex-1" />
                  <span className="text-gray-400 text-sm font-normal">s/d</span>
                  <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} className="form-input text-sm py-1.5 flex-1" />
                </div>
              </div>
            )}

            <div className="flex justify-end gap-3">
              <button onClick={() => setExportPrintDialog(null)} className="px-4 py-2 border rounded-lg text-sm hover:bg-gray-50 font-normal text-gray-700">Batal</button>
              <button onClick={handleDialogConfirm}
                className={`px-4 py-2 text-white rounded-lg text-sm ${exportPrintDialog === 'export' ? 'bg-green-600 hover:bg-green-700' : 'bg-blue-600 hover:bg-blue-700'}`}>
                {exportPrintDialog === 'export' ? 'Ekspor Excel' : 'Cetak Sekarang'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
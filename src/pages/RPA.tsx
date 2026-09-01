import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAddRPA, useUpdateRPA, useRPA, useApproveRPA, useRejectRPA, useDeleteRPA, RPAItem as RPAItemType } from '@/hooks/useRPA';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Calendar } from '@/components/ui/calendar';
import { CalendarIcon, Plus, Trash2, Edit, Printer, CheckCircle, XCircle } from 'lucide-react';
import { supabase } from '@/integrations/api/client';
import { format } from 'date-fns';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { usePagePermission } from '@/hooks/usePagePermission';
import { ComboboxNamaAlat } from '@/components/ComboboxNamaAlat';
import { SimplePagination, paginateData, getTotalPages } from '@/components/ui/SimplePagination';
import { formatDateDisplay, formatDateForMySQL, parseMySQLDate } from '@/utils/dateUtils';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { TableScrollWrapper } from '@/components/ui/TableScrollWrapper';

interface RPAFormItem {
  id: number;
  namaAlat: string;
  noLambung: string;
  uraianPekerjaan: string;
  mulaiTanggal: Date | undefined;
  selesaiTanggal: Date | undefined;
  keterangan: string;
}

export default function RPA() {
  const [nomorRPA, setNomorRPA] = useState('');
  const [tanggal, setTanggal] = useState<Date | undefined>(new Date());
  const [itemPekerjaan, setItemPekerjaan] = useState('');
  const [lokasiProyek, setLokasiProyek] = useState('');

  const [rpaItems, setRpaItems] = useState<RPAFormItem[]>([]);

  const [showItemDialog, setShowItemDialog] = useState(false);
  const [editingItemIndex, setEditingItemIndex] = useState<number | null>(null);
  const [itemForm, setItemForm] = useState<Omit<RPAFormItem, 'id'>>({
    namaAlat: '',
    noLambung: '',
    uraianPekerjaan: '',
    mulaiTanggal: undefined,
    selesaiTanggal: undefined,
    keterangan: ''
  });

  const { data: rpaList = [], isLoading, refetch: refetchRPA } = useRPA();
  const { mutateAsync: addRPA, isPending: isAdding } = useAddRPA();
  const { mutateAsync: updateRPA, isPending: isUpdating } = useUpdateRPA();
  const { mutateAsync: approveRPA, isPending: isApproving } = useApproveRPA();
  const { mutateAsync: rejectRPA, isPending: isRejecting } = useRejectRPA();
  const { mutateAsync: deleteRPA, isPending: isDeleting } = useDeleteRPA();

  const { data: allDetails = [] } = useQuery({
    queryKey: ['rpa-details', 'all'],
    queryFn: async () => {
      try {
        const { data, error } = await supabase
          .from('rpa_details')
          .select('*');
        if (error) throw error;
        return data || [];
      } catch (err) {
        console.warn('Error fetching all RPA details:', err);
        return [];
      }
    }
  });

  const { can_create: canCreate, can_edit: canEdit, can_delete: canDelete, can_approve: isAdmin, can_print: canPrint } = usePagePermission('rpa');

  const [isEditMode, setIsEditMode] = useState(false);
  const [currentRPAId, setCurrentRPAId] = useState<number | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);

  const handleOpenAddItem = () => {
    setEditingItemIndex(null);
    setItemForm({
      namaAlat: '',
      noLambung: '',
      uraianPekerjaan: '',
      mulaiTanggal: undefined,
      selesaiTanggal: undefined,
      keterangan: ''
    });
    setShowItemDialog(true);
  };

  const handleOpenEditItem = (index: number) => {
    const item = rpaItems[index];
    setEditingItemIndex(index);
    setItemForm({
      namaAlat: item.namaAlat,
      noLambung: item.noLambung,
      uraianPekerjaan: item.uraianPekerjaan,
      mulaiTanggal: item.mulaiTanggal,
      selesaiTanggal: item.selesaiTanggal,
      keterangan: item.keterangan
    });
    setShowItemDialog(true);
  };

  const handleSaveItem = () => {
    if (!itemForm.namaAlat.trim()) {
      alert('Nama Alat wajib diisi.');
      return;
    }

    if (itemForm.mulaiTanggal && itemForm.selesaiTanggal) {
      if (itemForm.mulaiTanggal > itemForm.selesaiTanggal) {
        alert('Tanggal Mulai tidak boleh melewati Tanggal Selesai.');
        return;
      }
    }

    if (editingItemIndex === null) {
      // Adding new
      const newItem: RPAFormItem = {
        id: Date.now(),
        ...itemForm
      };
      setRpaItems(prev => [...prev, newItem]);
    } else {
      // Editing existing
      setRpaItems(prev => prev.map((item, idx) =>
        idx === editingItemIndex ? { ...item, ...itemForm } : item
      ));
    }

    setShowItemDialog(false);
  };

  const handleRemoveItem = (index: number) => {
    setRpaItems(prev => prev.filter((_, idx) => idx !== index));
  };

  const resetForm = () => {
    setNomorRPA('');
    setTanggal(new Date());
    setItemPekerjaan('');
    setLokasiProyek('');
    setRpaItems([]);
    setIsEditMode(false);
    setCurrentRPAId(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!nomorRPA.trim()) {
      alert('Nomor RPA harus diisi');
      return;
    }

    if (!tanggal) {
      alert('Tanggal harus diisi');
      return;
    }

    if (!itemPekerjaan.trim()) {
      alert('Item pekerjaan harus diisi');
      return;
    }

    // 1. Validasi baris kosong (Nama Alat wajib diisi)
    const emptyRows: number[] = [];
    rpaItems.forEach((item, index) => {
      if (!item.namaAlat.trim()) {
        emptyRows.push(index + 1);
      }
    });

    if (emptyRows.length > 0) {
      alert(`Peringatan: Baris ke-${emptyRows.join(', ')} masih kosong dan harus diisi (Nama Alat wajib dipilih).`);
      return;
    }

    // 2. Validasi duplikasi alat
    const duplicates: string[] = [];
    const seenTools = new Map<string, number[]>(); // key -> array of row numbers

    rpaItems.forEach((item, index) => {
      const rowNum = index + 1;
      const toolName = item.namaAlat.trim();
      const hullNo = item.noLambung?.trim() || '';

      if (toolName) {
        // Gabungkan nama alat dan no lambung untuk mendeteksi alat yang sama persis
        const key = hullNo ? `${toolName} | ${hullNo}` : toolName;
        if (!seenTools.has(key)) {
          seenTools.set(key, []);
        }
        seenTools.get(key)!.push(rowNum);
      }
    });

    seenTools.forEach((rows, key) => {
      if (rows.length > 1) {
        const displayName = key.includes(' | ') ? key.replace(' | ', ' (') + ')' : key;
        duplicates.push(`Alat "${displayName}" sudah dipilih pada Baris ${rows.join(' & ')}`);
      }
    });

    if (duplicates.length > 0) {
      alert("Peringatan: Duplikasi Alat ditemukan!\n" + duplicates.join('\n') + "\n\nHarap pilih alat yang berbeda atau hapus baris duplikat.");
      return;
    }

    // 3. Validasi periode tanggal (Mulai <= Selesai jika keduanya diisi)
    const invalidDates: string[] = [];
    rpaItems.forEach((item, index) => {
      const rowNum = index + 1;
      if (item.mulaiTanggal && item.selesaiTanggal) {
        if (item.mulaiTanggal > item.selesaiTanggal) {
          invalidDates.push(`Baris ke-${rowNum}: Tanggal Mulai tidak boleh melewati Tanggal Selesai.`);
        }
      }
    });

    if (invalidDates.length > 0) {
      alert("Peringatan: Validasi Tanggal Salah!\n" + invalidDates.join('\n'));
      return;
    }

    const validItems = rpaItems.filter(item => item.namaAlat.trim() !== '');

    if (validItems.length === 0) {
      alert('Minimal satu baris dengan nama alat harus diisi');
      return;
    }

    try {
      const formatDate = (date: Date | undefined): string | null => {
        if (!date) return null;
        try {
          const d = new Date(date);
          if (isNaN(d.getTime())) return null;
          return formatDateForMySQL(d);
        } catch (error) {
          console.error('Error formatting date:', error);
          return null;
        }
      };

      const defaultDate = new Date();
      const formattedDefaultDate = formatDateForMySQL(defaultDate);

      const rpaData = {
        rpa_id: nomorRPA.trim(),
        tanggal: formatDate(tanggal) || formattedDefaultDate,
        item_pekerjaan: itemPekerjaan.trim(),
        lokasi_proyek: lokasiProyek.trim() || undefined,
      };

      const details = validItems.map(item => ({
        nama_alat: item.namaAlat.trim(),
        no_lambung: item.noLambung?.trim() || null,
        uraian_pekerjaan: item.uraianPekerjaan.trim() || '',
        mulai_tanggal: formatDate(item.mulaiTanggal),
        selesai_tanggal: formatDate(item.selesaiTanggal),
        keterangan: item.keterangan?.trim() || '',
      }));

      console.log('Submitting RPA data:', { rpaData, details });

      try {
        if (isEditMode && currentRPAId) {
          await updateRPA({
            id: currentRPAId,
            rpaData,
            details
          });
          alert('Data RPA berhasil diperbarui');
        } else {
          await addRPA({
            rpaData: {
              ...rpaData,
              lokasi_proyek: rpaData.lokasi_proyek || ''
            },
            details
          });
          alert('Data RPA berhasil disimpan');
        }
        refetchRPA();
        setShowForm(false);
        resetForm();
      } catch (error) {
        console.error(isEditMode ? 'Error updating RPA:' : 'Error saving RPA:', error);
        alert(`Gagal ${isEditMode ? 'memperbarui' : 'menyimpan'} data RPA: ` + (error instanceof Error ? error.message : 'Kesalahan tidak diketahui'));
      }
    } catch (error) {
      console.error('Error in handleSubmit:', error);
      alert('Terjadi kesalahan: ' + (error as Error).message);
    }
  };

  const handlePrintAll = async () => {
    // Fetch all RPA with details
    const { data: allRPA, error: rpaError } = await supabase
      .from('rpa')
      .select('*')
      .order('tanggal', { ascending: false });

    if (rpaError) {
      console.error('Error fetching RPA:', rpaError);
      alert('Gagal mengambil data RPA');
      return;
    }

    if (!allRPA || allRPA.length === 0) {
      alert('Tidak ada data RPA untuk dicetak');
      return;
    }

    // Fetch details for each RPA
    const rpaWithDetails = await Promise.all(
      allRPA.map(async (rpa: any) => {
        const { data: details, error: detailsError } = await supabase
          .from('rpa_details')
          .select('*')
          .eq('rpa_id', rpa.id);

        if (detailsError) {
          console.error('Error fetching details for RPA:', rpa.id, detailsError);
          return { ...rpa, details: [] };
        }

        return {
          ...rpa,
          details: details ? details.map((detail: any) => ({
            namaAlat: detail.nama_alat,
            uraianPekerjaan: detail.uraian_pekerjaan || '',
            mulaiTanggal: detail.mulai_tanggal ? parseMySQLDate(detail.mulai_tanggal) || undefined : undefined,
            selesaiTanggal: detail.selesai_tanggal ? parseMySQLDate(detail.selesai_tanggal) || undefined : undefined,
            keterangan: detail.keterangan || ''
          })) : []
        };
      })
    );

    printAllWindowContent(rpaWithDetails);
  };

  const handlePrint = (rpa?: RPAItemType) => {
    // Use form data if editing, otherwise use selected RPA data
    const printNomorRPA = rpa ? rpa.rpa_id : nomorRPA;
    const printTanggal = rpa ? (parseMySQLDate(rpa.tanggal) || undefined) : tanggal;
    const printItemPekerjaan = rpa ? rpa.item_pekerjaan : itemPekerjaan;
    const printLokasiProyek = rpa ? rpa.lokasi_proyek : lokasiProyek;
    const printItems = rpa ? [] : rpaItems;

    // If printing from list, fetch details first
    if (rpa) {
      supabase
        .from('rpa_details')
        .select('*')
        .eq('rpa_id', rpa.id)
        .then(({ data: details, error }: any) => {
          if (error) {
            console.error('Error fetching RPA details:', error);
            return;
          }

          const items = details ? details.map((detail: any) => ({
            namaAlat: detail.nama_alat,
            uraianPekerjaan: detail.uraian_pekerjaan || '',
            mulaiTanggal: detail.mulai_tanggal ? new Date(detail.mulai_tanggal) : undefined,
            selesaiTanggal: detail.selesai_tanggal ? new Date(detail.selesai_tanggal) : undefined,
            keterangan: detail.keterangan || ''
          })) : [];

          printWindowContent(printNomorRPA, printTanggal, printItemPekerjaan, printLokasiProyek, items);
        });
    } else {
      printWindowContent(printNomorRPA, printTanggal, printItemPekerjaan, printLokasiProyek, printItems);
    }
  };

  const printAllWindowContent = (rpaList: any[]) => {
    const printWindow = window.open('', '', 'width=800,height=600');
    if (printWindow) {
      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>Daftar RPA - Semua</title>
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
            <h1>DAFTAR RENCANA PENGGUNAAN ALAT (RPA)</h1>
            <div class="print-date">Dicetak pada: ${new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</div>
            
            <table>
              <thead>
                <tr>
                  <th>No</th>
                  <th>Nomor RPA</th>
                  <th>Tanggal</th>
                  <th>Item Pekerjaan</th>
                  <th>Lokasi Proyek</th>
                  <th>Nama Alat</th>
                  <th>Uraian Pekerjaan</th>
                  <th>Periode (Mulai - Selesai)</th>
                  <th>Keterangan</th>
                </tr>
              </thead>
              <tbody>
                ${rpaList.flatMap((rpa, rpaIndex) => {
        if (!rpa.details || rpa.details.length === 0) {
          return `
                      <tr>
                        <td style="text-align: center;">${rpaIndex + 1}</td>
                        <td>${rpa.rpa_id || '-'}</td>
                        <td>${formatDateDisplay(rpa.tanggal)}</td>
                        <td>${rpa.item_pekerjaan || '-'}</td>
                        <td>${rpa.lokasi_proyek || '-'}</td>
                        <td colspan="4" style="text-align: center; color: #666;">Tidak ada alat yang ditambahkan</td>
                      </tr>
                    `;
        }

        return rpa.details.map((item: any, detailIndex: number) => {
          const isFirst = detailIndex === 0;
          const rowSpanAttr = isFirst ? `rowspan="${rpa.details.length}"` : '';

          const mulaiStr = item.mulaiTanggal ? format(item.mulaiTanggal, 'dd/MM/yyyy') : '-';
          const selesaiStr = item.selesaiTanggal ? format(item.selesaiTanggal, 'dd/MM/yyyy') : '-';
          const periodeStr = (mulaiStr === '-' && selesaiStr === '-') ? '-' : `${mulaiStr} s/d ${selesaiStr}`;

          return `
                      <tr>
                        ${isFirst ? `<td style="text-align: center;" ${rowSpanAttr}>${rpaIndex + 1}</td>` : ''}
                        ${isFirst ? `<td ${rowSpanAttr}>${rpa.rpa_id || '-'}</td>` : ''}
                        ${isFirst ? `<td ${rowSpanAttr}>${formatDateDisplay(rpa.tanggal)}</td>` : ''}
                        ${isFirst ? `<td ${rowSpanAttr}>${rpa.item_pekerjaan || '-'}</td>` : ''}
                        ${isFirst ? `<td ${rowSpanAttr}>${rpa.lokasi_proyek || '-'}</td>` : ''}
                        <td>${item.namaAlat || '-'}</td>
                        <td>${item.uraianPekerjaan || '-'}</td>
                        <td style="text-align: center; white-space: nowrap;">${periodeStr}</td>
                        <td>${item.keterangan || '-'}</td>
                      </tr>
                    `;
        }).join('');
      }).join('')}
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
      console.error('Gagal membuka jendela print');
    }
  };

  const printWindowContent = (
    nomor: string,
    tanggal: Date | undefined,
    itemPekerjaan: string,
    lokasiProyek: string,
    items: any[]
  ) => {
    const printWindow = window.open('', '', 'width=800,height=600');
    if (printWindow) {
      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>RPA - ${nomor || 'Dokumen'}</title>
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
            <h1>RENCANA PENGGUNAAN ALAT (RPA)</h1>
            <div class="print-date">Dicetak pada: ${new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</div>
            
            <table>
              <thead>
                <tr>
                  <th>No</th>
                  <th>Nomor RPA</th>
                  <th>Tanggal</th>
                  <th>Item Pekerjaan</th>
                  <th>Lokasi Proyek</th>
                  <th>Nama Alat</th>
                  <th>Uraian Pekerjaan</th>
                  <th>Periode (Mulai - Selesai)</th>
                  <th>Keterangan</th>
                </tr>
              </thead>
              <tbody>
                ${(() => {
          if (!items || items.length === 0) {
            return `
                      <tr>
                        <td style="text-align: center;">1</td>
                        <td>${nomor || '-'}</td>
                        <td>${tanggal ? format(tanggal, 'dd/MM/yyyy') : '-'}</td>
                        <td>${itemPekerjaan || '-'}</td>
                        <td>${lokasiProyek || '-'}</td>
                        <td colspan="4" style="text-align: center; color: #666;">Tidak ada alat yang ditambahkan</td>
                      </tr>
                    `;
          }

          return items.map((item, detailIndex) => {
            const isFirst = detailIndex === 0;
            const rowSpanAttr = isFirst ? `rowspan="${items.length}"` : '';

            const mulaiStr = item.mulaiTanggal ? format(item.mulaiTanggal, 'dd/MM/yyyy') : '-';
            const selesaiStr = item.selesaiTanggal ? format(item.selesaiTanggal, 'dd/MM/yyyy') : '-';
            const periodeStr = (mulaiStr === '-' && selesaiStr === '-') ? '-' : `${mulaiStr} s/d ${selesaiStr}`;

            return `
                      <tr>
                        ${isFirst ? `<td style="text-align: center;" ${rowSpanAttr}>1</td>` : ''}
                        ${isFirst ? `<td ${rowSpanAttr}>${nomor || '-'}</td>` : ''}
                        ${isFirst ? `<td ${rowSpanAttr}>${tanggal ? format(tanggal, 'dd/MM/yyyy') : '-'}</td>` : ''}
                        ${isFirst ? `<td ${rowSpanAttr}>${itemPekerjaan || '-'}</td>` : ''}
                        ${isFirst ? `<td ${rowSpanAttr}>${lokasiProyek || '-'}</td>` : ''}
                        <td>${item.namaAlat || '-'}</td>
                        <td>${item.uraianPekerjaan || '-'}</td>
                        <td style="text-align: center; white-space: nowrap;">${periodeStr}</td>
                        <td>${item.keterangan || '-'}</td>
                      </tr>
                    `;
          }).join('');
        })()}
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
      console.error('Gagal membuka jendela print');
    }
  };

  const handleEdit = async (rpa: RPAItemType) => {
    setNomorRPA(rpa.rpa_id);
    setTanggal(parseMySQLDate(rpa.tanggal) || new Date());
    setItemPekerjaan(rpa.item_pekerjaan);
    setLokasiProyek(rpa.lokasi_proyek || '');

    try {
      // Query detail menggunakan rpa.id (numeric bigint sebagai FK)
      const { data: details, error } = await supabase
        .from('rpa_details')
        .select('*')
        .eq('rpa_id', rpa.id);

      if (error) throw error;

      if (details && details.length > 0) {
        const items = details.map((detail: any, index: number) => ({
          id: index + 1,
          namaAlat: detail.nama_alat,
          noLambung: detail.no_lambung || '',
          uraianPekerjaan: detail.uraian_pekerjaan || '',
          mulaiTanggal: detail.mulai_tanggal ? parseMySQLDate(detail.mulai_tanggal) || undefined : undefined,
          selesaiTanggal: detail.selesai_tanggal ? parseMySQLDate(detail.selesai_tanggal) || undefined : undefined,
          keterangan: detail.keterangan || ''
        }));

        setRpaItems(items);
      } else {
        setRpaItems([]);
      }

      setIsEditMode(true);
      setCurrentRPAId(rpa.id ?? null);
      setShowForm(true);
    } catch (error) {
      console.error('Error loading RPA details:', error);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Apakah Anda yakin ingin menghapus data RPA ini?')) {
      return;
    }

    try {
      await deleteRPA(Number(id));
      alert('Data RPA berhasil dihapus');
      refetchRPA();
    } catch (error) {
      console.error('Error deleting RPA:', error);
      alert('Gagal menghapus data RPA: ' + (error as Error).message);
    }
  };

  useEffect(() => {
    refetchRPA();
  }, []);

  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <h1 className="text-2xl font-bold">Rencana Penggunaan Alat (RPA)</h1>
        <div className="grid grid-cols-1 sm:flex sm:flex-wrap gap-2 w-full sm:w-auto">
          {!showForm && (
            <>
              {canPrint && (
                <Button variant="outline" onClick={handlePrintAll} className="flex items-center justify-center gap-2 text-xs sm:text-sm px-3 py-2 sm:px-4 sm:py-2 w-full sm:w-auto">
                  <Printer className="mr-2 h-4 w-4" /> Print Semua
                </Button>
              )}
              {canCreate && (
                <Button onClick={() => setShowForm(true)} className="flex items-center justify-center gap-2 text-xs sm:text-sm px-3 py-2 sm:px-4 sm:py-2 w-full sm:w-auto">
                  <Plus className="mr-2 h-4 w-4" /> Buat RPA Baru
                </Button>
              )}
            </>
          )}
        </div>
      </div>

      {!showForm ? (
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Daftar RPA</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex justify-center items-center h-32">
                  <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
                </div>
              ) : rpaList && rpaList.length > 0 ? (
                <>
                  <TableScrollWrapper className="rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>No. RPA</TableHead>
                          <TableHead>Nama Alat</TableHead>
                          <TableHead>Tanggal</TableHead>
                          <TableHead>Item Pekerjaan</TableHead>
                          <TableHead>Lokasi Proyek</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead className="w-[200px]">Aksi</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {paginateData(rpaList, currentPage, pageSize).map((rpa) => {
                          const status = rpa.status || 'diproses';
                          const statusConfig: Record<string, { label: string; cls: string }> = {
                            diproses: { label: 'Diproses', cls: 'bg-yellow-100 text-yellow-800' },
                            digunakan: { label: 'Digunakan', cls: 'bg-blue-100 text-blue-800' },
                            ditolak: { label: 'Ditolak', cls: 'bg-red-100 text-red-800' },
                            selesai: { label: 'Selesai', cls: 'bg-green-100 text-green-800' },
                          };
                          const sc = statusConfig[status] || statusConfig.diproses;
                          return (
                            <TableRow key={rpa.id}>
                              <TableCell>{rpa.rpa_id}</TableCell>
                              {(() => {
                                const tools = allDetails
                                  .filter((d: any) => d.rpa_id === rpa.id)
                                  .map((d: any) => `${d.nama_alat}${d.no_lambung ? ` (${d.no_lambung})` : ''}`)
                                  .join(', ');
                                return (
                                  <TableCell className="max-w-[220px] truncate font-medium text-gray-800" title={tools || '-'}>
                                    {tools || '-'}
                                  </TableCell>
                                );
                              })()}
                              <TableCell>{formatDateDisplay(rpa.tanggal)}</TableCell>
                              <TableCell>{rpa.item_pekerjaan}</TableCell>
                              <TableCell>{rpa.lokasi_proyek || '-'}</TableCell>
                              <TableCell>
                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${sc.cls}`}>
                                  {sc.label}
                                </span>
                              </TableCell>
                              <TableCell>
                                <div className="flex flex-wrap gap-1">
                                  {canPrint && (
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => handlePrint(rpa)}
                                      className="h-8 px-2"
                                    >
                                      <Printer className="h-4 w-4" />
                                    </Button>
                                  )}
                                  {canEdit && status !== 'selesai' && status !== 'ditolak' && status !== 'digunakan' && (
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => handleEdit(rpa)}
                                      className="h-8 px-2"
                                    >
                                      <Edit className="h-4 w-4" />
                                    </Button>
                                  )}
                                  {canDelete && (
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      className="h-8 px-2 text-red-500 border-red-200 hover:bg-red-50"
                                      disabled={isDeleting}
                                      onClick={() => handleDelete(String(rpa.id))}
                                    >
                                      <Trash2 className="h-4 w-4" />
                                    </Button>
                                  )}
                                  {/* Admin-only: Approve / Reject */}
                                  {isAdmin && status === 'diproses' && (
                                    <>
                                      <Button
                                        size="sm"
                                        className="h-8 px-2 bg-green-600 hover:bg-green-700 text-white"
                                        disabled={isApproving}
                                        onClick={() => {
                                          if (confirm(`Setujui RPA ${rpa.rpa_id}? Status alat akan berubah menjadi "Sedang Digunakan".`)) {
                                            approveRPA(rpa.id!);
                                          }
                                        }}
                                      >
                                        <CheckCircle className="h-4 w-4 mr-1" /> Setujui
                                      </Button>
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        className="h-8 px-2 text-red-600 border-red-300 hover:bg-red-50"
                                        disabled={isRejecting}
                                        onClick={() => {
                                          if (confirm(`Tolak RPA ${rpa.rpa_id}?`)) {
                                            rejectRPA(rpa.id!);
                                          }
                                        }}
                                      >
                                        <XCircle className="h-4 w-4 mr-1" /> Tolak
                                      </Button>
                                    </>
                                  )}
                                </div>
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </TableScrollWrapper>
                  <SimplePagination
                    currentPage={currentPage}
                    totalPages={getTotalPages(rpaList.length, pageSize)}
                    onPageChange={setCurrentPage}
                    pageSize={pageSize}
                    onPageSizeChange={(size) => { setPageSize(size); setCurrentPage(1); }}
                    totalItems={rpaList.length}
                  />
                </>
              ) : (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">Belum ada data RPA.</p>
                </div>
              )}

            </CardContent>
          </Card>
        </div>
      ) : (
        <form onSubmit={handleSubmit} id="rpa-form" className="w-full space-y-4">
          <Card>
            <CardHeader className="print:hidden">
              <CardTitle>Form RPA (Rencana Penggunaan Alat)</CardTitle>
              <CardDescription>Isi form berikut untuk menambahkan data RPA baru</CardDescription>
            </CardHeader>
            <CardHeader className="hidden print:block">
              <CardTitle>RENCANA PENGGUNAAN ALAT (RPA)</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="nomorRPA">Nomor RPA</Label>
                  <Input
                    id="nomorRPA"
                    value={nomorRPA}
                    onChange={(e) => setNomorRPA(e.target.value)}
                    placeholder="Masukkan nomor RPA"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="tanggal">Tanggal</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        id="tanggal"
                        type="button"
                        variant="outline"
                        className="w-full justify-start text-left font-normal"
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {tanggal ? format(tanggal, 'PPP') : <span>Pilih tanggal</span>}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={tanggal}
                        onSelect={setTanggal}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="itemPekerjaan">Item Pekerjaan</Label>
                  <Input
                    id="itemPekerjaan"
                    value={itemPekerjaan}
                    onChange={(e) => setItemPekerjaan(e.target.value)}
                    placeholder="Masukkan item pekerjaan"
                    required
                  />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="lokasiProyek">Lokasi Proyek</Label>
                  <Input
                    id="lokasiProyek"
                    value={lokasiProyek}
                    onChange={(e) => setLokasiProyek(e.target.value)}
                    placeholder="Masukkan lokasi proyek"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="mt-4">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Daftar Alat</CardTitle>
              <Button size="sm" onClick={handleOpenAddItem} type="button">
                <Plus className="mr-2 h-4 w-4" /> Tambah Alat
              </Button>
            </CardHeader>
            <CardContent>
              <TableScrollWrapper className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nama Alat & No. Lambung</TableHead>
                      <TableHead>Uraian Pekerjaan</TableHead>
                      <TableHead>Periode</TableHead>
                      <TableHead>Keterangan</TableHead>
                      <TableHead className="w-[100px] text-center">Aksi</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {rpaItems.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                          Belum ada alat yang ditambahkan. Klik "Tambah Alat" untuk menambahkan.
                        </TableCell>
                      </TableRow>
                    ) : (
                      rpaItems.map((item, index) => {
                        const mulaiStr = item.mulaiTanggal ? format(item.mulaiTanggal, 'dd/MM/yyyy') : '-';
                        const selesaiStr = item.selesaiTanggal ? format(item.selesaiTanggal, 'dd/MM/yyyy') : '-';
                        const periodeStr = (mulaiStr === '-' && selesaiStr === '-') ? '-' : `${mulaiStr} s/d ${selesaiStr}`;
                        return (
                          <TableRow key={item.id}>
                            <TableCell className="font-medium">
                              <div>{item.namaAlat}</div>
                              {item.noLambung && (
                                <div className="text-xs text-gray-500 font-normal">No. Lambung: {item.noLambung}</div>
                              )}
                            </TableCell>
                            <TableCell>{item.uraianPekerjaan || '-'}</TableCell>
                            <TableCell>{periodeStr}</TableCell>
                            <TableCell className="max-w-[200px] truncate">{item.keterangan || '-'}</TableCell>
                            <TableCell className="text-center">
                              <div className="flex items-center justify-center space-x-1">
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => handleOpenEditItem(index)}
                                  className="h-8 w-8 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => handleRemoveItem(index)}
                                  className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        );
                      })
                    )}
                  </TableBody>
                </Table>
              </TableScrollWrapper>

              <div className="flex justify-between mt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleOpenAddItem}
                  className="flex items-center gap-2"
                >
                  <Plus className="h-4 w-4" />
                  Tambah Alat
                </Button>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowForm(false)}
                  >
                    Batal
                  </Button>
                  <Button
                    type="submit"
                    disabled={isAdding || isUpdating}
                    className="bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    {isLoading && (
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                    )}
                    {isAdding ? 'Menyimpan...' : isUpdating ? 'Memperbarui...' : 'Simpan'}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </form>
      )}

      {/* Dialog Form Item Alat (Popup) */}
      <Dialog open={showItemDialog} onOpenChange={setShowItemDialog}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingItemIndex !== null ? 'Edit Detail Alat' : 'Tambah Alat ke Daftar'}
            </DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            {/* Nama Alat & No. Lambung menggunakan ComboboxNamaAlat */}
            <div className="grid gap-2">
              <Label>Nama Alat & No. Lambung</Label>
              <ComboboxNamaAlat
                value={itemForm.namaAlat}
                onChange={(val, noLambung) => {
                  setItemForm(prev => ({
                    ...prev,
                    namaAlat: val,
                    noLambung: noLambung || ''
                  }));
                }}
                placeholder="Pilih nama alat..."
                required
              />
              {itemForm.noLambung && (
                <p className="text-xs text-gray-500 mt-1">
                  No. Lambung terpilih: <span className="font-semibold text-gray-700">{itemForm.noLambung}</span>
                </p>
              )}
            </div>

            {/* Uraian Pekerjaan */}
            <div className="grid gap-2">
              <Label htmlFor="item-uraian">Uraian Pekerjaan</Label>
              <Input
                id="item-uraian"
                value={itemForm.uraianPekerjaan}
                onChange={(e) => setItemForm(prev => ({ ...prev, uraianPekerjaan: e.target.value }))}
                placeholder="Contoh: Menggali saluran air..."
              />
            </div>

            {/* Periode Mulai & Selesai */}
            <div className="grid gap-2">
              <Label>Periode Penggunaan</Label>
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <span className="text-xs text-gray-500">Tanggal Mulai</span>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        type="button"
                        variant="outline"
                        className="w-full justify-start text-left font-normal text-xs"
                      >
                        <CalendarIcon className="mr-1.5 h-3.5 w-3.5 text-gray-400" />
                        {itemForm.mulaiTanggal ? format(itemForm.mulaiTanggal, 'dd/MM/yyyy') : 'Mulai'}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={itemForm.mulaiTanggal}
                        onSelect={(date) => setItemForm(prev => ({ ...prev, mulaiTanggal: date }))}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                <div className="space-y-1">
                  <span className="text-xs text-gray-500">Tanggal Selesai</span>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        type="button"
                        variant="outline"
                        className="w-full justify-start text-left font-normal text-xs"
                      >
                        <CalendarIcon className="mr-1.5 h-3.5 w-3.5 text-gray-400" />
                        {itemForm.selesaiTanggal ? format(itemForm.selesaiTanggal, 'dd/MM/yyyy') : 'Selesai'}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={itemForm.selesaiTanggal}
                        onSelect={(date) => setItemForm(prev => ({ ...prev, selesaiTanggal: date }))}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>
            </div>

            {/* Keterangan */}
            <div className="grid gap-2">
              <Label htmlFor="item-keterangan">Keterangan</Label>
              <Input
                id="item-keterangan"
                value={itemForm.keterangan}
                onChange={(e) => setItemForm(prev => ({ ...prev, keterangan: e.target.value }))}
                placeholder="Keterangan tambahan (opsional)"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowItemDialog(false)}
            >
              Batal
            </Button>
            <Button
              type="button"
              onClick={handleSaveItem}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              Simpan Alat
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}


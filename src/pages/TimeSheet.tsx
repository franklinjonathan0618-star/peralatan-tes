import React, { useRef, useState, useCallback, FC, useEffect, useMemo } from 'react';
import * as XLSX from 'xlsx';
// saveAs diimpor secara global oleh file-saver
import { format, parse } from 'date-fns';
import { Trash2 as Trash, FileDown, FileUp, Loader2, Plus, Printer, Edit, Search, Calendar, X } from 'lucide-react';
import { normalizeDateOnly, parseMySQLDate } from '@/utils/dateUtils';

// UI Components
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/components/ui/use-toast";

// Hooks
import { useTimeSheet, useAddTimeSheet, useUpdateTimeSheet, useDeleteTimeSheet } from "@/hooks/useTimeSheet";
import { usePagePermission } from '@/hooks/usePagePermission';
import { SelectAlatTimeSheet } from '@/components/SelectAlatTimeSheet';
import { SimplePagination, paginateData, getTotalPages } from '@/components/ui/SimplePagination';
import { TableScrollWrapper } from '@/components/ui/TableScrollWrapper';

interface TimeSheet {
  id?: string;
  tanggal: string;
  noLambung?: string;
  namaOperator: string;
  namaAlat: string;
  sesi1JamMulai?: string;
  sesi1JamSelesai?: string;
  sesi2JamMulai?: string;
  sesi2JamSelesai?: string;
  sesi3JamMulai?: string;
  sesi3JamSelesai?: string;
  totalJam: number;
  aktivitas: string;
  lokasi: string;
  keterangan?: string;
  bbm?: number;
  oli40?: number;
  oli10?: number;
  oli90?: number;
}

interface TimeSheetFormData {
  tanggal: string;
  noLambung: string;
  namaOperator: string;
  namaAlat: string;
  sesi1JamMulai: string;
  sesi1JamSelesai: string;
  sesi2JamMulai: string;
  sesi2JamSelesai: string;
  sesi3JamMulai: string;
  sesi3JamSelesai: string;
  totalJam: number;
  aktivitas: string;
  lokasi: string;
  keterangan: string;
  bbm: string;
  oli40: string;
  oli10: string;
  oli90: string;
}

// Helper function to convert form data to TimeSheet
export const formDataToTimeSheet = (formData: TimeSheetFormData): TimeSheet => ({
  tanggal: formData.tanggal,
  noLambung: formData.noLambung || undefined,
  namaOperator: formData.namaOperator,
  namaAlat: formData.namaAlat,
  sesi1JamMulai: formData.sesi1JamMulai || undefined,
  sesi1JamSelesai: formData.sesi1JamSelesai || undefined,
  sesi2JamMulai: formData.sesi2JamMulai || undefined,
  sesi2JamSelesai: formData.sesi2JamSelesai || undefined,
  sesi3JamMulai: formData.sesi3JamMulai || undefined,
  sesi3JamSelesai: formData.sesi3JamSelesai || undefined,
  totalJam: formData.totalJam,
  aktivitas: formData.aktivitas,
  lokasi: formData.lokasi,
  keterangan: formData.keterangan || undefined,
  bbm: formData.bbm ? Number(formData.bbm) : undefined,
  oli40: formData.oli40 ? Number(formData.oli40) : undefined,
  oli10: formData.oli10 ? Number(formData.oli10) : undefined,
  oli90: formData.oli90 ? Number(formData.oli90) : undefined
});

const TimeSheet: FC = () => {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isImporting, setIsImporting] = useState(false);
  const { can_create: canCreate, can_edit: canEdit, can_delete: canDelete, can_import: canImport, can_export_excel: canExportExcel, can_print: canPrint } = usePagePermission('timeSheet');
  const canShowActions = canEdit || canDelete;

  // Form state
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Search & Date range filter state
  const [searchTerm, setSearchTerm] = useState('');
  const [tableFilterFrom, setTableFilterFrom] = useState('');
  const [tableFilterTo, setTableFilterTo] = useState('');

  // Export/Print dialog state
  const [exportPrintDialog, setExportPrintDialog] = useState<'export' | 'print' | null>(null);
  const [dialogMode, setDialogMode] = useState<'all' | 'range'>('all');
  const nowD = new Date();
  const firstDayOfMonth = `${nowD.getFullYear()}-${String(nowD.getMonth() + 1).padStart(2, '0')}-01`;
  const lastDayOfMonth = `${nowD.getFullYear()}-${String(nowD.getMonth() + 1).padStart(2, '0')}-${String(new Date(nowD.getFullYear(), nowD.getMonth() + 1, 0).getDate()).padStart(2, '0')}`;
  const [dateFrom, setDateFrom] = useState(firstDayOfMonth);
  const [dateTo, setDateTo] = useState(lastDayOfMonth);

  const [formData, setFormData] = useState<TimeSheetFormData>({
    tanggal: format(new Date(), 'yyyy-MM-dd'),
    noLambung: '',
    namaOperator: '',
    namaAlat: '',
    sesi1JamMulai: '',
    sesi1JamSelesai: '',
    sesi2JamMulai: '',
    sesi2JamSelesai: '',
    sesi3JamMulai: '',
    sesi3JamSelesai: '',
    totalJam: 0,
    aktivitas: '',
    lokasi: '',
    keterangan: '',
    bbm: '',
    oli40: '',
    oli10: '',
    oli90: ''
  });

  // Calculate total hours whenever session times change
  useEffect(() => {
    const sesi1 = calculateTotalHoursForSession(formData.sesi1JamMulai, formData.sesi1JamSelesai);
    const sesi2 = calculateTotalHoursForSession(formData.sesi2JamMulai, formData.sesi2JamSelesai);
    const sesi3 = calculateTotalHoursForSession(formData.sesi3JamMulai, formData.sesi3JamSelesai);
    const total = parseFloat((sesi1 + sesi2 + sesi3).toFixed(2));
    setFormData(prev => ({ ...prev, totalJam: total }));
  }, [
    formData.sesi1JamMulai, formData.sesi1JamSelesai,
    formData.sesi2JamMulai, formData.sesi2JamSelesai,
    formData.sesi3JamMulai, formData.sesi3JamSelesai
  ]);

  // Database hooks
  const { data: timeSheetData = [], refetch } = useTimeSheet();
  const { mutateAsync: addTimeSheet } = useAddTimeSheet();
  const { mutateAsync: updateTimeSheet } = useUpdateTimeSheet();
  const { mutateAsync: deleteTimeSheet } = useDeleteTimeSheet();

  // Filtered data based on search & date range
  const filteredData = useMemo(() => {
    return timeSheetData.filter((entry) => {
      // Text search
      if (searchTerm) {
        const term = searchTerm.toLowerCase();
        const matchesSearch =
          (entry.namaOperator || '').toLowerCase().includes(term) ||
          (entry.namaAlat || '').toLowerCase().includes(term) ||
          (entry.noLambung || '').toLowerCase().includes(term) ||
          (entry.lokasi || '').toLowerCase().includes(term) ||
          (entry.aktivitas || '').toLowerCase().includes(term) ||
          (entry.keterangan || '').toLowerCase().includes(term);
        if (!matchesSearch) return false;
      }
      // Date range filter
      const ds = entry.tanggal || '';
      if (tableFilterFrom && ds && ds < tableFilterFrom) return false;
      if (tableFilterTo && ds && ds > tableFilterTo) return false;
      return true;
    });
  }, [timeSheetData, searchTerm, tableFilterFrom, tableFilterTo]);

  // Function to convert Excel time to string format
  const convertExcelTimeToString = (excelTime: any): string => {
    console.log('Converting Excel time:', excelTime, 'Type:', typeof excelTime);

    // Jika sudah berupa string, cek formatnya
    if (typeof excelTime === 'string') {
      // Jika sudah format HH:MM atau HH:MM:SS, return as is
      if (/^\d{1,2}:\d{2}(:\d{2})?$/.test(excelTime)) {
        return excelTime.length === 5 ? excelTime : excelTime.substring(0, 5);
      }
      return '';
    }

    // Jika berupa number (Excel time serial)
    if (typeof excelTime === 'number') {
      // Excel time adalah fraction dari hari (0.5 = 12:00)
      const totalMinutes = Math.round(excelTime * 24 * 60);
      const hours = Math.floor(totalMinutes / 60);
      const minutes = totalMinutes % 60;

      // Format sebagai HH:MM
      return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
    }

    return '';
  };

  // Function to calculate total hours for a session
  const calculateTotalHoursForSession = (jamMulai: string, jamSelesai: string): number => {
    if (!jamMulai || !jamSelesai) return 0;

    try {
      // Convert to string and handle different time formats
      const startTime = String(jamMulai || '').trim();
      const endTime = String(jamSelesai || '').trim();

      if (!startTime || !endTime) return 0;

      // Parse time strings in HH:MM format
      const parseTime = (timeStr: string) => {
        const [hours, minutes] = timeStr.split(':').map(Number);
        return { hours, minutes };
      };

      const start = parseTime(startTime);
      const end = parseTime(endTime);

      if (isNaN(start.hours) || isNaN(start.minutes) || isNaN(end.hours) || isNaN(end.minutes)) {
        return 0;
      }

      let startTotalMinutes = start.hours * 60 + start.minutes;
      let endTotalMinutes = end.hours * 60 + end.minutes;

      // Handle overnight sessions (if end time is earlier than start time, assume it's the next day)
      if (endTotalMinutes <= startTotalMinutes) {
        endTotalMinutes += 24 * 60; // Add 24 hours in minutes
      }

      const totalMinutes = endTotalMinutes - startTotalMinutes;
      return parseFloat((totalMinutes / 60).toFixed(2)); // Convert to hours with 2 decimal places
    } catch (error) {
      console.error('Error calculating session hours:', error);
      return 0;
    }
  };

  // Function to calculate total hours for all sessions (for external use)
  const calculateAllSessionsTotalHours = (entry: TimeSheet): number => {
    const sesi1 = calculateTotalHoursForSession(entry.sesi1JamMulai || '', entry.sesi1JamSelesai || '');
    const sesi2 = calculateTotalHoursForSession(entry.sesi2JamMulai || '', entry.sesi2JamSelesai || '');
    const sesi3 = calculateTotalHoursForSession(entry.sesi3JamMulai || '', entry.sesi3JamSelesai || '');
    return parseFloat((sesi1 + sesi2 + sesi3).toFixed(2));
  };

  // Function to handle alat change
  const handleAlatChange = (noLambung: string) => {
    setFormData(prev => ({
      ...prev,
      noLambung: noLambung,
    }));
  };

  const handleAlatSelected = (alat: any) => {
    if (alat) {
      setFormData(prev => ({
        ...prev,
        namaAlat: alat.namaAlat,
        noLambung: alat.noLambung,
      }));
    }
  };

  // Function to handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      // Recalculate total hours before submission to ensure accuracy
      const sesi1 = calculateTotalHoursForSession(formData.sesi1JamMulai, formData.sesi1JamSelesai);
      const sesi2 = calculateTotalHoursForSession(formData.sesi2JamMulai, formData.sesi2JamSelesai);
      const sesi3 = calculateTotalHoursForSession(formData.sesi3JamMulai, formData.sesi3JamSelesai);
      const totalJam = parseFloat((sesi1 + sesi2 + sesi3).toFixed(2));

      // Update form data with recalculated total
      const updatedFormData = { ...formData, totalJam };

      if (editingId) {
        // Update existing record
        const tsData = formDataToTimeSheet(updatedFormData);
        await updateTimeSheet({ ...tsData, id: editingId });
        toast({
          title: 'Success',
          description: 'Data timesheet berhasil diperbarui',
        });
      } else {
        // Create new record
        await addTimeSheet(formDataToTimeSheet(updatedFormData));
        toast({
          title: 'Success',
          description: 'Data timesheet berhasil disimpan',
        });
      }

      // Reset form
      resetForm();
      refetch();
    } catch (error) {
      console.error('Error saving timesheet:', error);
      toast({
        title: 'Error',
        description: 'Gagal menyimpan data timesheet',
        variant: 'destructive',
      });
    }
  };

  // Reset form to initial state
  const resetForm = () => {
    setFormData({
      tanggal: format(new Date(), 'yyyy-MM-dd'),
      noLambung: '',
      namaOperator: '',
      namaAlat: '',
      sesi1JamMulai: '',
      sesi1JamSelesai: '',
      sesi2JamMulai: '',
      sesi2JamSelesai: '',
      sesi3JamMulai: '',
      sesi3JamSelesai: '',
      totalJam: 0,
      aktivitas: '',
      lokasi: '',
      keterangan: '',
      bbm: '',
      oli40: '',
      oli10: '',
      oli90: ''
    });
    setEditingId(null);
  };

  // Function to handle delete timesheet
  const handleDelete = async (id: string) => {
    if (window.confirm('Apakah Anda yakin ingin menghapus data ini?')) {
      try {
        await deleteTimeSheet(id);
        toast({
          title: 'Success',
          description: 'Data timesheet berhasil dihapus',
        });
        refetch();
      } catch (error) {
        console.error('Error deleting timesheet:', error);
        toast({
          title: 'Error',
          description: 'Gagal menghapus data timesheet',
          variant: 'destructive',
        });
      }
    }
  };

  const handleEdit = (entry: TimeSheet) => {
    if (!entry.id) return;

    // Recalculate total hours in case it needs to be updated
    const totalJam = calculateAllSessionsTotalHours(entry);

    setEditingId(entry.id);
    // Pastikan tanggal selalu dalam format YYYY-MM-DD untuk input[type="date"]
    const tanggalForForm = normalizeDateOnly(entry.tanggal);
    setFormData({
      tanggal: tanggalForForm,
      noLambung: entry.noLambung || '',
      namaOperator: entry.namaOperator,
      namaAlat: entry.namaAlat,
      sesi1JamMulai: entry.sesi1JamMulai || '',
      sesi1JamSelesai: entry.sesi1JamSelesai || '',
      sesi2JamMulai: entry.sesi2JamMulai || '',
      sesi2JamSelesai: entry.sesi2JamSelesai || '',
      sesi3JamMulai: entry.sesi3JamMulai || '',
      sesi3JamSelesai: entry.sesi3JamSelesai || '',
      totalJam: totalJam,
      aktivitas: entry.aktivitas,
      lokasi: entry.lokasi,
      keterangan: entry.keterangan || '',
      bbm: entry.bbm?.toString() || '0',
      oli40: entry.oli40?.toString() || '0',
      oli10: entry.oli10?.toString() || '0',
      oli90: entry.oli90?.toString() || '0',
    });

    // Scroll to form — use setTimeout to wait for re-render if form was hidden
    setTimeout(() => {
      const formElement = document.getElementById('timeSheetForm');
      if (formElement) {
        formElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
      } else {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    }, 50);
  };

  // Safe date formatter — handles YYYY-MM-DD, ISO datetime, dd/MM/yyyy
  const safeFormatDate = (tanggal: string | undefined | null): string => {
    if (!tanggal) return '-';
    // Jika sudah format dd/MM/yyyy, kembalikan langsung
    if (/^\d{2}\/\d{2}\/\d{4}$/.test(tanggal)) return tanggal;

    const d = parseMySQLDate(tanggal);
    if (d && !isNaN(d.getTime())) {
      return format(d, 'dd/MM/yyyy');
    }
    return tanggal;
  };

  // Function to convert Excel date to a valid date string
  const convertExcelDate = (excelDate: any): string => {
    let tanggalParsed: Date | null = null;
    if (excelDate instanceof Date && !isNaN(excelDate.getTime())) {
      tanggalParsed = excelDate;
    } else if (typeof excelDate === 'number') {
      const excelEpoch = Date.UTC(1899, 11, 30);
      const jsDate = new Date(excelEpoch + excelDate * 24 * 60 * 60 * 1000);
      if (!isNaN(jsDate.getTime())) tanggalParsed = jsDate;
    } else if (typeof excelDate === 'string') {
      const tryParseDate = (ds: string, fmt: string) => {
        try { const p = parse(ds, fmt, new Date()); if (!isNaN(p.getTime())) return p; } catch (e) { } return null;
      };
      const ts = String(excelDate).trim();
      // Coba semua format yang umum, termasuk dd-MM-yyyy dan dd/MM/yyyy
      tanggalParsed =
        tryParseDate(ts, 'yyyy-MM-dd') ||
        tryParseDate(ts, 'dd/MM/yyyy') ||
        tryParseDate(ts, 'dd-MM-yyyy') ||
        tryParseDate(ts, 'MM/dd/yyyy') ||
        tryParseDate(ts, 'yyyy/MM/dd');
      if (!tanggalParsed && ts) {
        const d = new Date(ts);
        if (!isNaN(d.getTime())) tanggalParsed = d;
      }
    }

    if (tanggalParsed) {
      return normalizeDateOnly(tanggalParsed);
    }
    return '';
  };

  // Function to handle file selection for import
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleImportExcel(file);
    }
    // Reset file input
    if (e.target) {
      e.target.value = '';
    }
  };

  // Function to handle import Excel
  const handleImportExcel = useCallback(async (file: File) => {
    setIsImporting(true);
    try {
      const reader = new FileReader();
      reader.onload = async (e) => {
        try {
          const data = e.target?.result;
          if (data) {
            const workbook = XLSX.read(data, { type: 'array' });
            const sheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[sheetName];
            const json = XLSX.utils.sheet_to_json(worksheet, { defval: '' });

            console.log('Raw Excel data:', json);

            let successCount = 0;
            let errorCount = 0;
            const errors: string[] = [];

            // Process the imported data row by row
            for (let i = 0; i < json.length; i++) {
              const item: any = json[i];
              try {
                console.log(`Processing row ${i + 1}:`, item);

                // Convert and validate data
                const convertedData = {
                  tanggal: convertExcelDate(item.Tanggal || item['Tanggal'] || item.tanggal),
                  noLambung: String(item['No Lambung'] || item.noLambung || item['Nomor Lambung'] || '').trim(),
                  namaOperator: String(item['Nama Operator'] || item.namaOperator || item['Operator'] || '').trim(),
                  namaAlat: String(item['Nama Alat'] || item.namaAlat || item['Alat'] || '').trim(),
                  sesi1JamMulai: convertExcelTimeToString(item['Sesi 1 Mulai'] || item.sesi1JamMulai || ''),
                  sesi1JamSelesai: convertExcelTimeToString(item['Sesi 1 Selesai'] || item.sesi1JamSelesai || ''),
                  sesi2JamMulai: convertExcelTimeToString(item['Sesi 2 Mulai'] || item.sesi2JamMulai || ''),
                  sesi2JamSelesai: convertExcelTimeToString(item['Sesi 2 Selesai'] || item.sesi2JamSelesai || ''),
                  sesi3JamMulai: convertExcelTimeToString(item['Sesi 3 Mulai'] || item.sesi3JamMulai || ''),
                  sesi3JamSelesai: convertExcelTimeToString(item['Sesi 3 Selesai'] || item.sesi3JamSelesai || ''),
                  totalJam: Number(item['Total Jam'] || item.totalJam || 0),
                  aktivitas: String(item.Aktivitas || item.aktivitas || '').trim(),
                  lokasi: String(item.Lokasi || item.lokasi || '').trim(),
                  keterangan: String(item.Keterangan || item.keterangan || '').trim(),
                  bbm: item['BBM (L)'] || item.bbm || '',
                  oli40: item['Oli 40 (L)'] || item.oli40 || '',
                  oli10: item['Oli 10 (L)'] || item.oli10 || '',
                  oli90: item['Oli 90 (L)'] || item.oli90 || '',
                };

                console.log(`Converted data for row ${i + 1}:`, convertedData);

                // Validate required fields
                if (!convertedData.tanggal) {
                  throw new Error(`Tanggal tidak valid: ${item.Tanggal || item.tanggal || ''}`);
                }
                if (!convertedData.namaOperator) {
                  throw new Error('Nama operator tidak boleh kosong');
                }
                if (!convertedData.namaAlat) {
                  throw new Error('Nama alat tidak boleh kosong');
                }
                if (!convertedData.aktivitas) {
                  throw new Error('Aktivitas tidak boleh kosong');
                }
                if (!convertedData.lokasi) {
                  throw new Error('Lokasi tidak boleh kosong');
                }

                // Add the data to the database
                await addTimeSheet(formDataToTimeSheet(convertedData));
                successCount++;
                console.log(`Row ${i + 1} berhasil diimpor`);

              } catch (error: any) {
                errorCount++;
                const errorMsg = `Baris ${i + 2}: ${error?.message || 'Error tidak diketahui'}`;
                errors.push(errorMsg);
                console.error(`Error processing row ${i + 2}:`, error);
              }
            }

            if (successCount > 0 && errorCount > 0) {
              toast({
                title: 'Impor Selesai Sebagian',
                description: (
                  <div>
                    <p>Berhasil: {successCount} transaksi.</p>
                    <p>Gagal: {errorCount} transaksi.</p>
                    {errors.length > 0 && (
                      <details className="mt-2 text-xs text-red-600">
                        <summary className="cursor-pointer font-semibold">Lihat detail error</summary>
                        <ul className="list-disc pl-4 mt-1">
                          {errors.slice(0, 10).map((err, i) => <li key={i}>{err}</li>)}
                          {errors.length > 10 && <li>Dan {errors.length - 10} kesalahan lainnya...</li>}
                        </ul>
                      </details>
                    )}
                  </div>
                ) as any,
                duration: 15000,
              });
            } else if (successCount > 0) {
              toast({
                title: 'Import Berhasil',
                description: `Berhasil mengimpor ${successCount} transaksi.`,
              });
            } else if (errorCount > 0) {
              toast({
                title: 'Import Gagal',
                description: (
                  <div>
                    <p>Terdapat {errorCount} kesalahan.</p>
                    {errors.length > 0 && (
                      <details className="mt-2 text-xs text-red-600">
                        <summary className="cursor-pointer font-semibold">Lihat detail error</summary>
                        <ul className="list-disc pl-4 mt-1">
                          {errors.slice(0, 10).map((err, i) => <li key={i}>{err}</li>)}
                          {errors.length > 10 && <li>Dan {errors.length - 10} kesalahan lainnya...</li>}
                        </ul>
                      </details>
                    )}
                  </div>
                ) as any,
                variant: 'destructive',
                duration: 15000,
              });
            }

            if (errors.length > 0) {
              console.log('Import errors:', errors);
            }

            if (successCount > 0) {
              refetch();
            }
          }
        } catch (error) {
          console.error('Error processing Excel file:', error);
          toast({
            title: 'Error',
            description: 'Gagal memproses file Excel',
            variant: 'destructive',
          });
        }
      };
      reader.readAsArrayBuffer(file);
    } catch (error) {
      console.error('Error reading file:', error);
      toast({
        title: 'Error',
        description: 'Gagal membaca file',
        variant: 'destructive',
      });
    } finally {
      setIsImporting(false);
    }
  }, [addTimeSheet, toast, refetch]);

  // Function to export data to Excel (accepts data array)
  const doExportExcel = (data: TimeSheet[]) => {
    if (data.length === 0) { toast({ title: 'Info', description: 'Tidak ada data untuk diekspor' }); return; }
    try {
      const exportData = data.map((item, index) => ({
        'No': index + 1,
        'Tanggal': item.tanggal ? safeFormatDate(item.tanggal) : '',
        'No Lambung': item.noLambung || '',
        'Nama Operator': item.namaOperator,
        'Nama Alat': item.namaAlat,
        'Sesi 1 Mulai': item.sesi1JamMulai || '',
        'Sesi 1 Selesai': item.sesi1JamSelesai || '',
        'Sesi 2 Mulai': item.sesi2JamMulai || '',
        'Sesi 2 Selesai': item.sesi2JamSelesai || '',
        'Sesi 3 Mulai': item.sesi3JamMulai || '',
        'Sesi 3 Selesai': item.sesi3JamSelesai || '',
        'Total Jam': item.totalJam,
        'Aktivitas': item.aktivitas,
        'Lokasi': item.lokasi,
        'Keterangan': item.keterangan || '',
        'BBM (L)': item.bbm || '0',
        'Oli 40 (L)': item.oli40 || '0',
        'Oli 10 (L)': item.oli10 || '0',
        'Oli 90 (L)': item.oli90 || '0',
      }));

      const worksheet = XLSX.utils.json_to_sheet(exportData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'TimeSheet');
      const suffix = dialogMode === 'range' && dateFrom && dateTo ? `_${dateFrom}_sd_${dateTo}` : '';
      XLSX.writeFile(workbook, `TimeSheet${suffix}_${format(new Date(), 'yyyyMMdd_HHmmss')}.xlsx`);

      toast({ title: 'Success', description: `Berhasil mengekspor ${data.length} data ke Excel.` });
    } catch (error) {
      console.error('Error exporting to Excel:', error);
      toast({ title: 'Error', description: 'Gagal mengekspor data ke Excel', variant: 'destructive' });
    }
  };

  // Print with data array
  const doPrintTimeSheet = (data: TimeSheet[], periodeLabel: string) => {
    if (data.length === 0) { toast({ title: 'Info', description: 'Tidak ada data untuk dicetak' }); return; }
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const term = searchTerm.trim().toLowerCase();

    // Tentukan grouping berdasarkan search term
    let groupBy: 'namaAlat' | 'namaOperator' | null = null;

    if (term) {
      const matchesOperator = data.every(item => (item.namaOperator || '').toLowerCase().includes(term));
      const matchesAlat = data.every(item => (item.namaAlat || '').toLowerCase().includes(term) || (item.noLambung || '').toLowerCase().includes(term));

      if (matchesOperator && !matchesAlat) {
        groupBy = 'namaAlat';
      } else if (matchesAlat && !matchesOperator) {
        groupBy = 'namaOperator';
      } else {
        const uniqueOperators = new Set(data.map(item => item.namaOperator.trim().toLowerCase())).size;
        const uniqueAlat = new Set(data.map(item => item.namaAlat.trim().toLowerCase())).size;

        if (uniqueOperators === 1 && uniqueAlat > 1) {
          groupBy = 'namaAlat';
        } else if (uniqueAlat === 1 && uniqueOperators > 1) {
          groupBy = 'namaOperator';
        }
      }
    } else {
      const uniqueOperators = new Set(data.map(item => item.namaOperator.trim().toLowerCase())).size;
      const uniqueAlat = new Set(data.map(item => item.namaAlat.trim().toLowerCase())).size;

      if (uniqueOperators === 1 && uniqueAlat > 1) {
        groupBy = 'namaAlat';
      } else if (uniqueAlat === 1 && uniqueOperators > 1) {
        groupBy = 'namaOperator';
      }
    }

    let tablesHtml = '';

    if (groupBy === 'namaAlat') {
      // Group by namaAlat
      const groups: Record<string, TimeSheet[]> = {};
      data.forEach(item => {
        const key = `${item.namaAlat} (${item.noLambung || '-'})`;
        if (!groups[key]) groups[key] = [];
        groups[key].push(item);
      });

      Object.entries(groups).forEach(([groupName, groupItems]) => {
        const groupRows = groupItems.map((item, idx) => `
          <tr>
            <td style="border:1px solid #000;padding:4px;text-align:center">${idx + 1}</td>
            <td style="border:1px solid #000;padding:4px">${safeFormatDate(item.tanggal)}</td>
            <td style="border:1px solid #000;padding:4px">${item.noLambung || '-'}</td>
            <td style="border:1px solid #000;padding:4px">${item.namaOperator}</td>
            <td style="border:1px solid #000;padding:4px">${item.namaAlat}</td>
            <td style="border:1px solid #000;padding:4px">${item.sesi1JamMulai || ''}-${item.sesi1JamSelesai || ''}</td>
            <td style="border:1px solid #000;padding:4px">${item.sesi2JamMulai || ''}-${item.sesi2JamSelesai || ''}</td>
            <td style="border:1px solid #000;padding:4px">${item.sesi3JamMulai || ''}-${item.sesi3JamSelesai || ''}</td>
            <td style="border:1px solid #000;padding:4px;text-align:center">${item.totalJam}</td>
            <td style="border:1px solid #000;padding:4px">${item.aktivitas}</td>
            <td style="border:1px solid #000;padding:4px">${item.lokasi}</td>
            <td style="border:1px solid #000;padding:4px">${item.keterangan || '-'}</td>
            <td style="border:1px solid #000;padding:4px;text-align:center">${item.bbm || '0'}</td>
            <td style="border:1px solid #000;padding:4px;text-align:center">${item.oli40 || '0'}</td>
            <td style="border:1px solid #000;padding:4px;text-align:center">${item.oli10 || '0'}</td>
            <td style="border:1px solid #000;padding:4px;text-align:center">${item.oli90 || '0'}</td>
          </tr>
        `).join('');

        const totalHours = groupItems.reduce((sum, item) => sum + (item.totalJam || 0), 0);
        const totalBbm = groupItems.reduce((sum, item) => sum + Number(item.bbm || 0), 0);
        const totalOli40 = groupItems.reduce((sum, item) => sum + Number(item.oli40 || 0), 0);
        const totalOli10 = groupItems.reduce((sum, item) => sum + Number(item.oli10 || 0), 0);
        const totalOli90 = groupItems.reduce((sum, item) => sum + Number(item.oli90 || 0), 0);

        tablesHtml += `
          <div class="group-section" style="margin-bottom: 30px; page-break-inside: avoid;">
            <h3 style="font-size: 13px; color: #1e3a8a; margin-top: 15px; margin-bottom: 8px; border-bottom: 2px solid #1e3a8a; padding-bottom: 4px;">
              Alat: ${groupName}
            </h3>
            <table>
              <thead>
                <tr>
                  <th>No</th><th>Tanggal</th><th>No Lambung</th><th>Operator</th><th>Alat</th>
                  <th>Sesi 1</th><th>Sesi 2</th><th>Sesi 3</th><th>Total Jam</th>
                  <th>Aktivitas</th><th>Lokasi</th><th>Keterangan</th>
                  <th>BBM</th><th>Oli 40</th><th>Oli 10</th><th>Oli 90</th>
                </tr>
              </thead>
              <tbody>
                ${groupRows}
              </tbody>
              <tfoot>
                <tr style="font-weight: bold; background-color: #f7fafc;">
                  <td colspan="8" style="border:1px solid #000;padding:4px;text-align:right">Total:</td>
                  <td style="border:1px solid #000;padding:4px;text-align:center">${totalHours} Jam</td>
                  <td colspan="3" style="border:1px solid #000;padding:4px"></td>
                  <td style="border:1px solid #000;padding:4px;text-align:center">${totalBbm}</td>
                  <td style="border:1px solid #000;padding:4px;text-align:center">${totalOli40}</td>
                  <td style="border:1px solid #000;padding:4px;text-align:center">${totalOli10}</td>
                  <td style="border:1px solid #000;padding:4px;text-align:center">${totalOli90}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        `;
      });
    } else if (groupBy === 'namaOperator') {
      // Group by namaOperator
      const groups: Record<string, TimeSheet[]> = {};
      data.forEach(item => {
        const key = item.namaOperator;
        if (!groups[key]) groups[key] = [];
        groups[key].push(item);
      });

      Object.entries(groups).forEach(([groupName, groupItems]) => {
        const groupRows = groupItems.map((item, idx) => `
          <tr>
            <td style="border:1px solid #000;padding:4px;text-align:center">${idx + 1}</td>
            <td style="border:1px solid #000;padding:4px">${safeFormatDate(item.tanggal)}</td>
            <td style="border:1px solid #000;padding:4px">${item.noLambung || '-'}</td>
            <td style="border:1px solid #000;padding:4px">${item.namaOperator}</td>
            <td style="border:1px solid #000;padding:4px">${item.namaAlat}</td>
            <td style="border:1px solid #000;padding:4px">${item.sesi1JamMulai || ''}-${item.sesi1JamSelesai || ''}</td>
            <td style="border:1px solid #000;padding:4px">${item.sesi2JamMulai || ''}-${item.sesi2JamSelesai || ''}</td>
            <td style="border:1px solid #000;padding:4px">${item.sesi3JamMulai || ''}-${item.sesi3JamSelesai || ''}</td>
            <td style="border:1px solid #000;padding:4px;text-align:center">${item.totalJam}</td>
            <td style="border:1px solid #000;padding:4px">${item.aktivitas}</td>
            <td style="border:1px solid #000;padding:4px">${item.lokasi}</td>
            <td style="border:1px solid #000;padding:4px">${item.keterangan || '-'}</td>
            <td style="border:1px solid #000;padding:4px;text-align:center">${item.bbm || '0'}</td>
            <td style="border:1px solid #000;padding:4px;text-align:center">${item.oli40 || '0'}</td>
            <td style="border:1px solid #000;padding:4px;text-align:center">${item.oli10 || '0'}</td>
            <td style="border:1px solid #000;padding:4px;text-align:center">${item.oli90 || '0'}</td>
          </tr>
        `).join('');

        const totalHours = groupItems.reduce((sum, item) => sum + (item.totalJam || 0), 0);
        const totalBbm = groupItems.reduce((sum, item) => sum + Number(item.bbm || 0), 0);
        const totalOli40 = groupItems.reduce((sum, item) => sum + Number(item.oli40 || 0), 0);
        const totalOli10 = groupItems.reduce((sum, item) => sum + Number(item.oli10 || 0), 0);
        const totalOli90 = groupItems.reduce((sum, item) => sum + Number(item.oli90 || 0), 0);

        tablesHtml += `
          <div class="group-section" style="margin-bottom: 30px; page-break-inside: avoid;">
            <h3 style="font-size: 13px; color: #1e3a8a; margin-top: 15px; margin-bottom: 8px; border-bottom: 2px solid #1e3a8a; padding-bottom: 4px;">
              Operator: ${groupName}
            </h3>
            <table>
              <thead>
                <tr>
                  <th>No</th><th>Tanggal</th><th>No Lambung</th><th>Operator</th><th>Alat</th>
                  <th>Sesi 1</th><th>Sesi 2</th><th>Sesi 3</th><th>Total Jam</th>
                  <th>Aktivitas</th><th>Lokasi</th><th>Keterangan</th>
                  <th>BBM</th><th>Oli 40</th><th>Oli 10</th><th>Oli 90</th>
                </tr>
              </thead>
              <tbody>
                ${groupRows}
              </tbody>
              <tfoot>
                <tr style="font-weight: bold; background-color: #f7fafc;">
                  <td colspan="8" style="border:1px solid #000;padding:4px;text-align:right">Total:</td>
                  <td style="border:1px solid #000;padding:4px;text-align:center">${totalHours} Jam</td>
                  <td colspan="3" style="border:1px solid #000;padding:4px"></td>
                  <td style="border:1px solid #000;padding:4px;text-align:center">${totalBbm}</td>
                  <td style="border:1px solid #000;padding:4px;text-align:center">${totalOli40}</td>
                  <td style="border:1px solid #000;padding:4px;text-align:center">${totalOli10}</td>
                  <td style="border:1px solid #000;padding:4px;text-align:center">${totalOli90}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        `;
      });
    } else {
      // No grouping (Default single table)
      const rows = data.map((item, idx) => `
        <tr>
          <td style="border:1px solid #000;padding:4px;text-align:center">${idx + 1}</td>
          <td style="border:1px solid #000;padding:4px">${safeFormatDate(item.tanggal)}</td>
          <td style="border:1px solid #000;padding:4px">${item.noLambung || '-'}</td>
          <td style="border:1px solid #000;padding:4px">${item.namaOperator}</td>
          <td style="border:1px solid #000;padding:4px">${item.namaAlat}</td>
          <td style="border:1px solid #000;padding:4px">${item.sesi1JamMulai || ''}-${item.sesi1JamSelesai || ''}</td>
          <td style="border:1px solid #000;padding:4px">${item.sesi2JamMulai || ''}-${item.sesi2JamSelesai || ''}</td>
          <td style="border:1px solid #000;padding:4px">${item.sesi3JamMulai || ''}-${item.sesi3JamSelesai || ''}</td>
          <td style="border:1px solid #000;padding:4px;text-align:center">${item.totalJam}</td>
          <td style="border:1px solid #000;padding:4px">${item.aktivitas}</td>
          <td style="border:1px solid #000;padding:4px">${item.lokasi}</td>
          <td style="border:1px solid #000;padding:4px">${item.keterangan || '-'}</td>
          <td style="border:1px solid #000;padding:4px;text-align:center">${item.bbm || '0'}</td>
          <td style="border:1px solid #000;padding:4px;text-align:center">${item.oli40 || '0'}</td>
          <td style="border:1px solid #000;padding:4px;text-align:center">${item.oli10 || '0'}</td>
          <td style="border:1px solid #000;padding:4px;text-align:center">${item.oli90 || '0'}</td>
        </tr>
      `).join('');

      tablesHtml = `
        <table>
          <thead>
            <tr>
              <th>No</th><th>Tanggal</th><th>No Lambung</th><th>Operator</th><th>Alat</th>
              <th>Sesi 1</th><th>Sesi 2</th><th>Sesi 3</th><th>Total Jam</th>
              <th>Aktivitas</th><th>Lokasi</th><th>Keterangan</th>
              <th>BBM</th><th>Oli 40</th><th>Oli 10</th><th>Oli 90</th>
            </tr>
          </thead>
          <tbody>
            ${rows}
          </tbody>
        </table>
      `;
    }

    printWindow.document.write(`
      <!DOCTYPE html><html><head><title>Print Time Sheet</title>
      <style>
        @page { size: landscape; margin: 1cm; }
        body { font-family: Arial, sans-serif; padding: 20px; font-size: 11px; }
        .header { border-bottom: 2px solid #000; padding-bottom: 10px; margin-bottom: 20px; }
        .company-name { font-weight: bold; font-size: 14px; }
        .company-division { font-size: 12px; }
        h1 { text-align: center; font-size: 18px; margin-bottom: 5px; }
        .print-date { text-align: center; color: #666; margin-bottom: 5px; font-size: 11px; }
        .print-periode { text-align: center; font-weight: bold; margin-bottom: 16px; font-size: 13px; }
        table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
        th { background-color: #f0f0f0; font-weight: bold; border: 1px solid #000; padding: 4px; text-align: center; }
        td { border: 1px solid #000; padding: 4px; }
      </style></head><body>
        <div class="header"><div class="company-name">Cabang Papua</div><div class="company-division">Peralatan</div></div>
        <h1>TIME SHEET ALAT BERAT</h1>
        ${periodeLabel ? `<div class="print-periode">${periodeLabel}</div>` : ''}
        <div class="print-date">Dicetak pada: ${new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</div>
        
        ${tablesHtml}
        
        <script>window.onload=function(){setTimeout(function(){window.print();window.onafterprint=function(){window.close();};},500);};</script>
      </body></html>
    `);
    printWindow.document.close();
  };

  // Dialog confirm handler
  const handleDialogConfirm = () => {
    let data = filteredData;
    let periodeLabel = '';
    if (dialogMode === 'range') {
      data = filteredData.filter((i) => {
        const ds = i.tanggal || '';
        if (dateFrom && ds < dateFrom) return false;
        if (dateTo && ds > dateTo) return false;
        return true;
      });
      const fromD = parseMySQLDate(dateFrom);
      const toD = parseMySQLDate(dateTo);
      periodeLabel = `Periode: ${fromD ? fromD.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }) : ''} \u2014 ${toD ? toD.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }) : ''}`;
    }
    if (exportPrintDialog === 'export') {
      doExportExcel(data);
    } else if (exportPrintDialog === 'print') {
      doPrintTimeSheet(data, periodeLabel);
    }
    setExportPrintDialog(null);
  };

  return (
    <div className="container mx-auto py-8">
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <CardTitle>Time Sheet Alat Berat</CardTitle>
            <div className="grid grid-cols-1 sm:flex sm:flex-wrap gap-2 w-full sm:w-auto">
              {canImport && (
                <Button
                  variant="outline"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isImporting}
                  className="flex items-center justify-center gap-2 text-xs sm:text-sm px-3 py-2 sm:px-4 sm:py-2 w-full sm:w-auto"
                >
                  {isImporting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Importing...
                    </>
                  ) : (
                    <>
                      <FileUp className="mr-2 h-4 w-4" />
                      Import Excel
                    </>
                  )}
                </Button>
              )}
              {canExportExcel && (
                <Button variant="outline" size="sm" onClick={() => { setDialogMode('all'); setExportPrintDialog('export'); }} className="flex items-center justify-center gap-2 text-xs sm:text-sm px-3 py-2 sm:px-4 sm:py-2 w-full sm:w-auto">
                  <FileDown className="mr-2 h-4 w-4" />
                  Export Excel
                </Button>
              )}
              {canPrint && (
                <Button variant="outline" size="sm" onClick={() => { setDialogMode('all'); setExportPrintDialog('print'); }} className="flex items-center justify-center gap-2 text-xs sm:text-sm px-3 py-2 sm:px-4 sm:py-2 w-full sm:w-auto">
                  <Printer className="mr-2 h-4 w-4" />
                  Cetak
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept=".xlsx,.xls"
            style={{ display: 'none' }}
          />

          {(canCreate || (canEdit && editingId)) && (
            <form onSubmit={handleSubmit} className="space-y-4 mb-8" id="timeSheetForm">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="tanggal">Tanggal</Label>
                  <Input
                    type="date"
                    id="tanggal"
                    value={formData.tanggal}
                    onChange={(e) => setFormData({ ...formData, tanggal: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="namaAlat">Nama Alat</Label>
                  <SelectAlatTimeSheet
                    id="namaAlat"
                    value={formData.noLambung}
                    onChange={handleAlatChange}
                    onAlatSelected={handleAlatSelected}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="noLambungSelect">No Lambung</Label>
                  <SelectAlatTimeSheet
                    id="noLambungSelect"
                    value={formData.noLambung}
                    onChange={handleAlatChange}
                    onAlatSelected={handleAlatSelected}
                  />
                </div>
                <div>
                  <Label htmlFor="namaOperator">Nama Operator</Label>
                  <Input
                    id="namaOperator"
                    value={formData.namaOperator}
                    onChange={(e) => setFormData({ ...formData, namaOperator: e.target.value })}
                    placeholder="Nama operator"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 border p-4 rounded-md bg-gray-50/50">
                <div className="space-y-2">
                  <Label className="font-semibold text-blue-700">Sesi 1</Label>
                  <div className="flex gap-2">
                    <div className="flex-1">
                      <Label htmlFor="sesi1JamMulai" className="text-xs">Mulai</Label>
                      <Input
                        type="time"
                        id="sesi1JamMulai"
                        value={formData.sesi1JamMulai}
                        onChange={(e) => setFormData({ ...formData, sesi1JamMulai: e.target.value })}
                      />
                    </div>
                    <div className="flex-1">
                      <Label htmlFor="sesi1JamSelesai" className="text-xs">Selesai</Label>
                      <Input
                        type="time"
                        id="sesi1JamSelesai"
                        value={formData.sesi1JamSelesai}
                        onChange={(e) => setFormData({ ...formData, sesi1JamSelesai: e.target.value })}
                      />
                    </div>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="font-semibold text-blue-700">Sesi 2</Label>
                  <div className="flex gap-2">
                    <div className="flex-1">
                      <Label htmlFor="sesi2JamMulai" className="text-xs">Mulai</Label>
                      <Input
                        type="time"
                        id="sesi2JamMulai"
                        value={formData.sesi2JamMulai}
                        onChange={(e) => setFormData({ ...formData, sesi2JamMulai: e.target.value })}
                      />
                    </div>
                    <div className="flex-1">
                      <Label htmlFor="sesi2JamSelesai" className="text-xs">Selesai</Label>
                      <Input
                        type="time"
                        id="sesi2JamSelesai"
                        value={formData.sesi2JamSelesai}
                        onChange={(e) => setFormData({ ...formData, sesi2JamSelesai: e.target.value })}
                      />
                    </div>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="font-semibold text-blue-700">Sesi 3</Label>
                  <div className="flex gap-2">
                    <div className="flex-1">
                      <Label htmlFor="sesi3JamMulai" className="text-xs">Mulai</Label>
                      <Input
                        type="time"
                        id="sesi3JamMulai"
                        value={formData.sesi3JamMulai}
                        onChange={(e) => setFormData({ ...formData, sesi3JamMulai: e.target.value })}
                      />
                    </div>
                    <div className="flex-1">
                      <Label htmlFor="sesi3JamSelesai" className="text-xs">Selesai</Label>
                      <Input
                        type="time"
                        id="sesi3JamSelesai"
                        value={formData.sesi3JamSelesai}
                        onChange={(e) => setFormData({ ...formData, sesi3JamSelesai: e.target.value })}
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="totalJam">Total Jam</Label>
                  <Input
                    type="number"
                    id="totalJam"
                    value={formData.totalJam}
                    readOnly
                    className="bg-gray-100 font-bold text-blue-700"
                  />
                </div>
                <div>
                  <Label htmlFor="aktivitas">Aktivitas</Label>
                  <Input
                    id="aktivitas"
                    value={formData.aktivitas}
                    onChange={(e) => setFormData({ ...formData, aktivitas: e.target.value })}
                    placeholder="Jenis aktivitas"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="lokasi">Lokasi</Label>
                  <Input
                    id="lokasi"
                    value={formData.lokasi}
                    onChange={(e) => setFormData({ ...formData, lokasi: e.target.value })}
                    placeholder="Lokasi kerja"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="keterangan">Keterangan</Label>
                  <Input
                    id="keterangan"
                    value={formData.keterangan}
                    onChange={(e) => setFormData({ ...formData, keterangan: e.target.value })}
                    placeholder="Catatan tambahan"
                  />
                </div>
              </div>

              <div className="grid grid-cols-4 gap-4">
                <div>
                  <Label htmlFor="bbm">BBM (L)</Label>
                  <Input
                    type="number"
                    id="bbm"
                    value={formData.bbm}
                    onChange={(e) => setFormData({ ...formData, bbm: e.target.value })}
                    placeholder="BBM (Liter)"
                  />
                </div>
                <div>
                  <Label htmlFor="oli40">Oli 40 (L)</Label>
                  <Input
                    type="number"
                    id="oli40"
                    value={formData.oli40}
                    onChange={(e) => setFormData({ ...formData, oli40: e.target.value })}
                    placeholder="Oli 40"
                  />
                </div>
                <div>
                  <Label htmlFor="oli10">Oli 10 (L)</Label>
                  <Input
                    type="number"
                    id="oli10"
                    value={formData.oli10}
                    onChange={(e) => setFormData({ ...formData, oli10: e.target.value })}
                    placeholder="Oli 10"
                  />
                </div>
                <div>
                  <Label htmlFor="oli90">Oli 90 (L)</Label>
                  <Input
                    type="number"
                    id="oli90"
                    value={formData.oli90}
                    onChange={(e) => setFormData({ ...formData, oli90: e.target.value })}
                    placeholder="Oli 90"
                  />
                </div>
              </div>

              <div className="flex gap-2">
                <Button type="submit" className="flex-1">
                  {editingId ? (
                    <><Edit className="w-4 h-4 mr-2" />Update Data</>
                  ) : (
                    <><Plus className="w-4 h-4 mr-2" />Simpan Data</>
                  )}
                </Button>
                {editingId && (
                  <Button type="button" variant="outline" onClick={resetForm}>
                    Batal
                  </Button>
                )}
              </div>
            </form>
          )}

          {/* ── Search & Date Range Filter ────────────────── */}
          <div className="flex flex-col md:flex-row items-start md:items-center gap-3 mt-8 mb-4">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
              <Input
                placeholder="Cari operator, alat, lokasi, no lambung..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1);
                }}
                className="pl-10"
              />
            </div>
            <div className="flex flex-col sm:flex-row sm:items-center gap-2 w-full max-w-md bg-white border rounded-lg p-2 text-sm">
              <div className="flex items-center gap-2 w-full">
                <Calendar size={16} className="text-gray-400 flex-shrink-0" />
                <input
                  type="date"
                  value={tableFilterFrom}
                  onChange={(e) => setTableFilterFrom(e.target.value)}
                  className="border-0 bg-transparent focus:ring-0 text-sm p-0 w-full"
                />
              </div>
              <span className="text-gray-400 self-center hidden sm:inline">—</span>
              <div className="flex items-center gap-2 w-full border-t sm:border-t-0 pt-2 sm:pt-0">
                <span className="text-gray-400 sm:hidden mr-1">Sampai:</span>
                <input
                  type="date"
                  value={tableFilterTo}
                  onChange={(e) => setTableFilterTo(e.target.value)}
                  className="border-0 bg-transparent focus:ring-0 text-sm p-0 w-full"
                />
              </div>
              {(tableFilterFrom || tableFilterTo) && (
                <button
                  onClick={() => {
                    setTableFilterFrom("");
                    setTableFilterTo("");
                  }}
                  className="ml-auto p-0.5 rounded-full text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                  title="Reset filter tanggal"
                >
                  <X size={14} />
                </button>
              )}
            </div>
          </div>

          <TableScrollWrapper className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tanggal</TableHead>
                  <TableHead>No Lambung</TableHead>
                  <TableHead>Operator</TableHead>
                  <TableHead>Nama Alat</TableHead>
                  <TableHead>S1 Mulai</TableHead>
                  <TableHead>S1 Selesai</TableHead>
                  <TableHead>S2 Mulai</TableHead>
                  <TableHead>S2 Selesai</TableHead>
                  <TableHead>S3 Mulai</TableHead>
                  <TableHead>S3 Selesai</TableHead>
                  <TableHead>Total Jam</TableHead>
                  <TableHead>Aktivitas</TableHead>
                  <TableHead>Lokasi</TableHead>
                  <TableHead>BBM</TableHead>
                  <TableHead>Oli 40</TableHead>
                  <TableHead>Oli 10</TableHead>
                  <TableHead>Oli 90</TableHead>
                  <TableHead>Keterangan</TableHead>
                  {canShowActions && <TableHead className="text-right">Aksi</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginateData(filteredData, currentPage, pageSize).map((entry) => (
                  <TableRow key={entry.id}>
                    <TableCell>{safeFormatDate(entry.tanggal)}</TableCell>
                    <TableCell>{entry.noLambung || '-'}</TableCell>
                    <TableCell>{entry.namaOperator}</TableCell>
                    <TableCell>{entry.namaAlat}</TableCell>
                    <TableCell>{entry.sesi1JamMulai}</TableCell>
                    <TableCell>{entry.sesi1JamSelesai}</TableCell>
                    <TableCell>{entry.sesi2JamMulai}</TableCell>
                    <TableCell>{entry.sesi2JamSelesai}</TableCell>
                    <TableCell>{entry.sesi3JamMulai}</TableCell>
                    <TableCell>{entry.sesi3JamSelesai}</TableCell>
                    <TableCell>{entry.totalJam} jam</TableCell>
                    <TableCell>{entry.aktivitas}</TableCell>
                    <TableCell>{entry.lokasi}</TableCell>
                    <TableCell>{entry.bbm}</TableCell>
                    <TableCell>{entry.oli40}</TableCell>
                    <TableCell>{entry.oli10}</TableCell>
                    <TableCell>{entry.oli90}</TableCell>
                    <TableCell>{entry.keterangan}</TableCell>
                    {canShowActions && (
                      <TableCell className="text-right">
                        <div className="flex gap-2 justify-end">
                          {canEdit && (
                            <Button variant="ghost" size="icon" onClick={() => handleEdit(entry)}>
                              <Edit className="h-4 w-4" />
                            </Button>
                          )}
                          {canDelete && (
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDelete(entry.id!)}
                              className="text-red-600 hover:bg-red-50"
                            >
                              <Trash className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    )}
                  </TableRow>
                ))}
                {filteredData.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={19} className="text-center py-4">
                      {searchTerm || tableFilterFrom || tableFilterTo ? 'Tidak ada data yang cocok dengan filter' : 'Belum ada data timesheet'}
                    </TableCell>
                  </TableRow>
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
      {/* ══ EXPORT/PRINT DIALOG ═══════════════════════ */}
      {exportPrintDialog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4 shadow-2xl">
            <h3 className="text-lg font-semibold mb-1">
              {exportPrintDialog === 'export' ? '📥 Ekspor TimeSheet' : '🖨️ Cetak TimeSheet'}
            </h3>
            <p className="text-sm text-gray-500 mb-5">Pilih data yang ingin {exportPrintDialog === 'export' ? 'diekspor' : 'dicetak'}:</p>

            <div className="flex flex-col gap-3 mb-5">
              <label className={`flex items-center gap-3 p-3 border-2 rounded-lg cursor-pointer transition-all ${dialogMode === 'all' ? 'border-blue-500 bg-blue-50/50' : 'border-gray-200 hover:border-gray-300'
                }`} onClick={() => setDialogMode('all')}>
                <input type="radio" name="tsMode" checked={dialogMode === 'all'} onChange={() => setDialogMode('all')} className="accent-blue-600" />
                <div>
                  <p className="font-medium text-sm">Semua Data</p>
                  <p className="text-xs text-gray-500">{filteredData.length} data akan di{exportPrintDialog === 'export' ? 'ekspor' : 'cetak'}</p>
                </div>
              </label>
              <label className={`flex items-center gap-3 p-3 border-2 rounded-lg cursor-pointer transition-all ${dialogMode === 'range' ? 'border-blue-500 bg-blue-50/50' : 'border-gray-200 hover:border-gray-300'
                }`} onClick={() => setDialogMode('range')}>
                <input type="radio" name="tsMode" checked={dialogMode === 'range'} onChange={() => setDialogMode('range')} className="accent-blue-600" />
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
    </div>
  );
};

export default TimeSheet;

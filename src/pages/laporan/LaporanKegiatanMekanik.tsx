import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Plus,
  Search,
  Save,
  Trash2,
  Pencil,
  FileDown,
  FileUp,
  Printer,
  CalendarIcon,
  X,
} from "lucide-react";
import React, {
  useState,
  useEffect,
  useRef,
  useMemo,
} from "react";
import { format } from "date-fns";
import { id } from "date-fns/locale";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/api/client";
import { usePagePermission } from '@/hooks/usePagePermission';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { KegiatanMekanik } from "@/types";
import * as XLSX from "xlsx";
import { exportToExcel } from "@/utils/excelUtils";
import { SelectPPA } from "@/components/SelectPPA";
import {
  SimplePagination,
  paginateData,
  getTotalPages,
} from "@/components/ui/SimplePagination";
import { formatDateDisplay } from "@/utils/dateUtils";
import { TableScrollWrapper } from "@/components/ui/TableScrollWrapper";

const LaporanKegiatanMekanik = () => {
  const { toast } = useToast();
  const { user } = useCurrentUser();
  const { can_create: canCreate, can_edit: canEdit, can_delete: canDelete, can_import: canImport, can_export_excel: canExportExcel, can_print: canPrint } = usePagePermission('kegiatanMekanik');
  const canShowActions = canEdit || canDelete;


  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);

  // ── State filter rentang tanggal tabel ────────────────
  const [tableFilterFrom, setTableFilterFrom] = useState("");
  const [tableFilterTo, setTableFilterTo] = useState("");

  // ── State Dialog Export/Print ──────────────────────────
  const [exportPrintDialog, setExportPrintDialog] = useState<
    "export" | "print" | null
  >(null);
  const [dialogMode, setDialogMode] = useState<"all" | "range">("all");
  const now = new Date();
  const firstDayOfMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-01`;
  const lastDayOfMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate()).padStart(2, "0")}`;
  const [dateFrom, setDateFrom] = useState(firstDayOfMonth);
  const [dateTo, setDateTo] = useState(lastDayOfMonth);

  const componentRef = useRef<HTMLDivElement>(null);
  const [kegiatanMekanik, setKegiatanMekanik] = useState<KegiatanMekanik[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState<
    Omit<KegiatanMekanik, "id" | "created_at" | "updated_at">
  >({
    tanggal: new Date(),
    no_ppa: "",
    no_lambung: "",
    nama_alat: "",
    nama_mekanik: "",
    lokasi_pekerjaan: "",
    lokasi_sebelumnya: "",
    keterangan: "",
    user_id: user?.id,
  });
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchKegiatanMekanik = async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from("kegiatan_mekanik")
        .select("*")
        .order("tanggal", { ascending: false });

      if (error) throw error;

      if (data) {
        setKegiatanMekanik(
          data.map((item: any) => ({
            ...item,
            user_id: item.user_id || undefined,
            keterangan: item.keterangan || "",
          })) as KegiatanMekanik[],
        );
      }
    } catch (error) {
      console.error("Error loading data:", error);
      toast({
        title: "Error",
        description: "Gagal memuat data kegiatan mekanik",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchKegiatanMekanik();
  }, []);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleDateChange = (date: Date | undefined) => {
    if (date) {
      setFormData((prev) => ({
        ...prev,
        tanggal: date,
      }));
    }
  };

  const resetForm = () => {
    setEditingId(null);
    setFormData({
      tanggal: new Date(),
      no_ppa: "",
      no_lambung: "",
      nama_alat: "",
      nama_mekanik: "",
      lokasi_pekerjaan: "",
      lokasi_sebelumnya: "",
      keterangan: "",
      user_id: user?.id,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (isSubmitting) return; // Cegah double-submit
    setIsSubmitting(true);

    try {
      // Buat payload bersih: buang id, created_at, updated_at, user_id
      // agar tidak ada konflik PRIMARY KEY saat update
      const {
        id: _id,
        created_at: _ca,
        updated_at: _ua,
        user_id: _uid,
        ...rest
      } = formData as any;

      // Format tanggal sebagai YYYY-MM-DD lokal (bukan UTC/ISO)
      // Kolom DATE di MySQL menyimpan tanggal saja; toISOString() mengkonversi ke UTC
      // sehingga di timezone WIB (+7) tanggal bisa mundur sehari (00:00 WIB = 17:00 UTC kemarin)
      const d = formData.tanggal ? new Date(formData.tanggal) : new Date();
      const tanggalLocal = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

      // no_ppa dan nama_alat adalah kolom NOT NULL di database, tapi user boleh
      // memilih "Tidak ada PPA" di form (yang menghasilkan null/undefined).
      // Karena itu, normalisasi ke string kosong agar tidak melanggar constraint DB.
      const dataToSubmit = {
        ...rest,
        tanggal: tanggalLocal,
        no_ppa: rest.no_ppa || "",
        nama_alat: rest.nama_alat || "",
      };

      if (editingId !== null) {
        const { error } = await (supabase as any)
          .from("kegiatan_mekanik")
          .update(dataToSubmit)
          .eq("id", editingId);

        if (error) throw error;

        toast({
          title: "Sukses",
          description: "Data kegiatan mekanik berhasil diperbarui",
        });
      } else {
        const { error } = await (supabase as any)
          .from("kegiatan_mekanik")
          .insert([dataToSubmit]);

        if (error) throw error;

        toast({
          title: "Sukses",
          description: "Data kegiatan mekanik berhasil ditambahkan",
        });
      }

      setIsDialogOpen(false);
      resetForm();
      fetchKegiatanMekanik();
    } catch (error: any) {
      console.error("Error saving data:", error);
      toast({
        title: "Error",
        description: error.message || "Gagal menyimpan data kegiatan mekanik",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = (id: any) => {
    // Bandingkan sebagai string agar number vs string dari DB tidak menyebabkan mismatch
    const itemToEdit = kegiatanMekanik.find((item) => String(item.id) === String(id));
    if (itemToEdit) {
      setFormData(itemToEdit);
      // Simpan id sebagai number agar cocok dengan tipe kolom BIGINT di database
      setEditingId(Number(id));
      setIsDialogOpen(true);
    }
  };

  const handleDelete = async (id: string) => {
    if (!id) {
      console.error("ID tidak valid");
      toast({
        title: "Error",
        description: "ID tidak valid",
        variant: "destructive",
      });
      return;
    }

    if (!window.confirm("Apakah Anda yakin ingin menghapus data ini?")) return;

    try {
      const { error } = await supabase
        .from("kegiatan_mekanik")
        .delete()
        .eq("id", id);

      if (error) throw error;

      setKegiatanMekanik((prev) => prev.filter((item) => item.id !== id));

      toast({
        title: "Sukses",
        description: "Data berhasil dihapus",
      });
    } catch (error) {
      console.error("Error deleting data:", error);
      toast({
        title: "Error",
        description: "Gagal menghapus data",
        variant: "destructive",
      });
    }
  };

  const doPrint = (data: KegiatanMekanik[], periodeLabel: string) => {
    if (data.length === 0) {
      toast({
        title: "Peringatan",
        description: "Tidak ada data untuk dicetak",
        variant: "destructive",
      });
      return;
    }
    const printWindow = window.open("", "_blank");
    if (!printWindow) return;

    const rows = data
      .map(
        (item, index) => `
      <tr>
        <td class="border p-2">${index + 1}</td>
        <td class="border p-2">${item.tanggal ? formatDateDisplay(item.tanggal) : "-"}</td>
        <td class="border p-2">${item.no_ppa || "-"}</td>
        <td class="border p-2">${item.no_lambung || "-"}</td>
        <td class="border p-2">${item.nama_alat || "-"}</td>
        <td class="border p-2">${item.nama_mekanik || "-"}</td>
        <td class="border p-2">${item.lokasi_pekerjaan || "-"}</td>
        <td class="border p-2">${item.lokasi_sebelumnya || "-"}</td>
        <td class="border p-2">${item.keterangan || "-"}</td>
      </tr>
    `,
      )
      .join("");

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Laporan Kegiatan Mekanik</title>
          <style>
            @page { size: auto; margin: 10mm; }
            body { font-family: Arial, sans-serif; margin: 20px; }
            .header { text-align: left; border-bottom: 2px solid #000; padding-bottom: 10px; margin-bottom: 20px; }
            .company-name { font-weight: bold; font-size: 14px; }
            .company-division { font-size: 12px; }
            .title-section { text-align: center; margin-bottom: 20px; }
            .print-periode { text-align: center; font-weight: bold; margin-bottom: 16px; font-size: 13px; }
            h1 { text-align: center; margin-top: 0; }
            table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
            th { background-color: #f3f4f6 !important; text-align: left; padding: 8px; border: 1px solid #000; }
            td { padding: 8px; border: 1px solid #000; }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="company-name">Cabang Papua</div>
            <div class="company-division">Peralatan</div>
          </div>
          <div class="title-section">
            <h1>Laporan Kegiatan Mekanik</h1>
            ${periodeLabel ? `<div class="print-periode">${periodeLabel}</div>` : ""}
            <p>Dicetak pada: ${new Date().toLocaleString()}</p>
          </div>
          <table>
            <thead><tr class="bg-gray-100">
              <th class="border p-2">No.</th><th class="border p-2">Tanggal</th><th class="border p-2">No. PPA</th>
              <th class="border p-2">No. Lambung</th><th class="border p-2">Nama Alat</th><th class="border p-2">Nama Mekanik</th>
              <th class="border p-2">Lokasi Pekerjaan</th><th class="border p-2">Lokasi Sebelumnya</th><th class="border p-2">Keterangan</th>
            </tr></thead>
            <tbody>${rows}</tbody>
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
  };

  const doExportExcel = (data: KegiatanMekanik[]) => {
    if (data.length === 0) {
      toast({
        title: "Peringatan",
        description: "Tidak ada data untuk diekspor",
        variant: "destructive",
      });
      return;
    }

    const dataToExport = data.map((item, index) => ({
      "No.": index + 1,
      Tanggal: item.tanggal ? formatDateDisplay(item.tanggal) : "-",
      "No. PPA": item.no_ppa || "-",
      "No. Lambung": item.no_lambung || "-",
      "Nama Alat": item.nama_alat || "-",
      "Nama Mekanik": item.nama_mekanik || "-",
      "Lokasi Pekerjaan": item.lokasi_pekerjaan || "-",
      "Lokasi Sebelumnya": item.lokasi_sebelumnya || "-",
      Keterangan: item.keterangan || "-",
    }));

    const suffix =
      dialogMode === "range" && dateFrom && dateTo
        ? `_${dateFrom}_sd_${dateTo}`
        : "";
    try {
      exportToExcel(dataToExport, `Laporan_Kegiatan_Mekanik${suffix}`);
      toast({
        title: "Sukses",
        description: `Berhasil mengekspor ${data.length} data ke Excel`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Gagal mengekspor data",
        variant: "destructive",
      });
    }
  };

  // Helper to get date string (yyyy-MM-dd) from tanggal field
  const getDateStr = (tanggal: any): string => {
    if (!tanggal) return "";
    try {
      const d = new Date(tanggal);
      if (isNaN(d.getTime())) return "";
      return format(d, "yyyy-MM-dd");
    } catch {
      return "";
    }
  };

  const handleDialogConfirm = () => {
    let data = filteredData;
    let periodeLabel = "";
    if (dialogMode === "range") {
      data = filteredData.filter((i: KegiatanMekanik) => {
        const ds = getDateStr(i.tanggal);
        if (!ds) return false;
        if (dateFrom && ds < dateFrom) return false;
        if (dateTo && ds > dateTo) return false;
        return true;
      });
      periodeLabel = `Periode: ${new Date(dateFrom).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })} \u2014 ${new Date(dateTo).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })}`;
    }
    if (exportPrintDialog === "print") {
      doPrint(data, periodeLabel);
    } else if (exportPrintDialog === "export") {
      doExportExcel(data);
    }
    setExportPrintDialog(null);
  };

  const handleImportExcel = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (fileInputRef.current) fileInputRef.current.value = "";

    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: "array" });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        const jsonData: any[] = XLSX.utils.sheet_to_json(worksheet, {
          defval: "",
        });

        if (jsonData.length === 0) {
          toast({
            title: "File Kosong",
            description: "Tidak ada data di file Excel",
            variant: "destructive",
          });
          return;
        }

        let successCount = 0;
        let errorCount = 0;
        const errors: string[] = [];

        for (let i = 0; i < jsonData.length; i++) {
          const item = jsonData[i];
          try {
            const namaMekanik = String(
              item["Nama Mekanik"] || item["nama_mekanik"] || "",
            ).trim();
            if (!namaMekanik)
              throw new Error("Nama Mekanik tidak boleh kosong");

            // Konversi tanggal fleksibel
            let tanggalVal: Date = new Date();
            const rawTanggal = item["Tanggal"] || item["tanggal"];
            if (rawTanggal) {
              if (typeof rawTanggal === "number") {
                // Excel serial date
                const excelEpoch = new Date(1900, 0, 1);
                tanggalVal = new Date(
                  excelEpoch.getTime() + (rawTanggal - 1) * 86400000,
                );
              } else if (typeof rawTanggal === "string" && rawTanggal.trim()) {
                tanggalVal = new Date(rawTanggal.trim());
                if (isNaN(tanggalVal.getTime())) tanggalVal = new Date();
              } else if (rawTanggal instanceof Date) {
                tanggalVal = rawTanggal;
              }
            }

            const insertData = {
              tanggal: tanggalVal.toISOString(),
              no_ppa:
                String(item["No. PPA"] || item["no_ppa"] || "").trim() || null,
              no_lambung: String(
                item["No. Lambung"] || item["no_lambung"] || "",
              ).trim(),
              nama_alat:
                String(item["Nama Alat"] || item["nama_alat"] || "").trim() ||
                null,
              nama_mekanik: namaMekanik,
              lokasi_pekerjaan: String(
                item["Lokasi Pekerjaan"] || item["lokasi_pekerjaan"] || "",
              ).trim(),
              lokasi_sebelumnya: String(
                item["Lokasi Sebelumnya"] || item["Lokasi_Sebelumnya"] || item["lokasi_sebelumnya"] || "",
              ).trim() || null,
              keterangan: String(
                item["Keterangan"] || item["keterangan"] || "",
              ).trim(),
            };

            const { error } = await supabase
              .from("kegiatan_mekanik")
              .insert(insertData);
            if (error) throw new Error(error.message);
            successCount++;
          } catch (err: any) {
            errorCount++;
            errors.push(
              `Baris ${i + 2}: ${err.message || "Error tidak diketahui"}`,
            );
            console.error(`Error row ${i + 1}:`, err);
          }
        }

        toast({
          title: successCount > 0 ? "Import Berhasil" : "Import Gagal",
          description: `${successCount} berhasil diimpor${errorCount > 0 ? `, ${errorCount} gagal` : ""}`,
          variant: successCount > 0 ? "default" : "destructive",
        });

        if (errors.length > 0) console.log("Import errors:", errors);
        if (successCount > 0) fetchKegiatanMekanik();
      } catch (error: any) {
        console.error("Error importing data:", error);
        toast({
          title: "Error",
          description: `Gagal mengimpor data: ${error.message}`,
          variant: "destructive",
        });
      }
    };

    reader.readAsArrayBuffer(file);
  };

  const filteredData = useMemo(() => {
    return kegiatanMekanik.filter((item) => {
      const matchesSearch =
        item.nama_mekanik.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.lokasi_pekerjaan
          .toLowerCase()
          .includes(searchTerm.toLowerCase()) ||
        (item.lokasi_sebelumnya &&
          item.lokasi_sebelumnya.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (item.keterangan &&
          item.keterangan.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (item.no_ppa &&
          item.no_ppa.toLowerCase().includes(searchTerm.toLowerCase())) ||
        item.no_lambung.toLowerCase().includes(searchTerm.toLowerCase());
      if (!matchesSearch) return false;
      // Filter rentang tanggal tabel
      const ds = getDateStr(item.tanggal);
      if (tableFilterFrom && ds && ds < tableFilterFrom) return false;
      if (tableFilterTo && ds && ds > tableFilterTo) return false;
      return true;
    });
  }, [kegiatanMekanik, searchTerm, tableFilterFrom, tableFilterTo]);

  const isEditMode = editingId !== null;

  return (
    <div className="container mx-auto py-6 space-y-4">
      <div className="hidden">
        <div ref={componentRef}>
          <h1 className="text-2xl font-bold text-center mb-4">
            Laporan Kegiatan Mekanik
          </h1>
          <p className="text-center mb-6">
            Dicetak pada: {new Date().toLocaleString()}
          </p>
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-gray-100">
                <th className="border p-2">No.</th>
                <th className="border p-2">Tanggal</th>
                <th className="border p-2">No. PPA</th>
                <th className="border p-2">No. Lambung</th>
                <th className="border p-2">Nama Alat</th>
                <th className="border p-2">Nama Mekanik</th>
                <th className="border p-2">Lokasi Pekerjaan</th>
                <th className="border p-2">Lokasi Sebelumnya</th>
                <th className="border p-2">Keterangan</th>
              </tr>
            </thead>
            <tbody>
              {kegiatanMekanik.map((item, index) => (
                <tr key={index}>
                  <td className="border p-2">{index + 1}</td>
                  <td className="border p-2">
                    {item.tanggal ? formatDateDisplay(item.tanggal) : "-"}
                  </td>
                  <td className="border p-2">{item.no_ppa || "-"}</td>
                  <td className="border p-2">{item.no_lambung || "-"}</td>
                  <td className="border p-2">{item.nama_alat || "-"}</td>
                  <td className="border p-2">{item.nama_mekanik || "-"}</td>
                  <td className="border p-2">{item.lokasi_pekerjaan || "-"}</td>
                  <td className="border p-2">{item.lokasi_sebelumnya || "-"}</td>
                  <td className="border p-2">{item.keterangan || "-"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <input
        type="file"
        ref={fileInputRef}
        onChange={handleImportExcel}
        accept=".xlsx,.xls"
        className="hidden"
      />

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-2xl font-bold">
            Laporan Kegiatan Mekanik
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            {/* Row 1: Action Buttons (Stacked on mobile, inline on sm) */}
            <div className="grid grid-cols-1 sm:flex sm:flex-wrap gap-2 w-full sm:w-auto">
              {canImport && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => fileInputRef.current?.click()}
                  className="flex items-center justify-center gap-2 text-xs sm:text-sm px-3 py-2 sm:px-4 sm:py-2 w-full sm:w-auto"
                >
                  <FileUp className="h-4 w-4" />
                  <span>Import Excel</span>
                </Button>
              )}
              {canExportExcel && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setDialogMode("all");
                    setExportPrintDialog("export");
                  }}
                  className="flex items-center justify-center gap-2 text-xs sm:text-sm px-3 py-2 sm:px-4 sm:py-2 w-full sm:w-auto"
                >
                  <FileDown className="h-4 w-4" />
                  <span>Export Excel</span>
                </Button>
              )}
              {canPrint && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setDialogMode("all");
                    setExportPrintDialog("print");
                  }}
                  className="flex items-center justify-center gap-2 text-xs sm:text-sm px-3 py-2 sm:px-4 sm:py-2 w-full sm:w-auto"
                >
                  <Printer className="h-4 w-4" />
                  <span>Print</span>
                </Button>
              )}
              {canCreate && (
                <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                  <DialogTrigger asChild>
                    <Button variant="default" size="sm" className="flex items-center justify-center gap-2 text-xs sm:text-sm px-3 py-2 sm:px-4 sm:py-2 w-full sm:w-auto">
                      <Plus className="mr-2 h-4 w-4" />
                      Tambah Data
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>
                        {isEditMode
                          ? "Edit Data Kegiatan Mekanik"
                          : "Tambah Data Kegiatan Mekanik"}
                      </DialogTitle>
                      <DialogDescription>
                        {isEditMode
                          ? "Perbarui data kegiatan mekanik yang dipilih."
                          : "Tambahkan data kegiatan mekanik baru."}
                      </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleSubmit} className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Tanggal */}
                        <div className="space-y-2">
                          <Label htmlFor="tanggal-input">Tanggal</Label>
                          <Popover>
                            <PopoverTrigger asChild>
                              <Button
                                id="tanggal-input"
                                variant="outline"
                                className="w-full justify-start text-left font-normal"
                                type="button"
                              >
                                <CalendarIcon className="mr-2 h-4 w-4" />
                                {formData.tanggal ? (
                                  format(new Date(formData.tanggal), "PPP")
                                ) : (
                                  <span>Pilih tanggal</span>
                                )}
                              </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0">
                              <Calendar
                                mode="single"
                                selected={new Date(formData.tanggal)}
                                onSelect={handleDateChange}
                                initialFocus
                                locale={id}
                              />
                            </PopoverContent>
                          </Popover>
                        </div>

                        {/* No. PPA — hanya PPA yang disetujui */}
                        <div className="space-y-2">
                          <Label htmlFor="no_ppa">No. PPA</Label>
                          <SelectPPA
                            value={formData.no_ppa}
                            onChange={(val) => {
                              if (!val) {
                                setFormData((prev) => ({
                                  ...prev,
                                  no_ppa: null,
                                  no_lambung: "",
                                  nama_alat: null,
                                }));
                              }
                            }}
                            onPPASelected={(ppa) => {
                              if (ppa) {
                                setFormData((prev) => ({
                                  ...prev,
                                  no_ppa: ppa.no_ppa,
                                  no_lambung: ppa.no_lambung || "",
                                  nama_alat: ppa.nama_alat || null,
                                }));
                              } else {
                                setFormData((prev) => ({
                                  ...prev,
                                  no_ppa: null,
                                  no_lambung: "",
                                  nama_alat: null,
                                }));
                              }
                            }}
                          />
                        </div>

                        {/* No. Lambung — selalu otomatis dari PPA */}
                        <div className="space-y-2">
                          <Label htmlFor="no_lambung">
                            No. Lambung
                            <span className="ml-2 text-xs text-muted-foreground">
                              (otomatis dari PPA)
                            </span>
                          </Label>
                          <Input
                            id="no_lambung"
                            value={formData.no_lambung || ""}
                            readOnly
                            disabled
                            className="bg-muted cursor-not-allowed"
                            placeholder="Terisi otomatis saat PPA dipilih"
                          />
                        </div>

                        {/* Nama Alat — selalu otomatis dari PPA */}
                        <div className="space-y-2">
                          <Label htmlFor="nama_alat">
                            Nama Alat
                            <span className="ml-2 text-xs text-muted-foreground">
                              (otomatis dari PPA)
                            </span>
                          </Label>
                          <Input
                            id="nama_alat"
                            value={formData.nama_alat || ""}
                            readOnly
                            disabled
                            className="bg-muted cursor-not-allowed"
                            placeholder="Terisi otomatis saat PPA dipilih"
                          />
                        </div>

                        {/* Nama Mekanik */}
                        <div className="space-y-2">
                          <Label htmlFor="nama_mekanik">
                            Nama Mekanik <span className="text-red-500">*</span>
                          </Label>
                          <Input
                            id="nama_mekanik"
                            name="nama_mekanik"
                            value={formData.nama_mekanik}
                            onChange={handleInputChange}
                            placeholder="Masukkan nama mekanik"
                            required
                          />
                        </div>

                        {/* Lokasi Pekerjaan & Lokasi Sebelumnya */}
                        <div className="space-y-2">
                          <Label htmlFor="lokasi_pekerjaan">
                            Lokasi Pekerjaan{" "}
                            <span className="text-red-500">*</span>
                          </Label>
                          <Input
                            id="lokasi_pekerjaan"
                            name="lokasi_pekerjaan"
                            value={formData.lokasi_pekerjaan}
                            onChange={handleInputChange}
                            placeholder="Masukkan lokasi pekerjaan"
                            required
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="lokasi_sebelumnya">
                            Lokasi Sebelumnya
                          </Label>
                          <Input
                            id="lokasi_sebelumnya"
                            name="lokasi_sebelumnya"
                            value={formData.lokasi_sebelumnya || ""}
                            onChange={handleInputChange}
                            placeholder="Masukkan lokasi sebelumnya"
                          />
                        </div>

                        {/* Keterangan */}
                        <div className="space-y-2 md:col-span-2">
                          <Label htmlFor="keterangan">Keterangan</Label>
                          <Textarea
                            id="keterangan"
                            name="keterangan"
                            value={formData.keterangan || ""}
                            onChange={handleInputChange}
                            placeholder="Masukkan keterangan tambahan"
                            rows={3}
                          />
                        </div>
                      </div>

                      <div className="flex justify-end space-x-2 pt-4">
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => {
                            resetForm();
                            setIsDialogOpen(false);
                          }}
                        >
                          Batal
                        </Button>
                        <Button type="submit" disabled={isSubmitting}>
                          <Save className="mr-2 h-4 w-4" />
                          {isSubmitting ? "Menyimpan..." : "Simpan"}
                        </Button>
                      </div>
                    </form>
                  </DialogContent>
                </Dialog>
              )}
            </div>

            {/* Filter & Search Container (Stacked on mobile, side-by-side on sm) */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full sm:w-auto sm:ml-auto">
              {/* Search input */}
              <div className="relative w-full sm:w-64">
                <Search className="absolute left-3 top-1/2 h-4 w-4 transform -translate-y-1/2 text-gray-500" />
                <Input
                  type="text"
                  placeholder="Cari nama mekanik, lokasi..."
                  className="pl-10 w-full"
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    setCurrentPage(1);
                  }}
                />
              </div>

              {/* Date range filter */}
              <div className="flex flex-col sm:flex-row sm:items-center gap-2 w-full sm:w-auto bg-white border rounded-lg p-2 text-sm">
                <div className="flex items-center gap-2 w-full sm:w-28">
                  <CalendarIcon size={14} className="text-gray-400 flex-shrink-0" />
                  <input
                    type="date"
                    value={tableFilterFrom}
                    onChange={(e) => setTableFilterFrom(e.target.value)}
                    className="border-0 bg-transparent focus:ring-0 text-xs p-0 w-full"
                  />
                </div>
                <span className="text-gray-400 self-center hidden sm:inline">—</span>
                <div className="flex items-center gap-2 w-full border-t sm:border-t-0 pt-2 sm:pt-0 sm:w-28">
                  <span className="text-gray-400 sm:hidden mr-1">Sampai:</span>
                  <input
                    type="date"
                    value={tableFilterTo}
                    onChange={(e) => setTableFilterTo(e.target.value)}
                    className="border-0 bg-transparent focus:ring-0 text-xs p-0 w-full"
                  />
                </div>
                {(tableFilterFrom || tableFilterTo) && (
                  <button
                    onClick={() => {
                      setTableFilterFrom("");
                      setTableFilterTo("");
                    }}
                    className="ml-auto sm:ml-1 p-0.5 rounded-full text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                    title="Reset filter tanggal"
                  >
                    <X size={14} />
                  </button>
                )}
              </div>
            </div>
          </div>

          <TableScrollWrapper className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>No.</TableHead>
                  <TableHead>Tanggal</TableHead>
                  <TableHead>No. PPA</TableHead>
                  <TableHead>No. Lambung</TableHead>
                  <TableHead>Nama Alat</TableHead>
                  <TableHead>Nama Mekanik</TableHead>
                  <TableHead>Lokasi Pekerjaan</TableHead>
                  <TableHead>Lokasi Sebelumnya</TableHead>
                  <TableHead>Keterangan</TableHead>
                  {canShowActions && <TableHead>Aksi</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={10} className="text-center py-8">
                      Memuat data...
                    </TableCell>
                  </TableRow>
                ) : filteredData.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={10}
                      className="text-center py-8 text-gray-500"
                    >
                      {searchTerm
                        ? "Tidak ada data yang sesuai dengan pencarian"
                        : "Belum ada data kegiatan mekanik"}
                    </TableCell>
                  </TableRow>
                ) : (
                  paginateData(filteredData, currentPage, pageSize).map(
                    (item: KegiatanMekanik, index: number) => (
                      <TableRow key={item.id}>
                        <TableCell>{index + 1}</TableCell>
                        <TableCell>
                          {item.tanggal ? formatDateDisplay(item.tanggal) : "-"}
                        </TableCell>
                        <TableCell>{item.no_ppa || "-"}</TableCell>
                        <TableCell>{item.no_lambung || "-"}</TableCell>
                        <TableCell>{item.nama_alat || "-"}</TableCell>
                        <TableCell>{item.nama_mekanik || "-"}</TableCell>
                        <TableCell>{item.lokasi_pekerjaan || "-"}</TableCell>
                        <TableCell>{item.lokasi_sebelumnya || "-"}</TableCell>
                        <TableCell>{item.keterangan || "-"}</TableCell>
                        {canShowActions && (
                          <TableCell>
                            <div className="flex items-center space-x-2">
                              {canEdit && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleEdit(item.id!)}
                                  className="text-blue-600 hover:bg-blue-50 p-1 h-8 w-8"
                                >
                                  <Pencil className="h-4 w-4" />
                                </Button>
                              )}
                              {canDelete && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleDelete(item.id!)}
                                  className="text-red-600 hover:bg-red-50 p-1 h-8 w-8"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              )}
                            </div>
                          </TableCell>
                        )}
                      </TableRow>
                    ),
                  )
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
      {/* ══ EXPORT/PRINT DIALOG ════════════════════════════ */}
      {exportPrintDialog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4 shadow-2xl">
            <h3 className="text-lg font-semibold mb-1">
              {exportPrintDialog === "export"
                ? "📥 Ekspor Data"
                : "🖨️ Cetak Kegiatan Mekanik"}
            </h3>
            <p className="text-sm text-gray-500 mb-5">
              Pilih data yang ingin{" "}
              {exportPrintDialog === "export" ? "diekspor" : "dicetak"}:
            </p>

            <div className="flex flex-col gap-3 mb-5">
              <label
                className={`flex items-center gap-3 p-3 border-2 rounded-lg cursor-pointer transition-all ${dialogMode === "all"
                  ? "border-blue-500 bg-blue-50/50"
                  : "border-gray-200 hover:border-gray-300"
                  }`}
                onClick={() => setDialogMode("all")}
              >
                <input
                  type="radio"
                  name="mekanikMode"
                  checked={dialogMode === "all"}
                  onChange={() => setDialogMode("all")}
                  className="accent-blue-600"
                />
                <div>
                  <p className="font-medium text-sm">Semua Data</p>
                  <p className="text-xs text-gray-500">
                    {filteredData.length} data akan di
                    {exportPrintDialog === "export" ? "ekspor" : "cetak"}
                  </p>
                </div>
              </label>
              <label
                className={`flex items-center gap-3 p-3 border-2 rounded-lg cursor-pointer transition-all ${dialogMode === "range"
                  ? "border-blue-500 bg-blue-50/50"
                  : "border-gray-200 hover:border-gray-300"
                  }`}
                onClick={() => setDialogMode("range")}
              >
                <input
                  type="radio"
                  name="mekanikMode"
                  checked={dialogMode === "range"}
                  onChange={() => setDialogMode("range")}
                  className="accent-blue-600"
                />
                <div>
                  <p className="font-medium text-sm">Rentang Tanggal</p>
                  <p className="text-xs text-gray-500">
                    Pilih periode tanggal tertentu
                  </p>
                </div>
              </label>
            </div>

            {dialogMode === "range" && (
              <div className="flex items-center gap-2 mb-5 p-3 bg-gray-50 rounded-lg border">
                <CalendarIcon
                  size={16}
                  className="text-gray-400 flex-shrink-0"
                />
                <div className="flex items-center gap-2 flex-1">
                  <input
                    type="date"
                    value={dateFrom}
                    onChange={(e) => setDateFrom(e.target.value)}
                    className="form-input text-sm py-1.5 flex-1"
                  />
                  <span className="text-gray-400 text-sm">s/d</span>
                  <input
                    type="date"
                    value={dateTo}
                    onChange={(e) => setDateTo(e.target.value)}
                    className="form-input text-sm py-1.5 flex-1"
                  />
                </div>
              </div>
            )}

            <div className="flex justify-end gap-3">
              <button
                onClick={() => setExportPrintDialog(null)}
                className="px-4 py-2 border rounded-lg text-sm hover:bg-gray-50"
              >
                Batal
              </button>
              <button
                onClick={handleDialogConfirm}
                className={`px-4 py-2 text-white rounded-lg text-sm ${exportPrintDialog === "export" ? "bg-green-600 hover:bg-green-700" : "bg-blue-600 hover:bg-blue-700"}`}
              >
                {exportPrintDialog === "export"
                  ? "Ekspor Excel"
                  : "Cetak Sekarang"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LaporanKegiatanMekanik;

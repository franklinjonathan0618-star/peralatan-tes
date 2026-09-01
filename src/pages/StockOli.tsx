import React, { useState, useMemo } from "react";
import ReactDOMServer from "react-dom/server";
import {
  Plus,
  Search,
  Edit,
  Trash,
  ChevronDown,
  Printer,
  Upload,
  Download,
  Calendar,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { parse } from "date-fns";
import { OliTransaction } from "../types/oil";
import { oilTypes } from "@/data/oilTypes";
import OilStockSummary from "../components/oil/OilStockSummary";
import OilTransactionForm from "../components/oil/OilTransactionForm";
import PrintableOilStock from "../components/oil/PrintableOilStock";
import {
  useOliTransactions,
  useAddOliTransaction,
  useUpdateOliTransaction,
  useDeleteOliTransaction,
} from "../hooks/useOliTransactions";
import { useOliStock } from "../hooks/useOliStocks";
import ExcelImportButton from "../components/ui/ExcelImportButton";
import { exportToExcel } from "@/utils/excelUtils";
import { TableScrollWrapper } from "@/components/ui/TableScrollWrapper";
import { usePagePermission } from '@/hooks/usePagePermission';
import {
  SimplePagination,
  paginateData,
  getTotalPages,
} from "@/components/ui/SimplePagination";
import { formatDateDisplay, normalizeDateOnly } from "@/utils/dateUtils";

const StockOli: React.FC = (): React.ReactElement => {
  const { can_create: canCreate, can_edit: canEdit, can_delete: canDelete, can_import: canImport, can_export_excel: canExportExcel, can_print: canPrint } = usePagePermission('stockOli');
  const canShowActions = canEdit || canDelete;

  const [selectedOilType, setSelectedOilType] = React.useState("Oli SAE 40");
  const [showForm, setShowForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [editingItem, setEditingItem] = useState<OliTransaction | null>(null);
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

  const { data, isLoading } = useOliTransactions(selectedOilType);
  const transactions: OliTransaction[] = data || [];
  const { data: stockData } = useOliStock(selectedOilType);
  const currentStock = stockData?.jumlah_stock || 0;
  const addTransaction = useAddOliTransaction();
  const updateTransaction = useUpdateOliTransaction();
  const deleteTransaction = useDeleteOliTransaction();

  const handleFormSubmit = (newTransaction: OliTransaction) => {
    try {
      if (editingItem) {
        updateTransaction.mutate({
          ...newTransaction,
          oilType: selectedOilType,
          oldVolume: editingItem.volume,
          oldJenis: editingItem.jenis,
        });
      } else {
        addTransaction.mutate({ ...newTransaction, oilType: selectedOilType });
      }

      setShowForm(false);
      setEditingItem(null);
    } catch (error) {
      console.error("Error saving transaction:", error);
      toast.error("Gagal menyimpan data transaksi");
    }
  };

  const handleEdit = (item: OliTransaction) => {
    try {
      setEditingItem(item);
      setShowForm(true);
    } catch (error) {
      toast.error("Gagal memuat data untuk diedit");
    }
  };

  const doPrint = (data: OliTransaction[], periodeLabel: string) => {
    if (data.length === 0) {
      toast.warning("Tidak ada data untuk dicetak");
      return;
    }
    const printWindow = window.open("", "_blank");
    if (printWindow) {
      const oilTypeName =
        oilTypes.find((type) => type.id === selectedOilType)?.name || "";

      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>Print Stock ${oilTypeName}</title>
            <link href="https://cdn.jsdelivr.net/npm/tailwindcss@2.2.19/dist/tailwind.min.css" rel="stylesheet">
            <style>.print-periode{text-align:center;font-weight:bold;margin-bottom:16px;font-size:13px;}</style>
          </head>
          <body>
            ${periodeLabel ? `<div class="print-periode">${periodeLabel}</div>` : ""}
            <div id="print-content">
              ${ReactDOMServer.renderToString(
                <PrintableOilStock transactions={data} oilType={oilTypeName} />,
              )}
            </div>
            <script>
              window.onload = () => {
                window.print();
                window.onafterprint = () => window.close();
              };
            </script>
          </body>
        </html>
      `);
      printWindow.document.close();
    } else {
      toast.error("Gagal membuka jendela cetak");
    }
  };

  const handleDelete = (id: number | string) => {
    try {
      const itemToDelete = transactions.find((item) => item.id === id);
      if (confirm("Apakah Anda yakin ingin menghapus data ini?")) {
        deleteTransaction.mutate({
          id,
          oilType: selectedOilType,
          volume: itemToDelete?.volume,
          jenis: itemToDelete?.jenis,
        });
      }
    } catch (error) {
      toast.error("Gagal menghapus data transaksi");
    }
  };

  const filteredData: OliTransaction[] = useMemo(() => {
    return transactions.filter((item) => {
      const matchesSearch =
        (item.keterangan?.toLowerCase() || "").includes(
          searchTerm.toLowerCase(),
        ) ||
        (item.tanggal || "").includes(searchTerm) ||
        (item.lokasiProyek?.toLowerCase() || "").includes(
          searchTerm.toLowerCase(),
        );
      if (!matchesSearch) return false;
      // Filter rentang tanggal tabel
      if (tableFilterFrom && item.tanggal && item.tanggal < tableFilterFrom)
        return false;
      if (tableFilterTo && item.tanggal && item.tanggal > tableFilterTo)
        return false;
      return true;
    });
  }, [transactions, searchTerm, tableFilterFrom, tableFilterTo]);

  const handleDialogConfirm = () => {
    let data = filteredData;
    let periodeLabel = "";
    if (dialogMode === "range") {
      data = filteredData.filter((i: OliTransaction) => {
        if (!i.tanggal) return false;
        if (dateFrom && i.tanggal < dateFrom) return false;
        if (dateTo && i.tanggal > dateTo) return false;
        return true;
      });
      periodeLabel = `Periode: ${formatDateDisplay(dateFrom)} \u2014 ${formatDateDisplay(dateTo)}`;
    }
    if (exportPrintDialog === "print") {
      doPrint(data, periodeLabel);
    } else if (exportPrintDialog === "export") {
      doExportExcel(data);
    }
    setExportPrintDialog(null);
  };

  const doExportExcel = (data: OliTransaction[]) => {
    if (data.length === 0) {
      toast.warning("Tidak ada data untuk diekspor");
      return;
    }
    const oilTypeName =
      oilTypes.find((type) => type.id === selectedOilType)?.name ||
      selectedOilType;
    const dataToExport = data.map((item: OliTransaction, index: number) => ({
      No: index + 1,
      Tanggal: item.tanggal ? normalizeDateOnly(item.tanggal) : '-',
      "Jenis Transaksi": item.jenis === "pembelian" ? "Pembelian" : item.jenis === "sisa_stock" ? "Sisa Stock" : "Pemakaian",
      "Volume (Liter)": item.volume,
      "Harga per Liter (Rp)": item.hargaPembelian || 0,
      "Total Harga (Rp)": item.totalHarga || 0,
      "No. Lambung": item.noLambung || "",
      "Nama Alat": item.namaAlat || "",
      "Lokasi Proyek": item.lokasiProyek || "",
      Keterangan: item.keterangan || "",
    }));
    const suffix =
      dialogMode === "range" && dateFrom && dateTo
        ? `_${dateFrom}_sd_${dateTo}`
        : "";
    try {
      exportToExcel(
        dataToExport,
        `Data_Transaksi_${oilTypeName.replace(/\s/g, "_")}${suffix}`,
      );
      toast.success(`Berhasil mengekspor ${data.length} transaksi ke Excel`);
    } catch (error) {
      toast.error("Gagal mengekspor data");
    }
  };

  const expectedOliHeaders = [
    "Tanggal",
    "Jenis Transaksi",
    "Volume (Liter)",
    "Harga per Liter (Rp)",
    "Keterangan",
    "No. Lambung",
    "Nama Alat",
    "Lokasi Proyek",
  ];

  const handleOliExcelDataParsed = async (
    parsedData: any[],
    fileName?: string,
  ) => {
    let successCount = 0;
    let errorCount = 0;
    const errors: string[] = [];

    if (parsedData.length === 0) {
      toast.info(
        `Tidak ada data untuk diimpor dari file ${fileName || "Excel"}. Pastikan sheet pertama berisi data transaksi.`,
      );
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

      const parseNumeric = (val: unknown): number => {
        if (val === undefined || val === null || val === '') return 0;
        if (typeof val === 'number') return val;
        const str = String(val).trim();
        const cleanStr = str.replace(/\./g, '').replace(/,/g, '.');
        const num = parseFloat(cleanStr);
        return isNaN(num) ? 0 : num;
      };

      if (index < 2) {
        console.log(
          `Raw Oli Excel Row ${index + 2}:`,
          JSON.stringify(normalizedRow),
        );
      }

      const tanggalValue = findVal(["tanggal", "date", "tgl"]);
      const jenisTransaksiVal = findVal(["jenis transaksi", "jenis_transaksi", "jenis", "type", "transaction type", "tipe transaksi", "tipe"]);
      const jenisRaw = jenisTransaksiVal ? jenisTransaksiVal.toString().trim().toLowerCase() : "";
      let jenisTransaksi: "pembelian" | "pemakaian" | "sisa_stock" = "pemakaian";
      if (jenisRaw === "pembelian" || jenisRaw === "purchase" || jenisRaw === "tambah" || jenisRaw === "masuk") {
        jenisTransaksi = "pembelian";
      } else if (jenisRaw === "pemakaian" || jenisRaw === "usage" || jenisRaw === "kurang" || jenisRaw === "keluar" || jenisRaw === "use" || jenisRaw === "pakai") {
        jenisTransaksi = "pemakaian";
      } else if (
        jenisRaw === "sisa stock" ||
        jenisRaw === "sisa_stock" ||
        jenisRaw === "sisa stok" ||
        jenisRaw === "sisa" ||
        jenisRaw === "saldo awal" ||
        jenisRaw === "stok awal" ||
        jenisRaw === "balance" ||
        jenisRaw === "initial stock"
      ) {
        jenisTransaksi = "sisa_stock";
      } else {
        jenisTransaksi = jenisRaw as any;
      }

      // Deteksi jenis oli jika dicantumkan di kolom Excel
      const jenisOliVal = findVal(["jenis oli", "jenis_oli", "oli", "oil type", "oil", "tipe oli", "nama oli"]);
      let targetOilType = selectedOilType;
      if (jenisOliVal) {
        const rawOli = String(jenisOliVal).trim().toLowerCase();
        const matched = oilTypes.find(
          (t) =>
            t.id.toLowerCase() === rawOli ||
            t.name.toLowerCase() === rawOli ||
            t.id.toLowerCase().replace(/\s+/g, "") === rawOli.replace(/\s+/g, "") ||
            rawOli.includes(t.id.toLowerCase()) ||
            rawOli.includes(t.id.toLowerCase().replace("oli ", ""))
        );
        if (matched) {
          targetOilType = matched.id;
        }
      }

      const volumeVal = findVal(["volume (liter)", "volume (l)", "volume", "jumlah", "quantity", "qty", "liter", "l"]);
      const volume = parseNumeric(volumeVal);

      const hargaPerLiterVal = findVal(["harga per liter (rp)", "harga per liter", "harga satuan (rp)", "harga satuan", "harga_satuan", "harga", "price", "cost", "rate"]);
      const hargaPerLiter = parseNumeric(hargaPerLiterVal);

      const keteranganExcel = String(findVal(["keterangan", "catatan", "note", "notes", "description", "ket"]) || "").trim();
      const noLambungExcel = String(findVal(["no. lambung", "no lambung", "no_lambung", "lambung", "hull number", "hull_no", "no alat"]) || "").trim();
      const namaAlatExcel = String(findVal(["nama alat", "nama_alat", "alat", "equipment", "equipment name"]) || "").trim();
      const lokasiProyekExcel = String(findVal(["lokasi proyek", "lokasi_proyek", "lokasi", "proyek", "project", "project location", "site"]) || "").trim();

      let tanggalParsed: Date | null = null;
      let tanggalFormatted: string = "";

      if (tanggalValue instanceof Date && !isNaN(tanggalValue.getTime())) {
        tanggalParsed = tanggalValue;
      } else if (typeof tanggalValue === "number") {
        const excelEpoch = Date.UTC(1899, 11, 30);
        const jsDate = new Date(
          excelEpoch + tanggalValue * 24 * 60 * 60 * 1000,
        );
        if (!isNaN(jsDate.getTime())) {
          tanggalParsed = jsDate;
        } else {
          console.warn(
            `Row ${index + 2}: Could not convert Oli Excel date serial number ${tanggalValue} to valid date.`,
          );
        }
      } else if (typeof tanggalValue === "string") {
        const tanggalStr = String(tanggalValue);
        const tryParseDate = (
          dateString: string,
          formatString: string,
        ): Date | null => {
          try {
            const parsedDate = parse(dateString, formatString, new Date());
            if (!isNaN(parsedDate.getTime())) return parsedDate;
          } catch (e) {
            /* ignore */
          }
          return null;
        };
        tanggalParsed =
          tryParseDate(String(tanggalStr), "yyyy-MM-dd") ||
          tryParseDate(String(tanggalStr), "dd/MM/yyyy") ||
          tryParseDate(String(tanggalStr), "MM/dd/yyyy") ||
          tryParseDate(String(tanggalStr), "yyyy/MM/dd");
        if (!tanggalParsed && tanggalStr) {
          const d = new Date(tanggalStr);
          if (!isNaN(d.getTime())) tanggalParsed = d;
        }
      }

      if (tanggalParsed) {
        tanggalFormatted = normalizeDateOnly(tanggalParsed);
      } else {
        errors.push(
          `Baris ${index + 2}: Format tanggal Oli tidak valid atau tanggal tidak bisa diparsing (${JSON.stringify(tanggalValue)}).`,
        );
        errorCount++;
        continue;
      }

      if (volume <= 0) {
        errors.push(
          `Baris ${index + 2}: Volume (Liter) tidak valid atau kosong.`,
        );
        errorCount++;
        continue;
      }

      let jenis: "pembelian" | "pemakaian" | "sisa_stock" = "pemakaian";
      if (jenisTransaksi === "pembelian") {
        jenis = "pembelian";
      } else if (jenisTransaksi === "pemakaian") {
        jenis = "pemakaian";
      } else if (jenisTransaksi === "sisa_stock") {
        jenis = "sisa_stock";
      } else {
        errors.push(
          `Baris ${index + 2}: Jenis Transaksi tidak valid ("${jenisTransaksi || ""}"). Gunakan "Pembelian", "Pemakaian", atau "Sisa Stock".`,
        );
        errorCount++;
        continue;
      }

      const newTransaction: Omit<OliTransaction, "id" | "totalHarga"> & {
        hargaPembelian?: number;
        totalHarga?: number;
      } = {
        tanggal: tanggalFormatted,
        jenis: jenis,
        volume: volume,
        keterangan: keteranganExcel || (jenis === "sisa_stock" ? "Sisa Stock" : jenis === "pembelian" ? "Pembelian" : "Pemakaian"),
        noLambung: jenis === "pemakaian" ? (noLambungExcel || "") : "",
        namaAlat: jenis === "pemakaian" ? (namaAlatExcel || "") : "",
        lokasiProyek: lokasiProyekExcel || "",
      };

      if (jenis === "pembelian") {
        newTransaction.hargaPembelian = hargaPerLiter;
        newTransaction.totalHarga = volume * hargaPerLiter;
      } else if (jenis === "sisa_stock") {
        newTransaction.hargaPembelian = hargaPerLiter || 0;
        newTransaction.totalHarga = volume * (hargaPerLiter || 0);
      } else if (jenis === "pemakaian") {
        newTransaction.hargaPembelian = 0;
        newTransaction.totalHarga = 0;
      }

      try {
        await addTransaction.mutateAsync({
          ...newTransaction,
          id: crypto.randomUUID(),
          oilType: targetOilType,
        } as OliTransaction & { oilType: string });
        successCount++;
      } catch (error: any) {
        console.error(`Error importing row ${index + 2} (Excel):`, error);
        errors.push(
          `Baris ${index + 2}: Gagal menyimpan. ${error.message || "Kesalahan tidak diketahui."}`,
        );
        errorCount++;
      }
    }

    if (successCount > 0 && errorCount > 0) {
      toast.warning(
        <div>
          <p className="font-semibold">
            Impor Selesai Sebagian (File: {fileName || "Excel"})
          </p>
          <p>Berhasil: {successCount} transaksi.</p>
          <p>Gagal: {errorCount} transaksi.</p>
          {errors.length > 0 && (
            <details className="mt-2 text-xs">
              <summary className="cursor-pointer font-semibold">
                Lihat Detail Kesalahan ({errors.length})
              </summary>
              <ul className="list-disc list-inside max-h-40 overflow-y-auto bg-gray-50 p-2 rounded">
                {errors.slice(0, 10).map((err, i) => (
                  <li key={i}>{err}</li>
                ))}
                {errors.length > 10 && (
                  <li>Dan {errors.length - 10} kesalahan lainnya...</li>
                )}
              </ul>
            </details>
          )}
        </div>,
        { duration: 15000 },
      );
    } else if (successCount > 0 && errorCount === 0) {
      toast.success(
        `Berhasil mengimpor ${successCount} transaksi dari file ${fileName || "Excel"}.`,
      );
    } else if (successCount === 0 && errorCount > 0) {
      toast.error(
        <div>
          <p className="font-semibold">
            Impor Gagal (File: {fileName || "Excel"})
          </p>
          <p>
            Tidak ada transaksi yang berhasil diimpor. Gagal: {errorCount}{" "}
            transaksi.
          </p>
          {errors.length > 0 && (
            <details className="mt-2 text-xs">
              <summary className="cursor-pointer font-semibold">
                Lihat Detail Kesalahan ({errors.length})
              </summary>
              <ul className="list-disc list-inside max-h-40 overflow-y-auto bg-gray-50 p-2 rounded">
                {errors.slice(0, 10).map((err, i) => (
                  <li key={i}>{err}</li>
                ))}
                {errors.length > 10 && (
                  <li>Dan {errors.length - 10} kesalahan lainnya...</li>
                )}
              </ul>
            </details>
          )}
        </div>,
        { duration: 15000 },
      );
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
    }).format(value);
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
      <div className="page-header flex flex-col gap-4">
        <h1 className="page-title">Stock Oli</h1>
        <p className="page-description">
          Kelola persediaan dan penggunaan oli untuk alat berat
        </p>
        <div className="relative w-64">
          <select
            value={selectedOilType}
            onChange={(e) => {
              setSelectedOilType(e.target.value);
              setShowForm(false);
              setEditingItem(null);
            }}
            className="w-full p-2 border rounded-md appearance-none bg-white pr-8 cursor-pointer"
          >
            {oilTypes.map((type) => (
              <option key={type.id} value={type.id}>
                {type.name}
              </option>
            ))}
          </select>
          <ChevronDown
            className="absolute right-2 top-1/2 transform -translate-y-1/2 pointer-events-none"
            size={20}
          />
        </div>
      </div>

      <OilStockSummary
        transactions={transactions}
        currentStock={currentStock}
      />

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
              placeholder="Cari berdasarkan tanggal atau keterangan..."
            />
          </div>
          <div className="flex items-center gap-2 bg-white border rounded-lg px-3 py-1.5 text-sm">
            <Calendar size={16} className="text-gray-400 flex-shrink-0" />
            <input
              type="date"
              value={tableFilterFrom}
              onChange={(e) => setTableFilterFrom(e.target.value)}
              className="border-0 bg-transparent focus:ring-0 text-sm p-0 w-[120px]"
            />
            <span className="text-gray-400">—</span>
            <input
              type="date"
              value={tableFilterTo}
              onChange={(e) => setTableFilterTo(e.target.value)}
              className="border-0 bg-transparent focus:ring-0 text-sm p-0 w-[120px]"
            />
            {(tableFilterFrom || tableFilterTo) && (
              <button
                onClick={() => {
                  setTableFilterFrom("");
                  setTableFilterTo("");
                }}
                className="ml-1 p-0.5 rounded-full text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                title="Reset filter tanggal"
              >
                <X size={14} />
              </button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:flex sm:flex-wrap gap-2 w-full sm:w-auto">
          {canImport && (
          <ExcelImportButton
            onDataParsed={handleOliExcelDataParsed}
            expectedHeaders={expectedOliHeaders}
            buttonText="Impor Excel Oli"
            className="flex items-center justify-center gap-1 px-3 py-2 text-xs sm:text-sm sm:px-4 sm:py-2 text-white bg-teal-600 rounded hover:bg-teal-700 w-full sm:w-auto"
          >
            <Upload size={16} className="mr-1" />
            Impor
          </ExcelImportButton>
          )}
          {canCreate && (
            <button
              onClick={() => {
                setEditingItem(null);
                setShowForm(true);
              }}
              className="flex items-center justify-center gap-1 px-3 py-2 text-xs sm:text-sm sm:px-4 sm:py-2 text-white bg-blue-600 rounded hover:bg-blue-700 w-full sm:w-auto"
            >
              <Plus size={16} />
              Tambah Transaksi
            </button>
          )}
          {canPrint && (
          <button
            onClick={() => {
              setDialogMode("all");
              setExportPrintDialog("print");
            }}
            className="flex items-center justify-center gap-1 px-3 py-2 text-xs sm:text-sm sm:px-4 sm:py-2 text-white bg-purple-600 rounded hover:bg-purple-700 w-full sm:w-auto"
          >
            <Printer size={16} />
            Cetak
          </button>
          )}
          {canExportExcel && (
          <button
            onClick={() => {
              setDialogMode("all");
              setExportPrintDialog("export");
            }}
            className="flex items-center justify-center gap-1 px-3 py-2 text-xs sm:text-sm sm:px-4 sm:py-2 text-white bg-green-600 rounded hover:bg-green-700 w-full sm:w-auto"
          >
            <Download size={16} />
            Ekspor Excel
          </button>
          )}
        </div>
      </div>

      {showForm && (
        <OilTransactionForm
          onSubmit={handleFormSubmit}
          onCancel={() => {
            setShowForm(false);
            setEditingItem(null);
          }}
          editingItem={editingItem}
        />
      )}

      <div className="glass-card">
        <TableScrollWrapper>
          <table className="data-table">
            <thead>
              <tr>
                <th>Tanggal</th>
                <th>Jenis</th>
                <th>Volume (L)</th>
                <th>Harga per Liter</th>
                <th>Total Harga</th>
                <th>Keterangan</th>
                <th>No. Lambung</th>
                <th>Nama Alat</th>
                <th>Lokasi Proyek</th>
                {canShowActions && <th>Aksi</th>}
              </tr>
            </thead>
            <tbody>
              {filteredData.length > 0 ? (
                paginateData(filteredData, currentPage, pageSize).map((item) => (
                  <tr key={item.id}>
                    <td>{formatDateDisplay(item.tanggal)}</td>
                    <td>
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          item.jenis === "pembelian"
                            ? "bg-blue-100 text-blue-800"
                            : item.jenis === "sisa_stock"
                            ? "bg-green-100 text-green-800"
                            : "bg-amber-100 text-amber-800"
                        }`}
                      >
                        {item.jenis === "pembelian" ? "Pembelian" : item.jenis === "sisa_stock" ? "Sisa Stock" : "Pemakaian"}
                      </span>
                    </td>
                    <td>{item.volume.toLocaleString("id-ID")}</td>
                    <td>
                      {item.hargaPembelian
                        ? formatCurrency(item.hargaPembelian)
                        : "-"}
                    </td>
                    <td>
                      {item.totalHarga ? formatCurrency(item.totalHarga) : "-"}
                    </td>
                    <td>{item.keterangan}</td>
                    <td>{item.noLambung || "-"}</td>
                    <td>{item.namaAlat || "-"}</td>
                    <td>{item.lokasiProyek || "-"}</td>
                    {canShowActions && (
                      <td>
                        <div className="flex gap-2">
                          {canEdit && (
                            <button
                              onClick={() => handleEdit(item)}
                              className="p-1 text-blue-600 hover:text-blue-800"
                            >
                              <Edit size={18} />
                            </button>
                          )}
                          {canDelete && (
                            <button
                              onClick={() => handleDelete(item.id)}
                              className="p-1 text-red-600 hover:text-red-800"
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
                  <td colSpan={10} className="text-center py-4">
                    {searchTerm
                      ? "Tidak ada data yang sesuai dengan pencarian"
                      : "Belum ada data transaksi oli"}
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
      {/* ══ EXPORT/PRINT DIALOG ════════════════════════════ */}
      {exportPrintDialog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4 shadow-2xl">
            <h3 className="text-lg font-semibold mb-1">
              {exportPrintDialog === "export"
                ? "📥 Ekspor Data"
                : "🖨️ Cetak Transaksi Oli"}
            </h3>
            <p className="text-sm text-gray-500 mb-5">
              Pilih data yang ingin{" "}
              {exportPrintDialog === "export" ? "diekspor" : "dicetak"}:
            </p>

            <div className="flex flex-col gap-3 mb-5">
              <label
                className={`flex items-center gap-3 p-3 border-2 rounded-lg cursor-pointer transition-all ${
                  dialogMode === "all"
                    ? "border-blue-500 bg-blue-50/50"
                    : "border-gray-200 hover:border-gray-300"
                }`}
                onClick={() => setDialogMode("all")}
              >
                <input
                  type="radio"
                  name="oliMode"
                  checked={dialogMode === "all"}
                  onChange={() => setDialogMode("all")}
                  className="accent-blue-600"
                />
                <div>
                  <p className="font-medium text-sm">Semua Data</p>
                  <p className="text-xs text-gray-500">
                    {filteredData.length} transaksi akan di
                    {exportPrintDialog === "export" ? "ekspor" : "cetak"}
                  </p>
                </div>
              </label>
              <label
                className={`flex items-center gap-3 p-3 border-2 rounded-lg cursor-pointer transition-all ${
                  dialogMode === "range"
                    ? "border-blue-500 bg-blue-50/50"
                    : "border-gray-200 hover:border-gray-300"
                }`}
                onClick={() => setDialogMode("range")}
              >
                <input
                  type="radio"
                  name="oliMode"
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
                <Calendar size={16} className="text-gray-400 flex-shrink-0" />
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
                className="px-4 py-2 text-white rounded-lg text-sm bg-blue-600 hover:bg-blue-700"
              >
                {exportPrintDialog === "export" ? "Ekspor" : "Cetak Sekarang"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StockOli;

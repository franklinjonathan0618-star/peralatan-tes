import { useState } from "react";
import { Calendar, FileDown, Printer, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/use-toast";
// Import jsPDF and autoTable with dynamic imports to avoid initialization issues
const loadJsPDF = async () => {
  const { jsPDF } = await import('jspdf');
  const autoTable = (await import('jspdf-autotable')).default;
  return { jsPDF, autoTable };
};
import { format } from "date-fns";
import { DateRangePicker } from "@/components/ui/date-range-picker";

interface BBMStockNavProps {
  onDateRangeChange: (startDate: Date | null, endDate: Date | null) => void;
  onSearch: (query: string) => void;
  data: {
    tanggalPembelian: Date;
    volumePembelian: number;
    hargaPerLiter: number;
    tanggalPemakaian: Date | null;
    volumePemakaian: number;
    keteranganPemakaian: string;
    namaAlatBerat: string;
    lokasiProyek?: string;
  }[];
}

export function BBMStockNav({ onDateRangeChange, onSearch, data }: BBMStockNavProps) {
  const { toast } = useToast();
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const handleDateChange = (value: { from?: Date; to?: Date }) => {
    const start = value?.from ?? null;
    const end = value?.to ?? null;
    setStartDate(start);
    setEndDate(end);
    onDateRangeChange(start, end);
  };

  const handleSearch = (value: string) => {
    setSearchQuery(value);
    onSearch(value);
  };

  const handlePrint = () => {
    try {
      if (!data || data.length === 0) {
        alert('Tidak ada data untuk dicetak');
        return;
      }

      const printWin = window.open('', '_blank');
      if (!printWin) {
        alert('Tidak dapat membuka jendela cetak. Mohon nonaktifkan pemblokir pop-up untuk situs ini.');
        return;
      }

      // Create table rows HTML
      const tableRows = data.map(item => {
        const isPembelian = (item.volumePembelian || 0) > 0;
        const volume = isPembelian ? (item.volumePembelian || 0) : (item.volumePemakaian || 0);
        const total = isPembelian ? (item.hargaPerLiter || 0) * volume : 0;
        const tanggal = isPembelian ? item.tanggalPembelian : (item.tanggalPemakaian || new Date());

        return `
          <tr>
            <td>${format(new Date(tanggal), 'dd/MM/yyyy')}</td>
            <td>${isPembelian ? 'Pembelian' : 'Pemakaian'}</td>
            <td class="text-right">${volume.toLocaleString('id-ID')}</td>
            <td class="text-right">${isPembelian ? `Rp ${(item.hargaPerLiter || 0).toLocaleString('id-ID')}` : '-'}</td>
            <td class="text-right">${isPembelian ? `Rp ${total.toLocaleString('id-ID')}` : '-'}</td>
            <td>${item.namaAlatBerat || '-'}</td>
            <td>${item.keteranganPemakaian || '-'}</td>
            <td>${item.lokasiProyek || '-'}</td>
          </tr>`;
      }).join('');

      // Date range text
      const dateRangeText = startDate && endDate
        ? `Periode: ${format(startDate, 'dd/MM/yyyy')} - ${format(endDate, 'dd/MM/yyyy')}`
        : 'Semua Data';

      // Search query text
      const searchText = searchQuery ? `<div>Pencarian: ${searchQuery}</div>` : '';

      // Current date and time
      const currentDate = new Date().toLocaleString('id-ID');

      // Create the complete HTML content
      const printContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <title>Laporan Stock BBM</title>
          <style>
            body { font-family: Arial, sans-serif; font-size: 12px; margin: 20px; }
            h1 { font-size: 18px; color: #1a365d; margin-bottom: 10px; }
            .header { margin-bottom: 15px; }
            .date-range { color: #4a5568; margin: 5px 0; }
            table { width: 100%; border-collapse: collapse; margin-top: 10px; page-break-inside: auto; }
            th { background-color: #2b6cb0; color: white; text-align: left; padding: 8px; }
            td { border: 1px solid #ddd; padding: 6px; }
            tr:nth-child(even) { background-color: #f9f9f9; }
            .text-right { text-align: right; }
            .footer { margin-top: 20px; font-size: 11px; color: #6c757d; text-align: center; }
            @media print {
              @page { margin: 1cm; size: landscape; }
              body { margin: 10px; }
              thead { display: table-header-group; }
              tfoot { display: table-footer-group; }
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>Laporan Stock BBM</h1>
            <div class="date-range">${dateRangeText}</div>
            ${searchText}
            <div>Dicetak pada: ${currentDate}</div>
          </div>
          
          <table>
            <thead>
              <tr>
                <th>Tanggal</th>
                <th>Jenis</th>
                <th>Volume (L)</th>
                <th>Harga/L</th>
                <th>Total</th>
                <th>Alat Berat</th>
                <th>Keterangan</th>
                <th>Lokasi</th>
              </tr>
            </thead>
            <tbody>${tableRows}</tbody>
          </table>
          
          <div class="footer">
            <p>Dicetak pada: ${currentDate}</p>
          </div>
        </body>
        </html>`;

      // Write to print window
      printWin.document.open();
      printWin.document.write(printContent);
      printWin.document.close();

      // Wait for content to load before printing
      printWin.onload = () => {
        try {
          // Small delay to ensure all content is rendered
          setTimeout(() => {
            try {
              // Try to print
              printWin.print();

              // Close the window after a delay if still open
              setTimeout(() => {
                if (!printWin.closed) {
                  printWin.close();
                }
              }, 1000);
            } catch (printError) {
              console.error('Error printing:', printError);
              alert('Gagal membuka dialog cetak. Silakan gunakan menu cetak browser (Ctrl+P).');
              if (!printWin.closed) {
                printWin.close();
              }
            }
          }, 500);
        } catch (loadError) {
          console.error('Error in print handler:', loadError);
          alert('Terjadi kesalahan saat mencetak. Silakan coba lagi.');
          if (printWin && !printWin.closed) {
            printWin.close();
          }
        }
      };

    } catch (error) {
      console.error('Error generating print content:', error);
      alert('Terjadi kesalahan saat membuat konten untuk dicetak.');
    }
  };

  const handleExportPDF = async () => {
    if (!data || data.length === 0) {
      toast({
        title: "Tidak ada data",
        description: "Tidak ada data yang bisa diekspor.",
        variant: "destructive" as const,
      });
      return;
    }

    try {
      // Load jsPDF and autoTable
      const { jsPDF, autoTable } = await loadJsPDF();

      // Create a new PDF document in landscape mode
      const doc = new jsPDF({
        orientation: 'landscape',
        unit: 'mm',
        format: 'a4'
      });

      // Initialize autoTable
      // @ts-ignore - autoTable is added to the prototype by jspdf-autotable
      if (typeof doc.autoTable !== 'function') {
        // @ts-ignore
        doc.autoTable = autoTable;
      }

      // Set default font first
      doc.setFont('helvetica');
      doc.setFontSize(10);

      // Set document properties
      const title = 'Laporan Stock BBM';
      const dateRange = startDate && endDate
        ? `Periode: ${format(startDate, 'dd/MM/yyyy')} - ${format(endDate, 'dd/MM/yyyy')}`
        : 'Semua Data';
      const searchInfo = searchQuery ? `Pencarian: ${searchQuery}` : '';
      const printDate = `Dicetak pada: ${new Date().toLocaleString('id-ID')}`;

      // Add title and info
      doc.setFontSize(16);
      doc.text(title, 14, 20);

      doc.setFontSize(10);
      doc.setTextColor(100);

      // Add text with proper line spacing
      let yPos = 30;
      doc.text(dateRange, 14, yPos);

      if (searchInfo) {
        yPos += 5;
        doc.text(searchInfo, 14, yPos);
      }

      yPos += 5;
      doc.text(printDate, 14, yPos);

      // Adjust startY for the table based on the content above it
      const startY = yPos + 10;

      // Prepare table data
      const tableColumn = [
        'Tanggal',
        'Jenis',
        'Volume (L)',
        'Harga/Liter',
        'Total',
        'Alat Berat',
        'Keterangan',
        'Lokasi Proyek'
      ];

      const tableRows = data.map(item => {
        const isPembelian = (item.volumePembelian || 0) > 0;
        const volume = isPembelian ? (item.volumePembelian || 0) : (item.volumePemakaian || 0);
        const total = isPembelian ? (item.hargaPerLiter || 0) * volume : 0;
        const tanggal = isPembelian ? item.tanggalPembelian : (item.tanggalPemakaian || new Date());

        return [
          format(new Date(tanggal), 'dd/MM/yyyy'),
          isPembelian ? 'Pembelian' : 'Pemakaian',
          volume.toLocaleString('id-ID'),
          isPembelian ? `Rp ${(item.hargaPerLiter || 0).toLocaleString('id-ID')}` : '-',
          isPembelian ? `Rp ${total.toLocaleString('id-ID')}` : '-',
          item.namaAlatBerat || '-',
          item.keteranganPemakaian || '-',
          item.lokasiProyek || '-'
        ];
      });

      // Add table using autoTable
      autoTable(doc, {
        head: [tableColumn],
        body: tableRows,
        startY: startY,
        styles: {
          fontSize: 8,
          cellPadding: 2,
          valign: 'middle',
          overflow: 'linebreak',
          halign: 'center',
          lineWidth: 0.1
        },
        margin: { top: startY },
        headStyles: {
          fillColor: [43, 108, 176],
          textColor: 255,
          fontStyle: 'bold'
        },
        alternateRowStyles: {
          fillColor: 245
        },
        didDrawPage: function (data: any) {
          // Footer
          const pageSize = doc.internal.pageSize;
          const pageHeight = pageSize.height ? pageSize.height : pageSize.getHeight();
          doc.text(
            `Halaman ${data.pageNumber}`,
            data.settings.margin.left,
            pageHeight - 10
          );
        }
      });

      // Save the PDF
      doc.save('laporan-bbm.pdf');

      toast({
        title: "Berhasil",
        description: "PDF berhasil diunduh.",
        variant: "default" as const,
      });
    } catch (error) {
      console.error('Error generating PDF:', error);
      toast({
        title: "Gagal",
        description: "Terjadi kesalahan saat membuat PDF.",
        variant: "destructive" as const,
      });
    }
  };

  return (
    <div className="bg-white border-b border-gray-200 py-3">
      <div className="container mx-auto px-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-gray-500" />
              <DateRangePicker
                value={{
                  from: startDate || undefined,
                  to: endDate || undefined
                }}
                onValueChange={handleDateChange}
              />
            </div>
            <div className="flex items-center gap-2">
              <Search className="h-4 w-4 text-gray-500" />
              <Input
                type="text"
                placeholder="Cari alat berat..."
                value={searchQuery}
                onChange={(e) => handleSearch(e.target.value)}
                className="w-[200px]"
              />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handlePrint}
              className="flex items-center gap-2"
            >
              <Printer className="h-4 w-4" />
              Print
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleExportPDF}
              className="flex items-center gap-2"
            >
              <FileDown className="h-4 w-4" />
              Export PDF
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

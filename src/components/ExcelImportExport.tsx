import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Upload, Download } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

interface ExcelImportExportProps {
  onImport: (data: any[]) => Promise<void> | void;
  onExport: () => any[] | Promise<any[]>;
  fileName?: string;
  sheetName?: string;
  acceptedColumns?: string[];
}

export const ExcelImportExport = ({
  onImport,
  onExport,
  fileName = 'export',
  sheetName = 'Data',
  acceptedColumns = []
}: ExcelImportExportProps) => {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleExport = async () => {
    try {
      setIsLoading(true);
      const data = await Promise.resolve(onExport());
      
      if (!data || data.length === 0) {
        toast({
          title: "Info",
          description: "Tidak ada data untuk diekspor",
          variant: "default"
        });
        return;
      }

      // Dynamically import xlsx to avoid issues
      const XLSX = (await import('xlsx')).default;

      const ws = XLSX.utils.json_to_sheet(data);
      
      // Auto-size columns
      const colWidths = Object.keys(data[0] || {}).map(key => ({
        wch: Math.max(
          key.length,
          Math.max(...data.map(row => String(row[key] || '').length))
        ) + 2
      }));
      ws['!cols'] = colWidths;

      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, sheetName);
      
      const timeStamp = new Date().toISOString().split('T')[0];
      XLSX.writeFile(wb, `${fileName}_${timeStamp}.xlsx`);

      toast({
        title: "Sukses",
        description: `Data berhasil diekspor ke ${fileName}_${timeStamp}.xlsx`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Gagal mengekspor data",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      setIsLoading(true);
      
      const XLSX = (await import('xlsx')).default;
      const reader = new FileReader();

      reader.onload = async (e) => {
        try {
          const data = e.target?.result;
          const workbook = XLSX.read(data, { type: 'binary' });
          const sheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[sheetName];
          const jsonData = XLSX.utils.sheet_to_json(worksheet);

          if (!jsonData || jsonData.length === 0) {
            toast({
              title: "Error",
              description: "File Excel kosong atau tidak memiliki data",
              variant: "destructive"
            });
            return;
          }

          // Validate columns if required
          if (acceptedColumns.length > 0 && jsonData && jsonData.length > 0) {
            const firstRow = jsonData[0] as Record<string, unknown>;
            const dataColumns = Object.keys(firstRow);
            const missingColumns = acceptedColumns.filter(col => !dataColumns.includes(col));
            
            if (missingColumns.length > 0) {
              toast({
                title: "Error",
                description: `Kolom yang hilang: ${missingColumns.join(', ')}`,
                variant: "destructive"
              });
              return;
            }
          }

          await onImport(jsonData);
          
          toast({
            title: "Sukses",
            description: `${jsonData.length} baris data berhasil diimpor`,
          });

          // Reset file input
          if (fileInputRef.current) {
            fileInputRef.current.value = '';
          }
        } catch (error) {
          toast({
            title: "Error",
            description: error instanceof Error ? error.message : "Gagal memproses file",
            variant: "destructive"
          });
        } finally {
          setIsLoading(false);
        }
      };

      reader.onerror = () => {
        toast({
          title: "Error",
          description: "Gagal membaca file",
          variant: "destructive"
        });
        setIsLoading(false);
      };

      reader.readAsBinaryString(file);
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Gagal memproses file",
        variant: "destructive"
      });
      setIsLoading(false);
    }
  };

  return (
    <div className="flex gap-2">
      <input
        ref={fileInputRef}
        type="file"
        accept=".xlsx,.xls,.csv"
        onChange={handleFileChange}
        className="hidden"
      />
      
      <Button
        onClick={handleImportClick}
        disabled={isLoading}
        variant="outline"
        size="sm"
        title="Import data dari file Excel"
      >
        <Upload className="w-4 h-4 mr-2" />
        Import Excel
      </Button>

      <Button
        onClick={handleExport}
        disabled={isLoading}
        variant="outline"
        size="sm"
        title="Export data ke file Excel"
      >
        <Download className="w-4 h-4 mr-2" />
        Export Excel
      </Button>
    </div>
  );
};

export default ExcelImportExport;

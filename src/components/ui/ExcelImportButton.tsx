import React, { useRef, useState } from 'react';
import * as XLSX from 'xlsx';
import { Button } from '@/components/ui/button';
import { Upload } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

interface ExcelImportButtonProps {
  onDataParsed: (data: any[], fileName?: string) => void;
  buttonText?: string;
  expectedHeaders?: string[];
  className?: string;
  children?: React.ReactNode;
}

const ExcelImportButton: React.FC<ExcelImportButtonProps> = ({
  onDataParsed,
  buttonText = 'Impor Excel',
  expectedHeaders,
  className,
  children
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const processWorkbook = (workbook: XLSX.WorkBook) => {
    let allData: any[] = [];
    
    // Process each sheet in the workbook
    workbook.SheetNames.forEach(sheetName => {
      const worksheet = workbook.Sheets[sheetName];
      const jsonData = XLSX.utils.sheet_to_json(worksheet, { defval: '', raw: false });
      
      if (expectedHeaders && expectedHeaders.length > 0 && jsonData.length > 0) {
        // Get headers from the first row of data
        const firstRow = jsonData[0];
        const actualHeaders = Object.keys(firstRow as Record<string, unknown>).map(h => String(h).trim().toLowerCase());
        
        // Relaxed check: use fuzzy/includes matching
        const missingHeaders = expectedHeaders.filter(header => {
          const h = header.trim().toLowerCase();
          return !actualHeaders.some(a => a === h || a.includes(h) || h.includes(a));
        });
        
        if (missingHeaders.length > 0) {
          console.warn(`Lembar '${sheetName}' tidak memiliki kolom: ${missingHeaders.join(', ')}. Impor tetap dilanjutkan.`);
        }
      }
      
      // Add all rows from this sheet to our combined data
      allData = [...allData, ...jsonData];
    });
    
    return allData;
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    setIsLoading(true);
    const file = event.target.files?.[0];
    
    if (!file) {
      setIsLoading(false);
      return;
    }
    
    // Check file type
    if (!file.name.endsWith('.xlsx') && !file.name.endsWith('.xls') && !file.name.endsWith('.csv')) {
      toast({
        title: 'Format File Tidak Didukung',
        description: 'Hanya file Excel (.xlsx, .xls) yang didukung',
        variant: 'destructive',
      });
      setIsLoading(false);
      return;
    }

    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        if (!data) {
          throw new Error('Tidak dapat membaca file');
        }
        
        // Read the workbook
        const workbook = XLSX.read(data, { type: 'array', cellDates: true });
        
        // Process all sheets in the workbook
        const allData = processWorkbook(workbook);
        
        if (allData.length === 0) {
          throw new Error('Tidak ada data yang ditemukan dalam file Excel');
        }
        
        // Send all data to parent component
        onDataParsed(allData, file.name);
        
        toast({
          title: 'Impor Berhasil',
          description: `Berhasil memproses ${allData.length} baris data dari ${workbook.SheetNames.length} lembar kerja`,
        });
        
      } catch (error) {
        console.error('Error processing Excel file:', error);
        toast({
          title: 'Error Memproses File',
          description: error instanceof Error ? error.message : 'Terjadi kesalahan saat memproses file Excel',
          variant: 'destructive',
          duration: 10000,
        });
      } finally {
        setIsLoading(false);
        // Reset file input to allow re-uploading the same file
        if (fileInputRef.current) fileInputRef.current.value = '';
      }
    };

    reader.onerror = (error) => {
      console.error('FileReader error:', error);
      toast({
        title: 'Error File Reader',
        description: 'Tidak dapat membaca file.',
        variant: 'destructive',
      });
      setIsLoading(false);
      if (fileInputRef.current) fileInputRef.current.value = ''; // Reset file input
    };

    reader.readAsArrayBuffer(file);
  };

  const handleButtonClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <>
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept=".xlsx, .xls"
        style={{ display: 'none' }}
        disabled={isLoading}
      />
      {children ? (
        <div onClick={!isLoading ? handleButtonClick : undefined} className={className} style={{ cursor: isLoading ? 'not-allowed' : 'pointer'}}>
          {children}
        </div>
      ) : (
        <Button onClick={handleButtonClick} className={className} disabled={isLoading}>
          <Upload className="mr-2 h-4 w-4" />
          {isLoading ? 'Memproses...' : buttonText}
        </Button>
      )}
    </>
  );
};

export default ExcelImportButton;

import * as XLSX from 'xlsx';
import { toast } from '@/components/ui/use-toast';

export const exportToExcel = (data: any[], fileName: string, sheetName: string = 'Data') => {
  try {
    if (!data || data.length === 0) {
      toast({
        title: 'Info',
        description: 'Tidak ada data untuk diekspor',
      });
      return;
    }

    const worksheet = XLSX.utils.json_to_sheet(data);
    
    // Auto-size columns
    const colWidths = Object.keys(data[0]).map(key => ({
      wch: Math.max(
        key.length,
        Math.max(...data.map(row => String(row[key] || '').length))
      ) + 2
    }));
    worksheet['!cols'] = colWidths;

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
    XLSX.writeFile(workbook, `${fileName}_${new Date().toISOString().split('T')[0]}.xlsx`);

    toast({
      title: 'Success',
      description: 'Data berhasil diexport ke Excel.',
    });
  } catch (error) {
    console.error('Error exporting to Excel:', error);
    toast({
      title: 'Error',
      description: 'Gagal mengekspor data ke Excel',
      variant: 'destructive',
    });
  }
};

/**
 * Import data from Excel file
 * @param file - Excel file to import
 * @returns Promise with parsed data
 */
export const importFromExcel = (file: File): Promise<any[]> => {
  return new Promise((resolve, reject) => {
    try {
      const reader = new FileReader();
      
      reader.onload = (event) => {
        try {
          const data = event.target?.result;
          const workbook = XLSX.read(data, { type: 'binary', cellDates: true });
          const sheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[sheetName];
          const jsonData = XLSX.utils.sheet_to_json(worksheet, { defval: '' });
          
          if (!jsonData || jsonData.length === 0) {
            throw new Error('File Excel kosong atau tidak memiliki data');
          }
          
          resolve(jsonData);
        } catch (error) {
          reject(new Error(`Error membaca file Excel: ${error instanceof Error ? error.message : 'Unknown error'}`));
        }
      };

      reader.onerror = () => {
        reject(new Error('Error membaca file'));
      };

      reader.readAsBinaryString(file);
    } catch (error) {
      reject(error);
    }
  });
};

/**
 * Validate imported data against expected columns
 * @param data - Imported data
 * @param expectedColumns - Array of expected column names
 */
export const validateImportedData = (
  data: any[],
  expectedColumns: string[]
): { valid: boolean; missingColumns: string[] } => {
  if (!data || data.length === 0) {
    return { valid: false, missingColumns: [] };
  }

  const dataColumns = Object.keys(data[0]);
  const missingColumns = expectedColumns.filter(col => !dataColumns.includes(col));

  return {
    valid: missingColumns.length === 0,
    missingColumns
  };
};

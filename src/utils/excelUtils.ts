import * as XLSX from 'xlsx';

/**
 * Export data to Excel file
 * @param data - Array of objects to export
 * @param fileName - Name of the file to be saved
 * @param sheetName - Name of the worksheet
 */
export const exportToExcel = (
  data: any[],
  fileName: string = 'export',
  sheetName: string = 'Data'
) => {
  try {
    if (!data || data.length === 0) {
      throw new Error('Tidak ada data untuk diekspor');
    }

    const ws = XLSX.utils.json_to_sheet(data);
    
    // Auto-size columns
    const colWidths = Object.keys(data[0]).map(key => ({
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
    
    return true;
  } catch (error) {
    console.error('Error exporting to Excel:', error);
    throw error;
  }
};

/**
 * Export multiple sheets to a single Excel file
 * @param sheets - Array of sheet configurations: { data: any[], name: string }
 * @param fileName - Name of the file to be saved
 */
export const exportMultipleSheetsToExcel = (
  sheets: Array<{ data: any[]; name: string }>,
  fileName: string = 'export'
) => {
  try {
    if (!sheets || sheets.length === 0) {
      throw new Error('Tidak ada data sheet untuk diekspor');
    }

    const wb = XLSX.utils.book_new();

    sheets.forEach(sheet => {
      // Skip empty sheet data or create empty sheet
      const wsData = sheet.data && sheet.data.length > 0 ? sheet.data : [{ 'Info': 'Tidak ada data untuk kategori ini' }];
      const ws = XLSX.utils.json_to_sheet(wsData);
      
      // Auto-size columns if there is actual data
      if (sheet.data && sheet.data.length > 0) {
        const colWidths = Object.keys(wsData[0]).map(key => ({
          wch: Math.max(
            key.length,
            Math.max(...wsData.map(row => String(row[key] || '').length))
          ) + 2
        }));
        ws['!cols'] = colWidths;
      }
      
      XLSX.utils.book_append_sheet(wb, ws, sheet.name);
    });

    const timeStamp = new Date().toISOString().split('T')[0];
    XLSX.writeFile(wb, `${fileName}_Lengkap_${timeStamp}.xlsx`);
    
    return true;
  } catch (error) {
    console.error('Error exporting multiple sheets to Excel:', error);
    throw error;
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
          const workbook = XLSX.read(data, { type: 'binary' });
          const sheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[sheetName];
          const jsonData = XLSX.utils.sheet_to_json(worksheet);
          
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
 * Prepare data for export with custom column mapping
 * @param data - Original data
 * @param columnMapping - Map from original key to display key
 */
export const prepareDataForExport = (
  data: any[],
  columnMapping?: Record<string, string>
) => {
  if (!columnMapping) {
    return data;
  }

  return data.map(item => {
    const newItem: any = {};
    Object.entries(columnMapping).forEach(([originalKey, displayKey]) => {
      newItem[displayKey] = item[originalKey];
    });
    return newItem;
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

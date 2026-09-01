# Implementasi Import/Export Excel - Summary Implementasi

## Status Implementasi

### ✅ Selesai
- **DataAlatBerat.tsx** - Full implementation dengan import/export Excel
- **DataAlatPendukung.tsx** - Full implementation dengan import/export Excel

### ⏳ Siap di-Update (Dalam Antrian)
- **StockBBM.tsx**
- **StockOli.tsx**
- **StockSparepart.tsx**
- **SewaAlat.tsx**
- **SewaAlatEksternal.tsx**
- **FormPerbaikan.tsx**
- **TimeSheet.tsx** (Sudah ada logika import/export tapi perlu improvement)
- **RPA.tsx**
- **PPA.tsx**

## Template Implementation Pattern

Setiap page harus mengikuti pattern ini untuk konsistensi:

### 1. Import Statements (Update di awal file)
```typescript
import { useRef, useCallback } from 'react'; // Tambah useRef dan useCallback jika belum ada
import { Upload, Download } from 'lucide-react'; // Tambah Upload icon
import { exportToExcel, importFromExcel, validateImportedData } from '@/lib/excelUtils';
```

### 2. State Declaration (Dalam component)
```typescript
const [isImporting, setIsImporting] = useState(false);
const fileInputRef = useRef<HTMLInputElement>(null);
```

### 3. Handler Functions (Sebelum return statement)
```typescript
// Handle import button click
const handleImportClick = () => {
  fileInputRef.current?.click();
};

// Handle file change and import
const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
  const file = e.target.files?.[0];
  if (!file) return;

  setIsImporting(true);
  try {
    const importedData = await importFromExcel(file);

    // Validate expected columns - SESUAIKAN DENGAN KOLOM PAGE
    const expectedColumns = [
      'Kolom1', 'Kolom2', 'Kolom3', 
      // ... sesuaikan dengan expected columns
    ];
    
    const validation = validateImportedData(importedData, expectedColumns);
    if (!validation.valid) {
      toast({
        title: "Error",
        description: `Kolom yang hilang: ${validation.missingColumns.join(', ')}`,
        variant: "destructive" as const,
      });
      setIsImporting(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    // Process imported data
    let successCount = 0;
    let errorCount = 0;

    for (let i = 0; i < importedData.length; i++) {
      try {
        const item = importedData[i];
        
        // Validate required fields
        if (!item['Kolom1'] || !item['Kolom2']) {
          throw new Error('Kolom1 dan Kolom2 harus diisi');
        }

        // Map imported data to appropriate structure
        const newData = {
          field1: item['Kolom1'],
          field2: item['Kolom2'],
          field3: item['Kolom3'],
          // ... sesuaikan mapping
        };

        // Add to database
        await new Promise((resolve, reject) => {
          addMutation.mutate(newData, {
            onSuccess: resolve,
            onError: reject,
          });
        });

        successCount++;
      } catch (error) {
        errorCount++;
        console.error(`Error processing row ${i + 1}:`, error);
      }
    }

    // Show result message
    let message = `Import selesai: ${successCount} berhasil`;
    if (errorCount > 0) {
      message += `, ${errorCount} gagal`;
    }

    toast({
      title: successCount > 0 ? 'Import Berhasil' : 'Import Gagal',
      description: message,
      variant: successCount > 0 ? 'default' : 'destructive',
    });

  } catch (error) {
    console.error('Error importing Excel:', error);
    toast({
      title: "Error",
      description: error instanceof Error ? error.message : "Gagal mengimpor data dari Excel",
      variant: "destructive" as const,
    });
  } finally {
    setIsImporting(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    e.target.value = '';
  }
};

// Export to Excel handler
const handleExportToExcel = () => {
  if (!filteredData || filteredData.length === 0) {
    toast({
      title: "Tidak ada data",
      description: "Tidak ada data yang bisa diekspor",
      variant: "destructive" as const,
    });
    return;
  }

  try {
    const dataToExport = filteredData.map((item) => ({
      'Kolom1': item.field1,
      'Kolom2': item.field2,
      'Kolom3': item.field3,
      // ... sesuaikan dengan kolom yang ingin di-export
    }));

    exportToExcel(dataToExport, 'nama-file');
  } catch (error) {
    console.error('Error exporting to Excel:', error);
    toast({
      title: "Error",
      description: "Gagal mengekspor data ke Excel",
      variant: "destructive" as const,
    });
  }
};
```

### 4. UI Elements (Di toolbar)
```typescript
<input
  ref={fileInputRef}
  type="file"
  accept=".xlsx,.xls,.csv"
  onChange={handleFileChange}
  className="hidden"
/>

<Button 
  onClick={handleImportClick} 
  variant="outline"
  disabled={isImporting}
>
  <Upload className="mr-2 h-4 w-4" />
  {isImporting ? 'Mengimpor...' : 'Import Excel'}
</Button>

<Button 
  onClick={handleExportToExcel} 
  variant="outline"
>
  <FileDown className="mr-2 h-4 w-4" />
  Export Excel
</Button>
```

## Data Structure untuk Import/Export

### StockBBM
**Expected Columns:**
- Tanggal
- Jenis BBM
- No Polisi/Operasional
- Jumlah (Liter)
- Harga Per Liter
- Total Harga
- Keterangan

### StockOli
**Expected Columns:**
- Tanggal
- Jenis Oli
- No Polisi/Operasional
- Jumlah (Liter)
- Keterangan

### StockSparepart
**Expected Columns:**
- Nama Item
- Jumlah Stok
- Harga Per Item
- Satuan Item
- Keterangan

### SewaAlat
**Expected Columns:**
- Tanggal Mulai
- Tanggal Selesai
- Nama Alat
- Jenis Alat
- Lokasi
- Operator
- Keterangan

### TimeSheet
**Expected Columns:**
- Tanggal
- No Lambung
- Nama Operator
- Nama Alat
- Sesi 1 Mulai
- Sesi 1 Selesai
- Sesi 2 Mulai
- Sesi 2 Selesai
- Sesi 3 Mulai
- Sesi 3 Selesai
- Total Jam
- Aktivitas
- Lokasi
- Keterangan
- BBM (L)
- Oli 40 (L)
- Oli 10 (L)
- Oli 90 (L)

## Utility Functions Available

Di `/src/lib/excelUtils.ts` sudah tersedia:
- `exportToExcel(data, fileName, sheetName)` - Export ke Excel
- `importFromExcel(file)` - Import dari Excel
- `validateImportedData(data, expectedColumns)` - Validasi kolom yang di-import

## Best Practices Implementasi

1. **Validasi Input**: Selalu validasi data yang di-import
2. **Error Handling**: Tampilkan detail error untuk setiap baris yang gagal
3. **Toast Messages**: Gunakan toast untuk feedback user
4. **Loading State**: Gunakan state untuk menunjukkan proses import/export
5. **File Reset**: Reset file input setelah import selesai
6. **Column Mapping**: Pastikan header Excel sesuai dengan expected columns

## Troubleshooting

Jika ada issues dengan implementasi:
1. Pastikan expected columns sesuai dengan nama kolom di Excel
2. Check console untuk error messages
3. Validasi struktur data yang di-import
4. Pastikan mutation functions (addMutation, etc) bekerja dengan baik

## Testing

Sebelum go-to-production:
1. Test dengan sample Excel file
2. Test dengan data yang tidak lengkap
3. Test dengan format yang berbeda
4. Test dengan jumlah data yang banyak


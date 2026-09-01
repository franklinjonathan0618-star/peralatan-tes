# Panduan Implementasi Import/Export Excel

## Ringkasan

Project ini sudah dilengkapi dengan komponen dan utility functions untuk import/export Excel yang dapat digunakan di semua pages dengan tabel data. Fitur ini memudahkan penambahan data dalam jumlah banyak melalui file Excel.

## File-File Utama

### 1. **ExcelImportExport Component** 
- **Lokasi**: `src/components/ExcelImportExport.tsx`
- **Fungsi**: Komponen reusable yang menyediakan tombol Import dan Export Excel
- **Props**:
  - `onImport`: Function untuk handle data yang diimport
  - `onExport`: Function untuk menyediakan data yang akan diekspor
  - `fileName`: Nama file untuk ekspor (default: 'export')
  - `sheetName`: Nama sheet dalam Excel (default: 'Data')
  - `acceptedColumns`: Array kolom yang expected (untuk validasi)

### 2. **Excel Utility Functions**
- **Lokasi**: `src/utils/excelUtils.ts`
- **Fungsi**:
  - `exportToExcel()`: Export data ke file Excel
  - `importFromExcel()`: Import data dari file Excel
  - `prepareDataForExport()`: Map custom column names
  - `validateImportedData()`: Validasi kolom yang diimport

## Cara Implementasi

### Langkah 1: Import Component
```typescript
import { ExcelImportExport } from '@/components/ExcelImportExport';
```

### Langkah 2: Buat Handler Functions

#### Export Handler
```typescript
const handleExportData = () => {
  return filteredData.map(item => ({
    'Kolom 1': item.field1,
    'Kolom 2': item.field2,
    'Kolom 3': item.field3,
    // ... sesuaikan dengan field yang ada
  }));
};
```

#### Import Handler
```typescript
const handleImportData = async (data: any[]) => {
  // Validasi dan proses data
  for (const item of data) {
    // Pastikan data sesuai dengan struktur yang diinginkan
    const newItem = {
      field1: item['Kolom 1'],
      field2: item['Kolom 2'],
      field3: item['Kolom 3'],
      // ... sesuaikan mapping
    };
    
    // Tambahkan ke database
    await addNewItem(newItem);
  }
};
```

### Langkah 3: Tambahkan Component ke UI
```typescript
<div className="flex items-center space-x-2">
  <ExcelImportExport
    onExport={handleExportData}
    onImport={handleImportData}
    fileName="nama-file"
    sheetName="Sheet Name"
    acceptedColumns={['Kolom 1', 'Kolom 2', 'Kolom 3']}
  />
  {/* Tombol lain */}
</div>
```

## Contoh Implementasi Lengkap

Lihat `src/pages/DataAlatBerat.tsx` untuk contoh implementasi lengkap dengan:
- Handler import dengan validasi
- Handler export dengan mapping kolom
- Integration dengan tabel yang ada

## Struktur File untuk Import

Format Excel yang diharapkan:
- Sheet pertama akan dibaca
- Baris pertama adalah header (nama kolom)
- Data mulai dari baris kedua
- Format file: `.xlsx`, `.xls`, atau `.csv`

## Tips & Best Practices

1. **Validasi Data**: Selalu validasi data saat import untuk menghindari data invalid
2. **Error Handling**: Tampilkan pesan error detail jika ada baris yang gagal
3. **Column Mapping**: Consistent naming dalam Excel untuk avoid typo
4. **Testing**: Test dengan data sample sebelum production
5. **Backup**: Selalu backup data sebelum import dalam jumlah besar

## Pages yang Sudah/Akan di-Update

- ✅ **DataAlatBerat.tsx** - Data Alat Berat
- ⏳ **DataAlatPendukung.tsx** - Data Alat Pendukung  
- ⏳ **StockBBM.tsx** - Stock BBM
- ⏳ **StockOli.tsx** - Stock Oli
- ⏳ **StockSparepart.tsx** - Stock Sparepart
- ⏳ **TimeSheet.tsx** - Time Sheet
- ⏳ **SewaAlat.tsx** - Sewa Alat
- ⏳ **SewaAlatEksternal.tsx** - Sewa Alat Eksternal
- ⏳ **FormPerbaikan.tsx** - Form Perbaikan

## Troubleshooting

### Import gagal dengan "Kolom yang hilang"
- Pastikan nama kolom di Excel sesuai dengan `acceptedColumns` yang ditetapkan
- Cek spelling dan pemisah whitespace

### Data tidak masuk ke database
- Validasi struktur data di `handleImportData`
- Cek console untuk error message yang lebih detail
- Pastikan field required tidak kosong

### Export hasilnya blank/kosong
- Pastikan ada data yang dapat diekspor
- Cek fungsi `onExport` mengembalikan array dengan data
- Pastikan mapping kolom sudah benar

## Dukungan

Untuk pertanyaan atau issues, silakan beri tahu development team.

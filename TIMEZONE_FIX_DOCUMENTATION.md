# Fix Timezone Database DATE ke Display

## Masalah yang Terjadi

Database kolom tanggal tertulis: **2026-04-07** (tipe data `DATE`)  
Tapi di tampilan menunjukkan: **2026-04-06T17:00:00.000Z** (offset -7 jam)

### Penyebab Root Cause

1. **MySQL DATE Type**: Menyimpan tanggal tanpa timezone info (hanya hari/bulan/tahun)
2. **JavaScript Parsing**: Saat string `"2026-04-07"` di-convert ke `new Date("2026-04-07")`, JavaScript menginterpretasi sebagai **UTC midnight** (00:00:00 UTC)
3. **Timezone Offset**: Aplikasi di Indonesia (WIB = UTC+7), sehingga 2026-04-07 00:00 UTC = 2026-04-06 17:00 WIB
4. **ISO String Display**: Ketika ditampilkan dengan format ISO (`toISOString()`), menghasilkan `2026-04-06T17:00:00.000Z`

**Ilustrasi:**

```
Database:  2026-04-07
    ↓
JavaScript: new Date("2026-04-07") → 2026-04-07T00:00:00.000Z (UTC)
    ↓
Browser (WIB): 2026-04-06T17:00:00 (timezone lokal)
    ↓
toISOString(): 2026-04-06T17:00:00.000Z (tampil offset 7 jam lebih awal)
```

## Solusi yang Diterapkan

### 1. Buat Utility Functions (`src/utils/dateUtils.ts`)

Membuat fungsi helper untuk parse MySQL DATE dengan benar:

```typescript
// Parse tanggal di timezone lokal, BUKAN UTC
export function parseMySQLDate(dateString: string): Date {
  const [year, month, day] = dateString.split('-').map(Number);
  return new Date(year, month - 1, day); // Constructor: new Date(year, month, day)
}

// Format untuk display UI
export function formatDateDisplay(date: string | Date): string {
  const dateObj = typeof date === 'string' ? parseMySQLDate(date) : date;
  return dateObj.toLocaleDateString('id-ID', {...});
}
```

**Perbedaan Parsing:**

```typescript
// ❌ SALAH - JavaScript interpret sebagai UTC
new Date("2026-04-07") → 2026-04-07T00:00:00.000Z

// ✅ BENAR - Parse di timezone lokal
new Date(2026, 3, 7) → 2026-04-07T00:00:00.000+07:00
```

### 2. Update Component yang Menampilkan Tanggal

**Sebelum:**

```tsx
{
  alatBerat.serviceTerakhir
    ? new Date(alatBerat.serviceTerakhir).toLocaleDateString("id-ID")
    : "-";
}
```

**Sesudah:**

```tsx
import { formatDateDisplay } from "@/utils/dateUtils";

{
  alatBerat.serviceTerakhir
    ? formatDateDisplay(alatBerat.serviceTerakhir)
    : "-";
}
```

### 3. File yang Sudah Diperbaiki

✅ **Display Components:**

- `src/components/dialogs/ViewAlatBeratDialog.tsx` - Tampilan detail alat berat
- `src/components/print/PrintableAlatBerat.tsx` - Print laporan alat berat
- `src/pages/laporan/LaporanKegiatanMekanik.tsx` - Laporan kegiatan mekanik (4 tempat)
- `src/pages/StockOli.tsx` - Display stock minyak (2 tempat)

✅ **Chart/Filtering Logic:**

- `src/components/dashboard/OilChart90.tsx` - Chart 6 bulan stock oli
  - Sort transactions
  - Filter untuk opening stock
  - Monthly grouping

### 4. Utility Functions Tersedia

```typescript
import {
  parseMySQLDate, // Parse string YYYY-MM-DD → Date (timezone lokal)
  formatDateDisplay, // Format untuk UI display
  formatDateForInput, // Format untuk HTML input[type="date"]
  formatDateForMySQL, // Format untuk kirim ke database
  adjustMySQLDateForComparison, // Adjust untuk date-fns comparison
} from "@/utils/dateUtils";
```

## Testing

Pastikan tanggal yang ditampilkan **SAMA** dengan di database:

| Database   | Tampilan yang Benar | Tampilan Salah |
| ---------- | ------------------- | -------------- |
| 2026-04-07 | 07 Apr 2026         | 06 Apr 2026    |
| 2026-01-15 | 15 Jan 2026         | 14 Jan 2026    |

## Langkah Implementasi untuk Database Lain

Jika ada kolom tanggal di tabel lain yang masih menggunakan `new Date()`:

1. Update component untuk import `formatDateDisplay`
2. Ganti `new Date(item.tanggal).toLocaleDateString()` dengan `formatDateDisplay(item.tanggal)`
3. Untuk comparison dengan date-fns, gunakan `parseMySQLDate(item.tanggal)` atau `adjustMySQLDateForComparison()`

## Notes Penting

- **MySQL DATE vs DATETIME**: Fix ini khusus untuk tipe `DATE`. Jika menggunakan `DATETIME` atau `TIMESTAMP`, cara parsing mungkin berbeda.
- **UTC+0 Timezone**: Jika aplikasi di timezone berbeda, timezone offset akan berbeda (misal UTC+0 tidak ada masalah)
- **Timezone Awareness**: Selalu gunakan utility ini daripada `new Date(stringDate)` untuk consistency

---

✅ **Timezone issue sudah fixed!** Tanggal sekarang akan ditampilkan dengan benar sesuai data di database.

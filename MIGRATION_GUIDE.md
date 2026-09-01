# 📚 Panduan Lengkap: Migrate Supabase dari Project Lama ke Project Baru

## 📋 Daftar Isi
1. [Persiapan](#persiapan)
2. [Step 1: Setup Schema di Project Baru](#step-1-setup-schema-di-project-baru)
3. [Step 2: Migrate Data](#step-2-migrate-data)
4. [Step 3: Verifikasi Migrasi](#step-3-verifikasi-migrasi)
5. [Troubleshooting](#troubleshooting)

---

## 🔧 Persiapan

### Informasi Project

**Project Lama (Sumber):**
- URL: `https://mdlamzewucztnxqnayqs.supabase.co`
- Anon Key: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1kbGFtemV3dWN6dG54cW5heXFzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDg2MDUwNzYsImV4cCI6MjA2NDE4MTA3Nn0.BCl0EACB25N96jzneJCKfFbq-ufbJg8pE-T0GVVUXAY`
- Service Role Key: **[Cek di dashboard project lama]**

**Project Baru (Tujuan):**
- URL: `https://jkqkywrckwkppfoezyes.supabase.co`
- Publishable Key: `sb_publishable_l-IEWUDE98cLkwr0QPwXJw_i868wU-o`
- Service Role Key: **[Cek di dashboard project baru]**

### Persyaratan
- Node.js >= 14
- npm atau yarn
- Akses ke dashboard Supabase project lama & baru
- File `MIGRATION_SCHEMA.sql` dan `migrate-data.ts` (sudah tersedia)

---

## 🚀 Step 1: Setup Schema di Project Baru

### 1.1 Jalankan SQL Migration di Project Baru

1. **Buka Supabase Dashboard Project Baru**
   - Kunjungi: https://app.supabase.com
   - Pilih project: `jkqkywrckwkppfoezyes`

2. **Buka SQL Editor**
   - Di sidebar, klik **SQL Editor**
   - Klik **New Query**

3. **Copy & Paste SQL Script**
   - Buka file: `MIGRATION_SCHEMA.sql` (di folder project)
   - Copy SEMUA isinya
   - Paste ke SQL Editor Supabase
   - Klik **Run** (tombol play)

4. **Verifikasi Eksekusi**
   - Tunggu hingga query selesai (biasanya 30-60 detik)
   - Anda akan melihat pesan sukses atau error
   - Jika ada error, lihat [Troubleshooting](#troubleshooting)

### ✅ Tandai Selesai
Jika semua query berhasil, lanjut ke Step 2.

---

## 📦 Step 2: Migrate Data

### 2.1 Update Konfigurasi di `migrate-data.ts`

1. **Buka file `migrate-data.ts`** di text editor

2. **Update Service Role Keys:**

```typescript
const OLD_PROJECT = {
  url: "https://mdlamzewucztnxqnayqs.supabase.co",
  anonKey: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  serviceRoleKey: "YOUR_OLD_SERVICE_ROLE_KEY", // ← GANTI INI
};

const NEW_PROJECT = {
  url: "https://jkqkywrckwkppfoezyes.supabase.co",
  anonKey: "sb_publishable_l-IEWUDE98cLkwr0QPwXJw_i868wU-o",
  serviceRoleKey: "YOUR_NEW_SERVICE_ROLE_KEY", // ← GANTI INI
};
```

3. **Cara Mendapatkan Service Role Key:**

**Untuk Project Lama:**
- Buka https://app.supabase.com
- Pilih project lama (`mdlamzewucztnxqnayqs`)
- Settings → API
- Cari **Service Role Key** atau **secret**
- Copy dan paste ke `OLD_PROJECT.serviceRoleKey`

**Untuk Project Baru:**
- Buka https://app.supabase.com
- Pilih project baru (`jkqkywrckwkppfoezyes`)
- Settings → API
- Cari **Service Role Key**
- Copy dan paste ke `NEW_PROJECT.serviceRoleKey`

### 2.2 Jalankan Script Migrasi Data

```bash
# 1. Arahkan ke folder project
cd "c:\Users\IT.MWT\OneDrive\Documents\GitHub\https-github.com-PollBTG-peralatan-mwt-divisi-infrastruktur-af5d93ac\peralatan-mwt-divisi-infrastruktur-af5d93ac"

# 2. Install dependencies (jika belum)
npm install

# 3. Jalankan script migrasi
npx ts-node migrate-data.ts
```

### 📊 Output Migrasi

Script akan menampilkan:
```
========================================
DATA MIGRATION IN PROGRESS
========================================

ℹ️  [10:30:45] Processing table: profiles
✅ [10:30:46] Exported 5 rows from profiles
✅ [10:30:47] Successfully imported 5 rows to profiles

ℹ️  [10:30:47] Processing table: ppa
✅ [10:30:48] Exported 12 rows from ppa
✅ [10:30:49] Successfully imported 12 rows to ppa

[... output untuk tabel-tabel lainnya ...]

========================================
FINAL STATISTICS
========================================
Total Tables: 16
Successful: 16
Failed/Empty: 0
Total Rows Exported: 487
Duration: 45s
========================================

✅ [10:31:30] Data migration completed!
```

---

## ✔️ Step 3: Verifikasi Migrasi

### 3.1 Cek Data di Project Baru

1. **Buka Supabase Dashboard Project Baru**
   - https://app.supabase.com → Pilih project baru

2. **Lihat Data di Table Editor**
   - Klik menu **Table Editor** di sidebar
   - Pilih table (misalnya: `ppa`, `timesheet`, dll)
   - Verifikasi data ada dan sesuai

3. **Jalankan Query Verifikasi**
   - Buka **SQL Editor**
   - Copy query di bawah:

```sql
-- Verifikasi jumlah row per table
SELECT 'profiles' as table_name, COUNT(*) as row_count FROM public.profiles
UNION ALL
SELECT 'ppa', COUNT(*) FROM public.ppa
UNION ALL
SELECT 'timesheet', COUNT(*) FROM public.timesheet
UNION ALL
SELECT 'kegiatan_mekanik', COUNT(*) FROM public.kegiatan_mekanik
UNION ALL
SELECT 'rpa', COUNT(*) FROM public.rpa
UNION ALL
SELECT 'rpa_details', COUNT(*) FROM public.rpa_details
UNION ALL
SELECT 'perbaikan', COUNT(*) FROM public.perbaikan
UNION ALL
SELECT 'alat_berat', COUNT(*) FROM public.alat_berat
UNION ALL
SELECT 'alat_pendukung', COUNT(*) FROM public.alat_pendukung
UNION ALL
SELECT 'bbm_transactions', COUNT(*) FROM public.bbm_transactions
UNION ALL
SELECT 'oli_transactions', COUNT(*) FROM public.oli_transactions
UNION ALL
SELECT 'bbm_stocks', COUNT(*) FROM public.bbm_stocks
UNION ALL
SELECT 'oli_stocks', COUNT(*) FROM public.oli_stocks
UNION ALL
SELECT 'sparepart', COUNT(*) FROM public.sparepart
UNION ALL
SELECT 'sewa_alat', COUNT(*) FROM public.sewa_alat
UNION ALL
SELECT 'sewa_alat_eksternal', COUNT(*) FROM public.sewa_alat_eksternal
ORDER BY table_name;
```

### 3.2 Test Aplikasi dengan Project Baru

1. **Aplikasi sudah dikonfigurasi dengan project baru:**
   - File `.env` sudah update dengan credential baru
   - File `supabase/config.toml` sudah update

2. **Jalankan aplikasi:**

```bash
# Install dependencies (jika belum)
npm install

# Run development server
npm run dev
```

3. **Test di browser:**
   - Buka http://localhost:5173
   - Periksa console (F12) untuk error:
     ```
     ✅ Supabase client initialized successfully
     ✅ Successfully connected to Supabase
     ```
   - Navigasi ke Dashboard dan verifikasi data loading
   - Test fitur CRUD (Create, Read, Update, Delete)

---

## 🆘 Troubleshooting

### Error 1: "Service Role Key tidak ditemukan"

**Penyebab:** Service Role Key belum dimasukkan di `migrate-data.ts`

**Solusi:**
1. Buka Supabase Dashboard (old & new project)
2. Settings → API
3. Copy **Service Role Key** (bukan Publishable Key!)
4. Paste ke `migrate-data.ts` di bagian `serviceRoleKey`

### Error 2: "Permission denied" saat menjalankan SQL

**Penyebab:** User Supabase tidak memiliki akses penuh

**Solusi:**
1. Pastikan login dengan akun admin/owner project
2. Atau gunakan Service Role Key untuk eksekusi query

### Error 3: "Foreign key constraint violated"

**Penyebab:** Data referensi (misalnya `user_id`) tidak ada

**Solusi:**
1. Script migration otomatis skip baris yang tidak valid
2. Check logs untuk melihat berapa baris yang di-skip
3. Manual migrate baris-baris tersebut jika diperlukan

### Error 4: Data duplikat setelah migration

**Penyebab:** Script migration dijalankan 2x

**Solusi:**
1. Truncate/kosongkan tables di project baru:
```sql
TRUNCATE TABLE public.ppa CASCADE;
TRUNCATE TABLE public.profiles CASCADE;
-- ... untuk setiap table
```

2. Jalankan migration lagi

### Error 5: "Connection refused" saat menjalankan migrate script

**Penyebab:** Network/VPN issue

**Solusi:**
1. Pastikan internet connection stabil
2. Coba ping Supabase:
```bash
curl https://jkqkywrckwkppfoezyes.supabase.co
```
3. Jika VPN terbatas, coba disconnect VPN
4. Coba jalankan script di waktu berbeda

---

## 📝 Checklist Migrasi

- [ ] Persiapan: Dapatkan semua credential (Service Role Keys)
- [ ] Step 1: Jalankan `MIGRATION_SCHEMA.sql` di project baru
- [ ] Verifikasi: Semua query SQL sukses berjalan
- [ ] Step 2: Update konfigurasi di `migrate-data.ts`
- [ ] Step 2: Jalankan `npx ts-node migrate-data.ts`
- [ ] Verifikasi: Semua tabel termigrasi dengan data
- [ ] Step 3: Verifikasi data di project baru
- [ ] Step 3: Test aplikasi dengan project baru
- [ ] ✅ Migrasi Selesai!

---

## 🎯 Ringkasan

| Step | Task | Status |
|------|------|--------|
| 1 | Setup Schema di Project Baru | ⏳ TODO |
| 2 | Migrate Data dari Old → New | ⏳ TODO |
| 3 | Verifikasi & Test Aplikasi | ⏳ TODO |

---

## 📞 Bantuan Tambahan

Jika masih ada masalah:
1. Buka browser console (F12) dan cek error messages
2. Cek Supabase status di https://status.supabase.com
3. Lihat TROUBLESHOOTING.md di folder project
4. Run diagnostics:
```javascript
import { runDiagnostics } from '@/utils/diagnostics';
await runDiagnostics();
```

**Good luck! 🚀**

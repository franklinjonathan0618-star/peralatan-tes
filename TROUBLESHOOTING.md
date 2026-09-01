# Panduan Troubleshooting & Perbaikan

## 📋 Ringkasan Perbaikan yang Telah Dilakukan

### 1. **Perbaikan Hook Data Loading** ✅

#### useTimeSheet.ts
- ✅ Menambahkan retry logic dengan exponential backoff
- ✅ Menambahkan stale time (5 menit) untuk caching lebih baik
- ✅ Menambahkan refetch on window focus
- ✅ Menambahkan error logging yang lebih detail

```typescript
retry: 3,
retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000)
staleTime: 5 * 60 * 1000 // 5 minutes
```

#### usePerbaikan.ts
- ✅ Menambahkan try-catch wrapper di fetchPerbaikan
- ✅ Menambahkan logging untuk data berhasil dimuat
- ✅ Menambahkan retry dan staleTime sesuai useAlatBerat

### 2. **Perbaikan Error Handling di Dashboard** ✅

#### Dashboard.tsx
- ✅ Menambahkan console.error untuk semua error state
- ✅ Membuat hasConnectionError flag untuk deteksi error koneksi
- ✅ Menambahkan error recovery UI dengan tombol "Coba Lagi"
- ✅ Menampilkan pesan error yang lebih spesifik ke user

### 3. **Tools Diagnostic** ✅
Dibuat `/src/utils/diagnostics.ts` dengan fungsi:
- `checkNetworkConnectivity()` - Cek koneksi internet
- `checkSupabaseConnectivity()` - Cek koneksi ke Supabase
- `runDiagnostics()` - Jalankan semua test
- `formatDiagnosticsForDisplay()` - Format hasil untuk tampilan

---

## 🔍 Cara Menggunakan Diagnostic Tools

### Di Browser Console
```javascript
// Import dari aplikasi
import { runDiagnostics } from '@/utils/diagnostics';

// Jalankan diagnostics
runDiagnostics().then(results => {
  console.log('Hasil:', results);
});
```

### Check Point Spesifik
```javascript
// Cek network saja
import { checkNetworkConnectivity } from '@/utils/diagnostics';
checkNetworkConnectivity().then(result => console.log(result));

// Cek Supabase saja
import { checkSupabaseConnectivity } from '@/utils/diagnostics';
checkSupabaseConnectivity().then(result => console.log(result));
```

---

## 🛠️ Troubleshooting Guide

### Issue 1: "Data tidak loading" / "Koneksi Tidak Tersedia"

**Kemungkinan Penyebab:**
- ❌ Koneksi internet tidak stabil
- ❌ DNS tidak bisa resolve jkqkywrckwkppfoezyes.supabase.co
- ❌ Firewall/Proxy mengblock Supabase
- ❌ VPN/Network terbatas

**Solusi:**
1. Buka browser console (F12)
2. Jalankan diagnostics:
```javascript
import { runDiagnostics } from '@/utils/diagnostics';
runDiagnostics();
```

3. Lihat output `Supabase connection` di console
4. Jika error DNS:
   - Coba ubah DNS ke 8.8.8.8 atau 1.1.1.1
   - Cek apakah bisa akses https://jkqkywrckwkppfoezyes.supabase.co di browser
   - Coba dengan VPN jika dalam network terbatas

5. Jika error network:
   - Cek koneksi internet
   - Coba reload page (Ctrl+F5)
   - Cek apakah Supabase services status normal di https://status.supabase.com

### Issue 2: "Runtime error: Cannot access 'X' before initialization"

**✅ SUDAH DIPERBAIKI**
- Penyebab: Variable export sebelum definisi
- Status: Fixed di useAlatBerat.ts (export moved to end of file)

### Issue 3: "Module has no exported member 'X'"

**✅ SUDAH DIPERBAIKI**
- Penyebab: Menggunakan named import untuk default export
- Status: Fixed di Dashboard.tsx (changed to default imports)

### Issue 4: Charts tidak ada data / menampilkan sample data

**Normal Behavior** ✅
- Charts menggunakan sample data sebagai fallback jika Supabase tidak tersedia
- Ini adalah expected behavior untuk mencegah UI blank
- Ketika Supabase terhubung, charts akan menampilkan data real

---

## 📊 Monitoring & Debugging

### Logs yang Harus Diperhatikan di Browser Console

#### ✅ Sukses
```
"Fetching alat berat data..."
"Alat berat data fetched successfully: 10 records"
"✅ Successfully connected to Supabase"
```

#### ⚠️ Warning
```
"No data returned from alat_berat table"
"undefined" atau array kosong untuk stats
```

#### ❌ Error
```
"Error fetching alat berat: ..."
"ERR_NAME_NOT_RESOLVED" - DNS error
"net::ERR_FAILED" - Network error
```

---

## 🚀 Performance Tips

1. **Stale Time (5 menit)**
   - Data di-cache 5 menit sebelum dianggap "stale"
   - Mengurangi request berlebihan ke Supabase

2. **Retry Logic**
   - Automatic retry 3x dengan exponential backoff
   - Maksimal delay 30 detik antar retry

3. **Window Focus Refetch**
   - Data di-refetch ketika tab kembali aktif
   - Memastikan data selalu fresh

---

## 📝 Konfigurasi Environment

File `.env` harus memiliki:
```env
VITE_SUPABASE_URL=https://jkqkywrckwkppfoezyes.supabase.co
VITE_SUPABASE_ANON_KEY=sb_publishable_l-IEWUDE98cLkwr0QPwXJw_i868wU-o
```

✅ Status: Sudah dikonfigurasi di `.env`

---

## 💡 Next Steps untuk Improvement

1. **Implement Offline Mode**
   - Gunakan IndexedDB untuk cache local
   - Sync data ketika online kembali

2. **Add Service Worker**
   - Cache API responses
   - Progressive Web App support

3. **Implement Error Tracking**
   - Sentry atau Rollbar untuk production error monitoring
   - Real-time alerts untuk critical errors

4. **Add Data Refresh Indicator**
   - UI indicator saat data sedang di-sync
   - Last updated timestamp

5. **Connection Status Indicator**
   - Badge di navbar menunjukkan status koneksi
   - Green = Connected, Red = Disconnected

---

## 🎯 Testing Checklist

- [ ] Buka Dashboard tanpa internet → harus menampilkan "Koneksi Tidak Tersedia"
- [ ] Buka Dashboard dengan internet → harus loading → harus muncul data
- [ ] Buka DevTools Console → tidak ada red errors
- [ ] Refresh page → data tetap terupdate
- [ ] Buka tab lain → kembali ke Dashboard → data di-refetch
- [ ] Jalankan diagnostics → semua should show success

---

## 📞 Contact & Support

Jika masih ada issue:
1. Jalankan diagnostics dan share log
2. Check browser console untuk error messages
3. Verify environment variables di `.env`
4. Check Supabase status di status.supabase.com

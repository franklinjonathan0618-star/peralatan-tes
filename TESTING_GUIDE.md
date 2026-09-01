# 🧪 TESTING GUIDE - 9 Pages Form Save Issues

**Last Updated**: April 7, 2026  
**Status**: Ready for Testing  
**Fixes Applied**: ✅ TIER 1 Complete (Timeouts, Query Invalidation, Validation)

---

## 📋 PRE-TESTING CHECKLIST

- [ ] **Dev server running** (`npm run dev` atau `bun run dev`)
- [ ] **Supabase connected** (check di console: no auth errors)
- [ ] **RLS Migration executed** (di Supabase dashboard)
- [ ] **Browser DevTools Console open** (F12 → Console tab)
- [ ] **Network Tab ready** (F12 → Network tab untuk monitor request)

---

## 🎯 TESTING STRATEGY

Untuk setiap halaman:
1. **Open halaman → lihat form**
2. **Fill form dengan valid data**
3. **Click Save/Submit**
4. **Check 3 hal**:
   - ✅ **Console**: Ada error message?
   - ✅ **Network**: Berapa ms request? (should be < 15s)
   - ✅ **Database**: Cek Supabase dashboard apakah data masuk?
   - ✅ **UI**: Apakah data muncul di tabel/list?

---

## 🔴 ISSUE #1: Data Alat Pendukung

**File**: [src/pages/DataAlatPendukung.tsx](src/pages/DataAlatPendukung.tsx)  
**Hook**: [src/hooks/useAlatPendukung.ts](src/hooks/useAlatPendukung.ts)  
**Database Table**: `alat_pendukung`

### Test Steps:
```
1. Navigate ke "Data Alat Pendukung" page
2. Click "Tambah Alat Pendukung" button
3. Fill form:
   - Nama Alat: "Compressor Test"
   - Jenis Alat: "Pneumatic"
   - Other fields: sesuai requirement
4. Click "Submit" atau "Simpan"
5. Verify:
   - ✅ Form hilang (modal close)
   - ✅ Tabel reload dengan data baru
   - ✅ Check Supabase: alat_pendukung table punya row baru
```

### Troubleshooting:
| Error | Solution |
|-------|----------|
| Form tidak submit | Check console untuk error message |
| Data tidak tampil di tabel | Check Network tab, lihat response |
| Data di DB tapi UI tidak update | Invalidate query di React Query DevTools |

---

## 🟠 ISSUE #2: Sewa Alat

**File**: [src/pages/SewaAlat.tsx](src/pages/SewaAlat.tsx)  
**Hook**: [src/hooks/useSewaAlat.ts](src/hooks/useSewaAlat.ts)  
**Database Table**: `sewa_alat`

### Test Steps:
```
1. Navigate ke "Sewa Alat" page
2. Click "Buat Sewa Baru" button
3. Fill form:
   - Nama Alat: "Excavator 1 ton"
   - Tanggal Sewa: 2026-04-07
   - Harga Sewa: 500000
   - Other fields: fill as needed
4. Click "Simpan"
5. Verify:
   - ✅ Success toast message
   - ✅ Data muncul di tabel
   - ✅ Supabase: sewa_alat table updated
```

### Expected Results:
- Form submit should take **< 5 seconds**
- Data should appear in table **within 2 seconds**

---

## 🔴 ISSUE #3: RPA (Rencana Perbaikan Alat)

**File**: [src/pages/RPA.tsx](src/pages/RPA.tsx)  
**Hook**: [src/hooks/useRPA.ts](src/hooks/useRPA.ts)  
**Database Tables**: `rpa`, `rpa_details` (both must sync!)

### Test Steps:
```
1. Navigate ke "RPA" page
2. Click "Buat RPA Baru" button
3. Fill form:
   - Tanggal RPA: 2026-04-07
   - Item Pekerjaan: "Service Engine"
   - Lokasi Proyek: "Workshop"
4. Add detail items:
   - Click "Tambah Item" or similar
   - Fill: Nama Alat, Uraian, Tanggal Mulai, Selesai
   - Click "Add Item"
5. Click "Simpan" untuk RPA utama
6. Verify:
   - ✅ RPA muncul di main list
   - ✅ Detail items muncul di tabel RPA_details
   - ✅ CRITICAL: Click RPA item → expand/detail → verify items ada
```

### Critical Fix:
- Sebelum fix: Items di DB tapi tidak muncul di UI
- Sesudah fix: Query invalidation fixed untuk `rpa` dan `rpa-details`

---

## 🟠 ISSUE #4: Kegiatan Mekanik

**File**: [src/pages/KegiatanMekanik.tsx](src/pages/KegiatanMekanik.tsx)  
**Hook**: [src/hooks/usePerbaikan.ts](src/hooks/usePerbaikan.ts) atau similar  
**Database Table**: `kegiatan_mekanik`

### Test Steps:
```
1. Navigate ke "Kegiatan Mekanik" page
2. Click "Buat Kegiatan Baru" button
3. Fill form (IMPORTANT - ALL REQUIRED):
   - Tanggal: 2026-04-07
   - No. Lambung: "LAM-001"
   - Nama Alat: "Excavator"
   - Jenis Kerusakan: "Engine Overheating"
   - Lokasi Perbaikan: "Workshop B"
   - Teknisi: Select from dropdown atau "John Doe"
4. Click "Simpan"
5. Verify:
   - ✅ Form submit (< 5 sec)
   - ✅ Data tampil di tabel
   - ✅ Supabase kegiatan_mekanik updated
```

### Field Validation:
```
Required fields:
- tanggal ✓
- noLambung ✓
- namaAlat ✓
- jenisKerusakan ✓
- lokasiPerbaikan ✓
- teknisi ✓
```

---

## 🔴 ISSUE #5: Stock Sparepart

**File**: [src/pages/StockSparepart.tsx](src/pages/StockSparepart.tsx)  
**Hook**: [src/hooks/useSparepart.ts](src/hooks/useSparepart.ts)  
**Database Table**: `sparepart`

### Test Steps:
```
1. Navigate ke "Stock Sparepart" page
2. Click "Tambah Sparepart" button
3. Fill form:
   - Nama Item: "Bearing A"
   - Satuan: "PCS"
   - Stock Awal: 10
   - Harga: 50000
4. Click "Simpan"
5. Verify:
   - ✅ Tabel reload
   - ✅ CRITICAL: Column "Nama Item" and "Satuan" visible
   - ✅ Supabase sparepart updated
```

### Column Rendering Check:
- [ ] Nama Item column tidak blank
- [ ] Satuan column tidak blank
- [ ] Jika blank: check CSS, check data fetch

---

## 🟠 ISSUE #6: PPA (Permohonan Perbaikan Alat)

**File**: [src/pages/PPA.tsx](src/pages/PPA.tsx)  
**Hook**: [src/hooks/usePPA.ts](src/hooks/usePPA.ts)  
**Database Table**: `ppa`

### Test Steps:
```
1. Navigate ke "PPA" page
2. Click "Buat PPA Baru" button
3. CRITICAL: Dialog form harus muncul inline (bukan navigate!)
4. Fill form:
   - Tanggal: 2026-04-07
   - No. PPA: "PPA-001-2026"
   - Nama Alat: "Excavator"
   - No. Lambung: "LAM-001"
   - Kerusakan: "Engine Issue"
   - Keterangan: (optional)
5. Click "Simpan"
6. Verify:
   - ✅ Dialog hilang
   - ✅ Data muncul di tabel PPA
   - ✅ Supabase ppa table updated
```

### FIX APPLIED:
- ✅ Inline dialog form (tidak navigate ke form page)
- ✅ State management (formData, showCreateDialog)
- ✅ handleCreatePPA function

---

## 🔴 ISSUE #7: Stock BBM (Bahan Bakar)

**File**: [src/pages/StockBBM.tsx](src/pages/StockBBM.tsx)  
**Hook**: [src/hooks/useBBMTransactions.ts](src/hooks/useBBMTransactions.ts)  
**Database Table**: `bbm_transactions`

### Test Steps:
```
1. Navigate ke "Stock BBM" page
2. Click "Catat Transaksi" button
3. Fill form:
   - Tanggal Pembelian: 2026-04-07
   - Jenis BBM: "Pertalite"
   - Jumlah Liter: 1000
   - Harga per Liter: 8500
   - Keterangan: (optional)
4. Click "Simpan"
5. Verify:
   - ✅ Success message
   - ✅ Transaksi tampil di list
   - ✅ Supabase bbm_transactions updated
```

### Performance Check:
- Timeout was: 3 seconds → **FIXED to 15 seconds**
- Network request should complete within 15s

---

## 🟠 ISSUE #8: Stock Oli

**File**: [src/pages/StockOli.tsx](src/pages/StockOli.tsx)  
**Hook**: [src/hooks/useOliTransactions.ts](src/hooks/useOliTransactions.ts)  
**Database Table**: `oli_transactions`

### Test Steps:
```
1. Navigate ke "Stock Oli" page
2. Click "Catat Transaksi" button
3. Fill form:
   - Tanggal: 2026-04-07
   - Jenis Oli: "SAE 40"
   - Jumlah Liter: 50
   - Harga per Liter: 35000
   - Keterangan: (optional)
4. Click "Simpan"
5. Verify:
   - ✅ Form submit success
   - ✅ Data tampil di tabel
   - ✅ Supabase oli_transactions updated
```

### Performance Check:
- Timeout was: 3 seconds → **FIXED to 15 seconds**

---

## 🔴 ISSUE #9: Time Sheet

**File**: [src/pages/TimeSheet.tsx](src/pages/TimeSheet.tsx)  
**Hook**: [src/hooks/useTimeSheet.ts](src/hooks/useTimeSheet.ts)  
**Database Table**: `time_sheet`

### Test Steps:
```
1. Navigate ke "Time Sheet" page
2. Click "Catat Time Sheet" button
3. Fill form:
   - Tanggal: 2026-04-07
   - Nama Alat: Select from dropdown
   - Jam Mulai: 08:00
   - Jam Selesai: 17:00
   - Operator: "John"
   - Keterangan: (optional)
4. CRITICAL: Nama Alat dropdown harus ada options!
5. Click "Simpan"
6. Verify:
   - ✅ Dropdown populated (not empty)
   - ✅ Form submit success
   - ✅ Data tampil di time sheet list
   - ✅ Supabase time_sheet updated
```

### Critical Issue to Watch:
- **Dropdown was empty** → Timeout fixed from 3s to 15s
- Should now properly fetch data from related tables

---

## 🛠️ DEBUGGING TIPS

### If Form Doesn't Submit:
1. **Check Console** (F12):
   ```
   Look for: 
   - Network error
   - Validation error
   - Timeout error
   ```

2. **Check Network Tab** (F12 → Network):
   ```
   - Find POST request ke supabase
   - Check status code (200 = OK, 4xx/5xx = Error)
   - Check response payload
   ```

3. **Check Supabase Dashboard**:
   ```
   - Go to SQL Editor
   - SELECT * FROM [table_name]
   - Verify data tidak masuk
   ```

### If Data Doesn't Appear in UI:
1. **Check React Query DevTools** (bottom right):
   - Look for cache invalidation
   - Verify recent queries

2. **Manual Page Refresh** (F5):
   - If data appears after refresh → query invalidation issue
   - If data doesn't appear → data not in DB

3. **Check Component Console Logs**:
   ```
   Look for: 
   - "Data loaded: [count] items"
   - "Error fetching data: [error]"
   ```

---

## 📊 TEST RESULTS TEMPLATE

### Issue #1: Data Alat Pendukung
- [ ] Form submit successful?
- [ ] Data muncul di tabel?
- [ ] Supabase DB updated?
- [ ] Error message: _____________

### Issue #2: Sewa Alat
- [ ] Form submit successful?
- [ ] Data muncul di tabel?
- [ ] Supabase DB updated?
- [ ] Submit duration: _____ ms

### Issue #3: RPA
- [ ] Main RPA created?
- [ ] Detail items created?
- [ ] Detail items visible in UI?
- [ ] Supabase: rpa + rpa_details updated?

### Issue #4: Kegiatan Mekanik
- [ ] All required fields filled?
- [ ] Form submit successful?
- [ ] Validation errors: _____________
- [ ] Data in DB: Yes / No

### Issue #5: Stock Sparepart
- [ ] Form submit successful?
- [ ] Nama Item column visible?
- [ ] Satuan column visible?
- [ ] Data in DB: Yes / No

### Issue #6: PPA
- [ ] Buat PPA button opens inline dialog?
- [ ] Form submit successful?
- [ ] Data muncul di tabel?
- [ ] Data in DB: Yes / No

### Issue #7: Stock BBM
- [ ] Form submit successful?
- [ ] Transaction recorded?
- [ ] Submit duration: _____ ms
- [ ] Data in DB: Yes / No

### Issue #8: Stock Oli
- [ ] Form submit successful?
- [ ] Transaction recorded?
- [ ] Submit duration: _____ ms
- [ ] Data in DB: Yes / No

### Issue #9: TimeSheet
- [ ] Dropdown populated?
- [ ] Can select Nama Alat?
- [ ] Form submit successful?
- [ ] Data in DB: Yes / No

---

## ✅ PASS CRITERIA

**Test PASSED if**:
- ✅ All 9 issues form submit successful
- ✅ Data appears in both UI and Database
- ✅ No console errors during submit
- ✅ No validation errors (unless intentional)
- ✅ Request completes in < 15 seconds

**Test FAILED if**:
- ❌ Form submit fails
- ❌ Data in DB but not in UI
- ❌ Validation error on valid data
- ❌ Request times out (> 15 seconds)

---

## 📞 NEXT STEPS

### If All Tests PASS ✅:
- Celebrate! 🎉
- Deploy to production
- Monitor for 1 week

### If Tests FAIL ❌:
1. Note exact issue #
2. Copy console error message
3. Check Network response
4. Create detailed bug report with:
   - Error message
   - Steps to reproduce
   - Expected vs actual result
   - Screenshot if possible

---

**Last Checked**: April 7, 2026  
**Status**: Ready for Comprehensive Testing

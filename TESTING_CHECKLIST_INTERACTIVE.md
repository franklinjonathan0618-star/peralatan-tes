# ✅ INTERACTIVE TESTING CHECKLIST

**Status**: Ready for Live Testing  
**Dev Server**: ✅ Running on http://localhost:5173  
**Date**: April 7, 2026

---

## 🚀 QUICK START

### Step 1: Open Browser
```
👉 Go to: http://localhost:5173
   OR: localhost:5173
```

### Step 2: Open DevTools
```
📍 Press: F12
📍 Go to: Console tab
📍 (Keep this open during testing to catch errors!)
```

### Step 3: Open Supabase Dashboard
```
📍 URL: https://app.supabase.com
📍 Project: [Your Project]
📍 Go to: SQL Editor
📍 Keep ready to check database inserts
```

---

## 📝 TEST CHECKLIST - Do This Now!

### **ISSUE #1: Data Alat Pendukung**
- [ ] Open left menu → "Data Alat Pendukung"
- [ ] Click button "Tambah Alat Pendukung" (or similar)
- [ ] **Form appears?** ________
- [ ] Fill with:
  - Nama Alat: `Compressor Test ABC`
  - Jenis Alat: `Pneumatic`
  - Other fields: fill as needed
- [ ] Click "Simpan" atau "Submit"
- [ ] **Check console** - Any errors? `_________________`
- [ ] **Form closed?** ________
- [ ] **Data appears in table?** ________
- [ ] **Go to Supabase** → Query:
  ```sql
  SELECT * FROM alat_pendukung WHERE nama_alat LIKE '%Compressor Test%';
  ```
  **Result**: Row found? ______ (Yes/No)

**STATUS**: ✅ Pass / ❌ Fail

---

### **ISSUE #2: Sewa Alat**
- [ ] Navigate to "Sewa Alat" page
- [ ] Click "Buat Sewa Baru" button
- [ ] **Form appears?** ________
- [ ] Fill with sample data:
  - Nama Alat: `Excavator Sewa Test`
  - Tanggal Sewa: `2026-04-07`
  - Harga: `500000`
  - Other fields: fill as needed
- [ ] Click "Simpan"
- [ ] **Check console** - Error message? `_________________`
- [ ] **Success toast notification appears?** ________
- [ ] **Data in table immediately?** ________
- [ ] **Supabase check**:
  ```sql
  SELECT * FROM sewa_alat WHERE nama_alat LIKE '%Sewa Test%';
  ```
  **Found?** ______ (Yes/No)

**STATUS**: ✅ Pass / ❌ Fail

---

### **ISSUE #3: RPA (Complex Test)**
- [ ] Navigate to "RPA" page
- [ ] Click "Buat RPA Baru" button
- [ ] **Form appears?** ________
- [ ] Fill RPA header:
  - Tanggal: `2026-04-07`
  - Item Pekerjaan: `Service Engine Test`
  - Lokasi: `Workshop`
- [ ] **Add detail items** (click "Tambah Item" atau "Add Item"):
  - Item 1:
    - Nama Alat: `Engine Pump`
    - Uraian: `Engine overhauling`
    - Mulai: `2026-04-07`
    - Selesai: `2026-04-09`
  - Click "Add" untuk item ini
  - Item 2:
    - Nama Alat: `Transmission`
    - Uraian: `Transmission service`
    - Mulai: `2026-04-10`
    - Selesai: `2026-04-11`
  - Click "Add"
- [ ] Click "Simpan" untuk RPA
- [ ] **Check console** - Errors? `_________________`
- [ ] **RPA appears in list?** ________
- [ ] **Click RPA item → expand detail → items visible?** ________
  - Engine Pump visible?: ________
  - Transmission visible?: ________
- [ ] **Supabase check** (TWO queries):
  ```sql
  -- Main RPA
  SELECT * FROM rpa WHERE item_pekerjaan LIKE '%Service Engine Test%';
  ```
  **Found?** ______ (Yes/No)
  
  ```sql
  -- Detail items
  SELECT * FROM rpa_details WHERE nama_alat IN ('Engine Pump', 'Transmission');
  ```
  **Count**: ______ (should be 2)

**STATUS**: ✅ Pass / ❌ Fail / ⚠️ Partial

---

### **ISSUE #4: Kegiatan Mekanik**
- [ ] Navigate to "Kegiatan Mekanik" page
- [ ] Click "Buat Kegiatan Baru" button
- [ ] **Form appears?** ________
- [ ] **ALL fields required** - Fill with:
  - Tanggal: `2026-04-07`
  - No. Lambung: `LAM-001-TEST`
  - Nama Alat: `Excavator`
  - Jenis Kerusakan: `Engine Overheating`
  - Lokasi Perbaikan: `Workshop B`
  - Teknisi: Select from dropdown (**dropdown has options?** _**YES**/NO_)
- [ ] Click "Simpan"
- [ ] **Check console** - Any validation errors? `_________________`
- [ ] **Form closed?** ________
- [ ] **Data in table?** ________
- [ ] **Supabase check**:
  ```sql
  SELECT * FROM kegiatan_mekanik WHERE no_lambung = 'LAM-001-TEST';
  ```
  **Found?** ______ (Yes/No)

**STATUS**: ✅ Pass / ❌ Fail

---

### **ISSUE #5: Stock Sparepart**
- [ ] Navigate to "Stock Sparepart" page
- [ ] Click "Tambah Sparepart" button
- [ ] **Form appears?** ________
- [ ] Fill with:
  - Nama Item: `Bearing A Test`
  - Satuan: `PCS`
  - Stock Awal: `10`
  - Harga: `50000`
  - Keterangan: (optional)
- [ ] Click "Simpan"
- [ ] **Check console** - Errors? `_________________`
- [ ] **Data appears in table?** ________
- [ ] **CRITICAL: Check column visibility**:
  - Nama Item column shows "Bearing A Test"? ________
  - Satuan column shows "PCS"? ________
  - Both visible (not blank/hidden)? ________
- [ ] **Supabase check**:
  ```sql
  SELECT nama_item, satuan, stock FROM sparepart WHERE nama_item LIKE '%Bearing A Test%';
  ```
  **Found with correct columns?** ______ (Yes/No)

**STATUS**: ✅ Pass / ❌ Fail / ⚠️ Partial (column issue)

---

### **ISSUE #6: PPA (Permohonan Perbaikan Alat)**
- [ ] Navigate to "PPA" page
- [ ] Click "Buat PPA Baru" button
- [ ] **CRITICAL: Dialog appears INLINE (not navigate)?** ________
- [ ] Fill form:
  - Tanggal: `2026-04-07`
  - No. PPA: `PPA-001-TEST`
  - Nama Alat: `Excavator`
  - No. Lambung: `LAM-002-TEST`
  - Kerusakan: `Hydraulic Issue`
  - Keterangan: (optional)
- [ ] Click "Simpan"
- [ ] **Check console** - Errors? `_________________`
- [ ] **Dialog closed?** ________
- [ ] **Data appears in PPA table?** ________
- [ ] **Supabase check**:
  ```sql
  SELECT * FROM ppa WHERE no_ppa = 'PPA-001-TEST';
  ```
  **Found?** ______ (Yes/No)

**STATUS**: ✅ Pass / ❌ Fail

---

### **ISSUE #7: Stock BBM (Fuel)**
- [ ] Navigate to "Stock BBM" page
- [ ] Click "Catat Transaksi" atau "Tambah" button
- [ ] **Form appears?** ________
- [ ] Fill with:
  - Tanggal Pembelian: `2026-04-07`
  - Jenis BBM: `Pertalite`
  - Jumlah Liter: `1000`
  - Harga per Liter: `8500`
  - Keterangan: (optional)
- [ ] Click "Simpan"
- [ ] **Check console** - Errors? `_________________`
- [ ] **Request duration** (check Network tab): ______ ms
  - ✅ Should be < 15 seconds
- [ ] **Success message appears?** ________
- [ ] **Transaction appears in list/table?** ________
- [ ] **Supabase check**:
  ```sql
  SELECT * FROM bbm_transactions WHERE jenis_bbm = 'Pertalite' AND jumlah_liter = 1000;
  ```
  **Found?** ______ (Yes/No)

**STATUS**: ✅ Pass / ❌ Fail

---

### **ISSUE #8: Stock Oli (Oil)**
- [ ] Navigate to "Stock Oli" page
- [ ] Click "Catat Transaksi" atau "Tambah" button
- [ ] **Form appears?** ________
- [ ] Fill with:
  - Tanggal: `2026-04-07`
  - Jenis Oli: `SAE 40`
  - Jumlah Liter: `50`
  - Harga per Liter: `35000`
  - Keterangan: (optional)
- [ ] Click "Simpan"
- [ ] **Check console** - Errors? `_________________`
- [ ] **Request duration** (Network tab): ______ ms
  - ✅ Should be < 15 seconds
- [ ] **Data in table?** ________
- [ ] **Supabase check**:
  ```sql
  SELECT * FROM oli_transactions WHERE jenis_oli = 'SAE 40' AND jumlah_liter = 50;
  ```
  **Found?** ______ (Yes/No)

**STATUS**: ✅ Pass / ❌ Fail

---

### **ISSUE #9: TimeSheet**
- [ ] Navigate to "TimeSheet" page
- [ ] Click "Catat TimeSheet" atau "Tambah" button
- [ ] **Form appears?** ________
- [ ] Look for **"Nama Alat" dropdown**:
  - **Dropdown has options?** ________
  - **Not empty/blank?** ________
  - (This was the main issue - timeout at 3s, now 15s)
- [ ] Fill with:
  - Tanggal: `2026-04-07`
  - Nama Alat: **Select from dropdown** ✓
  - Jam Mulai: `08:00`
  - Jam Selesai: `17:00`
  - Operator: `John Doe`
  - Keterangan: (optional)
- [ ] Click "Simpan"
- [ ] **Check console** - Errors? `_________________`
- [ ] **Request duration** (Network tab): ______ ms
  - ✅ Should be < 15 seconds
- [ ] **TimeSheet entry appears in list?** ________
- [ ] **Supabase check**:
  ```sql
  SELECT * FROM time_sheet WHERE operator LIKE '%John Doe%' AND tanggal = '2026-04-07';
  ```
  **Found?** ______ (Yes/No)

**STATUS**: ✅ Pass / ❌ Fail

---

## 📊 SUMMARY RESULTS

### Test Results Matrix:

| Issue | Status | Error Message (if fail) | DB Verified |
|-------|--------|------------------------|------------|
| #1 Alat Pendukung | ✅/❌ | _________________ | _____ |
| #2 Sewa Alat | ✅/❌ | _________________ | _____ |
| #3 RPA | ✅/❌/⚠️ | _________________ | _____ |
| #4 Kegiatan Mekanik | ✅/❌ | _________________ | _____ |
| #5 Sparepart | ✅/❌/⚠️ | _________________ | _____ |
| #6 PPA | ✅/❌ | _________________ | _____ |
| #7 Stock BBM | ✅/❌ | _________________ | _____ |
| #8 Stock Oli | ✅/❌ | _________________ | _____ |
| #9 TimeSheet | ✅/❌ | _________________ | _____ |

---

## 🎯 OVERALL RESULT

**Total Passed**: _____ / 9  
**Total Failed**: _____ / 9  

### Overall Status:
- [ ] ✅ **ALL TESTS PASSED** - Ready for Production!
- [ ] ⚠️ **SOME TESTS FAILED** - Need debugging
- [ ] ❌ **MOST TESTS FAILED** - Major issues

---

## 🐛 IF TESTS FAIL - DEBUGGING GUIDE

### For Each Failed Test:

1. **Collect Error Info**:
   - Copy console error message: `_______________________________`
   - Note Network request duration: _____ ms
   - Check Supabase response (Network → Response tab)

2. **Try These**:
   - [ ] Refresh page (F5)
   - [ ] Clear browser cache (Ctrl+Shift+Delete)
   - [ ] Check Supabase RLS policies:
     ```sql
     SELECT * FROM pg_policies 
     WHERE schemaname = 'public' 
     AND tablename = '[table_name]';
     ```
   - [ ] Check auth: Are you logged in?

3. **Report Issue With**:
   - Exact error message
   - Form inputs used
   - Expected vs actual result
   - Screenshot if applicable

---

## 📞 TESTING COMPLETE - NEXT STEPS

### ✅ If All Tests PASS:
```
1. Write down test date and time
2. Document any performance metrics noted
3. Deploy to staging or production
4. Monitor for 24 hours
```

### ❌ If Tests FAIL:
```
1. Copy all error messages
2. Note which issues failed
3. Check: Are RLS policies executed in Supabase?
4. Try to identify pattern:
   - All forms fail? → might be auth/RLS issue
   - Only some fail? → specific table or field issue
   - Slow requests? → increase timeout further
5. Create detailed bug report
```

---

**Start testing now!** 🚀

Go to: http://localhost:5173  
Press: F12 (DevTools)  
Test one issue at a time, follow checklist above.

Let me know the results! 📋

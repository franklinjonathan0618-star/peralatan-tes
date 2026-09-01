# 🗄️ SUPABASE TESTING QUERIES - QUICK REFERENCE

Gunakan queries ini di **Supabase SQL Editor** untuk verify data masuk ke database.

---

## 📋 VERIFIKASI DATA SETELAH SUBMIT FORM

### **Issue #1: Data Alat Pendukung**
```sql
-- Check if new alat pendukung created
SELECT id, nama_alat, jenis_alat, created_at 
FROM alat_pendukung 
ORDER BY created_at DESC 
LIMIT 10;
```

---

### **Issue #2: Sewa Alat**
```sql
-- Check recent sewa alat transactions
SELECT id, nama_alat, tanggal_sewa, harga_sewa, created_at 
FROM sewa_alat 
ORDER BY created_at DESC 
LIMIT 10;
```

---

### **Issue #3: RPA - Main Table**
```sql
-- Check RPA main table
SELECT id, rpa_id, tanggal, item_pekerjaan, lokasi_proyek, created_at 
FROM rpa 
ORDER BY created_at DESC 
LIMIT 10;
```

### **Issue #3: RPA - Detail Items**
```sql
-- Check RPA detail items
SELECT rd.id, rd.rpa_id, rd.nama_alat, rd.uraian_pekerjaan, 
       rd.mulai_tanggal, rd.selesai_tanggal, rd.created_at,
       r.rpa_id as parent_rpa_id
FROM rpa_details rd
LEFT JOIN rpa r ON rd.rpa_id = r.id
ORDER BY rd.created_at DESC 
LIMIT 20;
```

### **Issue #3: RPA - Verify Both Tables Sync**
```sql
-- Verify items point to correct RPA
SELECT COUNT(*) as total_rpa_records FROM rpa;
SELECT COUNT(*) as total_rpa_detail_records FROM rpa_details;
```

---

### **Issue #4: Kegiatan Mekanik**
```sql
-- Check kegiatan mekanik records
SELECT id, tanggal, no_ppa, no_lambung, nama_alat, 
       nama_mekanik, lokasi_pekerjaan, created_at 
FROM kegiatan_mekanik 
ORDER BY created_at DESC 
LIMIT 10;
```

---

### **Issue #5: Stock Sparepart**
```sql
-- Check sparepart inventory
SELECT id, nama_item, satuan, stock_awal, harga, created_at 
FROM sparepart 
ORDER BY created_at DESC 
LIMIT 10;
```

---

### **Issue #6: PPA (Permohonan Perbaikan Alat)**
```sql
-- Check PPA records
SELECT id, tanggal, no_ppa, nama_alat, no_lambung, 
       kerusakan, keterangan, created_at 
FROM ppa 
ORDER BY created_at DESC 
LIMIT 10;
```

---

### **Issue #7: Stock BBM (Fuel)**
```sql
-- Check BBM transactions
SELECT id, tanggal_pembelian, jenis_bbm, jumlah_liter, 
       harga_per_liter, total_harga, keterangan, created_at 
FROM bbm_transactions 
ORDER BY created_at DESC 
LIMIT 10;
```

---

### **Issue #8: Stock Oli (Oil)**
```sql
-- Check Oli transactions
SELECT id, tanggal, jenis_oli, jumlah_liter, 
       harga_per_liter, total_harga, keterangan, created_at 
FROM oli_transactions 
ORDER BY created_at DESC 
LIMIT 10;
```

---

### **Issue #9: TimeSheet**
```sql
-- Check timesheet entries
SELECT id, tanggal, nama_alat, jam_mulai, jam_selesai, 
       operator, keterangan, created_at 
FROM time_sheet 
ORDER BY created_at DESC 
LIMIT 10;
```

---

## 🔍 DEBUG QUERIES

### Check Table Row Count
```sql
-- Total records in each table
SELECT 
  'alat_pendukung' as table_name, COUNT(*) as row_count FROM alat_pendukung
UNION ALL
SELECT 'sewa_alat', COUNT(*) FROM sewa_alat
UNION ALL
SELECT 'rpa', COUNT(*) FROM rpa
UNION ALL
SELECT 'rpa_details', COUNT(*) FROM rpa_details
UNION ALL
SELECT 'kegiatan_mekanik', COUNT(*) FROM kegiatan_mekanik
UNION ALL
SELECT 'sparepart', COUNT(*) FROM sparepart
UNION ALL
SELECT 'ppa', COUNT(*) FROM ppa
UNION ALL
SELECT 'bbm_transactions', COUNT(*) FROM bbm_transactions
UNION ALL
SELECT 'oli_transactions', COUNT(*) FROM oli_transactions
UNION ALL
SELECT 'time_sheet', COUNT(*) FROM time_sheet;
```

---

### Check RLS Policies
```sql
-- View all RLS policies
SELECT 
  tablename, 
  policyname, 
  permissive, 
  roles, 
  qual, 
  with_check 
FROM pg_policies 
WHERE schemaname = 'public' 
ORDER BY tablename;
```

---

### Check specific table RLS policies
```sql
-- Example: Check policies for sewa_alat
SELECT 
  policyname, 
  permissive, 
  roles, 
  qual, 
  with_check 
FROM pg_policies 
WHERE schemaname = 'public' 
AND tablename = 'sewa_alat';
```

---

## 🧡 COMMON QUERIES

### Delete Test Data (After Testing)
```sql
-- Delete test records created during testing
-- WARNING: This will DELETE data! Use with caution!

DELETE FROM alat_pendukung WHERE nama_alat LIKE '%Test%';
DELETE FROM sewa_alat WHERE nama_alat LIKE '%Test%';
DELETE FROM rpa WHERE item_pekerjaan LIKE '%Test%';
DELETE FROM kegiatan_mekanik WHERE no_lambung LIKE '%TEST%';
DELETE FROM sparepart WHERE nama_item LIKE '%Test%';
DELETE FROM ppa WHERE no_ppa LIKE '%TEST%';
DELETE FROM bbm_transactions WHERE jenis_bbm LIKE '%Test%';
DELETE FROM oli_transactions WHERE jenis_oli LIKE '%Test%';
DELETE FROM time_sheet WHERE operator LIKE '%Test%';
```

---

### Search for Specific Test Data
```sql
-- Find all test records (with underscore or "TEST")
SELECT * FROM alat_pendukung WHERE nama_alat LIKE '%TEST%' OR nama_alat LIKE '%Test%';
SELECT * FROM sewa_alat WHERE nama_alat LIKE '%TEST%' OR nama_alat LIKE '%Test%';
SELECT * FROM kegiatan_mekanik WHERE no_lambung LIKE '%TEST%';
SELECT * FROM sparepart WHERE nama_item LIKE '%TEST%' OR nama_item LIKE '%Test%';
SELECT * FROM ppa WHERE no_ppa LIKE '%TEST%';
SELECT * FROM bbm_transactions WHERE jenis_bbm LIKE '%TEST%';
SELECT * FROM oli_transactions WHERE jenis_oli LIKE '%TEST%';
SELECT * FROM time_sheet WHERE operator LIKE '%TEST%' OR operator LIKE '%Test%';
```

---

## 📊 PERFORMANCE CHECKS

### Check Created Timestamps
```sql
-- See when records were created (helps verify if form submitted recently)
SELECT 
  'last_alat_pendukung' as check_name,
  (SELECT MAX(created_at) FROM alat_pendukung) as latest_timestamp
UNION ALL
SELECT 'last_sewa_alat', (SELECT MAX(created_at) FROM sewa_alat)
UNION ALL
SELECT 'last_rpa', (SELECT MAX(created_at) FROM rpa)
UNION ALL
SELECT 'last_kegiatan_mekanik', (SELECT MAX(created_at) FROM kegiatan_mekanik)
UNION ALL
SELECT 'last_sparepart', (SELECT MAX(created_at) FROM sparepart)
UNION ALL
SELECT 'last_ppa', (SELECT MAX(created_at) FROM ppa)
UNION ALL
SELECT 'last_bbm_transaction', (SELECT MAX(created_at) FROM bbm_transactions)
UNION ALL
SELECT 'last_oli_transaction', (SELECT MAX(created_at) FROM oli_transactions)
UNION ALL
SELECT 'last_time_sheet', (SELECT MAX(created_at) FROM time_sheet);
```

---

## ✅ USAGE INSTRUCTIONS

### How to Run Queries:

1. **Open Supabase Dashboard**
   - Go to: https://app.supabase.com
   - Select your project
   - Click "SQL Editor" in sidebar

2. **Copy the query** you want to run from above

3. **Paste into query editor**

4. **Click "Run"** button (or Ctrl+Enter)

5. **See results** in "Results" tab below

---

## 🎯 Quick Testing Workflow:

```
1. Run form submit in app (Chrome/Firefox)
2. See console message: "Data saved successfully!"
3. Go to Supabase SQL Editor (keep it open)
4. Run appropriate query from above
5. Check if new row appears with correct data
6. Verify timestamp is recent (matching form submit time)
7. Move to next test issue
```

---

## 💾 Save Test Results

After running each query, document:
- [ ] Query: ________________
- [ ] Row count: ______
- [ ] Most recent record created_at: ________________
- [ ] Data looks correct: YES / NO / PARTIAL

---

**Ready? Start testing!** 🚀

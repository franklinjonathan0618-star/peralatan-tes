# 🚨 Fix: Infinite Recursion RLS Policy Error

## ❌ Error Message

```
Pendaftaran Gagal
Gagal membuat profil. infinite recursion detected in policy for relation "profiles"
```

## 🔍 Root Cause Analysis

**Yang terdeteksi:**
Ada **13 policies yang DUPLICATE dan CONFLICTING** di table profiles:

```
1. Allow public signups (INSERT with true) ⚠️ Dangerous
2. Users can view own profile (SELECT with auth.uid())
3. Users can update own profile (UPDATE with auth.uid())
4. Allow email lookup by username (SELECT true)
5. Admins can view all profiles (SELECT with admin check)
6. profiles_select_all (SELECT true) ⚠️ Duplicate
7. profiles_insert_own (INSERT true) ⚠️ Duplicate
8. profiles_update_own (UPDATE true) ⚠️ Duplicate
9. Public read profiles (SELECT true)
10. Auth users can insert own profile (INSERT with auth.uid())
11. User update own profile (UPDATE with auth.uid())
12. Admin can update any profile (UPDATE with admin check)
13. Admin can delete any profile (DELETE with admin check)
```

**Masalah:**

- ❌ Multiple policies untuk action yang sama → conflict
- ❌ Policies dengan `true` condition → permissive terlalu luas
- ❌ "Allow public signups" + "Allow email lookup" → infinite recursion saat insert
- ❌ Admin check policies yang complex dengan sub-query

---

## ✅ SOLUSI: Clean Up Semua Policies Lama

### **Step 1: Jalankan Cleanup SQL**

**File:** `supabase/migrations/cleanup_profiles_rls_v2.sql`

**Atau langsung copy-paste ke SQL Editor:**

```sql
-- Drop SEMUA policies lama
DROP POLICY IF EXISTS "Allow public signups" ON public.profiles;
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Allow email lookup by username" ON public.profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "profiles_select_all" ON public.profiles;
DROP POLICY IF EXISTS "profiles_insert_own" ON public.profiles;
DROP POLICY IF EXISTS "profiles_update_own" ON public.profiles;
DROP POLICY IF EXISTS "Public read profiles" ON public.profiles;
DROP POLICY IF EXISTS "Auth users can insert own profile" ON public.profiles;
DROP POLICY IF EXISTS "User update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admin can update any profile" ON public.profiles;
DROP POLICY IF EXISTS "Admin can delete any profile" ON public.profiles;

-- Enable RLS fresh
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Create 5 CLEAN non-recursive policies
CREATE POLICY "allow_public_read_profiles"
ON public.profiles
FOR SELECT USING (true);

CREATE POLICY "allow_user_insert_own_profile"
ON public.profiles
FOR INSERT
WITH CHECK (auth.uid() = id AND auth.role() = 'authenticated');

CREATE POLICY "allow_user_update_own_profile"
ON public.profiles
FOR UPDATE
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

CREATE POLICY "allow_admin_update_any_profile"
ON public.profiles
FOR UPDATE
USING ((SELECT role FROM public.profiles WHERE id = auth.uid() LIMIT 1) = 'admin')
WITH CHECK ((SELECT role FROM public.profiles WHERE id = auth.uid() LIMIT 1) = 'admin');

CREATE POLICY "allow_admin_delete_any_profile"
ON public.profiles
FOR DELETE
USING ((SELECT role FROM public.profiles WHERE id = auth.uid() LIMIT 1) = 'admin');
```

**Execute dan tunggu sampai selesai (no errors).**

### **Step 2: Verify Cleanup Success**

Run query ini di SQL Editor:

```sql
SELECT policyname, cmd, permissive
FROM pg_policies
WHERE tablename = 'profiles'
ORDER BY policyname;
```

**Expected output (5 rows):**

```
allow_admin_delete_any_profile    | DELETE | PERMISSIVE
allow_admin_update_any_profile    | UPDATE | PERMISSIVE
allow_public_read_profiles        | SELECT | PERMISSIVE
allow_user_insert_own_profile     | INSERT | PERMISSIVE
allow_user_update_own_profile     | UPDATE | PERMISSIVE
```

✅ Jika 5 policies → cleanup berhasil!

### **Step 3: Test Register**

1. Refresh browser (Ctrl+F5 untuk clear cache)
2. Go to LoginRegister page
3. Klik tab **Daftar**
4. Isi form:
   ```
   Nama: Test User
   Username: testuser123
   Email: testuser123@email.com
   Password: password123
   Confirm: password123
   Role: Viewer
   ```
5. Klik **Daftar**
6. Expected: ✅ **Pendaftaran Berhasil!**

---

## 📋 Why These 5 Policies

| #   | Policy Name                    | Action | Condition                        | Why Needed                          |
| --- | ------------------------------ | ------ | -------------------------------- | ----------------------------------- |
| 1   | allow_public_read_profiles     | SELECT | `true`                           | Login page lookup username→email    |
| 2   | allow_user_insert_own_profile  | INSERT | `auth.uid()=id && authenticated` | User create own profile saat signup |
| 3   | allow_user_update_own_profile  | UPDATE | `auth.uid()=id`                  | User edit own profile               |
| 4   | allow_admin_update_any_profile | UPDATE | `admin check`                    | Admin manage users                  |
| 5   | allow_admin_delete_any_profile | DELETE | `admin check`                    | Admin delete users                  |

---

## 🔧 Troubleshooting If Still Error

### Error masih "infinite recursion"?

**Option A: Disable RLS (Development Only)**

```sql
ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;
```

Then test register - jika berhasil, berarti ada policy yang masih bermasalah.

**Option B: Check Table Structure**

```sql
-- Verify columns
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'profiles';

-- Verify constraints
SELECT constraint_name, constraint_type
FROM information_schema.table_constraints
WHERE table_name = 'profiles';

-- Verify triggers
SELECT trigger_name, event_object_table
FROM information_schema.triggers
WHERE event_object_table = 'profiles';
```

**Option C: Re-run Cleanup**

Pastikan:

1. Copy-paste SELURUH script dari `cleanup_profiles_rls_v2.sql`
2. Execute di SQL Editor (bukan split)
3. Tunggu sampai complete
4. Verify dengan query di Step 2

---

## 🔄 Verification Checklist

- [ ] All 13 old policies deleted
- [ ] RLS enabled on profiles table
- [ ] 5 new clean policies created
- [ ] `SELECT * FROM pg_policies WHERE tablename='profiles'` shows 5 rows
- [ ] No error messages saat execute SQL
- [ ] Browser cache cleared (Ctrl+F5)
- [ ] Test register dengan account baru
- [ ] ✅ Pendaftaran Berhasil message shown
- [ ] Bisa login dengan email/username baru
- [ ] Profile data terisi dengan benar

---

## 📞 If Still Not Working

### Check Supabase Logs:

```
Project Dashboard
  → Logs
  → API
  → Filter: "profiles"
  → Cek error message detail
```

### Manual Debug:

```sql
-- Test sebagai public user (no auth)
-- Ini harus OK (read semua profiles)
SELECT id, username, email FROM public.profiles;

-- Test INSERT (perlu user login di application dulu)
-- Setelah login, di browser console:
console.log(supabase.auth.session())

-- Verify user ID
-- Kemudian test insert di SQL Editor sebagai authenticated user
INSERT INTO public.profiles
(id, username, email, full_name, role)
VALUES (
  'user-id-from-auth',
  'testuser',
  'test@email.com',
  'Test User',
  'viewer'
);
```

---

## 🎯 Summary

| Step | Action                  | Status                        |
| ---- | ----------------------- | ----------------------------- |
| 1    | Drop 13 old policies    | ✅ Execute cleanup SQL        |
| 2    | Create 5 clean policies | ✅ Included in cleanup script |
| 3    | Verify policies         | ✅ Run verification query     |
| 4    | Test register           | ✅ Should work now            |

**Estimated time: 5 menit**

---

## ✅ Solusi Step-by-Step

### **Step 1: Buka Supabase Console**

1. Go to: https://supabase.com/dashboard
2. Select project Anda
3. Go to: **SQL Editor** (atau **SQL**)

### **Step 2: Run Fix SQL**

#### **Untuk Development (Quick Test):**

```sql
-- Disable RLS temporarily untuk testing
ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;

-- Verify disabled
SELECT tablename, rowsecurity FROM pg_tables
WHERE tablename = 'profiles';
-- Seharusnya rowsecurity = false
```

**Kemudian test register di aplikasi - seharusnya bisa berhasil.**

#### **Untuk Production (Proper Setup):**

Jalankan semua SQL dari file:

- **File:** `supabase/migrations/fix_profiles_rls_policies.sql`

**Atau copy-paste langsung:**

```sql
-- 1. Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 2. Drop old policies (jika ada)
DROP POLICY IF EXISTS "Public read profiles" ON public.profiles;
DROP POLICY IF EXISTS "User update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Auth users can insert profile" ON public.profiles;
DROP POLICY IF EXISTS "Admin can update any profile" ON public.profiles;
DROP POLICY IF EXISTS "Public can insert profiles" ON public.profiles;

-- 3. Create new NON-RECURSIVE policies

-- Policy: Everyone bisa baca profiles (untuk login lookup)
CREATE POLICY "Public read profiles"
ON public.profiles
FOR SELECT
USING (true);

-- Policy: User bisa insert profile sendiri saat signup
CREATE POLICY "Auth users can insert own profile"
ON public.profiles
FOR INSERT
WITH CHECK (
  auth.uid() = id
  AND auth.role() = 'authenticated'
);

-- Policy: User bisa update profile sendiri
CREATE POLICY "User update own profile"
ON public.profiles
FOR UPDATE
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- Policy: Admin bisa update semua profile
CREATE POLICY "Admin can update any profile"
ON public.profiles
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  )
);

-- Policy: Admin bisa delete profile
CREATE POLICY "Admin can delete any profile"
ON public.profiles
FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  )
);
```

### **Step 3: Verify Policies**

```sql
-- Cek semua policies di table profiles
SELECT * FROM pg_policies WHERE tablename = 'profiles';

-- Result seharusnya ada 5 policies:
-- - Public read profiles
-- - Auth users can insert own profile
-- - User update own profile
-- - Admin can update any profile
-- - Admin can delete any profile
```

### **Step 4: Test Register**

1. Buka aplikasi di browser
2. Refresh page (bersihkan cache)
3. Go to LoginRegister page
4. Klik tab **Daftar**
5. Isi form:
   ```
   Nama: Test User
   Username: test_user
   Email: test@email.com
   Password: password123
   Confirm: password123
   Role: Viewer
   ```
6. Klik **Daftar**
7. Expected result: ✅ **Pendaftaran Berhasil!**

---

## 🔄 Verification Checklist

- [ ] SQL migration sudah di-run
- [ ] Policies tidak ada error saat create
- [ ] `SELECT * FROM pg_policies WHERE tablename = 'profiles'` show 5 policies
- [ ] RLS status: `ALTER TABLE public.profiles ...` show `rowsecurity = true`
- [ ] Test register dengan new account
- [ ] Login dengan account baru berhasil
- [ ] Profile data muncul dengan benar

---

## 📋 RLS Policy Breakdown

### Policy 1: Public Read

```sql
FOR SELECT USING (true)
```

- **Effect:** Semua orang bisa READ profile
- **Use case:** Login page perlu lookup email dari username
- **Risk:** Rendah, hanya read username/email

### Policy 2: Auth Insert

```sql
FOR INSERT WITH CHECK (
  auth.uid() = id
  AND auth.role() = 'authenticated'
)
```

- **Effect:** Hanya bisa insert profile dengan id = own user id
- **Use case:** Saat signup, profile dibuat dengan user's own id
- **Risk:** Safe, can't insert for other users

### Policy 3: User Update

```sql
FOR UPDATE USING (auth.uid() = id)
```

- **Effect:** User hanya bisa update profile sendiri
- **Use case:** User edit own profile
- **Risk:** Safe, personal data protection

### Policy 4 & 5: Admin Access

```sql
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  )
)
```

- **Effect:** Admin bisa access semua profiles
- **Use case:** Admin manage users
- **Risk:** Safe, limited to admin only

---

## 🔧 Advanced Troubleshooting

### Jika error masih terjadi:

1. **Check current policies:**

   ```sql
   SELECT * FROM pg_policies WHERE tablename = 'profiles'
   ORDER BY policyname;
   ```

2. **Check RLS status:**

   ```sql
   SELECT tablename, rowsecurity FROM pg_tables WHERE tablename = 'profiles';
   ```

3. **Drop ALL policies:**

   ```sql
   DROP POLICY IF EXISTS "Public read profiles" ON public.profiles;
   DROP POLICY IF EXISTS "Auth users can insert own profile" ON public.profiles;
   DROP POLICY IF EXISTS "User update own profile" ON public.profiles;
   DROP POLICY IF EXISTS "Admin can update any profile" ON public.profiles;
   DROP POLICY IF EXISTS "Admin can delete any profile" ON public.profiles;

   -- Disable RLS completely (untuk debug)
   ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;
   ```

4. **Re-enable dan setup fresh:**

   ```sql
   ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

   -- Copy new policies dari fix_profiles_rls_policies.sql
   -- Run all CREATE POLICY statements
   ```

5. **Test query langsung:**
   ```sql
   -- Test sebagai authenticated user dengan id = '...'
   INSERT INTO public.profiles (id, username, email, full_name, role)
   VALUES (
     '12345-user-id-here',
     'testuser',
     'test@email.com',
     'Test User',
     'viewer'
   );
   ```

---

## 📞 Support

Jika masih error setelah ikuti langkah di atas:

1. **Check Supabase logs:**
   - Go to: Project → Logs → API
   - Cari timestamp saat register gagal
   - Lihat error message detail

2. **Check browser console:**
   - Buka DevTools (F12)
   - Go to Console tab
   - Cari error message lengkap
   - Screenshot dan bagikan

3. **Verify table structure:**

   ```sql
   -- Check columns di profiles table
   \d public.profiles
   ```

4. **Check constraints:**
   ```sql
   -- Verify foreign key dan unique constraints
   SELECT constraint_name, constraint_type
   FROM information_schema.table_constraints
   WHERE table_name = 'profiles';
   ```

---

## 🎯 Summary

| Problem                  | Solution                                                       |
| ------------------------ | -------------------------------------------------------------- |
| Infinite recursion error | Apply RLS policies dari `fix_profiles_rls_policies.sql`        |
| Need quick test          | Disable RLS: `ALTER TABLE profiles DISABLE ROW LEVEL SECURITY` |
| Can't insert profile     | Check auth.uid() = id constraint                               |
| Admin policies error     | Make sure admin has role='admin' in profiles                   |
| Multiple policies fail   | Drop all, re-create dari template clean                        |

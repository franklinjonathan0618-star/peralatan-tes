# ⚡ QUICK FIX: 13 Conflicting RLS Policies → 5 Clean Policies

## 🚨 Problem Found

Output dari `SELECT * FROM pg_policies WHERE tablename = 'profiles'` menunjukkan:

- **13 policies** yang duplicate dan conflicting
- Multiple policies untuk action yang sama
- Infinite recursion error saat register/insert

## ✅ Solution (5 Minutes)

### **COPY-PASTE ini ke Supabase SQL Editor:**

```sql
-- DROP SEMUA 13 policies lama
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

-- ENABLE RLS fresh
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- CREATE 5 CLEAN policies
CREATE POLICY "allow_public_read_profiles"
ON public.profiles FOR SELECT USING (true);

CREATE POLICY "allow_user_insert_own_profile"
ON public.profiles FOR INSERT
WITH CHECK (auth.uid() = id AND auth.role() = 'authenticated');

CREATE POLICY "allow_user_update_own_profile"
ON public.profiles FOR UPDATE
USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

CREATE POLICY "allow_admin_update_any_profile"
ON public.profiles FOR UPDATE
USING ((SELECT role FROM public.profiles WHERE id = auth.uid() LIMIT 1) = 'admin')
WITH CHECK ((SELECT role FROM public.profiles WHERE id = auth.uid() LIMIT 1) = 'admin');

CREATE POLICY "allow_admin_delete_any_profile"
ON public.profiles FOR DELETE
USING ((SELECT role FROM public.profiles WHERE id = auth.uid() LIMIT 1) = 'admin');
```

### **Langkah:**

1. Copy script atas ↑
2. Go to Supabase Console → SQL Editor
3. Paste script
4. Click **Execute**
5. Tunggu (no errors)
6. Refresh browser → Test register

---

## 📋 5 Clean Policies yang dibuat:

| Policy                           | Action | Condition        |
| -------------------------------- | ------ | ---------------- |
| `allow_public_read_profiles`     | SELECT | Everyone read    |
| `allow_user_insert_own_profile`  | INSERT | Only own user    |
| `allow_user_update_own_profile`  | UPDATE | Only own profile |
| `allow_admin_update_any_profile` | UPDATE | Admin only       |
| `allow_admin_delete_any_profile` | DELETE | Admin only       |

---

## ✔️ Verify Success

```sql
-- Run ini untuk verify 5 policies berhasil dibuat
SELECT policyname, cmd FROM pg_policies
WHERE tablename = 'profiles'
ORDER BY policyname;
```

Expected 5 rows berdasarkan nama di tabel atas.

---

## 🔥 Test Sekarang

1. Refresh browser
2. Go to LoginRegister
3. Tab: **Daftar**
4. Isi & submit
5. Expected: ✅ **Pendaftaran Berhasil!**

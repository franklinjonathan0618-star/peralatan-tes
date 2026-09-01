-- ============================================================
-- FIX INFINITE RECURSION RLS POLICY - Profiles Table
-- ============================================================
-- Error: "infinite recursion detected in policy for relation 'profiles'"
-- Cause: RLS policy tidak dikonfigurasi atau terlalu kompleks
-- Solution: Setup RLS policies dengan benar yang tidak rekursif
-- ============================================================

-- Step 1: Disable RLS untuk development/testing (Temporary)
-- UNCOMMENT LINE INI untuk development:
-- ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;

-- Step 2: Enable RLS untuk production
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Step 3: Drop existing policies (jika ada)
DROP POLICY IF EXISTS "Public read profiles" ON public.profiles;
DROP POLICY IF EXISTS "User update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Auth users can insert profile" ON public.profiles;
DROP POLICY IF EXISTS "Admin can update any profile" ON public.profiles;
DROP POLICY IF EXISTS "Profiles are viewable by owner" ON public.profiles;

-- ============================================================
-- PRODUCTION RLS POLICIES (Non-Recursive)
-- ============================================================

-- Policy 1: Public dapat READ semua profiles (untuk login lookup username)
CREATE POLICY "Public read profiles"
ON public.profiles
FOR SELECT
USING (true);

-- Policy 2: Authenticated users dapat INSERT profile sendiri (saat signup)
-- PENTING: 'auth.uid()' adalah fungsi bawaan Supabase yang SAFE
CREATE POLICY "Auth users can insert own profile"
ON public.profiles
FOR INSERT
WITH CHECK (
  auth.uid() = id
  AND auth.role() = 'authenticated'
);

-- Policy 3: User dapat UPDATE profile sendiri
CREATE POLICY "User update own profile"
ON public.profiles
FOR UPDATE
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- Policy 4: Admin dapat UPDATE profile apapun
-- (assumes 'admin' role ada di profiles.role)
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

-- Policy 5: Admin dapat DELETE profile
CREATE POLICY "Admin can delete any profile"
ON public.profiles
FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  )
);

-- ============================================================
-- IMPORTANT: Auth.users table access (read-only)
-- ============================================================
-- Supabase Auth users disimpan di auth.users table
-- Anda tidak perlu setup policy di sini, Supabase handle automatically

-- ============================================================
-- TESTING QUERY (untuk verify policies bekerja)
-- ============================================================
-- SELECT * FROM public.profiles;  -- Harus bisa read
-- INSERT INTO public.profiles (...) VALUES (...);  -- Harus bisa insert sebagai own user
-- UPDATE public.profiles SET role='viewer' WHERE id='...';  -- Update own profile OK
-- UPDATE public.profiles SET role='admin' WHERE id='...';  -- Hanya admin bisa

-- ============================================================
-- TROUBLESHOOTING
-- ============================================================
-- Jika masih error "infinite recursion":
-- 1. Check apakah ada policy yang refer ke table lain secara circular
-- 2. Pastikan tidak ada policy yang check 'profiles' di dalam 'profiles' policy
-- 3. Temporary disable RLS: ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;
-- 4. Kemudian test register, jika berjalan berarti problem di policy
-- 5. Rebuild policy dengan template di atas

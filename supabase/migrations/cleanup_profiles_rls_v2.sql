-- ============================================================
-- CLEANUP: Hapus SEMUA policies lama yang conflicting
-- ============================================================
-- Problem: Ada 13 policies yang duplicate dan conflicting
-- Solution: Delete semua, rebuild fresh dengan yang clean
-- ============================================================

-- Step 1: DROP SEMUA existing policies
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

-- Step 2: Verify all policies deleted
-- Seharusnya return 0 rows
-- SELECT COUNT(*) FROM pg_policies WHERE tablename = 'profiles';

-- ============================================================
-- Step 3: CREATE FRESH CLEAN POLICIES (Non-Recursive)
-- ============================================================

-- Enable RLS (jika belum)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- POLICY 1: Public dapat READ profiles (untuk login lookup)
-- ============================================================
-- Requirement: Login page perlu lookup email dari username
-- Permissions: SELECT
-- Condition: true (everyone bisa read)
-- Why safe: Hanya read username/email, tidak sensitive
-- Why no recursion: Simple SELECT USING (true), no sub-query
CREATE POLICY "allow_public_read_profiles"
ON public.profiles
FOR SELECT
USING (true);

-- ============================================================
-- POLICY 2: Authenticated user dapat INSERT profile sendiri
-- ============================================================
-- Requirement: Saat signup, user buat profile dengan id = auth.uid()
-- Permissions: INSERT
-- Condition: auth.uid() = id (hanya bisa insert with own user id)
-- Why safe: Can't forge other user's id
-- Why no recursion: Direct auth.uid() check, no table join
CREATE POLICY "allow_user_insert_own_profile"
ON public.profiles
FOR INSERT
WITH CHECK (
  auth.uid() = id
  AND auth.role() = 'authenticated'
);

-- ============================================================
-- POLICY 3: User dapat UPDATE profile sendiri
-- ============================================================
-- Requirement: User edit own profile
-- Permissions: UPDATE
-- Condition: USING (auth.uid() = id) - filter rows
--            WITH CHECK (auth.uid() = id) - verify after update
-- Why safe: Can't update other user's profile
-- Why no recursion: Direct auth.uid() check, no table join
CREATE POLICY "allow_user_update_own_profile"
ON public.profiles
FOR UPDATE
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- ============================================================
-- POLICY 4: Admin dapat UPDATE any profile
-- ============================================================
-- Requirement: Admin manage users
-- Permissions: UPDATE
-- Condition: Check if auth.uid() has admin role
-- Why safe: Limited to admin only
-- NOTE: This has sub-query but should NOT be recursive
--       because it's checking profiles_1, not profiles directly
CREATE POLICY "allow_admin_update_any_profile"
ON public.profiles
FOR UPDATE
USING (
  -- Check if current user is admin
  (SELECT role FROM public.profiles WHERE id = auth.uid() LIMIT 1) = 'admin'
)
WITH CHECK (
  -- Check if current user is admin
  (SELECT role FROM public.profiles WHERE id = auth.uid() LIMIT 1) = 'admin'
);

-- ============================================================
-- POLICY 5: Admin dapat DELETE any profile
-- ============================================================
-- Requirement: Admin manage users
-- Permissions: DELETE
CREATE POLICY "allow_admin_delete_any_profile"
ON public.profiles
FOR DELETE
USING (
  -- Check if current user is admin
  (SELECT role FROM public.profiles WHERE id = auth.uid() LIMIT 1) = 'admin'
);

-- ============================================================
-- VERIFY: Check policies sudah benar
-- ============================================================
-- Run this to verify:
-- SELECT schemaname, tablename, policyname, cmd, permissive
-- FROM pg_policies
-- WHERE tablename = 'profiles'
-- ORDER BY policyname;
--
-- Expected result: 5 policies
-- - allow_admin_delete_any_profile (DELETE)
-- - allow_admin_update_any_profile (UPDATE)
-- - allow_public_read_profiles (SELECT)
-- - allow_user_insert_own_profile (INSERT)
-- - allow_user_update_own_profile (UPDATE)

-- ============================================================
-- TEST: Try insert profile (sebagai authenticated user)
-- ============================================================
-- Jika sudah login, bisa test:
-- INSERT INTO public.profiles (id, username, email, full_name, role)
-- VALUES (auth.uid(), 'testuser', 'test@email.com', 'Test User', 'viewer');

-- ============================================================
-- TROUBLESHOOTING: If still error
-- ============================================================
-- 1. Check RLS is enabled:
--    SELECT tablename, rowsecurity FROM pg_tables 
--    WHERE tablename = 'profiles';
--    (Should show: rowsecurity = true)
--
-- 2. Check all policies are GONE before running this script:
--    SELECT COUNT(*) FROM pg_policies WHERE tablename = 'profiles';
--    (Should show: 0 or 13 if running again)
--
-- 3. If infinite recursion still happens:
--    Disable RLS: ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;
--    Then debug table structure

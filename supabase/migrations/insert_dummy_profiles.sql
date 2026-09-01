-- ============================================================
-- DUMMY DATA: Insert 3 test users directly ke database
-- ============================================================
-- Requirement: RLS harus DISABLE atau gunakan service_role key
-- ============================================================

-- SETUP: Pastikan RLS disabled dulu
ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;

-- ============================================================
-- DUMMY ACCOUNT 1: Admin
-- ============================================================
-- Important: User ID ini harus sudah ada di auth.users
-- Atau bisa generate UUID sendiri untuk testing
INSERT INTO public.profiles (
  id,
  username,
  email,
  full_name,
  role,
  created_at,
  updated_at
) VALUES (
  '12345678-1234-1234-1234-123456789001',  -- Replace dengan real user ID dari auth.users
  'admin',
  'admin@example.com',
  'Administrator',
  'admin',
  NOW(),
  NOW()
) ON CONFLICT (id) DO UPDATE SET
  username = EXCLUDED.username,
  email = EXCLUDED.email,
  full_name = EXCLUDED.full_name,
  role = EXCLUDED.role,
  updated_at = NOW();

-- ============================================================
-- DUMMY ACCOUNT 2: Commentator
-- ============================================================
INSERT INTO public.profiles (
  id,
  username,
  email,
  full_name,
  role,
  created_at,
  updated_at
) VALUES (
  '12345678-1234-1234-1234-123456789002',  -- Replace dengan real user ID
  'commentator',
  'commentator@example.com',
  'Commentator User',
  'commentator',
  NOW(),
  NOW()
) ON CONFLICT (id) DO UPDATE SET
  username = EXCLUDED.username,
  email = EXCLUDED.email,
  full_name = EXCLUDED.full_name,
  role = EXCLUDED.role,
  updated_at = NOW();

-- ============================================================
-- DUMMY ACCOUNT 3: Viewer
-- ============================================================
INSERT INTO public.profiles (
  id,
  username,
  email,
  full_name,
  role,
  created_at,
  updated_at
) VALUES (
  '12345678-1234-1234-1234-123456789003',  -- Replace dengan real user ID
  'viewer',
  'viewer@example.com',
  'Viewer User',
  'viewer',
  NOW(),
  NOW()
) ON CONFLICT (id) DO UPDATE SET
  username = EXCLUDED.username,
  email = EXCLUDED.email,
  full_name = EXCLUDED.full_name,
  role = EXCLUDED.role,
  updated_at = NOW();

-- ============================================================
-- VERIFY: Check data sudah terinsert
-- ============================================================
SELECT id, username, email, full_name, role, created_at 
FROM public.profiles 
ORDER BY created_at DESC;

-- ============================================================
-- IMPORTANT: Setelah insert, ENABLE RLS balik untuk security
-- ============================================================
-- ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- NOTES:
-- ============================================================
-- 1. User IDs (123456...) harus replace dengan UUID dari auth.users
--    Caranya: Buka Supabase → Authentication → Users
--    Copy UUID dari salah satu user
--
-- 2. Jika belum ada users di auth.users, harus create dulu
--    Bisa via Supabase Console → Authentication → Add user
--
-- 3. Username harus UNIQUE (ada constraint)
--    Jangan duplikat dengan yang sudah ada
--
-- 4. Email juga harus UNIQUE
--    Harus match dengan email di auth.users
--
-- 5. RLS perlu di-enable balik untuk production security
--    Uncomment line: ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

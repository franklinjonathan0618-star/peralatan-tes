-- ============================================================
-- Optimize username -> email lookup for login flow
-- ============================================================

-- 1) Index untuk lookup username exact match
CREATE INDEX IF NOT EXISTS profiles_username_idx
ON public.profiles (username);

-- 2) Index untuk lookup case-insensitive (jika data lama mixed-case)
CREATE INDEX IF NOT EXISTS profiles_lower_username_idx
ON public.profiles ((lower(username)));

-- 3) Optimized RPC for login lookup
-- SECURITY DEFINER dipakai agar lookup tidak berat karena evaluasi RLS per baris.
CREATE OR REPLACE FUNCTION public.get_email_by_username(p_username text)
RETURNS text
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT p.email
  FROM public.profiles AS p
  WHERE lower(p.username) = lower(p_username)
  LIMIT 1;
$$;

GRANT EXECUTE ON FUNCTION public.get_email_by_username(text) TO anon, authenticated;

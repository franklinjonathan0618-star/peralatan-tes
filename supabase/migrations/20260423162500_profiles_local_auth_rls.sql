-- WARNING:
-- For profile-only authentication, we disable RLS on profiles
-- because there is no auth.uid() context from Supabase Auth.
-- Re-enable RLS if you switch back to Supabase Auth.

alter table public.profiles disable row level security;

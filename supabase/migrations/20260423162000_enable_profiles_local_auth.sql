-- Enable profile-only authentication (without auth.users dependency)
create extension if not exists pgcrypto;

alter table public.profiles
drop constraint if exists profiles_id_fkey;

alter table public.profiles
alter column id set default gen_random_uuid();

create index if not exists profiles_lower_email_idx
on public.profiles using btree (lower(email));

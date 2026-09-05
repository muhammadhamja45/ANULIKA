-- =============================================================================
-- MIGRATION 002 — booking time ranges + photography packages
-- Run this once in the SQL Editor of a project that already ran schema.sql.
-- (A brand-new project can just run schema.sql — it already includes this.)
-- Safe to re-run: every statement is idempotent.
-- =============================================================================

-- Bookings now store an end time too, so a session can be "08:00–10:00"
-- instead of a single point in time.
alter table public.bookings add column if not exists end_time time;

-- Photography packages shown on the homepage, managed from /admin/packages.html.
create table if not exists public.packages (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  price_label text,
  description text,
  features text,
  image_url text,
  is_active boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
-- in case this migration was already run before image_url existed
alter table public.packages add column if not exists image_url text;
create index if not exists idx_packages_active on public.packages(is_active);

drop trigger if exists trg_packages_updated_at on public.packages;
create trigger trg_packages_updated_at before update on public.packages
  for each row execute function public.set_updated_at();

alter table public.packages enable row level security;

drop policy if exists "packages_select" on public.packages;
create policy "packages_select" on public.packages
  for select using (is_active = true or public.is_staff());

drop policy if exists "packages_insert_staff" on public.packages;
create policy "packages_insert_staff" on public.packages
  for insert with check (public.is_staff());

drop policy if exists "packages_update_staff" on public.packages;
create policy "packages_update_staff" on public.packages
  for update using (public.is_staff());

drop policy if exists "packages_delete_staff" on public.packages;
create policy "packages_delete_staff" on public.packages
  for delete using (public.is_staff());

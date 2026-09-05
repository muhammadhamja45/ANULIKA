-- =============================================================================
-- ANULIKA PHOTOGRAPHY — DATABASE SCHEMA
-- Run once in Supabase SQL Editor (or `supabase db push` as a migration).
-- Safe to run top-to-bottom on a fresh project.
-- =============================================================================

create extension if not exists "pgcrypto"; -- gen_random_uuid()

-- =============================================================================
-- TABLES
-- =============================================================================

-- profiles: one row per admin/editor, mirrors auth.users
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null,
  email text not null,
  role text not null default 'editor' check (role in ('admin', 'editor')),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index idx_profiles_role on public.profiles(role);

-- categories: manageable portfolio categories
create table public.categories (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  description text,
  is_active boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index idx_categories_active on public.categories(is_active);
create index idx_categories_slug on public.categories(slug);

-- portfolios: photography projects
create table public.portfolios (
  id uuid primary key default gen_random_uuid(),
  category_id uuid references public.categories(id) on delete set null,
  title text not null,
  slug text not null unique,
  cover_image text,
  description text,
  shoot_date date,
  is_published boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index idx_portfolios_category on public.portfolios(category_id);
create index idx_portfolios_published on public.portfolios(is_published);
create index idx_portfolios_slug on public.portfolios(slug);

-- portfolio_images: gallery images belonging to a portfolio
create table public.portfolio_images (
  id uuid primary key default gen_random_uuid(),
  portfolio_id uuid not null references public.portfolios(id) on delete cascade,
  image_url text not null,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);
create index idx_portfolio_images_portfolio on public.portfolio_images(portfolio_id);

-- bookings: client booking requests
create table public.bookings (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  whatsapp text not null,
  email text,
  category_id uuid references public.categories(id) on delete set null,
  booking_date date not null,
  booking_time time not null,
  end_time time,
  location text,
  notes text,
  status text not null default 'pending'
    check (status in ('pending', 'confirmed', 'rejected', 'completed', 'cancelled')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index idx_bookings_date on public.bookings(booking_date);
create index idx_bookings_status on public.bookings(status);

-- blocked_dates: dates the studio is unavailable (set by admin)
create table public.blocked_dates (
  id uuid primary key default gen_random_uuid(),
  blocked_date date not null unique,
  reason text,
  is_fully_booked boolean not null default false,
  created_at timestamptz not null default now()
);
create index idx_blocked_dates_date on public.blocked_dates(blocked_date);

-- app_settings: single-row global switches (e.g. booking open/closed)
create table public.app_settings (
  id smallint primary key default 1 check (id = 1),
  booking_open boolean not null default true,
  updated_at timestamptz not null default now()
);
insert into public.app_settings (id, booking_open) values (1, true);

-- packages: photography packages shown on the homepage
create table public.packages (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  price_label text, -- free text, e.g. "Rp 2.500.000" or "Mulai dari Rp 1.500.000"
  description text,
  features text, -- one included item per line, rendered as a bullet list
  image_url text,
  is_active boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index idx_packages_active on public.packages(is_active);

-- =============================================================================
-- updated_at auto-touch trigger
-- =============================================================================
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger trg_profiles_updated_at before update on public.profiles
  for each row execute function public.set_updated_at();
create trigger trg_categories_updated_at before update on public.categories
  for each row execute function public.set_updated_at();
create trigger trg_portfolios_updated_at before update on public.portfolios
  for each row execute function public.set_updated_at();
create trigger trg_bookings_updated_at before update on public.bookings
  for each row execute function public.set_updated_at();
create trigger trg_app_settings_updated_at before update on public.app_settings
  for each row execute function public.set_updated_at();
create trigger trg_packages_updated_at before update on public.packages
  for each row execute function public.set_updated_at();

-- =============================================================================
-- Role helpers (security definer so policies can check role without recursive RLS)
-- =============================================================================
create or replace function public.is_admin()
returns boolean
language sql security definer set search_path = public stable
as $$
  select coalesce((select role = 'admin' and is_active from public.profiles where id = auth.uid()), false);
$$;

create or replace function public.is_staff()
returns boolean
language sql security definer set search_path = public stable
as $$
  select coalesce((select is_active from public.profiles where id = auth.uid()), false);
$$;

-- Auto-create a profile row when a new auth user is created
-- (used by the supabase/functions/admin-users Edge Function when it creates a user).
create or replace function public.handle_new_user()
returns trigger
language plpgsql security definer set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, email, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', new.email),
    new.email,
    coalesce(new.raw_user_meta_data->>'role', 'editor')
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- =============================================================================
-- ROW LEVEL SECURITY
-- =============================================================================
alter table public.profiles enable row level security;
alter table public.categories enable row level security;
alter table public.portfolios enable row level security;
alter table public.portfolio_images enable row level security;
alter table public.bookings enable row level security;
alter table public.blocked_dates enable row level security;
alter table public.app_settings enable row level security;
alter table public.packages enable row level security;

-- profiles: staff can read all profiles (needed for admin/users.html); only admin can write.
create policy "profiles_select" on public.profiles
  for select using (auth.uid() = id or public.is_staff());
create policy "profiles_insert_admin" on public.profiles
  for insert with check (public.is_admin());
create policy "profiles_update_admin" on public.profiles
  for update using (public.is_admin());
create policy "profiles_delete_admin" on public.profiles
  for delete using (public.is_admin());

-- categories: public sees only active ones; staff (admin+editor) manage all.
create policy "categories_select" on public.categories
  for select using (is_active = true or public.is_staff());
create policy "categories_insert_staff" on public.categories
  for insert with check (public.is_staff());
create policy "categories_update_staff" on public.categories
  for update using (public.is_staff());
create policy "categories_delete_staff" on public.categories
  for delete using (public.is_staff());

-- portfolios: public sees only published ones; staff manage all.
create policy "portfolios_select" on public.portfolios
  for select using (is_published = true or public.is_staff());
create policy "portfolios_insert_staff" on public.portfolios
  for insert with check (public.is_staff());
create policy "portfolios_update_staff" on public.portfolios
  for update using (public.is_staff());
create policy "portfolios_delete_staff" on public.portfolios
  for delete using (public.is_staff());

-- portfolio_images: visible only if parent portfolio is visible; staff manage all.
create policy "portfolio_images_select" on public.portfolio_images
  for select using (
    exists (
      select 1 from public.portfolios p
      where p.id = portfolio_id and (p.is_published = true or public.is_staff())
    )
  );
create policy "portfolio_images_insert_staff" on public.portfolio_images
  for insert with check (public.is_staff());
create policy "portfolio_images_update_staff" on public.portfolio_images
  for update using (public.is_staff());
create policy "portfolio_images_delete_staff" on public.portfolio_images
  for delete using (public.is_staff());

-- bookings: anyone can create a booking (public form); only staff can read;
-- only admin can change status / delete (editor is view-only per spec).
create policy "bookings_insert_public" on public.bookings
  for insert with check (true);
create policy "bookings_select_staff" on public.bookings
  for select using (public.is_staff());
create policy "bookings_update_admin" on public.bookings
  for update using (public.is_admin());
create policy "bookings_delete_admin" on public.bookings
  for delete using (public.is_admin());

-- blocked_dates: public can read (needed to render the booking calendar); admin-only writes.
create policy "blocked_dates_select_public" on public.blocked_dates
  for select using (true);
create policy "blocked_dates_insert_admin" on public.blocked_dates
  for insert with check (public.is_admin());
create policy "blocked_dates_update_admin" on public.blocked_dates
  for update using (public.is_admin());
create policy "blocked_dates_delete_admin" on public.blocked_dates
  for delete using (public.is_admin());

-- app_settings: public can read (booking page checks booking_open); admin-only writes.
create policy "app_settings_select_public" on public.app_settings
  for select using (true);
create policy "app_settings_update_admin" on public.app_settings
  for update using (public.is_admin());

-- packages: public sees only active ones; staff (admin+editor) manage all.
create policy "packages_select" on public.packages
  for select using (is_active = true or public.is_staff());
create policy "packages_insert_staff" on public.packages
  for insert with check (public.is_staff());
create policy "packages_update_staff" on public.packages
  for update using (public.is_staff());
create policy "packages_delete_staff" on public.packages
  for delete using (public.is_staff());

-- =============================================================================
-- SEED: first admin account
-- =============================================================================
-- 1. Create the user in Supabase Dashboard → Authentication → Users → Add user
--    (or via the admin-users Edge Function once you have one admin already).
-- 2. Then run, replacing the email:
--
--   update public.profiles set role = 'admin', is_active = true
--   where email = 'you@example.com';
--
-- The handle_new_user() trigger already created the profiles row automatically
-- (default role 'editor') — this just promotes that first account to admin.

-- Landing SaaS — initial schema (Supabase / PostgreSQL)

create extension if not exists "pgcrypto";

-- Profiles (linked to auth.users)
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text,
  role text not null default 'admin',
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "profiles_select_own"
  on public.profiles for select
  using (auth.uid() = id);

create policy "profiles_update_own"
  on public.profiles for update
  using (auth.uid() = id);

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email)
  values (new.id, new.email);
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Global pixel & integrations (per account)
create table public.global_settings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users (id) on delete cascade,
  facebook_pixel_id text,
  tiktok_pixel_id text,
  telegram_bot_token text,
  telegram_chat_id text,
  google_sheet_webhook_url text,
  updated_at timestamptz not null default now()
);

alter table public.global_settings enable row level security;

create policy "global_settings_all_own"
  on public.global_settings for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Landing pages
create table public.landing_pages (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  title text not null,
  slug text not null unique,
  published boolean not null default false,
  sections jsonb not null default '[]'::jsonb,
  form_config jsonb not null default '{}'::jsonb,
  pixel_config jsonb not null default '{}'::jsonb,
  custom_domain text,
  visit_count int not null default 0,
  lead_count int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index landing_pages_user_id_idx on public.landing_pages (user_id);
create index landing_pages_slug_idx on public.landing_pages (slug);

alter table public.landing_pages enable row level security;

create policy "landing_pages_owner_all"
  on public.landing_pages for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "landing_pages_public_read_published"
  on public.landing_pages for select
  using (published = true);

-- Leads (inserts via service role from API only)
create table public.leads (
  id uuid primary key default gen_random_uuid(),
  landing_page_id uuid not null references public.landing_pages (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  payload jsonb not null default '{}'::jsonb,
  status text not null default 'new' check (status in ('new', 'processing', 'delivered')),
  created_at timestamptz not null default now()
);

create index leads_landing_page_id_idx on public.leads (landing_page_id);
create index leads_user_id_idx on public.leads (user_id);
create index leads_created_at_idx on public.leads (created_at desc);

alter table public.leads enable row level security;

create policy "leads_owner_select"
  on public.leads for select
  using (auth.uid() = user_id);

create policy "leads_owner_update"
  on public.leads for update
  using (auth.uid() = user_id);

create policy "leads_owner_delete"
  on public.leads for delete
  using (auth.uid() = user_id);

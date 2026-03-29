-- سجل صور مرفوعة إلى Storage مرتبطة بصفحة الهبوط (تتبع وتنظيف)
create table public.landing_media_assets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  landing_page_id uuid references public.landing_pages (id) on delete set null,
  bucket_id text not null default 'landing-media',
  storage_path text not null,
  public_url text not null,
  bytes int,
  mime_type text,
  created_at timestamptz not null default now(),
  unique (user_id, storage_path)
);

create index landing_media_assets_user_idx on public.landing_media_assets (user_id);
create index landing_media_assets_page_idx on public.landing_media_assets (landing_page_id);

alter table public.landing_media_assets enable row level security;

create policy "landing_media_assets_select_own"
  on public.landing_media_assets for select
  using (auth.uid() = user_id);

create policy "landing_media_assets_insert_own"
  on public.landing_media_assets for insert
  with check (auth.uid() = user_id);

create policy "landing_media_assets_delete_own"
  on public.landing_media_assets for delete
  using (auth.uid() = user_id);

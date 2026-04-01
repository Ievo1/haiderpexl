-- TikTok Pixel ID لكل صفحة هبوط
-- انسخ والصق المقطع كاملاً في SQL Editor (يجب أن يبدأ بـ ALTER TABLE).

alter table public.landing_pages add column if not exists tiktok_pixel_id text;

comment on column public.landing_pages.tiktok_pixel_id is 'TikTok pixel id for this landing page only';

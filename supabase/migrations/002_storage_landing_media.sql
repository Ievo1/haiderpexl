-- تخزين صور صفحات الهبوط (رفع من لوحة التحكم)
-- نفّذ هذا الملف في Supabase SQL Editor بعد 001_initial.sql

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'landing-media',
  'landing-media',
  true,
  5242880,
  array['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
on conflict (id) do update
set public = excluded.public,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;

-- إعادة التشغيل الآمنة: حذف السياسات إن وُجدت ثم إنشاؤها
drop policy if exists "landing_media_select_public" on storage.objects;
drop policy if exists "landing_media_insert_own" on storage.objects;
drop policy if exists "landing_media_update_own" on storage.objects;
drop policy if exists "landing_media_delete_own" on storage.objects;

-- قراءة عامة للملفات (عرض الصور في صفحات الهبوط)
create policy "landing_media_select_public"
  on storage.objects for select
  to public
  using (bucket_id = 'landing-media');

-- رفع/تعديل/حذف فقط داخل مجلد باسم user id (المسار: userId/filename)
create policy "landing_media_insert_own"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'landing-media'
    and name like auth.uid()::text || '/%'
  );

create policy "landing_media_update_own"
  on storage.objects for update
  to authenticated
  using (
    bucket_id = 'landing-media'
    and name like auth.uid()::text || '/%'
  );

create policy "landing_media_delete_own"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'landing-media'
    and name like auth.uid()::text || '/%'
  );

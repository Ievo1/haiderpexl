-- مظهر صفحة الهبوط العامة: نهاري أو ليلي
-- نفّذ هذا الملف على Supabase إذا ظهر خطأ schema cache لعمود appearance.

alter table public.landing_pages
  add column if not exists appearance text not null default 'light';

-- قيد القيم (مرة واحدة؛ يُتخطى إن وُجد مسبقاً عبر اسم مختلف)
do $$
begin
  alter table public.landing_pages
    add constraint landing_pages_appearance_check
    check (appearance in ('light', 'dark'));
exception
  when duplicate_object then null;
end $$;

-- ويب هوك احتياطي للطلبات (بالإضافة إلى Telegram)
alter table public.global_settings
  add column if not exists backup_webhook_url text;

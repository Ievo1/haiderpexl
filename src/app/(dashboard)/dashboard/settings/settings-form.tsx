"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { PixelTrackingChecklist } from "@/components/dashboard/pixel-tracking-checklist";
import { updateGlobalSettings } from "@/lib/actions/settings";

type Row = {
  facebook_pixel_id: string | null;
  tiktok_pixel_id: string | null;
  telegram_bot_token: string | null;
  telegram_chat_id: string | null;
  google_sheet_webhook_url: string | null;
  backup_webhook_url: string | null;
};

export function SettingsForm({ initial }: { initial: Row | null }) {
  const router = useRouter();
  const [v, setV] = useState<Row>({
    facebook_pixel_id: initial?.facebook_pixel_id ?? "",
    tiktok_pixel_id: initial?.tiktok_pixel_id ?? "",
    telegram_bot_token: initial?.telegram_bot_token ?? "",
    telegram_chat_id: initial?.telegram_chat_id ?? "",
    google_sheet_webhook_url: initial?.google_sheet_webhook_url ?? "",
    backup_webhook_url: initial?.backup_webhook_url ?? "",
  });
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setMsg(null);
    const res = await updateGlobalSettings({
      facebook_pixel_id: v.facebook_pixel_id || null,
      tiktok_pixel_id: v.tiktok_pixel_id || null,
      telegram_bot_token: v.telegram_bot_token || null,
      telegram_chat_id: v.telegram_chat_id || null,
      google_sheet_webhook_url: v.google_sheet_webhook_url || null,
      backup_webhook_url: v.backup_webhook_url || null,
    });
    setLoading(false);
    if ("error" in res && res.error) {
      setMsg(res.error);
      return;
    }
    setMsg("تم حفظ الإعدادات.");
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="space-y-8">
      <section className="rounded-2xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-950">
        <h2 className="text-lg font-semibold">بيكسل الإعلانات</h2>
        <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
          تُستخدم هذه المعرفات عند تفعيل Facebook / TikTok من إعدادات كل صفحة.
        </p>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <div>
            <label className="text-xs font-medium text-zinc-500">Facebook Pixel ID</label>
            <input
              dir="ltr"
              className="mt-1 w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm dark:border-zinc-800 dark:bg-zinc-950"
              value={v.facebook_pixel_id ?? ""}
              onChange={(e) => setV((s) => ({ ...s, facebook_pixel_id: e.target.value }))}
            />
          </div>
          <div>
            <label className="text-xs font-medium text-zinc-500">TikTok Pixel ID</label>
            <input
              dir="ltr"
              className="mt-1 w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm dark:border-zinc-800 dark:bg-zinc-950"
              value={v.tiktok_pixel_id ?? ""}
              onChange={(e) => setV((s) => ({ ...s, tiktok_pixel_id: e.target.value }))}
            />
          </div>
        </div>
        <div className="mt-6">
          <PixelTrackingChecklist variant="full" />
        </div>
      </section>

      <section className="rounded-2xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-950">
        <h2 className="text-lg font-semibold">Telegram</h2>
        <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
          إشعار فوري عند كل طلب جديد (Bot Token و Chat ID).
        </p>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label className="text-xs font-medium text-zinc-500">Bot Token</label>
            <input
              dir="ltr"
              className="mt-1 w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm dark:border-zinc-800 dark:bg-zinc-950"
              value={v.telegram_bot_token ?? ""}
              onChange={(e) => setV((s) => ({ ...s, telegram_bot_token: e.target.value }))}
            />
          </div>
          <div>
            <label className="text-xs font-medium text-zinc-500">Chat ID</label>
            <input
              dir="ltr"
              className="mt-1 w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm dark:border-zinc-800 dark:bg-zinc-950"
              value={v.telegram_chat_id ?? ""}
              onChange={(e) => setV((s) => ({ ...s, telegram_chat_id: e.target.value }))}
            />
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-950">
        <h2 className="text-lg font-semibold">Google Sheets / Webhook</h2>
        <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
          رابط Webhook (مثل Make أو Zapier) لإرسال بيانات الطلب كـ JSON.
        </p>
        <input
          dir="ltr"
          className="mt-4 w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm dark:border-zinc-800 dark:bg-zinc-950"
          placeholder="https://"
          value={v.google_sheet_webhook_url ?? ""}
          onChange={(e) => setV((s) => ({ ...s, google_sheet_webhook_url: e.target.value }))}
        />
      </section>

      <section className="rounded-2xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-950">
        <h2 className="text-lg font-semibold">ويب هوك احتياطي</h2>
        <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
          يُستدعى مع كل طلب (بالتوازي مع تيليغرام) — مفيد إذا تعطل بوت تيليغرام أو لنسخ احتياطي على
          خادمك أو Discord webhook.
        </p>
        <input
          dir="ltr"
          className="mt-4 w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm dark:border-zinc-800 dark:bg-zinc-950"
          placeholder="https://"
          value={v.backup_webhook_url ?? ""}
          onChange={(e) => setV((s) => ({ ...s, backup_webhook_url: e.target.value }))}
        />
      </section>

      {msg ? <p className="text-sm text-emerald-700 dark:text-emerald-300">{msg}</p> : null}

      <button
        type="submit"
        disabled={loading}
        className="rounded-xl bg-emerald-600 px-6 py-2.5 text-sm font-semibold text-white shadow-lg shadow-emerald-600/20 hover:bg-emerald-500 disabled:opacity-60"
      >
        {loading ? "جاري الحفظ…" : "حفظ الإعدادات"}
      </button>
    </form>
  );
}

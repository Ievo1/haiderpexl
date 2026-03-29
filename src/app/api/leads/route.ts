import { NextResponse } from "next/server";
import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendTelegramNotification } from "@/lib/integrations/telegram";
import { isValidIraqPhone, normalizeIraqPhone } from "@/lib/phone-iq";

const bodySchema = z.object({
  landingPageId: z.string().uuid(),
  payload: z.record(z.string(), z.unknown()),
  /** حقل وهمي ضد البوتات — يجب أن يبقى فارغاً */
  website: z.string().optional().default(""),
});

const RATE_MS = 90_000;

export async function POST(req: Request) {
  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Validation failed" }, { status: 422 });
  }

  /** بوتات تملأ الحقل المخفي — نُرجع نجاحاً دون حفظ */
  if (String(parsed.data.website ?? "").trim() !== "") {
    return NextResponse.json({ ok: true });
  }

  const admin = createAdminClient();

  const { data: page, error: pageErr } = await admin
    .from("landing_pages")
    .select("id, user_id, title, slug, published, lead_count")
    .eq("id", parsed.data.landingPageId)
    .maybeSingle();

  if (pageErr || !page) {
    return NextResponse.json({ error: "الصفحة غير موجودة", code: "NOT_FOUND" }, { status: 404 });
  }

  if (!page.published) {
    return NextResponse.json(
      {
        error: "الصفحة غير منشورة. انشرها من لوحة التحكم ثم أعد المحاولة.",
        code: "NOT_PUBLISHED",
      },
      { status: 403 },
    );
  }

  const payload = { ...parsed.data.payload } as Record<string, unknown>;

  const rawPhone = payload.phone;
  const rawConfirm = payload.confirm_phone;

  if (
    rawConfirm != null &&
    String(rawConfirm).trim() !== "" &&
    (rawPhone == null || String(rawPhone).trim() === "")
  ) {
    return NextResponse.json(
      { error: "أدخل رقم الهاتف ثم التأكيد.", code: "PHONE_INCOMPLETE" },
      { status: 422 },
    );
  }

  if (rawPhone != null && String(rawPhone).trim() !== "") {
    if (!isValidIraqPhone(rawPhone)) {
      return NextResponse.json(
        { error: "رقم الهاتف يجب أن يكون 11 رقماً ويبدأ بـ 07.", code: "INVALID_PHONE" },
        { status: 422 },
      );
    }
    const n = normalizeIraqPhone(rawPhone)!;
    payload.phone = n;
  }

  if (rawConfirm != null && String(rawConfirm).trim() !== "") {
    if (!isValidIraqPhone(rawConfirm)) {
      return NextResponse.json(
        { error: "تأكيد الهاتف يجب أن يكون 11 رقماً ويبدأ بـ 07.", code: "INVALID_PHONE" },
        { status: 422 },
      );
    }
    payload.confirm_phone = normalizeIraqPhone(rawConfirm)!;
  }

  if (
    payload.phone != null &&
    typeof payload.phone === "string" &&
    payload.confirm_phone != null &&
    typeof payload.confirm_phone === "string"
  ) {
    if (payload.phone !== payload.confirm_phone) {
      return NextResponse.json(
        { error: "رقم الهاتف وتأكيده غير متطابقين.", code: "PHONE_MISMATCH" },
        { status: 422 },
      );
    }
  }

  const phoneForRate =
    typeof payload.phone === "string" ? payload.phone : null;
  if (phoneForRate) {
    const since = new Date(Date.now() - RATE_MS).toISOString();
    const { data: recentRows } = await admin
      .from("leads")
      .select("id, created_at, payload")
      .eq("landing_page_id", page.id)
      .gte("created_at", since)
      .order("created_at", { ascending: false })
      .limit(40);

    const dup = recentRows?.some((row) => {
      const p = row.payload as Record<string, unknown> | null;
      const ph = p?.phone;
      return typeof ph === "string" && ph === phoneForRate;
    });
    if (dup) {
      return NextResponse.json(
        {
          error: "تم استلام طلب مؤخراً من هذا الرقم. انتظر قليلاً ثم أعد المحاولة.",
          code: "RATE_LIMIT",
        },
        { status: 429 },
      );
    }
  }

  const { data: inserted, error: insertErr } = await admin
    .from("leads")
    .insert({
      landing_page_id: page.id,
      user_id: page.user_id,
      payload,
      status: "new",
    })
    .select("id")
    .single();

  if (insertErr || !inserted) {
    return NextResponse.json({ error: insertErr?.message ?? "Insert failed" }, { status: 500 });
  }

  await admin
    .from("landing_pages")
    .update({
      lead_count: (page.lead_count ?? 0) + 1,
      updated_at: new Date().toISOString(),
    })
    .eq("id", page.id);

  const { data: settings } = await admin
    .from("global_settings")
    .select("telegram_bot_token, telegram_chat_id, google_sheet_webhook_url, backup_webhook_url")
    .eq("user_id", page.user_id)
    .maybeSingle();

  const lines = Object.entries(payload)
    .filter(([k]) => !k.startsWith("_"))
    .map(([k, v]) => `<b>${k}</b>: ${String(v)}`)
    .join("\n");
  const tgText = `🆕 طلب جديد — ${page.title}\n/${page.slug}\n\n${lines}`;

  const hookBody = {
    lead_id: inserted.id,
    landing_page_id: page.id,
    slug: page.slug,
    title: page.title,
    created_at: new Date().toISOString(),
    ...payload,
  };

  void sendTelegramNotification(
    settings?.telegram_bot_token,
    settings?.telegram_chat_id,
    tgText,
  );

  const postJson = async (url: string) => {
    try {
      await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(hookBody),
      });
    } catch {
      /* non-blocking */
    }
  };

  if (settings?.backup_webhook_url) {
    void postJson(settings.backup_webhook_url);
  }

  if (settings?.google_sheet_webhook_url) {
    void postJson(settings.google_sheet_webhook_url);
  }

  return NextResponse.json({ ok: true, leadId: inserted.id });
}

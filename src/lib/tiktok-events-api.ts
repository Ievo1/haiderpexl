import { createHash } from "crypto";
import { formatPhoneForTikTokE164 } from "@/lib/tiktok-mam-format";

const TIKTOK_PIXEL_TRACK_URL = "https://business-api.tiktok.com/open_api/v1.3/pixel/track/";

export function sha256HexLowerUtf8(text: string): string {
  return createHash("sha256").update(text, "utf8").digest("hex");
}

export function hashEmailForTikTokApi(email: string): string | null {
  const e = email.trim().toLowerCase();
  if (!e.includes("@")) return null;
  return sha256HexLowerUtf8(e);
}

/** رقم مُطبَّع 07xxxxxxxx أو أي شكل يمر عبر formatPhoneForTikTokE164 */
export function hashPhoneForTikTokApi(phoneRaw: string): string | null {
  const e164 = formatPhoneForTikTokE164(phoneRaw);
  if (!e164) return null;
  return sha256HexLowerUtf8(e164);
}

export function hashExternalIdForTikTokApi(leadId: string): string {
  return sha256HexLowerUtf8(String(leadId).trim());
}

function clientIpFromRequest(req: Request): string | undefined {
  const xff = req.headers.get("x-forwarded-for");
  if (xff) {
    const first = xff.split(",")[0]?.trim();
    if (first) return first.slice(0, 45);
  }
  const real = req.headers.get("x-real-ip");
  if (real) return real.trim().slice(0, 45);
  return undefined;
}

function userAgentFromRequest(req: Request): string | undefined {
  const ua = req.headers.get("user-agent");
  if (!ua) return undefined;
  return ua.slice(0, 512);
}

export type TikTokSubmitFormServerPayload = {
  accessToken: string;
  pixelCode: string;
  eventId: string;
  leadId: string;
  payload: Record<string, unknown>;
  req: Request;
  pageUrl?: string;
  referrer?: string;
  ttclid?: string;
  ttp?: string;
  contentId: string;
  value: number;
  currency: string;
  testEventCode?: string;
};

/**
 * يرسل SubmitForm عبر Events API — الحقول الحساسة مُجزّأة كما يطلب TikTok.
 * يُستدعى بشكل غير متزامن من مسار الطلبات؛ لا يعطل الاستجابة للعميل.
 */
export async function sendTikTokSubmitFormServer(
  p: TikTokSubmitFormServerPayload,
): Promise<void> {
  const user: Record<string, string> = {};

  const ext = hashExternalIdForTikTokApi(p.leadId);
  user.external_id = ext;

  const phoneRaw = p.payload.phone != null ? String(p.payload.phone) : "";
  if (phoneRaw) {
    const ph = hashPhoneForTikTokApi(phoneRaw);
    if (ph) user.phone_number = ph;
  }

  for (const key of Object.keys(p.payload)) {
    if (key.toLowerCase().includes("email")) {
      const em = String(p.payload[key] ?? "").trim();
      const h = hashEmailForTikTokApi(em);
      if (h) {
        user.email = h;
        break;
      }
    }
  }

  if (p.ttp && p.ttp.trim()) user.ttp = p.ttp.trim().slice(0, 200);

  const ip = clientIpFromRequest(p.req);
  if (ip) user.ip = ip;

  const ua = userAgentFromRequest(p.req);
  if (ua) user.user_agent = ua;

  const context: Record<string, unknown> = { user };

  if (p.ttclid && p.ttclid.trim()) {
    context.ad = { callback: p.ttclid.trim().slice(0, 500) };
  }

  const page: Record<string, string> = {};
  if (p.pageUrl && p.pageUrl.trim()) page.url = p.pageUrl.trim().slice(0, 2048);
  if (p.referrer && p.referrer.trim()) page.referrer = p.referrer.trim().slice(0, 2048);
  if (Object.keys(page).length) context.page = page;

  const cur = /^[A-Z]{3}$/i.test(p.currency) ? p.currency.toUpperCase() : "IQD";
  const v = Number.isFinite(p.value) && p.value >= 0 ? p.value : 0;
  const cid = p.contentId.trim().slice(0, 200);

  const properties: Record<string, unknown> = {
    content_type: "product",
    currency: cur,
    value: v,
    contents: [
      {
        content_id: cid,
        price: v,
        quantity: 1,
      },
    ],
  };

  const body: Record<string, unknown> = {
    pixel_code: p.pixelCode,
    event: "SubmitForm",
    event_id: p.eventId.slice(0, 200),
    timestamp: new Date().toISOString().replace(/\.\d{3}Z$/, "Z"),
    context,
    properties,
  };

  if (p.testEventCode && p.testEventCode.trim()) {
    body.test_event_code = p.testEventCode.trim();
  }

  try {
    const res = await fetch(TIKTOK_PIXEL_TRACK_URL, {
      method: "POST",
      headers: {
        "Access-Token": p.accessToken,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });
    const json = (await res.json().catch(() => ({}))) as {
      code?: number;
      message?: string;
      data?: { code?: number; message?: string };
    };
    const code =
      typeof json.code === "number"
        ? json.code
        : typeof json.data?.code === "number"
          ? json.data.code
          : undefined;
    if (!res.ok || (code != null && code !== 0)) {
      console.error("[TikTok Events API] SubmitForm failed", res.status, json);
    }
  } catch (e) {
    console.error("[TikTok Events API] SubmitForm error", e);
  }
}

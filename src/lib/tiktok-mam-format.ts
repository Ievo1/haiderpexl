import { normalizeIraqPhone } from "@/lib/phone-iq";

/**
 * TikTok (MAM + Events API): E.164 عراق +964 ثم 10 أرقام تبدأ بـ 7.
 * يُستخدم على العميل للبكسل وعلى الخادم قبل تجزئة الهاتف لـ Events API.
 */
export function formatPhoneForTikTokE164(raw: string): string | null {
  const digits = String(raw).replace(/\D/g, "");
  let national10: string | null = null;

  if (digits.startsWith("00964")) {
    const rest = digits.slice(5);
    if (rest.length === 10 && rest.startsWith("7")) national10 = rest;
    else if (rest.length === 11 && rest.startsWith("07")) national10 = rest.slice(1);
  } else if (digits.startsWith("964")) {
    const rest = digits.slice(3);
    if (rest.length === 10 && rest.startsWith("7")) national10 = rest;
    else if (rest.length === 11 && rest.startsWith("07")) national10 = rest.slice(1);
  } else {
    const normalized = normalizeIraqPhone(raw);
    const d = (normalized ?? digits).replace(/\D/g, "");
    if (d.length === 11 && d.startsWith("07")) {
      const rest = d.slice(1);
      if (rest.length === 10 && rest.startsWith("7")) national10 = rest;
    } else if (d.length === 10 && d.startsWith("7")) {
      national10 = d;
    }
  }

  if (!national10 || national10.length !== 10 || !national10.startsWith("7")) return null;
  return `+964${national10}`;
}

/** يمنع حقن نص في معرّف البكسل — أحرف وأرقام وشرطة وسطر سفلي */
export function sanitizeTikTokPixelId(raw: string | null | undefined): string | null {
  if (raw == null) return null;
  const s = String(raw).trim();
  if (!s || !/^[A-Za-z0-9_-]+$/.test(s)) return null;
  return s;
}

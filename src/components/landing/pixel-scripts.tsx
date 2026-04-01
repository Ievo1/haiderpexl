"use client";

import Script from "next/script";
import { useEffect } from "react";
import { normalizeIraqPhone } from "@/lib/phone-iq";
import type { PixelPageConfig } from "@/types/landing";

declare global {
  interface Window {
    fbq?: (...args: unknown[]) => void;
    ttq?: {
      load: (id: string) => void;
      page: () => void;
      track: (name: string, props?: Record<string, unknown>) => void;
      identify?: (data: Record<string, unknown>) => void;
    };
  }
}

/** يُخزَّن بعد إرسال النموذج ليُمرَّر لأحداث صفحة الشكر (MAM) */
const TT_MAM_SESSION_KEY = "ld_tt_mam_v1";

/** حقول Manual Advanced Matching المدعومة من TikTok للأحداث / identify */
export type TikTokMamPayload = {
  email?: string;
  phone_number?: string;
  first_name?: string;
  last_name?: string;
  city?: string;
  state?: string;
  zip?: string;
  country?: string;
  address?: string;
};

function formatPhoneForTikTokMam(raw: string): string | null {
  const normalized = normalizeIraqPhone(raw);
  const d = (normalized ?? raw).replace(/\D/g, "");
  if (d.length === 11 && d.startsWith("07")) return `964${d.slice(1)}`;
  if (d.length === 10 && d.startsWith("7")) return `964${d}`;
  if (d.startsWith("964") && d.length >= 12) return d;
  return d.length >= 8 ? d : null;
}

/** يستخرج بيانات المطابقة من payload النموذج (اسم، هاتف، محافظة، عنوان، بريد إن وُجد) */
export function extractTikTokMamFromLeadPayload(
  payload: Record<string, unknown>,
): TikTokMamPayload {
  const out: TikTokMamPayload = {};

  const phoneRaw = payload.phone != null ? String(payload.phone) : "";
  const phoneTt = formatPhoneForTikTokMam(phoneRaw);
  if (phoneTt) out.phone_number = phoneTt;

  for (const key of Object.keys(payload)) {
    if (key.toLowerCase().includes("email") && !out.email) {
      const em = String(payload[key] ?? "").trim();
      if (em.includes("@")) out.email = em;
    }
  }

  const full = String(payload.name ?? "").trim();
  const parts = full.split(/\s+/).filter(Boolean);
  if (parts.length >= 1) out.first_name = parts[0];
  if (parts.length >= 2) out.last_name = parts.slice(1).join(" ");

  const gov = String(payload.governorate ?? payload.city ?? "").trim();
  if (gov) out.city = gov;

  const addr = String(payload.address ?? "").trim();
  if (addr) out.address = addr;

  out.country = "IQ";
  return out;
}

function mamForTikTokEvent(m: TikTokMamPayload | null | undefined): Record<string, string> {
  if (!m) return {};
  const o: Record<string, string> = {};
  const keys: (keyof TikTokMamPayload)[] = [
    "email",
    "phone_number",
    "first_name",
    "last_name",
    "city",
    "state",
    "zip",
    "country",
    "address",
  ];
  for (const k of keys) {
    const v = m[k];
    if (v != null && String(v).trim() !== "") o[k] = String(v).trim();
  }
  return o;
}

/** بعد نجاح إرسال الطلب: identify + قمع TikTok + تخزين MAM لصفحة الشكر */
export function tikTokAfterLeadFormSuccess(opts: {
  pixelConfig: PixelPageConfig;
  contentId: string;
  payload: Record<string, unknown>;
  orderValue: number;
  currencyIso: string;
}) {
  const { pixelConfig, contentId, payload, orderValue, currencyIso } = opts;
  if (!pixelConfig.enabled || !pixelConfig.useTikTok) return;

  const mam = extractTikTokMamFromLeadPayload(payload);
  try {
    sessionStorage.setItem(TT_MAM_SESSION_KEY, JSON.stringify(mam));
  } catch {
    /* private mode */
  }

  if (typeof window.ttq === "undefined") return;

  try {
    const idFn = window.ttq.identify;
    if (typeof idFn === "function" && Object.keys(mamForTikTokEvent(mam)).length > 0) {
      idFn.call(window.ttq, { ...mamForTikTokEvent(mam) });
    }
  } catch {
    /* ignore */
  }

  const cid = normalizePixelContentId(contentId);
  const v = Number.isFinite(orderValue) && orderValue >= 0 ? orderValue : 0;
  const cur = /^[A-Z]{3}$/i.test(currencyIso) ? currencyIso.toUpperCase() : "IQD";
  const extra = mamForTikTokEvent(mam);

  if (!cid || !(pixelConfig.trackLead || pixelConfig.trackPurchase)) return;

  try {
    window.ttq.track("AddToCart", {
      content_id: cid,
      content_type: "product",
      value: v,
      currency: cur,
      ...extra,
    });
  } catch {
    /* ignore */
  }
  try {
    window.ttq.track("InitiateCheckout", {
      content_id: cid,
      content_type: "product",
      value: v,
      currency: cur,
      ...extra,
    });
  } catch {
    /* ignore */
  }
}

export function peekTikTokMamFromSession(): TikTokMamPayload | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(TT_MAM_SESSION_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as TikTokMamPayload;
  } catch {
    return null;
  }
}

export function clearTikTokMamSession() {
  try {
    sessionStorage.removeItem(TT_MAM_SESSION_KEY);
  } catch {
    /* ignore */
  }
}

/** يمنع حقن نص في سكربت البكسل — معرّفات TikTok عادة أحرف وأرقام وشرطة */
export function sanitizeTikTokPixelId(raw: string | null | undefined): string | null {
  if (raw == null) return null;
  const s = String(raw).trim();
  if (!s || !/^[A-Za-z0-9_-]+$/.test(s)) return null;
  return s;
}

/** معرّف منتج/عرض لكتالوج TikTok — حرف واحد على الأقل غير مسافة */
export function normalizePixelContentId(raw: string | null | undefined): string | null {
  if (raw == null) return null;
  const s = String(raw).trim();
  if (!s) return null;
  return s.slice(0, 200);
}

export function PixelScripts({
  fbId,
  ttId,
  pixelConfig,
  contentId,
}: {
  fbId: string | null | undefined;
  ttId: string | null | undefined;
  pixelConfig: PixelPageConfig;
  /** slug الصفحة أو landingPageId — لربط الأحداث بكتالوج التسوّق */
  contentId: string;
}) {
  const enabled = pixelConfig.enabled;
  const cid = normalizePixelContentId(contentId);
  const safeTtId = sanitizeTikTokPixelId(ttId);

  useEffect(() => {
    if (!enabled || !pixelConfig.useTikTok || !safeTtId || !window.ttq) return;
    try {
      window.ttq.load(safeTtId);
      if (pixelConfig.trackPageView) window.ttq.page();
    } catch {
      /* ignore */
    }
  }, [enabled, safeTtId, pixelConfig.useTikTok, pixelConfig.trackPageView]);

  /** ViewContent + فيسبوك — بعد تحميل السكربت، لإرفاق content_id (متطلب TikTok Shopping / VSA) */
  useEffect(() => {
    if (!enabled || !pixelConfig.trackPageView || !cid) return;

    const fire = () => {
      if (pixelConfig.useTikTok && window.ttq) {
        try {
          window.ttq.track("ViewContent", {
            content_id: cid,
            content_type: "product",
          });
        } catch {
          /* ignore */
        }
      }
      if (pixelConfig.useFacebook && typeof window.fbq === "function") {
        try {
          window.fbq("track", "ViewContent", {
            content_ids: [cid],
            content_type: "product",
          });
        } catch {
          /* ignore */
        }
      }
    };

    const t1 = window.setTimeout(fire, 200);
    const t2 = window.setTimeout(fire, 900);
    return () => {
      window.clearTimeout(t1);
      window.clearTimeout(t2);
    };
  }, [
    enabled,
    cid,
    pixelConfig.trackPageView,
    pixelConfig.useTikTok,
    pixelConfig.useFacebook,
  ]);

  if (!enabled) return null;

  const fbInline =
    pixelConfig.useFacebook && fbId
      ? `
!function(f,b,e,v,n,t,s)
{if(f.fbq)return;n=f.fbq=function(){n.callMethod?
n.callMethod.apply(n,arguments):n.queue.push(arguments)};
if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
n.queue=[];t=b.createElement(e);t.async=!0;
t.src=v;s=b.getElementsByTagName(e)[0];
s.parentNode.insertBefore(t,s)}(window, document,'script',
'https://connect.facebook.net/en_US/fbevents.js');
fbq('init', '${fbId}');
${pixelConfig.trackPageView ? "fbq('track', 'PageView');" : ""}
`.trim()
      : null;

  /* قالب TikTok الرسمي (محدّث) — المعرف يُحقن بعد التحقق فقط */
  const ttInline =
    pixelConfig.useTikTok && safeTtId
      ? `
!function (w, d, t) {
  w.TiktokAnalyticsObject=t;var ttq=w[t]=w[t]||[];ttq.methods=["page","track","identify","instances","debug","on","off","once","ready","alias","group","enableCookie","disableCookie","holdConsent","revokeConsent","grantConsent"],ttq.setAndDefer=function(t,e){t[e]=function(){t.push([e].concat(Array.prototype.slice.call(arguments,0)))}};for(var i=0;i<ttq.methods.length;i++)ttq.setAndDefer(ttq,ttq.methods[i]);ttq.instance=function(t){for(var e=ttq._i[t]||[],n=0;n<ttq.methods.length;n++)ttq.setAndDefer(e,ttq.methods[n]);return e},ttq.load=function(e,n){var r="https://analytics.tiktok.com/i18n/pixel/events.js",o=n&&n.partner;ttq._i=ttq._i||{},ttq._i[e]=[],ttq._i[e]._u=r,ttq._t=ttq._t||{},ttq._t[e]=+new Date,ttq._o=ttq._o||{},ttq._o[e]=n||{};n=document.createElement("script");n.type="text/javascript",n.async=!0,n.src=r+"?sdkid="+e+"&lib="+t;e=document.getElementsByTagName("script")[0];e.parentNode.insertBefore(n,e)};
  ttq.load('${safeTtId}');
  ${pixelConfig.trackPageView ? "ttq.page();" : ""}
}(window, document, 'ttq');
`.trim()
      : null;

  return (
    <>
      {fbInline ? (
        <>
          <Script
            id="facebook-pixel"
            strategy="afterInteractive"
            dangerouslySetInnerHTML={{ __html: fbInline }}
          />
          <noscript>
            <img
              height="1"
              width="1"
              className="hidden"
              src={`https://www.facebook.com/tr?id=${fbId}&ev=PageView&noscript=1`}
              alt=""
            />
          </noscript>
        </>
      ) : null}
      {ttInline ? (
        <Script
          key={safeTtId}
          id={`tiktok-pixel-${safeTtId}`}
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{ __html: ttInline }}
        />
      ) : null}
    </>
  );
}

/** يُستدعى من صفحة الشكر — تعبئة / ليد (يُدمج MAM إن وُجد من الجلسة) */
export function trackLeadEvent(
  pixelConfig: PixelPageConfig,
  contentId: string,
  mam?: TikTokMamPayload | null,
) {
  if (!pixelConfig.enabled) return;
  const cid = normalizePixelContentId(contentId);
  const ttExtra = mamForTikTokEvent(mam);
  if (pixelConfig.trackLead && pixelConfig.useFacebook && typeof window.fbq === "function") {
    window.fbq(
      "track",
      "Lead",
      cid ? { content_ids: [cid], content_type: "product" } : {},
    );
  }
  if (pixelConfig.trackLead && pixelConfig.useTikTok && window.ttq && cid) {
    window.ttq.track("SubmitForm", {
      content_id: cid,
      content_type: "product",
      ...ttExtra,
    });
  }
}

/** صفحة الشكر — الشراء / إتمام الدفع */
export function trackPurchaseEvent(
  pixelConfig: PixelPageConfig,
  value: number,
  currency: string = "IQD",
  contentId: string,
  mam?: TikTokMamPayload | null,
) {
  if (!pixelConfig.enabled || !pixelConfig.trackPurchase) return;
  const v = Number.isFinite(value) && value >= 0 ? value : 0;
  const cid = normalizePixelContentId(contentId);
  const ttExtra = mamForTikTokEvent(mam);
  if (pixelConfig.useFacebook && typeof window.fbq === "function") {
    window.fbq("track", "Purchase", {
      value: v,
      currency,
      ...(cid ? { content_ids: [cid], content_type: "product" } : {}),
    });
  }
  if (pixelConfig.useTikTok && window.ttq) {
    const payload: Record<string, unknown> = {
      value: v,
      currency,
      ...ttExtra,
    };
    if (cid) {
      payload.content_id = cid;
      payload.content_type = "product";
    }
    window.ttq.track("CompletePayment", payload);
  }
}

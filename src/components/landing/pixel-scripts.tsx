"use client";

import Script from "next/script";
import { useEffect } from "react";
import type { PixelPageConfig } from "@/types/landing";

declare global {
  interface Window {
    fbq?: (...args: unknown[]) => void;
    ttq?: {
      load: (id: string) => void;
      page: () => void;
      track: (name: string, props?: Record<string, unknown>) => void;
    };
  }
}

export function PixelScripts({
  fbId,
  ttId,
  pixelConfig,
}: {
  fbId: string | null | undefined;
  ttId: string | null | undefined;
  pixelConfig: PixelPageConfig;
}) {
  const enabled = pixelConfig.enabled;

  useEffect(() => {
    if (!enabled || !pixelConfig.useTikTok || !ttId || !window.ttq) return;
    try {
      window.ttq.load(ttId);
      if (pixelConfig.trackPageView) window.ttq.page();
    } catch {
      /* ignore */
    }
  }, [enabled, ttId, pixelConfig.useTikTok, pixelConfig.trackPageView]);

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

  const ttInline =
    pixelConfig.useTikTok && ttId
      ? `
!function (w, d, t) {
  w.TiktokAnalyticsObject=t;var ttq=w[t]=w[t]||[];ttq.methods=["page","track","identify","instances","debug","on","off","once","ready","alias","group","enableCookie","disableCookie"],ttq.setAndDefer=function(t,e){t[e]=function(){t.push([e].concat(Array.prototype.slice.call(arguments,0)))}};for(var i=0;i<ttq.methods.length;i++)ttq.setAndDefer(ttq,ttq.methods[i]);ttq.instance=function(t){for(var e=ttq._i[t]||[],n=0;n<ttq.methods.length;n++)ttq.setAndDefer(e,ttq.methods[n]);return e},ttq.load=function(e,n){var i="https://analytics.tiktok.com/i18n/pixel/events.js";ttq._i=ttq._i||{},ttq._i[e]=[],ttq._i[e]._u=i,ttq._t=ttq._t||{},ttq._t[e]=+new Date,ttq._o=ttq._o||{},ttq._o[e]=n||{};var o=document.createElement("script");o.type="text/javascript",o.async=!0,o.src=i+"?sdkid="+e+"&lib="+t;var a=document.getElementsByTagName("script")[0];a.parentNode.insertBefore(o,a)};
  ttq.load('${ttId}');
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
          id="tiktok-pixel-base"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{ __html: ttInline }}
        />
      ) : null}
    </>
  );
}

/** يُستدعى بعد نجاح إرسال النموذج فقط — بدون Purchase (يُطلق من صفحة الشكر) */
export function trackLeadEvent(pixelConfig: PixelPageConfig) {
  if (!pixelConfig.enabled) return;
  if (pixelConfig.trackLead && pixelConfig.useFacebook && typeof window.fbq === "function") {
    window.fbq("track", "Lead");
  }
  if (pixelConfig.trackLead && pixelConfig.useTikTok && window.ttq) {
    window.ttq.track("SubmitForm", {});
  }
}

/** صفحة الشكر — الشراء / إتمام الدفع */
export function trackPurchaseEvent(
  pixelConfig: PixelPageConfig,
  value: number,
  currency: string = "IQD",
) {
  if (!pixelConfig.enabled || !pixelConfig.trackPurchase) return;
  const v = Number.isFinite(value) && value >= 0 ? value : 0;
  if (pixelConfig.useFacebook && typeof window.fbq === "function") {
    window.fbq("track", "Purchase", { value: v, currency });
  }
  if (pixelConfig.useTikTok && window.ttq) {
    window.ttq.track("CompletePayment", { value: v, currency });
  }
}

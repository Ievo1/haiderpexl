"use client";

import { useEffect, useMemo } from "react";
import {
  clearTikTokMamSession,
  peekTikTokMamFromSession,
  peekTikTokSubmitEventId,
  PixelScripts,
  trackLeadEvent,
  trackPurchaseEvent,
} from "@/components/landing/pixel-scripts";
import { getLandingClasses } from "@/lib/landing-appearance-classes";
import type { LandingAppearance, PixelPageConfig } from "@/types/landing";

/** بدون PageView على صفحة الشكر؛ أحداث Lead و Purchase تُرسل يدوياً بعد تحميل السكربتات */
function useThankYouPixelConfig(pixelConfig: PixelPageConfig): PixelPageConfig {
  return useMemo(
    () => ({
      ...pixelConfig,
      trackPageView: false,
    }),
    [
      pixelConfig.enabled,
      pixelConfig.useFacebook,
      pixelConfig.useTikTok,
      pixelConfig.trackPageView,
      pixelConfig.trackLead,
      pixelConfig.trackPurchase,
    ],
  );
}

export function ThankYouClient({
  fbId,
  ttId,
  pixelConfig,
  contentId,
  value,
  currency,
  appearance = "light",
}: {
  fbId: string | null | undefined;
  ttId: string | null | undefined;
  pixelConfig: PixelPageConfig;
  /** slug أو id الصفحة — لـ TikTok content_id */
  contentId: string;
  value: number;
  currency: string;
  appearance?: LandingAppearance;
}) {
  const cfg = useThankYouPixelConfig(pixelConfig);
  const c = getLandingClasses(appearance ?? "light");

  useEffect(() => {
    const mam = peekTikTokMamFromSession();
    let cancelled = false;
    const tClear = window.setTimeout(() => clearTikTokMamSession(), 15000);
    const leadMs = 500;
    const purchaseMs = 1100;
    const tLead = window.setTimeout(() => {
      if (cancelled) return;
      trackLeadEvent(pixelConfig, contentId, mam, peekTikTokSubmitEventId());
    }, leadMs);
    const tPurchase = window.setTimeout(() => {
      if (cancelled) return;
      trackPurchaseEvent(pixelConfig, value, currency, contentId, mam);
    }, purchaseMs);
    return () => {
      cancelled = true;
      window.clearTimeout(tClear);
      window.clearTimeout(tLead);
      window.clearTimeout(tPurchase);
    };
  }, [pixelConfig, contentId, value, currency]);

  return (
    <div className={c.page}>
      <PixelScripts fbId={fbId} ttId={ttId} pixelConfig={cfg} contentId={contentId} />
      <div className="mx-auto max-w-lg px-4 py-16 text-center">
        <div
          className={`mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full text-3xl ${c.thankCheck}`}
        >
          ✓
        </div>
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">تم استلام طلبك بنجاح</h1>
        <p className={`mt-3 ${c.thankSub}`}>شكراً لثقتك. سنتواصل معك قريباً لتأكيد التفاصيل.</p>
      </div>
    </div>
  );
}

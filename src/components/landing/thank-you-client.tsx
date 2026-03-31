"use client";

import { useEffect, useMemo } from "react";
import { PixelScripts, trackLeadEvent, trackPurchaseEvent } from "@/components/landing/pixel-scripts";
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
  value,
  currency,
  appearance = "light",
}: {
  fbId: string | null | undefined;
  ttId: string | null | undefined;
  pixelConfig: PixelPageConfig;
  value: number;
  currency: string;
  appearance?: LandingAppearance;
}) {
  const cfg = useThankYouPixelConfig(pixelConfig);
  const c = getLandingClasses(appearance ?? "light");

  useEffect(() => {
    let cancelled = false;
    /* تأخير بسيط حتى يجهز fbq / ttq بعد تنقل client-side من النموذج */
    const leadMs = 500;
    const purchaseMs = 1100;
    const tLead = window.setTimeout(() => {
      if (cancelled) return;
      trackLeadEvent(pixelConfig);
    }, leadMs);
    const tPurchase = window.setTimeout(() => {
      if (cancelled) return;
      trackPurchaseEvent(pixelConfig, value, currency);
    }, purchaseMs);
    return () => {
      cancelled = true;
      window.clearTimeout(tLead);
      window.clearTimeout(tPurchase);
    };
  }, [pixelConfig, value, currency]);

  return (
    <div className={c.page}>
      <PixelScripts fbId={fbId} ttId={ttId} pixelConfig={cfg} />
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

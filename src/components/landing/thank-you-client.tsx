"use client";

import { useEffect, useMemo } from "react";
import { PixelScripts, trackPurchaseEvent } from "@/components/landing/pixel-scripts";
import { getLandingClasses } from "@/lib/landing-appearance-classes";
import type { LandingAppearance, PixelPageConfig } from "@/types/landing";

function useThankYouPixelConfig(pixelConfig: PixelPageConfig): PixelPageConfig {
  return useMemo(
    () => ({
      ...pixelConfig,
      trackPageView: false,
      trackLead: false,
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
    const t = window.setTimeout(() => {
      if (cancelled) return;
      trackPurchaseEvent(cfg, value, currency);
    }, 400);
    return () => {
      cancelled = true;
      window.clearTimeout(t);
    };
  }, [cfg, value, currency]);

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

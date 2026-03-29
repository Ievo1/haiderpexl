import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ThankYouClient } from "@/components/landing/thank-you-client";
import { isSupabaseServiceConfigured } from "@/lib/supabase/env";
import { createAdminClient } from "@/lib/supabase/admin";
import type { LandingAppearance, LandingPageRow, PixelPageConfig } from "@/types/landing";

type Props = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ value?: string; cur?: string }>;
};

export async function generateMetadata(_props: Props): Promise<Metadata> {
  return {
    title: "تم الطلب",
    robots: { index: false, follow: false },
    openGraph: { title: "تم استلام طلبك" },
  };
}

export default async function ThankYouPage({ params, searchParams }: Props) {
  const { slug } = await params;
  const sp = await searchParams;
  if (!isSupabaseServiceConfigured()) notFound();

  const admin = createAdminClient();
  const { data: page } = await admin
    .from("landing_pages")
    .select("*")
    .eq("slug", slug)
    .eq("published", true)
    .maybeSingle();

  if (!page) notFound();

  const { data: settings } = await admin
    .from("global_settings")
    .select("facebook_pixel_id, tiktok_pixel_id")
    .eq("user_id", page.user_id)
    .maybeSingle();

  const row = page as unknown as LandingPageRow;
  const raw = sp.value;
  const value = Math.max(0, Number.parseFloat(String(raw ?? "0")) || 0);
  const cur = String(sp.cur ?? "IQD").trim().toUpperCase();
  const currency = /^[A-Z]{3}$/.test(cur) ? cur : "IQD";
  const appearance = (row.appearance as LandingAppearance | undefined) ?? "light";

  return (
    <ThankYouClient
      fbId={settings?.facebook_pixel_id}
      ttId={settings?.tiktok_pixel_id}
      pixelConfig={row.pixel_config as PixelPageConfig}
      value={value}
      currency={currency}
      appearance={appearance}
    />
  );
}

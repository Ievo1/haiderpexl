import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { LandingRenderer } from "@/components/landing/landing-renderer";
import { isSupabaseServiceConfigured } from "@/lib/supabase/env";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import type {
  FormConfig,
  LandingAppearance,
  LandingPageRow,
  LandingSection,
  PixelPageConfig,
} from "@/types/landing";

type Props = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ preview?: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  if (!isSupabaseServiceConfigured()) {
    return { title: "صفحة هبوط" };
  }
  const admin = createAdminClient();
  const { data: page } = await admin
    .from("landing_pages")
    .select("title, sections")
    .eq("slug", slug)
    .eq("published", true)
    .maybeSingle();

  const title = page?.title ?? "صفحة هبوط";
  const desc =
    typeof page?.sections === "object" &&
    page.sections &&
    Array.isArray(page.sections) &&
    page.sections[0] &&
    typeof page.sections[0] === "object" &&
    "type" in page.sections[0] &&
    page.sections[0].type === "header" &&
    "subtitle" in page.sections[0]
      ? String((page.sections[0] as { subtitle?: string }).subtitle ?? "")
      : "";

  return {
    title,
    description: desc || "صفحة هبوط احترافية",
    openGraph: { title },
  };
}

export default async function PublicLandingPage({ params, searchParams }: Props) {
  const { slug } = await params;
  const { preview } = await searchParams;
  if (!isSupabaseServiceConfigured()) {
    notFound();
  }
  const admin = createAdminClient();

  if (preview) {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) notFound();
    const { data: page } = await admin
      .from("landing_pages")
      .select("*")
      .eq("slug", slug)
      .eq("user_id", user.id)
      .maybeSingle();
    if (!page) notFound();
    const { data: settings } = await admin
      .from("global_settings")
      .select("facebook_pixel_id, tiktok_pixel_id")
      .eq("user_id", page.user_id)
      .maybeSingle();

    const row = page as unknown as LandingPageRow;
    const appearance = (row.appearance as LandingAppearance | undefined) ?? "light";
    return (
      <LandingRenderer
        slug={slug}
        landingPageId={row.id}
        sections={row.sections as LandingSection[]}
        formConfig={row.form_config as FormConfig}
        pixelConfig={row.pixel_config as PixelPageConfig}
        fbPixelId={settings?.facebook_pixel_id}
        ttPixelId={settings?.tiktok_pixel_id}
        trackVisit={false}
        appearance={appearance}
      />
    );
  }

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
  const appearance = (row.appearance as LandingAppearance | undefined) ?? "light";

  return (
    <LandingRenderer
      slug={slug}
      landingPageId={row.id}
      sections={row.sections as LandingSection[]}
      formConfig={row.form_config as FormConfig}
      pixelConfig={row.pixel_config as PixelPageConfig}
      fbPixelId={settings?.facebook_pixel_id}
      ttPixelId={settings?.tiktok_pixel_id}
      trackVisit
      appearance={appearance}
    />
  );
}

import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { LandingRenderer } from "@/components/landing/landing-renderer";
import { createClient } from "@/lib/supabase/server";
import type {
  FormConfig,
  LandingAppearance,
  LandingPageRow,
  LandingSection,
  PixelPageConfig,
} from "@/types/landing";

export const metadata: Metadata = {
  title: "معاينة صفحة الهبوط",
  robots: { index: false, follow: false },
};

export default async function LandingPreviewPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) notFound();

  const { data: page, error } = await supabase
    .from("landing_pages")
    .select("*")
    .eq("id", id)
    .eq("user_id", user.id)
    .single();

  if (error || !page) notFound();

  const { data: settings } = await supabase
    .from("global_settings")
    .select("facebook_pixel_id, tiktok_pixel_id")
    .eq("user_id", user.id)
    .maybeSingle();

  const row = page as unknown as LandingPageRow;
  const appearance = (row.appearance as LandingAppearance | undefined) ?? "light";

  return (
    <div className="fixed inset-0 z-[200] flex flex-col bg-white dark:bg-zinc-950">
      <header className="flex shrink-0 flex-wrap items-center justify-between gap-3 border-b border-zinc-200 bg-white/95 px-4 py-3 backdrop-blur dark:border-zinc-800 dark:bg-zinc-950/95">
        <Link
          href={`/dashboard/landing-pages/${id}`}
          className="text-sm font-semibold text-emerald-700 hover:text-emerald-800 dark:text-emerald-400 dark:hover:text-emerald-300"
        >
          ← رجوع للتحرير
        </Link>
        <p className="max-w-xl text-xs text-zinc-600 dark:text-zinc-400">
          {row.published ? (
            <>معاينة داخلية — الرابط العام للزوار: /l/{row.slug}</>
          ) : (
            <>
              <strong>مسودة:</strong> الزوار لا يرون هذه الصفحة حتى تضغط «نشر للجميع».
            </>
          )}
        </p>
      </header>
      <div className="min-h-0 flex-1 overflow-y-auto">
        <LandingRenderer
          slug={row.slug}
          landingPageId={row.id}
          sections={row.sections as LandingSection[]}
          formConfig={row.form_config as FormConfig}
          pixelConfig={row.pixel_config as PixelPageConfig}
          fbPixelId={settings?.facebook_pixel_id}
          ttPixelId={settings?.tiktok_pixel_id}
          trackVisit={false}
          appearance={appearance}
        />
      </div>
    </div>
  );
}

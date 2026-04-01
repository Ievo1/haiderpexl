import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { LandingEditor } from "@/components/builder/landing-editor";
import { createClient } from "@/lib/supabase/server";
import type { LandingPageRow } from "@/types/landing";

async function publicSiteOrigin(): Promise<string> {
  const envUrl = process.env.NEXT_PUBLIC_APP_URL?.trim().replace(/\/$/, "");
  if (envUrl) return envUrl;
  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host");
  if (!host) return "";
  const proto = h.get("x-forwarded-proto") ?? "https";
  return `${proto}://${host}`;
}

export default async function EditLandingPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: page, error } = await supabase
    .from("landing_pages")
    .select("*")
    .eq("id", id)
    .eq("user_id", user!.id)
    .single();

  if (error || !page) notFound();

  const siteOrigin = await publicSiteOrigin();

  const { data: settings } = await supabase
    .from("global_settings")
    .select("facebook_pixel_id")
    .eq("user_id", user!.id)
    .maybeSingle();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">تحرير صفحة الهبوط</h1>
        <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
          اسحب لترتيب الأقسام والحقول. يتم الحفظ تلقائياً أثناء التعديل.
        </p>
      </div>
      <LandingEditor
        initialPage={page as unknown as LandingPageRow}
        publicSiteOrigin={siteOrigin}
        globalFacebookPixelId={settings?.facebook_pixel_id ?? null}
      />
    </div>
  );
}

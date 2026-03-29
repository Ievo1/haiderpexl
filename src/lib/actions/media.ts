"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

/** تسجيل ملف بعد رفع ناجح إلى Storage — مرتبط بصفحة الهبوط للتتبع */
export async function registerLandingMediaAsset(input: {
  landingPageId?: string | null;
  storagePath: string;
  publicUrl: string;
  bytes: number;
  mimeType: string;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "غير مصرح" };

  if (input.landingPageId) {
    const { data: page } = await supabase
      .from("landing_pages")
      .select("id")
      .eq("id", input.landingPageId)
      .eq("user_id", user.id)
      .maybeSingle();
    if (!page) return { error: "الصفحة غير موجودة" };
  }

  const { error } = await supabase.from("landing_media_assets").insert({
    user_id: user.id,
    landing_page_id: input.landingPageId ?? null,
    storage_path: input.storagePath,
    public_url: input.publicUrl,
    bytes: input.bytes,
    mime_type: input.mimeType,
  });

  if (error) {
    if (error.code === "23505") return { ok: true };
    return { error: error.message };
  }
  if (input.landingPageId) {
    revalidatePath(`/dashboard/landing-pages/${input.landingPageId}`);
  }
  return { ok: true };
}

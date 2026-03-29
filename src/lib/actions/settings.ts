"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function updateGlobalSettings(patch: {
  facebook_pixel_id?: string | null;
  tiktok_pixel_id?: string | null;
  telegram_bot_token?: string | null;
  telegram_chat_id?: string | null;
  google_sheet_webhook_url?: string | null;
  backup_webhook_url?: string | null;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "غير مصرح" };

  const { data: existing } = await supabase
    .from("global_settings")
    .select("id")
    .eq("user_id", user.id)
    .maybeSingle();

  if (!existing) {
    const { error } = await supabase.from("global_settings").insert({
      user_id: user.id,
      ...patch,
      updated_at: new Date().toISOString(),
    });
    if (error) return { error: error.message };
  } else {
    const { error } = await supabase
      .from("global_settings")
      .update({ ...patch, updated_at: new Date().toISOString() })
      .eq("user_id", user.id);
    if (error) return { error: error.message };
  }

  revalidatePath("/dashboard/settings");
  return { ok: true };
}

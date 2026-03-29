"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function deleteLandingPage(pageId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "غير مصرح" };

  const { error } = await supabase
    .from("landing_pages")
    .delete()
    .eq("id", pageId)
    .eq("user_id", user.id);

  if (error) return { error: error.message };

  revalidatePath("/dashboard/landing-pages");
  revalidatePath("/dashboard/orders");
  revalidatePath("/dashboard");
  return { ok: true };
}

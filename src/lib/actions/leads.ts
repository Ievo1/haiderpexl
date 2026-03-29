"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function updateLeadStatus(leadId: string, status: "new" | "processing" | "delivered") {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "غير مصرح" };

  const { error } = await supabase
    .from("leads")
    .update({ status })
    .eq("id", leadId)
    .eq("user_id", user.id);

  if (error) return { error: error.message };
  revalidatePath("/dashboard/orders");
  return { ok: true };
}

export async function deleteLead(leadId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "غير مصرح" };

  const { data: lead, error: fetchErr } = await supabase
    .from("leads")
    .select("landing_page_id")
    .eq("id", leadId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (fetchErr || !lead) return { error: "الطلب غير موجود" };

  const { error: delErr } = await supabase
    .from("leads")
    .delete()
    .eq("id", leadId)
    .eq("user_id", user.id);

  if (delErr) return { error: delErr.message };

  const { data: page } = await supabase
    .from("landing_pages")
    .select("lead_count")
    .eq("id", lead.landing_page_id)
    .eq("user_id", user.id)
    .maybeSingle();

  if (page) {
    const next = Math.max(0, (page.lead_count ?? 1) - 1);
    await supabase
      .from("landing_pages")
      .update({ lead_count: next, updated_at: new Date().toISOString() })
      .eq("id", lead.landing_page_id)
      .eq("user_id", user.id);
  }

  revalidatePath("/dashboard/orders");
  revalidatePath("/dashboard");
  return { ok: true };
}

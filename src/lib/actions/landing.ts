"use server";

import { revalidatePath } from "next/cache";
import { nanoid } from "nanoid";
import { createClient } from "@/lib/supabase/server";
import {
  defaultFormConfig,
  defaultSections,
  DEFAULT_PIXEL_PAGE,
  slugifyTitle,
} from "@/lib/constants";
import type {
  FormConfig,
  LandingAppearance,
  LandingSection,
  PixelPageConfig,
} from "@/types/landing";

export async function createLandingPage(input: { title: string; slug?: string }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "غير مصرح" };

  const baseSlug = input.slug?.trim() || slugifyTitle(input.title);
  let slug = baseSlug;
  let n = 0;
  while (n < 20) {
    const { data: exists } = await supabase
      .from("landing_pages")
      .select("id")
      .eq("slug", slug)
      .maybeSingle();
    if (!exists) break;
    n += 1;
    slug = `${baseSlug}-${n}`;
  }

  const { data, error } = await supabase
    .from("landing_pages")
    .insert({
      user_id: user.id,
      title: input.title.trim() || "بدون عنوان",
      slug,
      published: false,
      sections: defaultSections(),
      form_config: defaultFormConfig(),
      pixel_config: DEFAULT_PIXEL_PAGE,
      appearance: "light" as LandingAppearance,
      tiktok_pixel_id: null,
    })
    .select("id")
    .single();

  if (error) return { error: error.message };
  revalidatePath("/dashboard/landing-pages");
  return { id: data.id, slug };
}

export async function updateLandingPage(
  id: string,
  patch: {
    title?: string;
    slug?: string;
    published?: boolean;
    sections?: LandingSection[];
    form_config?: FormConfig;
    pixel_config?: PixelPageConfig;
    tiktok_pixel_id?: string | null;
    custom_domain?: string | null;
    appearance?: LandingAppearance;
  },
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "غير مصرح" };

  const { error } = await supabase
    .from("landing_pages")
    .update({
      ...patch,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) return { error: error.message };
  revalidatePath("/dashboard/landing-pages");
  revalidatePath(`/dashboard/landing-pages/${id}`);
  return { ok: true };
}

export async function duplicateLandingPage(id: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "غير مصرح" };

  const { data: row, error: fetchErr } = await supabase
    .from("landing_pages")
    .select("*")
    .eq("id", id)
    .eq("user_id", user.id)
    .single();

  if (fetchErr || !row) return { error: "الصفحة غير موجودة" };

  const base = `${row.slug}-copy`;
  let slug = `${base}-${nanoid(4)}`;
  const { data: created, error } = await supabase
    .from("landing_pages")
    .insert({
      user_id: user.id,
      title: `${row.title} (نسخة)`,
      slug,
      published: false,
      sections: row.sections,
      form_config: row.form_config,
      pixel_config: row.pixel_config,
      appearance: (row as { appearance?: LandingAppearance }).appearance ?? "light",
      tiktok_pixel_id: (row as { tiktok_pixel_id?: string | null }).tiktok_pixel_id ?? null,
      custom_domain: null,
    })
    .select("id")
    .single();

  if (error) return { error: error.message };
  revalidatePath("/dashboard/landing-pages");
  return { id: created.id };
}

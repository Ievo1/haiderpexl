import { NextResponse } from "next/server";
import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/admin";

const schema = z.object({ slug: z.string().min(1).max(200) });

export async function POST(req: Request) {
  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const parsed = schema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Bad request" }, { status: 422 });
  }

  const admin = createAdminClient();
  const { data: page } = await admin
    .from("landing_pages")
    .select("id, visit_count, published")
    .eq("slug", parsed.data.slug)
    .maybeSingle();

  if (!page?.published) {
    return NextResponse.json({ ok: false }, { status: 404 });
  }

  await admin
    .from("landing_pages")
    .update({
      visit_count: (page.visit_count ?? 0) + 1,
      updated_at: new Date().toISOString(),
    })
    .eq("id", page.id);

  return NextResponse.json({ ok: true });
}

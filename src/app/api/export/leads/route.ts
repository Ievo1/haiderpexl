import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const pageId = searchParams.get("pageId") || undefined;
  const from = searchParams.get("from") || undefined;
  const to = searchParams.get("to") || undefined;

  let q = supabase
    .from("leads")
    .select("id, created_at, status, payload, landing_page_id")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (pageId) q = q.eq("landing_page_id", pageId);
  if (from) q = q.gte("created_at", from);
  if (to) q = q.lte("created_at", to);

  const { data: leads, error } = await q;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (!leads?.length) {
    const empty = "\uFEFFid,created_at,status,page_title,page_slug\n";
    return new NextResponse(empty, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="leads-empty.csv"`,
      },
    });
  }

  const pageIds = [...new Set(leads.map((l) => l.landing_page_id))];
  const { data: pages } = await supabase.from("landing_pages").select("id, title, slug").in("id", pageIds);

  const pageMap = Object.fromEntries((pages ?? []).map((p) => [p.id, p]));

  const rows = (leads ?? []).map((row) => {
    const lp = pageMap[row.landing_page_id];
    const payload = row.payload as Record<string, unknown>;
    return {
      id: row.id,
      created_at: row.created_at,
      status: row.status,
      page_title: lp?.title ?? "",
      page_slug: lp?.slug ?? "",
      ...payload,
    };
  });

  const headers = Array.from(
    rows.reduce((set, r) => {
      Object.keys(r).forEach((k) => set.add(k));
      return set;
    }, new Set<string>()),
  );

  const escape = (v: unknown) => {
    const s = v == null ? "" : String(v);
    if (/[",\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
    return s;
  };

  const csv = [
    headers.join(","),
    ...rows.map((r) => headers.map((h) => escape(r[h as keyof typeof r])).join(",")),
  ].join("\n");

  const filename = `leads-${new Date().toISOString().slice(0, 10)}.csv`;

  return new NextResponse("\uFEFF" + csv, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}

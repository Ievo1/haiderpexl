import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

export default async function DashboardHome() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { count: pagesCount } = await supabase
    .from("landing_pages")
    .select("*", { count: "exact", head: true })
    .eq("user_id", user!.id);

  const { count: leadsCount } = await supabase
    .from("leads")
    .select("*", { count: "exact", head: true })
    .eq("user_id", user!.id);

  const { data: visits } = await supabase
    .from("landing_pages")
    .select("visit_count")
    .eq("user_id", user!.id);

  const totalVisits = (visits ?? []).reduce((a, r) => a + (r.visit_count ?? 0), 0);

  const cards = [
    { label: "صفحات الهبوط", value: pagesCount ?? 0, href: "/dashboard/landing-pages" },
    { label: "إجمالي الطلبات", value: leadsCount ?? 0, href: "/dashboard/orders" },
    { label: "الزيارات (تقريبي)", value: totalVisits, href: "/dashboard/landing-pages" },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">مرحباً بك</h1>
        <p className="mt-2 text-zinc-600 dark:text-zinc-400">
          نظرة سريعة على أداء صفحات الهبوط والطلبات.
        </p>
      </div>
      <div className="grid gap-4 sm:grid-cols-3">
        {cards.map((c) => (
          <Link
            key={c.label}
            href={c.href}
            className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm transition hover:border-emerald-500/30 dark:border-zinc-800 dark:bg-zinc-950"
          >
            <p className="text-sm text-zinc-500">{c.label}</p>
            <p className="mt-2 text-3xl font-bold tabular-nums">{c.value}</p>
          </Link>
        ))}
      </div>
      <div className="rounded-2xl border border-dashed border-zinc-300 bg-zinc-50/50 p-6 dark:border-zinc-700 dark:bg-zinc-900/40">
        <p className="font-medium">ابدأ بإنشاء صفحة هبوط</p>
        <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
          أنشئ صفحة جديدة، خصّص الأقسام والنموذج، ثم انشر الرابط.
        </p>
        <Link
          href="/dashboard/landing-pages/new"
          className="mt-4 inline-flex rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-emerald-600/20 hover:bg-emerald-500"
        >
          إنشاء صفحة هبوط جديدة
        </Link>
      </div>
    </div>
  );
}

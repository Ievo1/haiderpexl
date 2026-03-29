import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { DeleteLandingPageButton } from "@/components/dashboard/delete-landing-page-button";

export default async function LandingPagesList() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: pages } = await supabase
    .from("landing_pages")
    .select("id, title, slug, published, visit_count, lead_count, updated_at")
    .eq("user_id", user!.id)
    .order("updated_at", { ascending: false });

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">صفحات الهبوط</h1>
          <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
            أنشئ وخصّص صفحاتك وروابطك المباشرة.
          </p>
        </div>
        <Link
          href="/dashboard/landing-pages/new"
          className="inline-flex justify-center rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-emerald-600/20 hover:bg-emerald-500"
        >
          إنشاء صفحة هبوط جديدة
        </Link>
      </div>

      <div className="overflow-hidden rounded-2xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950">
        <table className="w-full text-right text-sm">
          <thead className="border-b border-zinc-200 bg-zinc-50 text-xs text-zinc-500 dark:border-zinc-800 dark:bg-zinc-900">
            <tr>
              <th className="px-4 py-3 font-medium">العنوان</th>
              <th className="px-4 py-3 font-medium">الرابط</th>
              <th className="px-4 py-3 font-medium">الحالة</th>
              <th className="px-4 py-3 font-medium">زيارات</th>
              <th className="px-4 py-3 font-medium">طلبات</th>
              <th className="px-4 py-3 font-medium">إجراءات</th>
            </tr>
          </thead>
          <tbody>
            {(pages ?? []).length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-10 text-center text-zinc-500">
                  لا توجد صفحات بعد. أنشئ صفحتك الأولى.
                </td>
              </tr>
            ) : (
              (pages ?? []).map((p) => (
                <tr key={p.id} className="border-b border-zinc-100 last:border-0 dark:border-zinc-800">
                  <td className="px-4 py-3 font-medium">{p.title}</td>
                  <td className="px-4 py-3 font-mono text-xs" dir="ltr">
                    /l/{p.slug}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={
                        p.published
                          ? "rounded-full bg-emerald-500/15 px-2 py-0.5 text-xs text-emerald-700 dark:text-emerald-300"
                          : "rounded-full bg-zinc-500/15 px-2 py-0.5 text-xs text-zinc-600"
                      }
                    >
                      {p.published ? "منشور" : "مسودة"}
                    </span>
                  </td>
                  <td className="px-4 py-3 tabular-nums">{p.visit_count ?? 0}</td>
                  <td className="px-4 py-3 tabular-nums">{p.lead_count ?? 0}</td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap items-center gap-3">
                      <Link
                        href={`/dashboard/landing-pages/${p.id}`}
                        className="text-emerald-700 hover:underline dark:text-emerald-400"
                      >
                        تحرير
                      </Link>
                      <DeleteLandingPageButton pageId={p.id} title={p.title} />
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

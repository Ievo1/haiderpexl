import { createClient } from "@/lib/supabase/server";
import { OrdersTable } from "./orders-table";

export default async function OrdersPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: leads } = await supabase
    .from("leads")
    .select("id, created_at, status, payload, landing_page_id")
    .eq("user_id", user!.id)
    .order("created_at", { ascending: false })
    .limit(500);

  const { data: pages } = await supabase
    .from("landing_pages")
    .select("id, title, slug")
    .eq("user_id", user!.id);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">الطلبات</h1>
        <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
          جميع الطلبات الواردة من نماذج صفحات الهبوط مع التصفية والتصدير.
        </p>
      </div>
      <OrdersTable
        leads={(leads ?? []) as never}
        pages={(pages ?? []) as { id: string; title: string; slug: string }[]}
      />
    </div>
  );
}

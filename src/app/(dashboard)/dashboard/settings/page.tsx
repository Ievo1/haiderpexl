import { createClient } from "@/lib/supabase/server";
import { SettingsForm } from "./settings-form";

export default async function SettingsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: settings } = await supabase
    .from("global_settings")
    .select("*")
    .eq("user_id", user!.id)
    .maybeSingle();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">الإعدادات</h1>
        <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
          البيكسلات، تيليغرام، وتكامل جداول البيانات.
        </p>
      </div>
      <SettingsForm initial={settings} />
    </div>
  );
}

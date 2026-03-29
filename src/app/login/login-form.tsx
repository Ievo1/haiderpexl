"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  /** يعتمد فقط على المتغيرات المضمّنة في العميل؛ لا نستخدم ?missingEnv=1 لإجبار التنبيه بعد ضبط .env.local */
  const envMissing = useMemo(() => {
    return !(
      process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() &&
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim()
    );
  }, []);

  useEffect(() => {
    if (envMissing) return;
    if (searchParams.get("missingEnv") !== "1") return;
    const q = new URLSearchParams();
    const next = searchParams.get("next");
    if (next) q.set("next", next);
    router.replace(q.toString() ? `/login?${q}` : "/login", { scroll: false });
  }, [envMissing, searchParams, router]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (envMissing) return;
    setLoading(true);
    setError(null);
    const supabase = createClient();
    const { error: err } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (err) {
      setError(err.message);
      return;
    }
    const next = searchParams.get("next");
    const safe =
      next && next.startsWith("/") && !next.startsWith("//") ? next : "/dashboard";
    router.push(safe);
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="mt-8 space-y-4">
      {envMissing ? (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900 dark:border-amber-900/40 dark:bg-amber-950/40 dark:text-amber-100">
          <p className="font-semibold">لم يتم ضبط Supabase بعد</p>
          <p className="mt-2 leading-relaxed text-amber-800/90 dark:text-amber-200/90">
            أنشئ ملفاً باسم{" "}
            <code className="rounded bg-amber-100 px-1.5 py-0.5 font-mono text-xs dark:bg-amber-900/50">
              .env.local
            </code>{" "}
            داخل مجلد{" "}
            <code className="rounded bg-amber-100 px-1.5 py-0.5 font-mono text-xs dark:bg-amber-900/50">
              landing-dashboard
            </code>{" "}
            وانسخ القيم من{" "}
            <code className="rounded bg-amber-100 px-1.5 py-0.5 font-mono text-xs dark:bg-amber-900/50">
              .env.example
            </code>
            ، ثم أضف رابط المشروع ومفتاح anon من لوحة Supabase → Settings → API. أوقف الخادم (Ctrl+C) ثم أعد تشغيل{" "}
            <code className="rounded bg-amber-100 px-1.5 py-0.5 font-mono text-xs dark:bg-amber-900/50">
              npm run dev
            </code>{" "}
            حتى تُحمَّل متغيرات <code className="rounded bg-amber-100 px-1.5 py-0.5 font-mono text-xs dark:bg-amber-900/50">NEXT_PUBLIC_*</code>.
          </p>
        </div>
      ) : null}
      <div>
        <label className="text-sm font-medium text-zinc-600 dark:text-zinc-300">البريد</label>
        <input
          type="email"
          required
          autoComplete="email"
          className="mt-1 w-full rounded-xl border border-zinc-200 bg-white px-4 py-3 text-sm dark:border-zinc-800 dark:bg-zinc-950"
          dir="ltr"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
      </div>
      <div>
        <label className="text-sm font-medium text-zinc-600 dark:text-zinc-300">كلمة المرور</label>
        <input
          type="password"
          required
          autoComplete="current-password"
          className="mt-1 w-full rounded-xl border border-zinc-200 bg-white px-4 py-3 text-sm dark:border-zinc-800 dark:bg-zinc-950"
          dir="ltr"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
      </div>
      {error ? <p className="text-sm text-red-600 dark:text-red-400">{error}</p> : null}
      <button
        type="submit"
        disabled={loading || envMissing}
        className="w-full rounded-xl bg-emerald-600 py-3 text-sm font-semibold text-white shadow-lg shadow-emerald-600/25 hover:bg-emerald-500 disabled:opacity-60"
      >
        {loading ? "جاري الدخول…" : envMissing ? "أضف إعدادات Supabase أولاً" : "دخول"}
      </button>
    </form>
  );
}

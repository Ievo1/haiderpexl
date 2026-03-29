"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createLandingPage } from "@/lib/actions/landing";
import { slugifyTitle } from "@/lib/constants";

export function NewLandingForm() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [slugManual, setSlugManual] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function onTitleChange(v: string) {
    setTitle(v);
    if (!slugManual) setSlug(slugifyTitle(v));
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const res = await createLandingPage({ title, slug: slug.trim() || undefined });
    setLoading(false);
    if ("error" in res && res.error) {
      setError(res.error);
      return;
    }
    if ("id" in res && res.id) router.push(`/dashboard/landing-pages/${res.id}`);
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4 rounded-2xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-950">
      <div>
        <label className="text-sm font-medium text-zinc-600 dark:text-zinc-300">اسم الصفحة</label>
        <input
          required
          className="mt-1 w-full rounded-xl border border-zinc-200 bg-white px-4 py-3 text-sm dark:border-zinc-800 dark:bg-zinc-950"
          value={title}
          onChange={(e) => onTitleChange(e.target.value)}
          placeholder="مثال: عرض الصيف"
        />
      </div>
      <div>
        <label className="text-sm font-medium text-zinc-600 dark:text-zinc-300">الرابط (Slug)</label>
        <div className="mt-1 flex items-center gap-2 rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2.5 dark:border-zinc-800 dark:bg-zinc-900">
          <span className="text-zinc-400" dir="ltr">
            /l/
          </span>
          <input
            className="min-w-0 flex-1 bg-transparent text-sm outline-none"
            dir="ltr"
            value={slug}
            onChange={(e) => {
              setSlugManual(true);
              setSlug(
                e.target.value
                  .toLowerCase()
                  .replace(/\s+/g, "-")
                  .replace(/[^a-z0-9\-]/g, ""),
              );
            }}
            placeholder="offer-1"
          />
        </div>
        <p className="mt-1 text-xs text-zinc-500">يُسمح بالأحرف الإنجليزية والأرقام والشرطة فقط.</p>
      </div>
      {error ? <p className="text-sm text-red-600">{error}</p> : null}
      <button
        type="submit"
        disabled={loading}
        className="w-full rounded-xl bg-emerald-600 py-3 text-sm font-semibold text-white shadow-lg shadow-emerald-600/25 hover:bg-emerald-500 disabled:opacity-60"
      >
        {loading ? "جاري الإنشاء…" : "إنشاء والانتقال للمحرر"}
      </button>
    </form>
  );
}

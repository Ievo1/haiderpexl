"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { ExternalLink, Loader2 } from "lucide-react";
import { duplicateLandingPage, updateLandingPage } from "@/lib/actions/landing";
import { PixelTrackingChecklist } from "@/components/dashboard/pixel-tracking-checklist";
import type {
  FormConfig,
  LandingAppearance,
  LandingPageRow,
  LandingSection,
  PixelPageConfig,
} from "@/types/landing";
import { FormBuilderPanel } from "@/components/builder/form-builder";
import { SectionsEditor } from "@/components/builder/sections-editor";
import { normalizeFormConfig } from "@/lib/form-config";
import { cn } from "@/lib/utils";

type Tab = "sections" | "form" | "pixels";

export function LandingEditor({
  initialPage,
  globalPixels,
}: {
  initialPage: LandingPageRow;
  globalPixels: { fb: string | null; tt: string | null };
}) {
  const router = useRouter();
  const [page, setPage] = useState<LandingPageRow>(() => ({
    ...initialPage,
    appearance: (initialPage.appearance as LandingAppearance | undefined) ?? "light",
    form_config: normalizeFormConfig(initialPage.form_config as FormConfig),
  }));
  const [tab, setTab] = useState<Tab>("sections");
  const [saveState, setSaveState] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [dupLoading, setDupLoading] = useState(false);
  const lastSavedJson = useRef(JSON.stringify(initialPage));
  const pageRef = useRef(page);
  pageRef.current = page;

  const snapshot = useMemo(() => JSON.stringify(page), [page]);

  useEffect(() => {
    if (snapshot === lastSavedJson.current) return;
    const timer = window.setTimeout(async () => {
      const p = pageRef.current;
      setSaveState("saving");
      const res = await updateLandingPage(p.id, {
        title: p.title,
        slug: p.slug,
        published: p.published,
        appearance: p.appearance ?? "light",
        sections: p.sections as LandingSection[],
        form_config: p.form_config as FormConfig,
        pixel_config: p.pixel_config as PixelPageConfig,
        custom_domain: p.custom_domain,
      });
      if ("error" in res && res.error) {
        setSaveState("error");
        return;
      }
      lastSavedJson.current = JSON.stringify(pageRef.current);
      setSaveState("saved");
      router.refresh();
    }, 1600);
    return () => window.clearTimeout(timer);
  }, [snapshot, router]);

  async function handlePublish() {
    setSaveState("saving");
    const res = await updateLandingPage(page.id, { published: true });
    if ("error" in res && res.error) {
      setSaveState("error");
      return;
    }
    setPage((p) => ({ ...p, published: true }));
    lastSavedJson.current = JSON.stringify({ ...pageRef.current, published: true });
    setSaveState("saved");
    router.refresh();
  }

  async function handleDuplicate() {
    setDupLoading(true);
    const res = await duplicateLandingPage(page.id);
    setDupLoading(false);
    if ("error" in res && res.error) return;
    if ("id" in res && res.id) router.push(`/dashboard/landing-pages/${res.id}`);
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="space-y-3 lg:max-w-xl">
          <label className="text-xs font-medium text-zinc-500">اسم الصفحة</label>
          <input
            className="w-full rounded-xl border border-zinc-200 bg-white px-4 py-2.5 text-sm dark:border-zinc-800 dark:bg-zinc-950"
            value={page.title}
            onChange={(e) => setPage((p) => ({ ...p, title: e.target.value }))}
          />
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="text-xs font-medium text-zinc-500">المسار (Slug)</label>
              <div className="mt-1 flex items-center gap-2 rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm dark:border-zinc-800 dark:bg-zinc-900">
                <span className="text-zinc-400" dir="ltr">
                  /l/
                </span>
                <input
                  className="min-w-0 flex-1 bg-transparent outline-none"
                  dir="ltr"
                  value={page.slug}
                  onChange={(e) =>
                    setPage((p) => ({
                      ...p,
                      slug: e.target.value
                        .toLowerCase()
                        .replace(/\s+/g, "-")
                        .replace(/[^a-z0-9\-]/g, ""),
                    }))
                  }
                />
              </div>
            </div>
            <div>
              <label className="text-xs font-medium text-zinc-500">دومين مخصص (اختياري)</label>
              <input
                className="mt-1 w-full rounded-xl border border-zinc-200 bg-white px-4 py-2.5 text-sm dark:border-zinc-800 dark:bg-zinc-950"
                dir="ltr"
                placeholder="offer.example.com"
                value={page.custom_domain ?? ""}
                onChange={(e) =>
                  setPage((p) => ({ ...p, custom_domain: e.target.value || null }))
                }
              />
            </div>
            <div className="sm:col-span-2">
              <label className="text-xs font-medium text-zinc-500">مظهر الصفحة العامة (للزوار)</label>
              <div className="mt-2 flex flex-wrap gap-2">
                {(
                  [
                    ["light", "نهاري"],
                    ["dark", "ليلي"],
                  ] as const
                ).map(([val, label]) => (
                  <button
                    key={val}
                    type="button"
                    onClick={() =>
                      setPage((p) => ({ ...p, appearance: val as LandingAppearance }))
                    }
                    className={cn(
                      "rounded-xl border px-4 py-2 text-sm font-medium transition",
                      (page.appearance ?? "light") === val
                        ? "border-emerald-600 bg-emerald-50 text-emerald-900 dark:border-emerald-500 dark:bg-emerald-950/50 dark:text-emerald-100"
                        : "border-zinc-200 bg-white text-zinc-600 hover:border-zinc-300 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-400",
                    )}
                  >
                    {label}
                  </button>
                ))}
              </div>
              <p className="mt-1 text-xs text-zinc-500">
                يُطبَّق على رابط الصفحة العام وليس على لوحة التحكم.
              </p>
            </div>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span
            className={cn(
              "inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-medium",
              saveState === "saving" && "bg-amber-500/15 text-amber-700 dark:text-amber-300",
              saveState === "saved" && "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300",
              saveState === "error" && "bg-red-500/15 text-red-700 dark:text-red-300",
              saveState === "idle" && "bg-zinc-500/10 text-zinc-600",
            )}
          >
            {saveState === "saving" ? (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin" /> جاري الحفظ…
              </>
            ) : saveState === "saved" ? (
              "تم الحفظ"
            ) : saveState === "error" ? (
              "خطأ في الحفظ"
            ) : (
              "تلقائي"
            )}
          </span>
          <Link
            href={`/l/${page.slug}?preview=1`}
            target="_blank"
            className="inline-flex items-center gap-2 rounded-xl border border-zinc-200 bg-white px-4 py-2 text-sm font-medium dark:border-zinc-800 dark:bg-zinc-950"
          >
            <ExternalLink className="h-4 w-4" /> معاينة
          </Link>
          <button
            type="button"
            onClick={handlePublish}
            className="rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-emerald-600/25 hover:bg-emerald-500"
          >
            نشر
          </button>
          <button
            type="button"
            disabled={dupLoading}
            onClick={handleDuplicate}
            className="rounded-xl border border-zinc-200 px-4 py-2 text-sm dark:border-zinc-800"
          >
            {dupLoading ? "…" : "نسخ الصفحة"}
          </button>
        </div>
      </div>

      <div className="flex flex-wrap gap-2 border-b border-zinc-200 pb-2 dark:border-zinc-800">
        {(
          [
            ["sections", "الأقسام"],
            ["form", "نموذج الطلب"],
            ["pixels", "البيكسل والتتبع"],
          ] as const
        ).map(([k, label]) => (
          <button
            key={k}
            type="button"
            onClick={() => setTab(k)}
            className={cn(
              "rounded-full px-4 py-1.5 text-sm font-medium transition",
              tab === k
                ? "bg-zinc-900 text-white dark:bg-white dark:text-zinc-900"
                : "text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-900",
            )}
          >
            {label}
          </button>
        ))}
      </div>

      {tab === "sections" ? (
        <SectionsEditor
          landingPageId={page.id}
          sections={page.sections as LandingSection[]}
          onChange={(sections) => setPage((p) => ({ ...p, sections: sections as LandingPageRow["sections"] }))}
        />
      ) : null}

      {tab === "form" ? (
        <FormBuilderPanel
          value={page.form_config as FormConfig}
          onChange={(form_config) => setPage((p) => ({ ...p, form_config: form_config as LandingPageRow["form_config"] }))}
        />
      ) : null}

      {tab === "pixels" ? (
        <div className="space-y-6 rounded-2xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-950">
          <div className="rounded-xl bg-zinc-50 p-4 text-sm dark:bg-zinc-900">
            <p className="font-medium">معرّفات البيكسل العامة (من الإعدادات)</p>
            <p className="mt-1 text-zinc-600 dark:text-zinc-400" dir="ltr">
              Facebook: {globalPixels.fb || "—"} | TikTok: {globalPixels.tt || "—"}
            </p>
          </div>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={(page.pixel_config as PixelPageConfig).enabled}
              onChange={(e) =>
                setPage((p) => ({
                  ...p,
                  pixel_config: {
                    ...(p.pixel_config as PixelPageConfig),
                    enabled: e.target.checked,
                  },
                }))
              }
            />
            تفعيل التتبع لهذه الصفحة
          </label>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={(page.pixel_config as PixelPageConfig).useFacebook}
                onChange={(e) =>
                  setPage((p) => ({
                    ...p,
                    pixel_config: {
                      ...(p.pixel_config as PixelPageConfig),
                      useFacebook: e.target.checked,
                    },
                  }))
                }
              />
              Facebook Pixel
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={(page.pixel_config as PixelPageConfig).useTikTok}
                onChange={(e) =>
                  setPage((p) => ({
                    ...p,
                    pixel_config: {
                      ...(p.pixel_config as PixelPageConfig),
                      useTikTok: e.target.checked,
                    },
                  }))
                }
              />
              TikTok Pixel
            </label>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={(page.pixel_config as PixelPageConfig).trackPageView}
                onChange={(e) =>
                  setPage((p) => ({
                    ...p,
                    pixel_config: {
                      ...(p.pixel_config as PixelPageConfig),
                      trackPageView: e.target.checked,
                    },
                  }))
                }
              />
              PageView
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={(page.pixel_config as PixelPageConfig).trackLead}
                onChange={(e) =>
                  setPage((p) => ({
                    ...p,
                    pixel_config: {
                      ...(p.pixel_config as PixelPageConfig),
                      trackLead: e.target.checked,
                    },
                  }))
                }
              />
              Lead (عند إرسال النموذج)
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={(page.pixel_config as PixelPageConfig).trackPurchase}
                onChange={(e) =>
                  setPage((p) => ({
                    ...p,
                    pixel_config: {
                      ...(p.pixel_config as PixelPageConfig),
                      trackPurchase: e.target.checked,
                    },
                  }))
                }
              />
              Purchase (اختياري)
            </label>
          </div>
          <PixelTrackingChecklist variant="compact" className="mt-4" />
        </div>
      ) : null}
    </div>
  );
}

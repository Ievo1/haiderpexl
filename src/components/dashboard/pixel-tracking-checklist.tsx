"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

const STORAGE_KEY = "landing-pixel-tracking-checklist";

type Item = { id: string; title: string; detail?: string };

const CHECKLIST_ITEMS: Item[] = [
  {
    id: "ids",
    title: "معرّفات البيكسل في الإعدادات",
    detail: "من «الإعدادات» أدخل Facebook Pixel ID و TikTok Pixel ID (أرقام فقط، بدون مسافات) ثم احفظ.",
  },
  {
    id: "published",
    title: "الصفحة منشورة للعامة",
    detail: "فعّل «نشر» للصفحة؛ الزوار لا يرون الصفحة إلا بعد النشر فيُحمّل البيكسل.",
  },
  {
    id: "page-enabled",
    title: "تفعيل التتبع من تبويب البيكسل",
    detail: "في محرّر الصفحة → تبويب «البيكسل والتتبع»: فعّل «تفعيل التتبع لهذه الصفحة» واختر Facebook و/أو TikTok.",
  },
  {
    id: "pageview",
    title: "حدث PageView (زيارة الصفحة)",
    detail: "فعّل «PageView». فيسبوك: fbq('track','PageView'). تيك توك: ttq.page().",
  },
  {
    id: "lead",
    title: "حدث Lead (إرسال النموذج)",
    detail: "فعّل «Lead». فيسبوك: Lead. تيك توك: SubmitForm. يُطلق بعد نجاح إرسال النموذج فقط.",
  },
  {
    id: "purchase",
    title: "حدث Purchase (صفحة الشكر)",
    detail: "فعّل «Purchase». يُرسل من صفحة الشكر بعد تأخير قصير: فيسبوك Purchase، تيك توك CompletePayment (مع القيمة والعملة).",
  },
  {
    id: "network",
    title: "فحص الشبكة في المتصفح",
    detail: "افتح الصفحة العامة → F12 → Network: ابحث عن fbevents.js و analytics.tiktok.com (events.js).",
  },
  {
    id: "meta-test",
    title: "Meta — Test Events",
    detail: "في Events Manager استخدم «Test Events» أو Pixel Helper لمراقبة الأحداث لحظياً.",
  },
  {
    id: "tt-test",
    title: "TikTok — اختبار البيكسل",
    detail: "من TikTok Ads → الأدوات → Events Manager تأكد من ظهور الأحداث (page / SubmitForm / CompletePayment).",
  },
  {
    id: "visit-api",
    title: "عداد الزيارات في الداشبورد",
    detail: "العدّاد الداخلي يعتمد على طلب /api/track/view وليس على البيكسل — لا يؤثر على إعلاناتك.",
  },
];

function loadState(): Record<string, boolean> {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const p = JSON.parse(raw) as unknown;
    if (p && typeof p === "object" && !Array.isArray(p)) return p as Record<string, boolean>;
  } catch {
    /* ignore */
  }
  return {};
}

export function PixelTrackingChecklist({
  variant = "full",
  className,
}: {
  variant?: "full" | "compact";
  className?: string;
}) {
  const [open, setOpen] = useState(variant === "full");
  const [checked, setChecked] = useState<Record<string, boolean>>({});

  useEffect(() => {
    setChecked(loadState());
  }, []);

  const toggle = useCallback((id: string) => {
    setChecked((prev) => {
      const next = { ...prev, [id]: !prev[id] };
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      } catch {
        /* private mode */
      }
      return next;
    });
  }, []);

  const clearAll = useCallback(() => {
    setChecked({});
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      /* ignore */
    }
  }, []);

  const done = CHECKLIST_ITEMS.filter((i) => checked[i.id]).length;
  const total = CHECKLIST_ITEMS.length;

  return (
    <div
      className={cn(
        "rounded-2xl border border-emerald-200/80 bg-emerald-50/50 dark:border-emerald-900/50 dark:bg-emerald-950/20",
        className,
      )}
    >
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center justify-between gap-3 px-4 py-3 text-start sm:px-5"
      >
        <div>
          <p className="font-semibold text-emerald-950 dark:text-emerald-100">قائمة التحقق — تتبع البيكسلات</p>
          <p className="mt-0.5 text-xs text-emerald-800/90 dark:text-emerald-300/90">
            {done}/{total} مكتمل — تأكد أن كل بند ينطبق على مشروعك قبل الاعتماد على الإحصائيات في المنصات.
          </p>
        </div>
        <ChevronDown
          className={cn("h-5 w-5 shrink-0 text-emerald-700 transition-transform dark:text-emerald-300", open && "rotate-180")}
          aria-hidden
        />
      </button>

      {open ? (
        <div className="space-y-1 border-t border-emerald-200/60 px-4 pb-4 pt-1 dark:border-emerald-900/50 sm:px-5">
          <ul className="space-y-2">
            {CHECKLIST_ITEMS.map((item) => (
              <li key={item.id}>
                <label
                  className={cn(
                    "flex cursor-pointer gap-3 rounded-xl px-2 py-2 transition hover:bg-emerald-100/60 dark:hover:bg-emerald-950/40",
                    variant === "compact" && "py-1.5",
                  )}
                >
                  <input
                    type="checkbox"
                    checked={!!checked[item.id]}
                    onChange={() => toggle(item.id)}
                    className="mt-1 h-4 w-4 shrink-0 rounded border-emerald-300 text-emerald-600 focus:ring-emerald-500"
                  />
                  <span className="min-w-0">
                    <span className="block text-sm font-medium text-zinc-900 dark:text-zinc-100">{item.title}</span>
                    {item.detail ? (
                      <span
                        className={cn(
                          "mt-0.5 block text-xs leading-relaxed text-zinc-600 dark:text-zinc-400",
                          variant === "compact" && "line-clamp-2 sm:line-clamp-none",
                        )}
                      >
                        {item.detail}
                      </span>
                    ) : null}
                  </span>
                </label>
              </li>
            ))}
          </ul>
          <div className="flex flex-wrap items-center gap-3 border-t border-emerald-200/50 pt-3 dark:border-emerald-900/40">
            <button
              type="button"
              onClick={clearAll}
              className="text-xs font-medium text-emerald-800 underline-offset-2 hover:underline dark:text-emerald-300"
            >
              مسح علامات القائمة
            </button>
            {variant === "compact" ? (
              <Link
                href="/dashboard/settings"
                className="text-xs font-medium text-emerald-800 underline-offset-2 hover:underline dark:text-emerald-300"
              >
                الشرح الكامل في الإعدادات
              </Link>
            ) : null}
          </div>
        </div>
      ) : null}
    </div>
  );
}

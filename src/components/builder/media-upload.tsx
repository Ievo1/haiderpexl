"use client";

import { useRef, useState } from "react";
import { Loader2, Upload, X } from "lucide-react";
import { uploadLandingImage } from "@/lib/supabase/upload";
import { registerLandingMediaAsset } from "@/lib/actions/media";
import { cn } from "@/lib/utils";

export function MediaUpload({
  value,
  onChange,
  label,
  compact,
  landingPageId,
}: {
  value: string;
  onChange: (url: string) => void;
  label?: string;
  /** معرض صور — صورة أصغر */
  compact?: boolean;
  /** لربط الملف بسجل في قاعدة البيانات مع الصفحة */
  landingPageId?: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function onPick(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setLoading(true);
    setErr(null);
    try {
      const { publicUrl, storagePath } = await uploadLandingImage(file);
      onChange(publicUrl);
      const reg = await registerLandingMediaAsset({
        landingPageId: landingPageId ?? null,
        storagePath,
        publicUrl,
        bytes: file.size,
        mimeType: file.type || "image/jpeg",
      });
      if ("error" in reg && reg.error) {
        console.warn("تعذر تسجيل الصورة في قاعدة البيانات:", reg.error);
      }
    } catch (ex) {
      setErr(ex instanceof Error ? ex.message : "فشل الرفع");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-2">
      {label ? (
        <label className="text-xs font-medium text-zinc-500">{label}</label>
      ) : null}
      <div className="flex flex-wrap items-start gap-3">
        {value ? (
          <div
            className={cn(
              "relative overflow-hidden rounded-xl border border-zinc-200 bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-800",
              compact ? "h-20 w-20" : "h-32 w-full max-w-xs sm:h-36",
            )}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={value} alt="" className="h-full w-full object-cover" loading="lazy" />
          </div>
        ) : (
          <div
            className={cn(
              "flex items-center justify-center rounded-xl border border-dashed border-zinc-300 bg-zinc-50 text-zinc-400 dark:border-zinc-600 dark:bg-zinc-900",
              compact ? "h-20 w-20" : "h-32 w-full max-w-xs",
            )}
          >
            لا صورة
          </div>
        )}
        <div className="flex flex-col gap-2">
          <input
            ref={inputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            className="hidden"
            onChange={onPick}
          />
          <button
            type="button"
            disabled={loading}
            onClick={() => inputRef.current?.click()}
            className="inline-flex items-center gap-2 rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm font-medium dark:border-zinc-700 dark:bg-zinc-950"
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Upload className="h-4 w-4" />
            )}
            {loading ? "جاري الرفع…" : "رفع صورة من الجهاز"}
          </button>
          {value ? (
            <button
              type="button"
              onClick={() => onChange("")}
              className="inline-flex items-center gap-1 text-xs text-red-600 dark:text-red-400"
            >
              <X className="h-3.5 w-3.5" /> إزالة الصورة
            </button>
          ) : null}
        </div>
      </div>
      {err ? <p className="text-xs text-red-600 dark:text-red-400">{err}</p> : null}
      <p className="text-xs text-zinc-500">JPEG / PNG / WebP / GIF — بحد أقصى 5 ميجابايت</p>
    </div>
  );
}

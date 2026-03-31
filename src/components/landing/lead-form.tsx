"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import type {
  FormConfig,
  FormFieldConfig,
  LandingAppearance,
  QuantityOption,
} from "@/types/landing";
import type { PixelPageConfig } from "@/types/landing";
import { getLandingClasses } from "@/lib/landing-appearance-classes";
import { normalizeFormConfig } from "@/lib/form-config";
import { isValidIraqPhone, normalizeIraqPhone } from "@/lib/phone-iq";
import { cn } from "@/lib/utils";

function formatMoney(n: number, currency: string) {
  return `${n.toLocaleString("ar-IQ")} ${currency}`;
}

function optionSummaryLine(o: QuantityOption, cur: string) {
  const parts = [o.label];
  if (o.pieces != null && o.pieces > 0) {
    parts.push(`(${o.pieces} قطعة)`);
  }
  parts.push("—");
  if (o.compareAtPrice != null && o.compareAtPrice > o.price) {
    parts.push(`كان ${formatMoney(o.compareAtPrice, cur)} ← `);
  }
  parts.push(formatMoney(o.price, cur));
  return parts.join(" ");
}

function phoneDigitsOnly(input: string): string {
  return input.replace(/\D/g, "").slice(0, 11);
}

export function LeadForm({
  landingPageId,
  slug,
  formConfig,
  pixelConfig,
  heading,
  appearance = "light",
}: {
  landingPageId: string;
  slug: string;
  formConfig: FormConfig;
  pixelConfig: PixelPageConfig;
  heading: string;
  appearance?: LandingAppearance;
}) {
  const router = useRouter();
  const theme = getLandingClasses(appearance ?? "light");
  const [status, setStatus] = useState<"idle" | "loading" | "done" | "error">("idle");
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [values, setValues] = useState<Record<string, string>>({});
  const [honeypot, setHoneypot] = useState("");

  const cfg = useMemo(() => normalizeFormConfig(formConfig), [formConfig]);
  const currency = cfg.priceCurrencyLabel ?? "د.ع";

  const fields = useMemo(
    () =>
      [...cfg.fields]
        .filter((f) => f.enabled)
        .sort((a, b) => a.order - b.order),
    [cfg.fields],
  );

  const govList = cfg.governorateOptions?.length
    ? cfg.governorateOptions
    : cfg.cityOptions ?? [];

  const selectedQuantityOption = useMemo((): QuantityOption | null => {
    const qf = fields.find((f) => f.key === "quantity");
    if (!qf?.quantityOptions?.length) return null;
    const id = values[qf.key];
    if (!id) return null;
    return qf.quantityOptions.find((o) => o.id === id) ?? null;
  }, [fields, values]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("loading");
    const payload: Record<string, unknown> = {};

    for (const f of fields) {
      if (f.key === "quantity") {
        const opt = f.quantityOptions?.find((o) => o.id === values[f.key]);
        if (f.required && !opt) {
          setStatus("error");
          setSubmitError("اختر عدد القطع.");
          return;
        }
        payload.quantity = opt?.label ?? "";
        payload.quantity_label = opt?.label ?? "";
        payload.quantity_option_id = opt?.id ?? "";
        payload.quantity_pieces = opt?.pieces ?? null;
        payload.quantity_price = opt?.price ?? 0;
        payload.quantity_compare_at = opt?.compareAtPrice ?? null;
        payload.quantity_discount_label = opt?.discountLabel ?? null;
        payload.price_currency = f.currencyLabel ?? currency;
        continue;
      }

      if (f.key === "governorate" || f.key === "city") {
        const v = values[f.key] ?? "";
        if (f.required && !String(v).trim()) {
          setStatus("error");
          setSubmitError("أكمل الحقول المطلوبة.");
          return;
        }
        payload.governorate = v;
        continue;
      }

      if (f.key === "phone" || f.key === "confirm_phone") {
        const raw = values[f.key] ?? "";
        if (f.required && !String(raw).trim()) {
          setStatus("error");
          setSubmitError("أكمل الحقول المطلوبة.");
          return;
        }
        if (String(raw).trim() !== "" && !isValidIraqPhone(raw)) {
          setStatus("error");
          setSubmitError("رقم الهاتف يجب أن يكون 11 رقماً ويبدأ بـ 07.");
          return;
        }
        payload[f.key] = raw.trim() === "" ? "" : normalizeIraqPhone(raw) ?? raw;
        continue;
      }

      const v = values[f.key] ?? "";
      if (f.required && !String(v).trim()) {
        setStatus("error");
        setSubmitError("أكمل الحقول المطلوبة.");
        return;
      }
      payload[f.key] = v;
    }

    const p = payload.phone != null ? String(payload.phone) : "";
    const confirmPh = payload.confirm_phone != null ? String(payload.confirm_phone) : "";
    if (fields.some((x) => x.key === "confirm_phone") && p && confirmPh && p !== confirmPh) {
      setStatus("error");
      setSubmitError("رقم الهاتف وتأكيده غير متطابقين.");
      return;
    }

    setSubmitError(null);
    try {
      const res = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ landingPageId, payload, website: honeypot }),
      });
      const data = (await res.json().catch(() => ({}))) as {
        error?: string;
        code?: string;
      };
      if (!res.ok) {
        if (res.status === 429) {
          setSubmitError(
            typeof data.error === "string"
              ? data.error
              : "طلبات كثيرة. انتظر قليلاً ثم أعد المحاولة.",
          );
        } else {
          setSubmitError(
            typeof data.error === "string"
              ? data.error
              : res.status === 403
                ? "الصفحة غير منشورة. انشرها من لوحة التحكم أولاً."
                : "تعذر إرسال الطلب.",
          );
        }
        setStatus("error");
        return;
      }
      setStatus("done");
      const price = selectedQuantityOption?.price ?? 0;
      const v = Number.isFinite(price) ? price : 0;
      router.push(
        `/l/${encodeURIComponent(slug)}/thank-you?value=${encodeURIComponent(String(v))}&cur=IQD`,
      );
    } catch {
      setSubmitError("تعذر الاتصال بالخادم. تحقق من الشبكة.");
      setStatus("error");
    }
  }

  function renderField(f: FormFieldConfig) {
    if (f.key === "notes") {
      return (
        <textarea
          required={f.required}
          placeholder={f.placeholder}
          className={cn(
            "min-h-[96px] w-full rounded-xl border px-4 py-3 text-sm outline-none ring-emerald-500/30 focus:ring-2",
            theme.input,
          )}
          value={values[f.key] ?? ""}
          onChange={(e) => setValues((s) => ({ ...s, [f.key]: e.target.value }))}
        />
      );
    }

    if (f.key === "governorate" || f.key === "city") {
      return (
        <select
          required={f.required}
          className={cn(
            "w-full rounded-xl border px-4 py-3 text-sm outline-none ring-emerald-500/30 focus:ring-2",
            theme.input,
          )}
          value={values[f.key] ?? ""}
          onChange={(e) => setValues((s) => ({ ...s, [f.key]: e.target.value }))}
        >
          <option value="">{f.placeholder || "اختر المحافظة"}</option>
          {govList.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
      );
    }

    if (f.key === "quantity") {
      const opts = f.quantityOptions ?? [];
      const cur = f.currencyLabel ?? currency;
      return (
        <div className="space-y-3">
          <div className="grid gap-3 sm:grid-cols-2">
            {opts.map((o) => {
              const selected = values[f.key] === o.id;
              return (
                <button
                  key={o.id}
                  type="button"
                  onClick={() => setValues((s) => ({ ...s, [f.key]: o.id }))}
                  className={cn(
                    "rounded-2xl border p-4 text-right text-sm transition",
                    selected ? cn("ring-2 ring-emerald-500/30", theme.qtySelected) : theme.qtyIdle,
                  )}
                >
                  <p className={cn("font-semibold", theme.qtyTitle)}>{o.label}</p>
                  {o.pieces != null && o.pieces > 0 ? (
                    <p className="mt-1 text-xs text-zinc-500">{o.pieces} قطعة</p>
                  ) : null}
                  <div className="mt-2 flex flex-wrap items-baseline gap-2">
                    {o.compareAtPrice != null && o.compareAtPrice > o.price ? (
                      <>
                        <span className="text-xs text-zinc-400 line-through">
                          {formatMoney(o.compareAtPrice, cur)}
                        </span>
                        <span className={cn("text-base font-bold", theme.priceBold)}>
                          {formatMoney(o.price, cur)}
                        </span>
                      </>
                    ) : (
                      <span className={cn("text-base font-bold", theme.priceBold)}>
                        {formatMoney(o.price, cur)}
                      </span>
                    )}
                  </div>
                  {o.discountLabel ? (
                    <p className={cn("mt-1 text-xs font-medium", theme.discount)}>{o.discountLabel}</p>
                  ) : null}
                </button>
              );
            })}
          </div>
          {f.required && !values[f.key] ? (
            <p className="text-xs text-zinc-500">اختر أحد الخيارات أعلاه.</p>
          ) : null}

          {selectedQuantityOption && values[f.key] === selectedQuantityOption.id ? (
            <div className={cn("rounded-xl border p-4 text-sm", theme.qtySummary)}>
              <p className={cn("font-semibold", theme.qtySummaryTitle)}>
                {selectedQuantityOption.label}
                {selectedQuantityOption.pieces != null && selectedQuantityOption.pieces > 0
                  ? ` · ${selectedQuantityOption.pieces} قطعة`
                  : null}
              </p>
              <p className="mt-1 text-xs text-zinc-500">{optionSummaryLine(selectedQuantityOption, cur)}</p>
            </div>
          ) : null}
        </div>
      );
    }

    if (f.key === "phone" || f.key === "confirm_phone") {
      return (
        <input
          type="tel"
          inputMode="numeric"
          autoComplete="tel"
          maxLength={11}
          required={f.required}
          placeholder={f.placeholder || "07XXXXXXXXX"}
          dir="ltr"
          className={cn(
            "w-full rounded-xl border px-4 py-3 text-sm outline-none ring-emerald-500/30 focus:ring-2",
            theme.input,
          )}
          value={values[f.key] ?? ""}
          onChange={(e) =>
            setValues((s) => ({ ...s, [f.key]: phoneDigitsOnly(e.target.value) }))
          }
        />
      );
    }

    return (
      <input
        type="text"
        required={f.required}
        placeholder={f.placeholder}
        className={cn(
          "w-full rounded-xl border px-4 py-3 text-sm outline-none ring-emerald-500/30 focus:ring-2",
          theme.input,
        )}
        value={values[f.key] ?? ""}
        onChange={(e) => setValues((s) => ({ ...s, [f.key]: e.target.value }))}
      />
    );
  }

  const totalDisplay = selectedQuantityOption?.price ?? null;

  return (
    <section id="lead-form" className="scroll-mt-24">
      <h2 className="text-2xl font-semibold tracking-tight">{heading}</h2>
      <form onSubmit={onSubmit} className="mt-6 space-y-4" noValidate>
        {/* honeypot — لا تملأ */}
        <div className="absolute -left-[9999px] h-px w-px overflow-hidden" aria-hidden>
          <label htmlFor="lead-website">Website</label>
          <input
            id="lead-website"
            type="text"
            tabIndex={-1}
            autoComplete="off"
            value={honeypot}
            onChange={(e) => setHoneypot(e.target.value)}
          />
        </div>

        {fields.map((f) => (
          <div key={f.id}>
            <label className={cn("mb-1.5 block text-sm font-medium", theme.leadLabel)}>
              {f.label}
              {f.required ? <span className="text-red-500"> *</span> : null}
            </label>
            {renderField(f)}
          </div>
        ))}

        {totalDisplay != null ? (
          <div className={cn("rounded-2xl border px-4 py-3 text-center", theme.totalBox)}>
            <p className={cn("text-sm", theme.totalLabel)}>المبلغ المختار للطلب</p>
            <p className={cn("text-xl font-bold", theme.totalValue)}>
              {formatMoney(totalDisplay, currency)}
            </p>
          </div>
        ) : null}

        <button
          type="submit"
          disabled={status === "loading" || status === "done"}
          className="inline-flex w-full items-center justify-center rounded-xl bg-emerald-600 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-emerald-600/25 transition hover:bg-emerald-500 disabled:opacity-60"
        >
          {status === "done" ? "جاري التحويل…" : cfg.submitLabel}
        </button>
        {status === "error" ? (
          <p className={cn("text-sm", theme.errText)}>
            {submitError ?? "تعذر الإرسال. حاول مجدداً."}
          </p>
        ) : null}
      </form>
    </section>
  );
}

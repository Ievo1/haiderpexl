import type { LandingAppearance } from "@/types/landing";

/** ألوان صفحة الهبوط العامة — لا تعتمد على `html.dark` حتى يعمل المظهر بشكل مستقل. */
export function getLandingClasses(a: LandingAppearance) {
  const dark = a === "dark";
  return {
    page: dark ? "min-h-screen bg-zinc-950 text-zinc-50" : "min-h-screen bg-zinc-50 text-zinc-900",
    headerImg: dark ? "bg-zinc-800" : "bg-zinc-200",
    headerEmpty: dark ? "border-zinc-700 bg-zinc-900" : "border-zinc-300 bg-zinc-100",
    subtitle: dark ? "text-zinc-400" : "text-zinc-600",
    proseCard: dark
      ? "prose-invert border-zinc-800 bg-zinc-900"
      : "prose-zinc border-zinc-200 bg-white",
    galleryCell: dark ? "bg-zinc-800" : "bg-zinc-200",
    emptyGallery: dark ? "text-zinc-500" : "text-zinc-500",
    reviewCard: dark ? "border-zinc-800 bg-zinc-900" : "border-zinc-200 bg-white",
    reviewBody: dark ? "text-zinc-400" : "text-zinc-600",
    formWrap: dark ? "border-zinc-800 bg-zinc-900" : "border-zinc-200 bg-white",
    leadLabel: dark ? "text-zinc-200" : "text-zinc-700",
    input: dark ? "border-zinc-700 bg-zinc-900" : "border-zinc-200 bg-white",
    qtySelected: dark
      ? "border-emerald-600 bg-emerald-950/40 ring-emerald-500/30"
      : "border-emerald-500 bg-emerald-50 ring-emerald-500/30",
    qtyIdle: dark
      ? "border-zinc-700 bg-zinc-900 hover:border-zinc-600"
      : "border-zinc-200 bg-white hover:border-zinc-300",
    qtyTitle: dark ? "text-zinc-100" : "text-zinc-900",
    priceBold: dark ? "text-emerald-300" : "text-emerald-700",
    comparePrice: dark ? "text-zinc-400" : "text-zinc-400",
    discount: dark ? "text-amber-300" : "text-amber-700",
    qtySummary: dark ? "border-zinc-700 bg-zinc-900/80" : "border-zinc-200 bg-zinc-50",
    qtySummaryTitle: dark ? "text-zinc-100" : "text-zinc-900",
    totalBox: dark
      ? "border-emerald-900/50 bg-emerald-950/40"
      : "border-emerald-200 bg-emerald-50/80",
    totalLabel: dark ? "text-zinc-400" : "text-zinc-600",
    totalValue: dark ? "text-emerald-200" : "text-emerald-800",
    errText: dark ? "text-red-400" : "text-red-600",
    thankCheck: dark ? "bg-emerald-950/80" : "bg-emerald-100",
    thankSub: dark ? "text-zinc-400" : "text-zinc-600",
  };
}

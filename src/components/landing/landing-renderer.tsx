import type {
  FormConfig,
  LandingAppearance,
  LandingSection,
  PixelPageConfig,
} from "@/types/landing";
import { getLandingClasses } from "@/lib/landing-appearance-classes";
import { LeadForm } from "@/components/landing/lead-form";
import { PixelScripts } from "@/components/landing/pixel-scripts";
import { TrackView } from "@/components/landing/track-view";
import { cn } from "@/lib/utils";

function youtubeId(url: string): string | null {
  try {
    const u = new URL(url);
    if (u.hostname.includes("youtu.be")) return u.pathname.slice(1);
    const v = u.searchParams.get("v");
    if (v) return v;
    if (u.pathname.startsWith("/embed/")) return u.pathname.replace("/embed/", "");
    return null;
  } catch {
    return null;
  }
}

function Stars({ n }: { n: number }) {
  return (
    <span className="text-amber-400" aria-hidden>
      {"★".repeat(Math.min(5, Math.max(0, n)))}
      {"☆".repeat(5 - Math.min(5, Math.max(0, n)))}
    </span>
  );
}

export function LandingRenderer({
  slug,
  landingPageId,
  sections,
  formConfig,
  pixelConfig,
  fbPixelId,
  ttPixelId,
  trackVisit,
  appearance = "light",
}: {
  slug: string;
  landingPageId: string;
  sections: LandingSection[];
  formConfig: FormConfig;
  pixelConfig: PixelPageConfig;
  fbPixelId: string | null | undefined;
  ttPixelId: string | null | undefined;
  trackVisit: boolean;
  appearance?: LandingAppearance;
}) {
  const mode: LandingAppearance = appearance ?? "light";
  const c = getLandingClasses(mode);
  const pixelContentId = slug.trim() || landingPageId;

  return (
    <div className={c.page}>
      <PixelScripts
        fbId={fbPixelId}
        ttId={ttPixelId}
        pixelConfig={pixelConfig}
        contentId={pixelContentId}
      />
      {trackVisit ? <TrackView slug={slug} /> : null}

      <main className="mx-auto max-w-3xl px-4 pb-24 pt-10 sm:px-6">
        {sections.map((section) => {
          switch (section.type) {
            case "header":
              return (
                <section key={section.id} className="mb-14 text-center">
                  {section.imageUrl ? (
                    <div
                      className={cn(
                        "relative mx-auto mb-8 aspect-[16/9] w-full overflow-hidden rounded-3xl shadow-xl",
                        c.headerImg,
                      )}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={section.imageUrl}
                        alt={section.title}
                        className="h-full w-full object-cover"
                        loading="lazy"
                        decoding="async"
                      />
                    </div>
                  ) : (
                    <div
                      className={cn(
                        "mb-8 aspect-[16/9] w-full rounded-3xl border border-dashed",
                        c.headerEmpty,
                      )}
                    />
                  )}
                  <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">{section.title}</h1>
                  {section.subtitle ? (
                    <p className={cn("mt-3 text-lg", c.subtitle)}>{section.subtitle}</p>
                  ) : null}
                </section>
              );
            case "productDescription":
              return (
                <section key={section.id} className="mb-14">
                  <div
                    className={cn(
                      "prose max-w-none rounded-2xl border p-6 shadow-sm",
                      c.proseCard,
                    )}
                  >
                    <p className="whitespace-pre-wrap leading-relaxed">{section.content}</p>
                  </div>
                </section>
              );
            case "gallery":
              return (
                <section key={section.id} className="mb-14">
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                    {section.images.some((s) => String(s).trim()) ? (
                      section.images
                        .map((src, i) => ({ src, i }))
                        .filter(({ src }) => String(src).trim())
                        .map(({ src, i }) => (
                        <div
                          key={`${section.id}-${i}`}
                          className={cn(
                            "relative aspect-square overflow-hidden rounded-2xl",
                            c.galleryCell,
                          )}
                        >
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={src}
                            alt=""
                            className="h-full w-full object-cover"
                            loading="lazy"
                            decoding="async"
                          />
                        </div>
                      ))
                    ) : (
                      <p className={cn("col-span-full text-sm", c.emptyGallery)}>
                        لا توجد صور بعد.
                      </p>
                    )}
                  </div>
                </section>
              );
            case "video":
              if (!section.enabled || !section.url) return null;
              {
                const id = youtubeId(section.url);
                if (!id) {
                  return (
                    <section key={section.id} className="mb-14">
                      <p className="text-sm text-red-600">رابط فيديو غير صالح.</p>
                    </section>
                  );
                }
                return (
                  <section key={section.id} className="mb-14">
                    <div className="aspect-video overflow-hidden rounded-2xl bg-black shadow-lg">
                      <iframe
                        title="video"
                        className="h-full w-full"
                        src={`https://www.youtube.com/embed/${id}`}
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                      />
                    </div>
                  </section>
                );
              }
            case "reviews":
              return (
                <section key={section.id} className="mb-14 space-y-4">
                  <h2 className="text-xl font-semibold">آراء العملاء</h2>
                  <div className="space-y-3">
                    {section.items.map((r) => (
                      <article
                        key={r.id}
                        className={cn("rounded-2xl border p-4", c.reviewCard)}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-medium">{r.name}</span>
                          <Stars n={r.rating} />
                        </div>
                        <p className={cn("mt-2 text-sm", c.reviewBody)}>{r.text}</p>
                      </article>
                    ))}
                  </div>
                </section>
              );
            case "cta":
              return (
                <section key={section.id} className="mb-14 flex justify-center">
                  <a
                    href={section.href}
                    className={cn(
                      "inline-flex items-center justify-center rounded-2xl bg-emerald-600 px-8 py-4 text-base font-semibold text-white shadow-xl shadow-emerald-600/30 transition hover:bg-emerald-500",
                    )}
                  >
                    {section.label}
                  </a>
                </section>
              );
            case "form":
              return (
                <section
                  key={section.id}
                  className={cn("mb-14 rounded-3xl border p-6 shadow-xl", c.formWrap)}
                >
                  <LeadForm
                    landingPageId={landingPageId}
                    slug={slug}
                    formConfig={formConfig}
                    pixelConfig={pixelConfig}
                    heading={section.heading}
                    appearance={mode}
                  />
                </section>
              );
            default:
              return null;
          }
        })}
      </main>
    </div>
  );
}

"use client";

import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, Plus, Trash2 } from "lucide-react";
import { nanoid } from "nanoid";
import type {
  LandingSection,
  ReviewItem,
} from "@/types/landing";
import { MediaUpload } from "@/components/builder/media-upload";
import { cn } from "@/lib/utils";

function SectionShell({
  id,
  title,
  children,
}: {
  id: string;
  title: string;
  children: React.ReactNode;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id,
  });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };
  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "rounded-2xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-950",
        isDragging && "opacity-70 ring-2 ring-emerald-500/40",
      )}
    >
      <div className="flex items-start gap-3">
        <button
          type="button"
          className="mt-1 cursor-grab text-zinc-400"
          {...attributes}
          {...listeners}
          aria-label="سحب القسم"
        >
          <GripVertical className="h-5 w-5" />
        </button>
        <div className="min-w-0 flex-1 space-y-4">
          <h3 className="text-sm font-semibold text-zinc-700 dark:text-zinc-200">{title}</h3>
          {children}
        </div>
      </div>
    </div>
  );
}

function renderSectionEditor(
  section: LandingSection,
  onChange: (s: LandingSection) => void,
  landingPageId: string,
) {
  switch (section.type) {
    case "header":
      return (
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label className="text-xs text-zinc-500">العنوان</label>
            <input
              className="mt-1 w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900"
              value={section.title}
              onChange={(e) => onChange({ ...section, title: e.target.value })}
            />
          </div>
          <div className="sm:col-span-2">
            <label className="text-xs text-zinc-500">وصف قصير</label>
            <input
              className="mt-1 w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900"
              value={section.subtitle}
              onChange={(e) => onChange({ ...section, subtitle: e.target.value })}
            />
          </div>
          <div className="sm:col-span-2">
            <MediaUpload
              label="صورة الرأس"
              landingPageId={landingPageId}
              value={section.imageUrl}
              onChange={(url) => onChange({ ...section, imageUrl: url })}
            />
          </div>
        </div>
      );
    case "productDescription":
      return (
        <div>
          <label className="text-xs text-zinc-500">وصف المنتج</label>
          <textarea
            className="mt-1 min-h-[120px] w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900"
            value={section.content}
            onChange={(e) => onChange({ ...section, content: e.target.value })}
          />
        </div>
      );
    case "gallery":
      return (
        <div className="space-y-4">
          {section.images.map((url, i) => (
            <div
              key={i}
              className="flex flex-col gap-2 rounded-xl border border-zinc-100 p-3 dark:border-zinc-800"
            >
              <MediaUpload
                compact
                landingPageId={landingPageId}
                label={`صورة ${i + 1}`}
                value={url}
                onChange={(nextUrl) => {
                  const next = [...section.images];
                  next[i] = nextUrl;
                  onChange({ ...section, images: next });
                }}
              />
              <button
                type="button"
                className="self-start text-xs text-red-600"
                onClick={() => {
                  const next = section.images.filter((_, j) => j !== i);
                  onChange({ ...section, images: next });
                }}
              >
                حذف هذه الصورة
              </button>
            </div>
          ))}
          <button
            type="button"
            className="inline-flex items-center gap-2 rounded-lg border border-dashed border-zinc-300 px-3 py-2 text-sm text-zinc-600 dark:border-zinc-700"
            onClick={() => onChange({ ...section, images: [...section.images, ""] })}
          >
            <Plus className="h-4 w-4" /> إضافة صورة
          </button>
        </div>
      );
    case "video":
      return (
        <div className="space-y-3">
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={section.enabled}
              onChange={(e) => onChange({ ...section, enabled: e.target.checked })}
            />
            تفعيل الفيديو
          </label>
          <div>
            <label className="text-xs text-zinc-500">رابط YouTube</label>
            <input
              className="mt-1 w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900"
              dir="ltr"
              value={section.url}
              onChange={(e) => onChange({ ...section, url: e.target.value })}
            />
          </div>
        </div>
      );
    case "reviews":
      return (
        <div className="space-y-3">
          {section.items.map((item) => (
            <div key={item.id} className="rounded-xl border border-zinc-100 p-3 dark:border-zinc-800">
              <div className="grid gap-2 sm:grid-cols-2">
                <input
                  className="rounded-lg border border-zinc-200 px-2 py-1.5 text-sm dark:border-zinc-700 dark:bg-zinc-900"
                  placeholder="الاسم"
                  value={item.name}
                  onChange={(e) => {
                    const items = section.items.map((it) =>
                      it.id === item.id ? { ...it, name: e.target.value } : it,
                    );
                    onChange({ ...section, items });
                  }}
                />
                <input
                  type="number"
                  min={1}
                  max={5}
                  className="rounded-lg border border-zinc-200 px-2 py-1.5 text-sm dark:border-zinc-700 dark:bg-zinc-900"
                  value={item.rating}
                  onChange={(e) => {
                    const items = section.items.map((it) =>
                      it.id === item.id ? { ...it, rating: Number(e.target.value) } : it,
                    );
                    onChange({ ...section, items });
                  }}
                />
              </div>
              <textarea
                className="mt-2 w-full rounded-lg border border-zinc-200 px-2 py-1.5 text-sm dark:border-zinc-700 dark:bg-zinc-900"
                placeholder="التعليق"
                value={item.text}
                onChange={(e) => {
                  const items = section.items.map((it) =>
                    it.id === item.id ? { ...it, text: e.target.value } : it,
                  );
                  onChange({ ...section, items });
                }}
              />
              <button
                type="button"
                className="mt-2 text-xs text-red-600"
                onClick={() =>
                  onChange({
                    ...section,
                    items: section.items.filter((it) => it.id !== item.id),
                  })
                }
              >
                حذف
              </button>
            </div>
          ))}
          <button
            type="button"
            className="inline-flex items-center gap-2 rounded-lg border border-dashed border-zinc-300 px-3 py-2 text-sm dark:border-zinc-700"
            onClick={() => {
              const next: ReviewItem = {
                id: nanoid(6),
                name: "عميل",
                text: "",
                rating: 5,
              };
              onChange({ ...section, items: [...section.items, next] });
            }}
          >
            <Plus className="h-4 w-4" /> إضافة تقييم
          </button>
        </div>
      );
    case "cta":
      return (
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label className="text-xs text-zinc-500">نص الزر</label>
            <input
              className="mt-1 w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900"
              value={section.label}
              onChange={(e) => onChange({ ...section, label: e.target.value })}
            />
          </div>
          <div>
            <label className="text-xs text-zinc-500">الرابط</label>
            <input
              className="mt-1 w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900"
              dir="ltr"
              value={section.href}
              onChange={(e) => onChange({ ...section, href: e.target.value })}
            />
          </div>
        </div>
      );
    case "form":
      return (
        <div>
          <label className="text-xs text-zinc-500">عنوان قسم النموذج</label>
          <input
            className="mt-1 w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900"
            value={section.heading}
            onChange={(e) => onChange({ ...section, heading: e.target.value })}
          />
        </div>
      );
    default:
      return null;
  }
}

const sectionTitles: Record<LandingSection["type"], string> = {
  header: "رأس الصفحة",
  productDescription: "وصف المنتج",
  gallery: "معرض الصور",
  video: "فيديو",
  reviews: "التقييمات",
  cta: "زر الدعوة",
  form: "نموذج الطلب",
};

export function SectionsEditor({
  sections,
  onChange,
  landingPageId,
}: {
  sections: LandingSection[];
  onChange: (next: LandingSection[]) => void;
  landingPageId: string;
}) {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = sections.findIndex((s) => s.id === active.id);
    const newIndex = sections.findIndex((s) => s.id === over.id);
    if (oldIndex < 0 || newIndex < 0) return;
    onChange(arrayMove(sections, oldIndex, newIndex));
  }

  function patchSection(id: string, next: LandingSection) {
    onChange(sections.map((s) => (s.id === id ? next : s)));
  }

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <SortableContext items={sections.map((s) => s.id)} strategy={verticalListSortingStrategy}>
        <div className="space-y-3">
          {sections.map((section) => (
            <SectionShell key={section.id} id={section.id} title={sectionTitles[section.type]}>
              {renderSectionEditor(section, (next) => patchSection(section.id, next), landingPageId)}
            </SectionShell>
          ))}
        </div>
      </SortableContext>
    </DndContext>
  );
}

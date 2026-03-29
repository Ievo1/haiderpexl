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
import { DEFAULT_IRAQ_GOVERNORATES } from "@/lib/iraq-governorates";
import { normalizeFormConfig } from "@/lib/form-config";
import type { FormConfig, FormFieldConfig, QuantityOption } from "@/types/landing";
import { cn } from "@/lib/utils";

function QuantityOptionsEditor({
  options,
  currencyLabel,
  onOptionsChange,
  onCurrencyChange,
}: {
  options: QuantityOption[];
  currencyLabel: string;
  onOptionsChange: (next: QuantityOption[]) => void;
  onCurrencyChange: (c: string) => void;
}) {
  return (
    <div className="space-y-3 rounded-xl border border-emerald-200/60 bg-emerald-50/40 p-3 dark:border-emerald-900/40 dark:bg-emerald-950/20">
      <p className="text-xs font-medium text-emerald-800 dark:text-emerald-200">
        عدد القطع والأسعار (كل صف = خيار في الاستمارة)
      </p>
      <p className="text-xs text-zinc-600 dark:text-zinc-400">
        املأ «السعر النهائي»؛ وإن أردت إظهار خصم اكتب «السعر قبل الخصم» ونص الخصم (يظهر للعميل مشطوباً + السعر الجديد).
      </p>
      <div className="flex flex-wrap items-center gap-2">
        <label className="text-xs text-zinc-500">تسمية العملة</label>
        <input
          className="w-24 rounded-lg border border-zinc-200 bg-white px-2 py-1 text-sm dark:border-zinc-700 dark:bg-zinc-900"
          value={currencyLabel}
          onChange={(e) => onCurrencyChange(e.target.value)}
          placeholder="د.ع"
        />
      </div>
      <div className="space-y-3">
        {options.map((row, idx) => (
          <div
            key={row.id}
            className="rounded-xl border border-zinc-200 bg-white p-3 dark:border-zinc-700 dark:bg-zinc-900"
          >
            <div className="mb-2 flex items-center justify-between">
              <span className="text-xs font-medium text-zinc-500">خيار {idx + 1}</span>
              <button
                type="button"
                className="rounded p-1 text-red-600"
                onClick={() => onOptionsChange(options.filter((_, i) => i !== idx))}
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
            <div className="grid gap-2 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <label className="text-[10px] text-zinc-500">العنوان للعميل (مثال: قطعتان، 3 قطع)</label>
                <input
                  className="mt-0.5 w-full rounded-lg border border-zinc-200 px-2 py-1.5 text-sm dark:border-zinc-600 dark:bg-zinc-950"
                  placeholder="قطعتان"
                  value={row.label}
                  onChange={(e) => {
                    const next = [...options];
                    next[idx] = { ...row, label: e.target.value };
                    onOptionsChange(next);
                  }}
                />
              </div>
              <div>
                <label className="text-[10px] text-zinc-500">عدد القطع (رقم)</label>
                <input
                  type="number"
                  min={0}
                  step={1}
                  className="mt-0.5 w-full rounded-lg border border-zinc-200 px-2 py-1.5 text-sm dark:border-zinc-600 dark:bg-zinc-950"
                  placeholder="2"
                  value={row.pieces ?? ""}
                  onChange={(e) => {
                    const next = [...options];
                    const v = e.target.value;
                    next[idx] = {
                      ...row,
                      pieces: v === "" ? undefined : Number(v),
                    };
                    onOptionsChange(next);
                  }}
                />
              </div>
              <div>
                <label className="text-[10px] text-zinc-500">السعر النهائي</label>
                <input
                  type="number"
                  min={0}
                  step={1}
                  className="mt-0.5 w-full rounded-lg border border-zinc-200 px-2 py-1.5 text-sm dark:border-zinc-600 dark:bg-zinc-950"
                  placeholder="0"
                  value={row.price || ""}
                  onChange={(e) => {
                    const next = [...options];
                    next[idx] = { ...row, price: Number(e.target.value) || 0 };
                    onOptionsChange(next);
                  }}
                />
              </div>
              <div>
                <label className="text-[10px] text-zinc-500">السعر قبل الخصم (اختياري)</label>
                <input
                  type="number"
                  min={0}
                  step={1}
                  className="mt-0.5 w-full rounded-lg border border-zinc-200 px-2 py-1.5 text-sm dark:border-zinc-600 dark:bg-zinc-950"
                  placeholder="—"
                  value={row.compareAtPrice ?? ""}
                  onChange={(e) => {
                    const next = [...options];
                    const v = e.target.value;
                    next[idx] = {
                      ...row,
                      compareAtPrice: v === "" ? undefined : Number(v),
                    };
                    onOptionsChange(next);
                  }}
                />
              </div>
              <div className="sm:col-span-2">
                <label className="text-[10px] text-zinc-500">نص الخصم (اختياري)</label>
                <input
                  className="mt-0.5 w-full rounded-lg border border-zinc-200 px-2 py-1.5 text-sm dark:border-zinc-600 dark:bg-zinc-950"
                  placeholder="مثال: وفر 5000 د.ع"
                  value={row.discountLabel ?? ""}
                  onChange={(e) => {
                    const next = [...options];
                    next[idx] = { ...row, discountLabel: e.target.value || undefined };
                    onOptionsChange(next);
                  }}
                />
              </div>
            </div>
            <p className="mt-2 text-[10px] text-zinc-400">{currencyLabel}</p>
          </div>
        ))}
      </div>
      <button
        type="button"
        className="inline-flex items-center gap-1 text-xs font-medium text-emerald-700 dark:text-emerald-300"
        onClick={() =>
          onOptionsChange([
            ...options,
            { id: nanoid(8), label: "", price: 0 },
          ])
        }
      >
        <Plus className="h-3.5 w-3.5" /> إضافة خيار (عدد قطع + سعر)
      </button>
    </div>
  );
}

function SortableField({
  field,
  onChange,
  globalCurrency,
}: {
  field: FormFieldConfig;
  onChange: (next: FormFieldConfig) => void;
  globalCurrency: string;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: field.id,
  });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const isGov = field.key === "governorate" || field.key === "city";
  const isQty = field.key === "quantity";

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
          className="mt-1 cursor-grab text-zinc-400 hover:text-zinc-600"
          {...attributes}
          {...listeners}
          aria-label="سحب"
        >
          <GripVertical className="h-5 w-5" />
        </button>
        <div className="min-w-0 flex-1 space-y-3">
          <div className="flex flex-wrap items-center gap-3">
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={field.enabled}
                onChange={(e) => onChange({ ...field, enabled: e.target.checked })}
              />
              مفعّل
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={field.required}
                onChange={(e) => onChange({ ...field, required: e.target.checked })}
              />
              إجباري
            </label>
            <span className="text-xs text-zinc-500">المفتاح: {field.key}</span>
          </div>
          {isGov ? (
            <p className="text-xs text-zinc-500">
              قائمة المحافظات تُعدّل من القسم أعلاه (سطر لكل محافظة).
            </p>
          ) : null}
          {isQty ? (
            <p className="text-xs text-emerald-800 dark:text-emerald-200/90">
              خانة «عدد القطع» في الصفحة العامة: العميل يختار كم قطعة (كل خيار له سعر، ويمكن إظهار خصم بالسعر
              القديم + النص).
            </p>
          ) : null}
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="text-xs font-medium text-zinc-500">التسمية</label>
              <input
                className="mt-1 w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900"
                value={field.label}
                onChange={(e) => onChange({ ...field, label: e.target.value })}
              />
            </div>
            <div>
              <label className="text-xs font-medium text-zinc-500">Placeholder</label>
              <input
                className="mt-1 w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900"
                value={field.placeholder}
                onChange={(e) => onChange({ ...field, placeholder: e.target.value })}
              />
            </div>
          </div>
          {isQty ? (
            <QuantityOptionsEditor
              options={field.quantityOptions ?? []}
              currencyLabel={field.currencyLabel ?? globalCurrency}
              onCurrencyChange={(c) => onChange({ ...field, currencyLabel: c })}
              onOptionsChange={(opts) => onChange({ ...field, quantityOptions: opts })}
            />
          ) : null}
        </div>
      </div>
    </div>
  );
}

export function FormBuilderPanel({
  value,
  onChange,
}: {
  value: FormConfig;
  onChange: (next: FormConfig) => void;
}) {
  const cfg = normalizeFormConfig(value);
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const sorted = [...cfg.fields].sort((a, b) => a.order - b.order);

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = sorted.findIndex((f) => f.id === active.id);
    const newIndex = sorted.findIndex((f) => f.id === over.id);
    if (oldIndex < 0 || newIndex < 0) return;
    const moved = arrayMove(sorted, oldIndex, newIndex);
    const reordered = moved.map((f, i) => ({ ...f, order: i }));
    onChange({ ...value, ...cfg, fields: reordered, cityOptions: undefined });
  }

  function updateField(next: FormFieldConfig) {
    onChange({
      ...value,
      ...cfg,
      fields: cfg.fields.map((f) => (f.id === next.id ? next : f)),
      cityOptions: undefined,
    });
  }

  const govText = (cfg.governorateOptions ?? []).join("\n");
  const currency = cfg.priceCurrencyLabel ?? "د.ع";

  return (
    <div className="space-y-4">
      <div>
        <label className="text-xs font-medium text-zinc-500">نص زر الإرسال</label>
        <input
          className="mt-1 w-full max-w-md rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900"
          value={cfg.submitLabel}
          onChange={(e) =>
            onChange({ ...value, ...cfg, submitLabel: e.target.value, cityOptions: undefined })
          }
        />
      </div>
      <div>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <label className="text-xs font-medium text-zinc-500">
            المحافظات المعروضة (سطر لكل محافظة)
          </label>
          <button
            type="button"
            className="text-xs font-medium text-emerald-700 hover:underline dark:text-emerald-400"
            onClick={() =>
              onChange({
                ...value,
                ...cfg,
                governorateOptions: [...DEFAULT_IRAQ_GOVERNORATES],
                cityOptions: undefined,
              })
            }
          >
            إعادة تعيين لمحافظات العراق
          </button>
        </div>
        <textarea
          className="mt-1 w-full min-h-[120px] rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900"
          value={govText}
          onChange={(e) =>
            onChange({
              ...value,
              ...cfg,
              governorateOptions: e.target.value
                .split("\n")
                .map((s) => s.trim())
                .filter(Boolean),
              cityOptions: undefined,
            })
          }
        />
        <p className="mt-1 text-xs text-zinc-500">
          احذف السطر لإخفاء محافظة من القائمة. التعديل هنا لا يحذف الحقول الأخرى في النموذج.
        </p>
      </div>
      <div>
        <label className="text-xs font-medium text-zinc-500">تسمية العملة الافتراضية (للعرض مع الأسعار)</label>
        <input
          className="mt-1 w-full max-w-xs rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900"
          value={currency}
          onChange={(e) =>
            onChange({
              ...value,
              ...cfg,
              priceCurrencyLabel: e.target.value,
              cityOptions: undefined,
            })
          }
          placeholder="د.ع"
        />
      </div>

      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={sorted.map((f) => f.id)} strategy={verticalListSortingStrategy}>
          <div className="space-y-3">
            {sorted.map((f) => (
              <SortableField
                key={f.id}
                field={f}
                globalCurrency={currency}
                onChange={updateField}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>
    </div>
  );
}

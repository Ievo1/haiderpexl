"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";
import { updateLeadStatus, deleteLead } from "@/lib/actions/leads";
import {
  buildOrderExportRow,
  getLeadPayloadFields,
} from "@/lib/lead-payload-display";
import {
  downloadOrdersExcel,
  downloadOrdersPdf,
  printOrders,
} from "@/lib/orders-export";

function FieldCell({
  value,
  dir,
  className,
}: {
  value: string;
  dir?: "ltr" | "rtl";
  className?: string;
}) {
  const empty = !value.trim();
  return (
    <td
      className={`max-w-[11rem] px-2 py-2 align-middle text-sm ${className ?? ""}`}
      title={empty ? undefined : value}
    >
      {empty ? (
        <span className="text-zinc-300 dark:text-zinc-600">—</span>
      ) : (
        <div className={`truncate ${dir === "ltr" ? "text-left font-mono text-xs" : ""}`} dir={dir}>
          {value}
        </div>
      )}
    </td>
  );
}

type LeadRow = {
  id: string;
  created_at: string;
  status: "new" | "processing" | "delivered";
  payload: Record<string, unknown>;
  landing_page_id: string;
};

type PageOpt = { id: string; title: string; slug: string };

function todayYmd(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/** نفس اليوم التقويمي حسب المنطقة الزمنية للمتصفح */
function sameLocalDay(iso: string, ymd: string): boolean {
  const d = new Date(iso);
  const parts = ymd.split("-").map(Number);
  const y = parts[0];
  const m = parts[1];
  const day = parts[2];
  if (y == null || m == null || day == null) return false;
  return d.getFullYear() === y && d.getMonth() + 1 === m && d.getDate() === day;
}

export function OrdersTable({
  leads: initial,
  pages,
}: {
  leads: LeadRow[];
  pages: PageOpt[];
}) {
  const router = useRouter();
  const [isDeleting, startDeleteTransition] = useTransition();
  const [pageId, setPageId] = useState<string>("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  /** عند التعبئة: عرض طلبات هذا اليوم فقط (يتجاهل من/إلى) */
  const [filterDay, setFilterDay] = useState("");
  const [leads, setLeads] = useState(initial);
  const [exportingPdf, setExportingPdf] = useState(false);

  const pageMap = useMemo(
    () => Object.fromEntries(pages.map((p) => [p.id, p])),
    [pages],
  );

  const filtered = useMemo(() => {
    return leads.filter((l) => {
      if (pageId && l.landing_page_id !== pageId) return false;
      if (filterDay) {
        return sameLocalDay(l.created_at, filterDay);
      }
      if (from && new Date(l.created_at) < new Date(from)) return false;
      if (to && new Date(l.created_at) > new Date(`${to}T23:59:59`)) return false;
      return true;
    });
  }, [leads, pageId, from, to, filterDay]);

  const exportRows = useMemo(() => {
    return filtered.map((l) => {
      const pg = pageMap[l.landing_page_id];
      return buildOrderExportRow(
        l.created_at,
        pg?.title ?? "",
        pg?.slug ?? "",
        l.payload,
        l.status,
      );
    });
  }, [filtered, pageMap]);

  async function onStatus(id: string, status: LeadRow["status"]) {
    const prev = leads;
    setLeads((rows) => rows.map((r) => (r.id === id ? { ...r, status } : r)));
    const res = await updateLeadStatus(id, status);
    if ("error" in res && res.error) setLeads(prev);
  }

  function onDeleteLead(id: string) {
    if (!confirm("حذف هذا الطلب نهائياً؟")) return;
    const prev = leads;
    setLeads((rows) => rows.filter((r) => r.id !== id));
    startDeleteTransition(async () => {
      const res = await deleteLead(id);
      if ("error" in res && res.error) {
        alert(res.error);
        setLeads(prev);
        return;
      }
      router.refresh();
    });
  }

  const exportHref = useMemo(() => {
    const p = new URLSearchParams();
    if (pageId) p.set("pageId", pageId);
    if (from) p.set("from", from);
    if (to) p.set("to", to);
    const q = p.toString();
    return q ? `/api/export/leads?${q}` : "/api/export/leads";
  }, [pageId, from, to]);

  function handleExcel() {
    if (exportRows.length === 0) {
      alert("لا توجد طلبات ضمن التصفية الحالية.");
      return;
    }
    downloadOrdersExcel(exportRows);
  }

  async function handlePdf() {
    if (exportRows.length === 0) {
      alert("لا توجد طلبات ضمن التصفية الحالية.");
      return;
    }
    setExportingPdf(true);
    try {
      await downloadOrdersPdf(exportRows);
    } catch (e) {
      console.error(e);
      alert("تعذر إنشاء ملف PDF. جرّب الطباعة أو Excel.");
    } finally {
      setExportingPdf(false);
    }
  }

  function handlePrint() {
    if (exportRows.length === 0) {
      alert("لا توجد طلبات ضمن التصفية الحالية.");
      return;
    }
    printOrders(exportRows);
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 rounded-2xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-950 sm:flex-row sm:flex-wrap sm:items-end">
        <div className="min-w-[160px] flex-1">
          <label className="text-xs text-zinc-500">الصفحة</label>
          <select
            className="mt-1 w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm dark:border-zinc-800 dark:bg-zinc-950"
            value={pageId}
            onChange={(e) => setPageId(e.target.value)}
          >
            <option value="">كل الصفحات</option>
            {pages.map((p) => (
              <option key={p.id} value={p.id}>
                {p.title}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="text-xs text-zinc-500">من تاريخ</label>
          <input
            type="date"
            className="mt-1 w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm dark:border-zinc-800 dark:bg-zinc-950"
            value={from}
            onChange={(e) => setFrom(e.target.value)}
            disabled={!!filterDay}
          />
        </div>
        <div>
          <label className="text-xs text-zinc-500">إلى تاريخ</label>
          <input
            type="date"
            className="mt-1 w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm dark:border-zinc-800 dark:bg-zinc-950"
            value={to}
            onChange={(e) => setTo(e.target.value)}
            disabled={!!filterDay}
          />
        </div>
        <div>
          <label className="text-xs text-zinc-500">يوم محدد</label>
          <input
            type="date"
            className="mt-1 w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm dark:border-zinc-800 dark:bg-zinc-950"
            value={filterDay}
            onChange={(e) => setFilterDay(e.target.value)}
            title="عرض طلبات هذا اليوم فقط"
          />
        </div>
        <div className="flex flex-col gap-1">
          <span className="text-xs text-zinc-500">اختصار</span>
          <button
            type="button"
            className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm font-medium text-emerald-900 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-100"
            onClick={() => {
              setFilterDay(todayYmd());
              setFrom("");
              setTo("");
            }}
          >
            طلبات اليوم
          </button>
          {filterDay ? (
            <button
              type="button"
              className="text-xs text-zinc-500 underline"
              onClick={() => setFilterDay("")}
            >
              إلغاء فلتر اليوم
            </button>
          ) : null}
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={handleExcel}
            className="inline-flex items-center justify-center rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm font-medium text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950/50 dark:text-emerald-200"
          >
            Excel
          </button>
          <button
            type="button"
            disabled={exportingPdf}
            onClick={() => void handlePdf()}
            className="inline-flex items-center justify-center rounded-xl border border-zinc-200 px-3 py-2 text-sm font-medium disabled:opacity-60 dark:border-zinc-800"
          >
            {exportingPdf ? "PDF…" : "PDF"}
          </button>
          <button
            type="button"
            onClick={handlePrint}
            className="inline-flex items-center justify-center rounded-xl border border-zinc-200 px-3 py-2 text-sm font-medium dark:border-zinc-800"
          >
            طباعة
          </button>
          <a
            href={exportHref}
            className="inline-flex items-center justify-center rounded-xl border border-zinc-200 px-3 py-2 text-sm font-medium dark:border-zinc-800"
          >
            CSV
          </a>
        </div>
      </div>

      <div className="overflow-x-auto rounded-2xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950">
        <table className="w-full min-w-[1020px] text-right text-sm">
          <thead className="border-b border-zinc-200 bg-zinc-50 text-xs font-medium text-zinc-600 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-400">
            <tr>
              <th className="whitespace-nowrap px-2 py-2.5">التاريخ</th>
              <th className="min-w-[120px] px-2 py-2.5">الصفحة</th>
              <th className="min-w-[7rem] px-2 py-2.5">الاسم</th>
              <th className="min-w-[7rem] px-2 py-2.5">الهاتف</th>
              <th className="min-w-[6rem] px-2 py-2.5">المحافظة</th>
              <th className="min-w-[8rem] px-2 py-2.5">الخيار</th>
              <th className="whitespace-nowrap px-2 py-2.5">المبلغ</th>
              <th className="min-w-[8rem] px-2 py-2.5">العنوان</th>
              <th className="min-w-[9rem] px-2 py-2.5">ملاحظات</th>
              <th className="min-w-[8rem] px-2 py-2.5">تفاصيل إضافية</th>
              <th className="whitespace-nowrap px-2 py-2.5">الحالة</th>
              <th className="w-12 px-1 py-2.5"> </th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={12} className="px-3 py-8 text-center text-zinc-500">
                  لا توجد طلبات مطابقة.
                </td>
              </tr>
            ) : (
              filtered.map((l) => {
                const pg = pageMap[l.landing_page_id];
                const f = getLeadPayloadFields(l.payload);
                return (
                  <tr
                    key={l.id}
                    className="border-b border-zinc-100 last:border-0 dark:border-zinc-800"
                  >
                    <td className="whitespace-nowrap px-2 py-2 align-middle text-xs text-zinc-500">
                      {new Date(l.created_at).toLocaleString("ar-SA")}
                    </td>
                    <td className="max-w-[140px] px-2 py-2 align-middle">
                      <div className="truncate font-medium" title={pg?.title}>
                        {pg?.title ?? "—"}
                      </div>
                      {pg?.slug ? (
                        <div className="truncate text-xs text-zinc-500" dir="ltr" title={pg.slug}>
                          {pg.slug}
                        </div>
                      ) : null}
                    </td>
                    <FieldCell value={f.name} />
                    <FieldCell value={f.phone} dir="ltr" />
                    <FieldCell value={f.governorate} />
                    <FieldCell value={f.quantity} />
                    <FieldCell value={f.amount} />
                    <FieldCell value={f.address} />
                    <td
                      className="max-w-[11rem] px-2 py-2 align-middle text-sm"
                      title={f.notes.trim() ? f.notes : undefined}
                    >
                      {!f.notes.trim() ? (
                        <span className="text-zinc-300 dark:text-zinc-600">—</span>
                      ) : (
                        <div className="truncate">{f.notes}</div>
                      )}
                    </td>
                    <td
                      className="max-w-[11rem] px-2 py-2 align-middle text-xs text-zinc-600 dark:text-zinc-400"
                      title={f.more.trim() ? f.more : undefined}
                    >
                      {!f.more.trim() ? (
                        <span className="text-zinc-300 dark:text-zinc-600">—</span>
                      ) : (
                        <div className="line-clamp-2">{f.more}</div>
                      )}
                    </td>
                    <td className="whitespace-nowrap px-2 py-2 align-middle">
                      <select
                        className="rounded-lg border border-zinc-200 bg-white px-2 py-1 text-xs dark:border-zinc-800 dark:bg-zinc-950"
                        value={l.status}
                        onChange={(e) =>
                          onStatus(l.id, e.target.value as LeadRow["status"])
                        }
                      >
                        <option value="new">جديد</option>
                        <option value="processing">قيد المعالجة</option>
                        <option value="delivered">تم التسليم</option>
                      </select>
                    </td>
                    <td className="px-1 py-2 align-middle">
                      <button
                        type="button"
                        disabled={isDeleting}
                        title="حذف الطلب"
                        className="rounded-lg p-1.5 text-red-600 hover:bg-red-50 disabled:opacity-50 dark:text-red-400 dark:hover:bg-red-950/40"
                        onClick={() => onDeleteLead(l.id)}
                      >
                        <Trash2 className="h-4 w-4" aria-hidden />
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

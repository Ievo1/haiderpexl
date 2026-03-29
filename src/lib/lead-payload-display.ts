/**
 * عرض حقول الطلب للوحة التحكم — بدون مفاتيح تقنية أو JSON خام.
 */

const EXTRA_LABELS: Record<string, string> = {
  email: "البريد",
  zip: "الرمز البريدي",
};

function fmtMoney(n: unknown, currencyLabel: string): string {
  const num = typeof n === "number" ? n : Number(n);
  if (!Number.isFinite(num)) return String(n ?? "");
  return `${num.toLocaleString("ar-IQ")} ${currencyLabel}`;
}

function str(v: unknown): string {
  if (v == null) return "";
  if (typeof v === "object") return JSON.stringify(v);
  return String(v);
}

/** حقول منفصلة لعرض الجدول بالأعمدة (أفقي) */
export type LeadPayloadFields = {
  name: string;
  phone: string;
  governorate: string;
  quantity: string;
  amount: string;
  address: string;
  notes: string;
  /** تأكيد هاتف، خصم، حقول إضافية — سطر واحد مختصر */
  more: string;
};

export function getLeadPayloadFields(payload: Record<string, unknown>): LeadPayloadFields {
  const cur = str(payload.price_currency ?? "د.ع").trim() || "د.ع";
  const phone = str(payload.phone).trim();
  const confirmPhone = str(payload.confirm_phone).trim();

  const name = str(payload.name).trim();
  const governorate = str(payload.governorate ?? payload.city).trim();

  const qText = str(payload.quantity ?? payload.quantity_label).trim();
  const pieces = payload.quantity_pieces;
  let quantity = qText;
  if (pieces != null && pieces !== "" && Number(pieces) > 0) {
    quantity = qText ? `${qText} · ${pieces} قطعة` : `${pieces} قطعة`;
  }

  let amount = "";
  if (payload.quantity_price != null && payload.quantity_price !== "") {
    amount = fmtMoney(payload.quantity_price, cur);
  }

  const address = str(payload.address).trim();
  const notes = str(payload.notes).trim();

  const moreParts: string[] = [];
  if (confirmPhone && confirmPhone !== phone) {
    moreParts.push(`تأكيد: ${confirmPhone}`);
  }
  const confAddr = str(payload.confirm_address).trim();
  if (confAddr && confAddr !== address) {
    moreParts.push(`تأكيد عنوان: ${confAddr}`);
  }
  const compareAt = payload.quantity_compare_at;
  const price = Number(payload.quantity_price);
  const ca = Number(compareAt);
  if (Number.isFinite(ca) && ca > 0 && (!Number.isFinite(price) || ca > price)) {
    moreParts.push(`قبل الخصم: ${fmtMoney(compareAt, cur)}`);
  }
  const disc = str(payload.quantity_discount_label).trim();
  if (disc) moreParts.push(disc);

  const handled = new Set([
    "name",
    "phone",
    "confirm_phone",
    "governorate",
    "city",
    "address",
    "confirm_address",
    "quantity",
    "quantity_label",
    "quantity_option_id",
    "quantity_pieces",
    "quantity_price",
    "quantity_compare_at",
    "quantity_discount_label",
    "price_currency",
    "notes",
  ]);

  for (const key of Object.keys(payload).sort()) {
    if (handled.has(key) || key.startsWith("_")) continue;
    const v = payload[key];
    if (v == null || v === "") continue;
    const label = EXTRA_LABELS[key] ?? key.replace(/_/g, " ");
    const val = typeof v === "object" && v !== null ? JSON.stringify(v) : str(v);
    if (val.trim()) moreParts.push(`${label}: ${val}`);
  }

  return {
    name,
    phone,
    governorate,
    quantity,
    amount,
    address,
    notes,
    more: moreParts.join(" · "),
  };
}

export function leadStatusLabelAr(status: string): string {
  switch (status) {
    case "new":
      return "جديد";
    case "processing":
      return "قيد المعالجة";
    case "delivered":
      return "تم التسليم";
    default:
      return status;
  }
}

/** صف واحد للتصدير (Excel / PDF / طباعة) — مفاتيح عربية ثابتة */
export function buildOrderExportRow(
  createdAt: string,
  pageTitle: string,
  pageSlug: string,
  payload: Record<string, unknown>,
  status: string,
): Record<string, string> {
  const f = getLeadPayloadFields(payload);
  return {
    التاريخ: new Date(createdAt).toLocaleString("ar-SA"),
    "عنوان الصفحة": pageTitle,
    "معرّف الرابط": pageSlug,
    الاسم: f.name,
    الهاتف: f.phone,
    المحافظة: f.governorate,
    الخيار: f.quantity,
    المبلغ: f.amount,
    العنوان: f.address,
    ملاحظات: f.notes,
    "تفاصيل إضافية": f.more,
    الحالة: leadStatusLabelAr(status),
  };
}

/**
 * يحوّل payload الطلب إلى أسطر (عنوان عربي + قيمة مقروءة).
 */
export function getLeadPayloadDisplayRows(payload: Record<string, unknown>): {
  label: string;
  value: string;
}[] {
  const rows: { label: string; value: string }[] = [];
  const cur = str(payload.price_currency ?? "د.ع").trim() || "د.ع";

  const phone = str(payload.phone).trim();
  const confirmPhone = str(payload.confirm_phone).trim();

  const add = (label: string, value: unknown) => {
    const s = str(value).trim();
    if (!s) return;
    rows.push({ label, value: s });
  };

  add("الاسم", payload.name);

  if (phone) add("رقم الهاتف", phone);
  if (confirmPhone && confirmPhone !== phone) {
    add("تأكيد الهاتف", confirmPhone);
  }

  const gov = str(payload.governorate ?? payload.city).trim();
  if (gov) add("المحافظة", gov);

  const addr = str(payload.address).trim();
  if (addr) add("العنوان", addr);
  const confAddr = str(payload.confirm_address).trim();
  if (confAddr && confAddr !== addr) add("تأكيد العنوان", confAddr);

  const qText = str(payload.quantity ?? payload.quantity_label).trim();
  if (qText) add("الخيار / الكمية", qText);

  const pieces = payload.quantity_pieces;
  if (pieces != null && pieces !== "" && Number(pieces) > 0) {
    add("عدد القطع", pieces);
  }

  if (payload.quantity_price != null && payload.quantity_price !== "") {
    rows.push({ label: "المبلغ", value: fmtMoney(payload.quantity_price, cur) });
  }

  const compareAt = payload.quantity_compare_at;
  const price = Number(payload.quantity_price);
  const ca = Number(compareAt);
  if (Number.isFinite(ca) && ca > 0 && (!Number.isFinite(price) || ca > price)) {
    rows.push({ label: "السعر قبل الخصم", value: fmtMoney(compareAt, cur) });
  }

  const disc = str(payload.quantity_discount_label).trim();
  if (disc) add("العرض / الخصم", disc);

  add("ملاحظات", payload.notes);

  const handled = new Set([
    "name",
    "phone",
    "confirm_phone",
    "governorate",
    "city",
    "address",
    "confirm_address",
    "quantity",
    "quantity_label",
    "quantity_option_id",
    "quantity_pieces",
    "quantity_price",
    "quantity_compare_at",
    "quantity_discount_label",
    "price_currency",
    "notes",
  ]);

  const restKeys = Object.keys(payload)
    .filter((k) => !handled.has(k) && !k.startsWith("_"))
    .sort();

  for (const key of restKeys) {
    const v = payload[key];
    if (v == null || v === "") continue;
    const label = EXTRA_LABELS[key] ?? key.replace(/_/g, " ");
    const val = typeof v === "object" && v !== null ? JSON.stringify(v) : str(v);
    if (!val.trim()) continue;
    rows.push({ label, value: val });
  }

  return rows;
}

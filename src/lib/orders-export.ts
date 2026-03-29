import * as XLSX from "xlsx";

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function buildOrdersTableHtml(rows: Record<string, string>[]): string {
  if (rows.length === 0) {
    return "<p>لا توجد بيانات للتصدير.</p>";
  }
  const keys = Object.keys(rows[0]);
  const thead = `<tr>${keys.map((k) => `<th>${escapeHtml(k)}</th>`).join("")}</tr>`;
  const tbody = rows
    .map((r) => {
      const cells = keys.map((k) => `<td>${escapeHtml(r[k] ?? "")}</td>`).join("");
      return `<tr>${cells}</tr>`;
    })
    .join("");
  return `<table><thead>${thead}</thead><tbody>${tbody}</tbody></table>`;
}

export function downloadOrdersExcel(rows: Record<string, string>[]): void {
  if (rows.length === 0) return;
  const ws = XLSX.utils.json_to_sheet(rows);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "الطلبات");
  const name = `طلبات-${new Date().toISOString().slice(0, 10)}.xlsx`;
  XLSX.writeFile(wb, name);
}

export async function downloadOrdersPdf(rows: Record<string, string>[]): Promise<void> {
  if (typeof window === "undefined" || rows.length === 0) return;
  const html2pdf = (await import("html2pdf.js")).default;
  const container = document.createElement("div");
  container.style.position = "fixed";
  container.style.left = "-10000px";
  container.style.top = "0";
  container.style.width = "1100px";
  container.style.padding = "16px";
  container.style.direction = "rtl";
  container.style.background = "#fff";
  container.style.color = "#111";
  container.style.fontFamily = "system-ui, Tahoma, sans-serif";
  container.style.fontSize = "11px";
  container.innerHTML = `<h1 style="font-size:16px;margin:0 0 12px">تقرير الطلبات</h1>${buildOrdersTableHtml(rows)}`;
  document.body.appendChild(container);
  try {
    await html2pdf()
      .set({
        margin: [8, 8, 8, 8],
        filename: `طلبات-${new Date().toISOString().slice(0, 10)}.pdf`,
        image: { type: "jpeg", quality: 0.92 },
        html2canvas: { scale: 2, useCORS: true },
        jsPDF: { unit: "mm", format: "a4", orientation: "landscape" },
      })
      .from(container)
      .save();
  } finally {
    document.body.removeChild(container);
  }
}

export function printOrders(rows: Record<string, string>[]): void {
  if (typeof window === "undefined" || rows.length === 0) return;
  const w = window.open("", "_blank");
  if (!w) return;
  const html = `<!DOCTYPE html><html dir="rtl" lang="ar"><head><meta charset="utf-8"/><title>الطلبات</title>
<style>
  body{font-family:system-ui,Tahoma,sans-serif;padding:16px;font-size:12px}
  table{border-collapse:collapse;width:100%}
  th,td{border:1px solid #ccc;padding:6px;text-align:right;vertical-align:top}
  th{background:#f4f4f5;font-weight:600}
  h1{font-size:16px;margin:0 0 12px}
</style></head><body>
<h1>تقرير الطلبات</h1>
${buildOrdersTableHtml(rows)}
</body></html>`;
  w.document.write(html);
  w.document.close();
  w.focus();
  setTimeout(() => {
    w.print();
  }, 300);
}

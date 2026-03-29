/** رقم عراقي: 11 رقم يبدأ بـ 07 (مثال 07XXXXXXXXX) */
export const IRAQ_MOBILE_REGEX = /^07[0-9]{9}$/;

export function normalizeIraqPhone(input: unknown): string | null {
  if (input == null) return null;
  const s = String(input).trim().replace(/\s+/g, "");
  const digits = s.replace(/\D/g, "");
  if (digits.length === 11 && digits.startsWith("07")) return digits;
  if (digits.length === 10 && digits.startsWith("7")) return `0${digits}`;
  return null;
}

export function isValidIraqPhone(input: unknown): boolean {
  const n = normalizeIraqPhone(input);
  return n != null && IRAQ_MOBILE_REGEX.test(n);
}

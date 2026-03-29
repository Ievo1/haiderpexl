import { DEFAULT_IRAQ_GOVERNORATES } from "@/lib/iraq-governorates";
import type { FormConfig, FormFieldConfig } from "@/types/landing";

/** توحيد الإعدادات القديمة (cityOptions / حقول بلا خيارات كمية). */
export function normalizeFormConfig(raw: Partial<FormConfig> & { fields?: FormFieldConfig[] }): FormConfig {
  const gov = raw.governorateOptions?.length
    ? [...raw.governorateOptions]
    : raw.cityOptions?.length
      ? [...raw.cityOptions]
      : [...DEFAULT_IRAQ_GOVERNORATES];

  const fields: FormFieldConfig[] = (raw.fields ?? []).map((f) => {
    if (f.key === "quantity") {
      const qo =
        f.quantityOptions?.length && f.quantityOptions.length > 0
          ? f.quantityOptions
          : [{ id: `${f.id}-opt`, label: "خيار واحد", price: 0 }];
      return {
        ...f,
        quantityOptions: qo,
        currencyLabel: f.currencyLabel ?? raw.priceCurrencyLabel ?? "د.ع",
      };
    }
    return f;
  });

  return {
    ...raw,
    governorateOptions: gov,
    submitLabel: raw.submitLabel ?? "إرسال الطلب",
    priceCurrencyLabel: raw.priceCurrencyLabel ?? "د.ع",
    fields,
    cityOptions: undefined,
  };
}

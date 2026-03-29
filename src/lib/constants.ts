import { nanoid } from "nanoid";
import { DEFAULT_IRAQ_GOVERNORATES } from "@/lib/iraq-governorates";
import type {
  FormConfig,
  FormFieldKey,
  LandingSection,
  PixelPageConfig,
} from "@/types/landing";

export const DEFAULT_PIXEL_PAGE: PixelPageConfig = {
  enabled: true,
  useFacebook: true,
  useTikTok: false,
  trackPageView: true,
  trackLead: true,
  trackPurchase: false,
};

export function defaultFormConfig(): FormConfig {
  const mk = (
    key: FormFieldKey,
    label: string,
    placeholder: string,
    order: number,
    required: boolean,
  ) => ({
    id: nanoid(8),
    key,
    label,
    placeholder,
    enabled: true,
    required,
    order,
  });

  return {
    submitLabel: "إرسال الطلب",
    priceCurrencyLabel: "د.ع",
    governorateOptions: [...DEFAULT_IRAQ_GOVERNORATES],
    fields: [
      mk("name", "الاسم الكامل", "اكتب اسمك", 0, true),
      mk("phone", "رقم الجوال", "07xxxxxxxxxx", 1, true),
      mk("address", "العنوان", "الحي، الشارع", 2, true),
      mk("confirm_phone", "تأكيد رقم الجوال", "أعد إدخال الرقم", 3, true),
      mk("confirm_address", "تأكيد العنوان", "أعد إدخال العنوان", 4, false),
      {
        ...mk("governorate", "المحافظة", "اختر المحافظة", 5, true),
      },
      {
        ...mk("quantity", "عدد القطع", "اختر عدد القطع والسعر", 6, true),
        currencyLabel: "د.ع",
        quantityOptions: [
          { id: nanoid(8), label: "قطعة واحدة", pieces: 1, price: 25000 },
          {
            id: nanoid(8),
            label: "قطعتان",
            pieces: 2,
            price: 45000,
            compareAtPrice: 50000,
            discountLabel: "وفر 5000 د.ع",
          },
          {
            id: nanoid(8),
            label: "3 قطع",
            pieces: 3,
            price: 60000,
            compareAtPrice: 75000,
            discountLabel: "خصم على 3 قطع",
          },
        ],
      },
      mk("notes", "ملاحظات", "أي تفاصيل إضافية", 7, false),
    ],
  };
}

export function defaultSections(): LandingSection[] {
  return [
    {
      id: nanoid(8),
      type: "header",
      title: "عنوان جذاب لعرضك",
      subtitle: "وصف قصير يشرح القيمة",
      imageUrl: "",
    },
    {
      id: nanoid(8),
      type: "productDescription",
      content:
        "صف منتجك أو خدمتك هنا. اشرح الفوائد والمميزات بوضوح لزيادة التحويل.",
    },
    {
      id: nanoid(8),
      type: "gallery",
      images: [],
    },
    {
      id: nanoid(8),
      type: "video",
      url: "",
      enabled: false,
    },
    {
      id: nanoid(8),
      type: "reviews",
      items: [
        {
          id: nanoid(6),
          name: "عميل سعيد",
          text: "تجربة ممتازة وتوصيل سريع.",
          rating: 5,
        },
      ],
    },
    {
      id: nanoid(8),
      type: "cta",
      label: "اطلب الآن",
      href: "#lead-form",
    },
    {
      id: nanoid(8),
      type: "form",
      heading: "أرسل طلبك",
    },
  ];
}

export function slugifyTitle(title: string): string {
  const base = title
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);
  return base || `page-${nanoid(6)}`;
}

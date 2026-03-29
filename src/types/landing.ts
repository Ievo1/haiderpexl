export type FormFieldKey =
  | "name"
  | "phone"
  | "address"
  | "confirm_phone"
  | "confirm_address"
  | "governorate"
  /** قديم — يُعامل مثل المحافظة */
  | "city"
  | "quantity"
  | "notes";

export interface QuantityOption {
  id: string;
  /** عنوان يظهر للعميل (مثال: قطعة واحدة، قطعتان، 3 قطع) */
  label: string;
  /** عدد القطع — للتوضيح والترتيب (اختياري) */
  pieces?: number;
  /** السعر النهائي بعد الخصم */
  price: number;
  /** السعر قبل الخصم — يُعرض مشطوباً عند التعبئة */
  compareAtPrice?: number;
  /** نص الخصم (مثال: خصم 10٪ أو وفر 5000) */
  discountLabel?: string;
}

export interface FormFieldConfig {
  id: string;
  key: FormFieldKey;
  label: string;
  placeholder: string;
  enabled: boolean;
  required: boolean;
  order: number;
  /** عند key === quantity */
  quantityOptions?: QuantityOption[];
  /** تسمية العملة بجانب السعر (مثلاً د.ع) */
  currencyLabel?: string;
}

export interface FormConfig {
  fields: FormFieldConfig[];
  /** قائمة المحافظات المعروضة في القائمة */
  governorateOptions?: string[];
  /** @deprecated استخدم governorateOptions */
  cityOptions?: string[];
  submitLabel: string;
  /** افتراضي للعرض مع أسعار الكمية */
  priceCurrencyLabel?: string;
}

export type SectionType =
  | "header"
  | "productDescription"
  | "gallery"
  | "video"
  | "reviews"
  | "cta"
  | "form";

export interface SectionBase {
  id: string;
  type: SectionType;
}

export interface HeaderSection extends SectionBase {
  type: "header";
  title: string;
  subtitle: string;
  imageUrl: string;
}

export interface ProductSection extends SectionBase {
  type: "productDescription";
  content: string;
}

export interface GallerySection extends SectionBase {
  type: "gallery";
  images: string[];
}

export interface VideoSection extends SectionBase {
  type: "video";
  url: string;
  enabled: boolean;
}

export interface ReviewItem {
  id: string;
  name: string;
  text: string;
  rating: number;
}

export interface ReviewsSection extends SectionBase {
  type: "reviews";
  items: ReviewItem[];
}

export interface CtaSection extends SectionBase {
  type: "cta";
  label: string;
  href: string;
}

export interface FormSection extends SectionBase {
  type: "form";
  heading: string;
}

export type LandingSection =
  | HeaderSection
  | ProductSection
  | GallerySection
  | VideoSection
  | ReviewsSection
  | CtaSection
  | FormSection;

export interface PixelPageConfig {
  enabled: boolean;
  useFacebook: boolean;
  useTikTok: boolean;
  trackPageView: boolean;
  trackLead: boolean;
  trackPurchase: boolean;
}

/** مظهر صفحة الهبوط العامة للزوار */
export type LandingAppearance = "light" | "dark";

export interface LandingPageRow {
  id: string;
  user_id: string;
  title: string;
  slug: string;
  published: boolean;
  /** مظهر نهاري أو ليلي للصفحة العامة */
  appearance: LandingAppearance;
  sections: LandingSection[];
  form_config: FormConfig;
  pixel_config: PixelPageConfig;
  custom_domain: string | null;
  visit_count: number;
  lead_count: number;
  created_at: string;
  updated_at: string;
}

export interface GlobalSettingsRow {
  id: string;
  user_id: string;
  facebook_pixel_id: string | null;
  tiktok_pixel_id: string | null;
  telegram_bot_token: string | null;
  telegram_chat_id: string | null;
  google_sheet_webhook_url: string | null;
  /** ويب هوك احتياطي (JSON) إذا فشل تيليغرام أو للنسخ الاحتياطي */
  backup_webhook_url: string | null;
  updated_at: string;
}

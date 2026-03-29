import { nanoid } from "nanoid";
import { createClient } from "@/lib/supabase/client";

const BUCKET = "landing-media";
const MAX_BYTES = 5 * 1024 * 1024;

export type UploadLandingImageResult = {
  publicUrl: string;
  storagePath: string;
};

export async function uploadLandingImage(file: File): Promise<UploadLandingImageResult> {
  if (file.size > MAX_BYTES) {
    throw new Error("حجم الصورة يجب أن لا يتجاوز 5 ميجابايت");
  }
  if (!file.type.startsWith("image/")) {
    throw new Error("الملف يجب أن يكون صورة");
  }

  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("يجب تسجيل الدخول لرفع الصور");

  const ext = file.name.split(".").pop()?.toLowerCase();
  const safeExt = ext && ["jpg", "jpeg", "png", "webp", "gif"].includes(ext) ? ext : "jpg";
  const storagePath = `${user.id}/${nanoid(12)}.${safeExt}`;

  const { error } = await supabase.storage.from(BUCKET).upload(storagePath, file, {
    cacheControl: "3600",
    upsert: false,
    contentType: file.type || `image/${safeExt === "jpg" ? "jpeg" : safeExt}`,
  });

  if (error) throw new Error(error.message);

  const { data } = supabase.storage.from(BUCKET).getPublicUrl(storagePath);
  return { publicUrl: data.publicUrl, storagePath };
}

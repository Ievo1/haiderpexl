"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { deleteLandingPage } from "@/lib/actions/landing-pages";

export function DeleteLandingPageButton({
  pageId,
  title,
}: {
  pageId: string;
  title: string;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  return (
    <button
      type="button"
      disabled={pending}
      className="text-sm text-red-600 hover:underline disabled:opacity-50 dark:text-red-400"
      onClick={() => {
        if (
          !confirm(
            `حذف صفحة «${title}» نهائياً؟\nسيتم حذف جميع الطلبات المرتبطة بها أيضاً.`,
          )
        ) {
          return;
        }
        startTransition(async () => {
          const res = await deleteLandingPage(pageId);
          if ("error" in res && res.error) {
            alert(res.error);
            return;
          }
          router.refresh();
        });
      }}
    >
      {pending ? "…" : "حذف"}
    </button>
  );
}

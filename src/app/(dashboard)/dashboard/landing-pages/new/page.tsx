import { NewLandingForm } from "./ui";

export default function NewLandingPage() {
  return (
    <div className="mx-auto max-w-lg space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">إنشاء صفحة هبوط جديدة</h1>
        <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
          أدخل اسماً للصفحة، سيتم إنشاء رابط (slug) تلقائياً يمكنك تعديله لاحقاً.
        </p>
      </div>
      <NewLandingForm />
    </div>
  );
}

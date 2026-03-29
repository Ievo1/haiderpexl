import { Suspense } from "react";
import { LoginForm } from "./login-form";

export default function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 px-4 dark:bg-zinc-950">
      <div className="w-full max-w-md rounded-3xl border border-zinc-200 bg-white p-8 shadow-xl dark:border-zinc-800 dark:bg-zinc-900">
        <h1 className="text-2xl font-bold tracking-tight">تسجيل الدخول</h1>
        <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
          أدخل بيانات حساب المسؤول للوصول إلى لوحة التحكم.
        </p>
        <Suspense fallback={<div className="mt-8 h-40 animate-pulse rounded-xl bg-zinc-100 dark:bg-zinc-800" />}>
          <LoginForm />
        </Suspense>
      </div>
    </div>
  );
}

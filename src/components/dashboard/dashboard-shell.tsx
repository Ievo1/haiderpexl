"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { LayoutDashboard, FileStack, Inbox, Settings, LogOut, Moon, Sun, Monitor } from "lucide-react";
import { useTheme } from "@/components/providers/theme-provider";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

const nav = [
  { href: "/dashboard", label: "نظرة عامة", icon: LayoutDashboard },
  { href: "/dashboard/landing-pages", label: "صفحات الهبوط", icon: FileStack },
  { href: "/dashboard/orders", label: "الطلبات", icon: Inbox },
  { href: "/dashboard/settings", label: "الإعدادات", icon: Settings },
];

function ThemeSwitcher({ compact }: { compact?: boolean }) {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  if (!mounted) {
    return <div className={cn("h-9", compact ? "w-full" : "w-full")} />;
  }

  const items = [
    { id: "light" as const, label: "نهاري", icon: Sun },
    { id: "dark" as const, label: "ليلي", icon: Moon },
    { id: "system" as const, label: "تلقائي", icon: Monitor },
  ];

  return (
    <div className={cn("space-y-1.5", compact ? "w-full" : "")}>
      <p className={cn("text-xs text-zinc-500", compact ? "px-1" : "px-3")}>مظهر لوحة التحكم</p>
      <div
        className={cn(
          "flex gap-1 rounded-xl border border-zinc-200 bg-zinc-50/80 p-1 dark:border-zinc-800 dark:bg-zinc-900/50",
          compact ? "justify-center" : "",
        )}
      >
        {items.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            type="button"
            title={label}
            onClick={() => setTheme(id)}
            className={cn(
              "flex flex-1 items-center justify-center gap-1 rounded-lg px-2 py-1.5 text-xs font-medium transition",
              theme === id
                ? "bg-white text-zinc-900 shadow-sm dark:bg-zinc-800 dark:text-white"
                : "text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100",
            )}
          >
            <Icon className="h-3.5 w-3.5 shrink-0" aria-hidden />
            <span className={compact ? "sr-only sm:not-sr-only" : ""}>{label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

export function DashboardShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();

  async function signOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <div className="flex min-h-screen bg-zinc-100/80 dark:bg-zinc-950">
      <aside className="hidden w-64 shrink-0 border-l border-zinc-200 bg-white/90 p-4 backdrop-blur dark:border-zinc-800 dark:bg-zinc-950/90 lg:block">
        <div className="mb-8 px-2">
          <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500">Landing OS</p>
          <p className="mt-1 text-lg font-bold text-zinc-900 dark:text-white">لوحة التحكم</p>
        </div>
        <nav className="space-y-1">
          {nav.map((item) => {
            const active = pathname === item.href || pathname.startsWith(item.href + "/");
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition",
                  active
                    ? "bg-zinc-900 text-white dark:bg-white dark:text-zinc-900"
                    : "text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-900",
                )}
              >
                <Icon className="h-4 w-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="mt-6 space-y-3 border-t border-zinc-200 pt-4 dark:border-zinc-800">
          <ThemeSwitcher />
          <button
            type="button"
            onClick={signOut}
            className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/40"
          >
            <LogOut className="h-4 w-4" />
            تسجيل الخروج
          </button>
        </div>
      </aside>

      <div className="min-w-0 flex-1">
        <header className="sticky top-0 z-10 border-b border-zinc-200 bg-white/80 backdrop-blur dark:border-zinc-800 dark:bg-zinc-950/80 lg:hidden">
          <div className="flex flex-col gap-3 px-4 py-3">
            <div className="flex items-center justify-between">
              <p className="font-semibold">لوحة التحكم</p>
              <button
                type="button"
                onClick={signOut}
                className="rounded-lg p-2 text-red-600 dark:text-red-400"
                aria-label="تسجيل الخروج"
              >
                <LogOut className="h-5 w-5" />
              </button>
            </div>
            <ThemeSwitcher compact />
          </div>
          <nav className="flex gap-2 overflow-x-auto border-t border-zinc-100 px-3 pb-3 dark:border-zinc-800">
            {nav.map((item) => {
              const active = pathname === item.href || pathname.startsWith(item.href + "/");
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "whitespace-nowrap rounded-full px-3 py-1.5 text-xs font-medium",
                    active
                      ? "bg-zinc-900 text-white dark:bg-white dark:text-zinc-900"
                      : "bg-zinc-100 text-zinc-600 dark:bg-zinc-900 dark:text-zinc-400",
                  )}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </header>
        <div className="mx-auto max-w-5xl px-4 py-8">{children}</div>
      </div>
    </div>
  );
}

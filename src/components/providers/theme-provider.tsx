"use client";

/**
 * مزوّد ثيم بدون وسم <script> (React 19 يمنع script داخل مكوّنات React).
 * يطبّق class `dark` على <html> متوافقاً مع Tailwind darkMode: class.
 */
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useLayoutEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

export const THEME_STORAGE_KEY = "landing-dashboard-theme";

export type ThemeSetting = "light" | "dark" | "system";

export type UseThemeReturn = {
  /** الإعداد المحفوظ: نهاري / ليلي / تلقائي */
  theme: ThemeSetting;
  setTheme: (t: string) => void;
  /** الوضع الفعلي المعروض (بعد حلّ «تلقائي») */
  resolvedTheme: "light" | "dark";
  themes: string[];
  systemTheme?: "light" | "dark";
};

const ThemeContext = createContext<UseThemeReturn | undefined>(undefined);

function getSystemTheme(): "light" | "dark" {
  if (typeof window === "undefined") return "light";
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

function resolveTheme(setting: ThemeSetting, system: "light" | "dark"): "light" | "dark" {
  if (setting === "system") return system;
  return setting;
}

function applyToDocument(resolved: "light" | "dark") {
  const root = document.documentElement;
  root.classList.toggle("dark", resolved === "dark");
  root.style.colorScheme = resolved;
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<ThemeSetting>("system");
  const [systemTheme, setSystemTheme] = useState<"light" | "dark">("light");
  const [mounted, setMounted] = useState(false);

  const resolvedTheme = useMemo(
    () => resolveTheme(theme, systemTheme),
    [theme, systemTheme],
  );

  useEffect(() => {
    setSystemTheme(getSystemTheme());
    try {
      const raw = localStorage.getItem(THEME_STORAGE_KEY);
      if (raw === "light" || raw === "dark" || raw === "system") {
        setThemeState(raw);
      }
    } catch {
      /* private mode */
    }
    setMounted(true);
  }, []);

  useLayoutEffect(() => {
    if (!mounted) return;
    applyToDocument(resolveTheme(theme, systemTheme));
    try {
      localStorage.setItem(THEME_STORAGE_KEY, theme);
    } catch {
      /* ignore */
    }
  }, [mounted, theme, systemTheme]);

  useEffect(() => {
    if (!mounted) return;
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const onChange = () => setSystemTheme(getSystemTheme());
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, [mounted]);

  useEffect(() => {
    if (!mounted) return;
    const onStorage = (e: StorageEvent) => {
      if (e.key !== THEME_STORAGE_KEY) return;
      const v = e.newValue;
      if (v === "light" || v === "dark" || v === "system") setThemeState(v);
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, [mounted]);

  const setTheme = useCallback((t: string) => {
    if (t === "light" || t === "dark" || t === "system") {
      setThemeState(t);
    }
  }, []);

  const value = useMemo<UseThemeReturn>(
    () => ({
      theme,
      setTheme,
      resolvedTheme,
      themes: ["light", "dark", "system"],
      systemTheme: theme === "system" ? systemTheme : undefined,
    }),
    [theme, setTheme, resolvedTheme, systemTheme],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): UseThemeReturn {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    throw new Error("useTheme يجب استخدامه داخل ThemeProvider");
  }
  return ctx;
}

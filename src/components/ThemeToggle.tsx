"use client";

import { useEffect, useState } from "react";
import { Sun, Moon } from "lucide-react";

type Theme = "light" | "dark";

export function ThemeToggle({ className = "" }: { className?: string }) {
  const [theme, setTheme] = useState<Theme>("light");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const current = (document.documentElement.dataset.theme as Theme) || "light";
    setTheme(current);
    setMounted(true);
  }, []);

  const toggle = () => {
    const next: Theme = theme === "dark" ? "light" : "dark";
    document.documentElement.dataset.theme = next;
    try {
      localStorage.setItem("anikit-theme", next);
    } catch {
      // ignore storage failures (private mode etc.)
    }
    setTheme(next);
  };

  const isDark = theme === "dark";

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
      title={isDark ? "Light mode" : "Dark mode"}
      className={`subtitle-bar group inline-flex items-center gap-2 border-2 border-ink/20 bg-panel px-3 py-1.5 text-[0.62rem] font-bold uppercase tracking-[0.25em] text-ink/70 transition hover:border-accent hover:text-ink ${className}`}
    >
      {/* render a stable icon until mounted to avoid hydration flash */}
      {mounted && isDark ? (
        <Moon className="h-3.5 w-3.5 text-accent" />
      ) : (
        <Sun className="h-3.5 w-3.5 text-accent" />
      )}
      {mounted ? (isDark ? "dark" : "light") : "theme"}
    </button>
  );
}

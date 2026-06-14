"use client";

import { useCallback, useEffect, useState } from "react";

const STORAGE_KEY = "anikit:accent";
export const DEFAULT_ACCENT = "#e7251c";

/** Curated accent presets for the Wrapped stage. */
export const ACCENT_PRESETS: { name: string; value: string }[] = [
  { name: "Crimson", value: "#e7251c" },
  { name: "Electric", value: "#2f6df6" },
  { name: "Violet", value: "#7c5cff" },
  { name: "Emerald", value: "#19c37d" },
  { name: "Gold", value: "#f5a623" },
  { name: "Magenta", value: "#ff2d78" },
  { name: "Cyan", value: "#16c4d6" },
];

/** Darken a hex color toward black (for the deep/shadow shade). */
export const darken = (hex: string, amount = 0.34): string => {
  const m = hex.replace("#", "");
  const full = m.length === 3 ? m.split("").map((c) => c + c).join("") : m;
  if (full.length !== 6) return hex;
  const r = parseInt(full.slice(0, 2), 16);
  const g = parseInt(full.slice(2, 4), 16);
  const b = parseInt(full.slice(4, 6), 16);
  const d = (v: number) => Math.max(0, Math.round(v * (1 - amount)));
  return `#${[d(r), d(g), d(b)].map((v) => v.toString(16).padStart(2, "0")).join("")}`;
};

/** Persisted accent color (localStorage — no server storage). Returns the color + its deep shade
 * + a setter. Used to override `--pw-red` / `--pw-red-deep` on the Wrapped stage. */
export const useAccent = () => {
  const [accent, setAccentState] = useState<string>(DEFAULT_ACCENT);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored && /^#[0-9a-fA-F]{6}$/.test(stored)) setAccentState(stored);
    } catch {
      /* localStorage blocked — keep default */
    }
  }, []);

  const setAccent = useCallback((value: string) => {
    setAccentState(value);
    try {
      localStorage.setItem(STORAGE_KEY, value);
    } catch {
      /* ignore */
    }
  }, []);

  return { accent, accentDeep: darken(accent), setAccent };
};

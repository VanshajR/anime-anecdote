import clsx, { type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { format } from "date-fns";
import { ANALYTICS_END, ANALYTICS_START } from "./constants";

export const cn = (...inputs: ClassValue[]) => twMerge(clsx(...inputs));

export const clamp = (value: number, min = 0, max = 1): number =>
  Math.min(Math.max(value, min), max);

export const parseMalDate = (value?: string | null): Date | null => {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
};

export const isWithinWindow = (value?: string | Date | null): boolean => {
  const date = value instanceof Date ? value : parseMalDate(value);
  if (!date) return false;
  return date >= ANALYTICS_START && date <= ANALYTICS_END;
};

export const formatHours = (hours: number): string => {
  if (hours >= 1_000) {
    return `${(hours / 1_000).toFixed(1)}k hrs`;
  }
  return `${hours.toFixed(1)} hrs`;
};

export const hoursToDays = (hours: number): number => hours / 24;

export const percentile = (value: number, max: number): number =>
  max === 0 ? 0 : Math.round((value / max) * 100);

export const toBase64Url = (data: Record<string, unknown>): string => {
  return Buffer.from(JSON.stringify(data)).toString("base64url");
};

export const fromBase64Url = <T>(value: string): T | null => {
  try {
    return JSON.parse(Buffer.from(value, "base64url").toString()) as T;
  } catch {
    return null;
  }
};

export const describeWindow = (): string => {
  const start = format(ANALYTICS_START, "MMM d");
  const end = format(ANALYTICS_END, "MMM d");
  return `${start} – ${end}, ${ANALYTICS_START.getUTCFullYear()}`;
};

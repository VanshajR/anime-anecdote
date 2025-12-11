import type { TitleLocale } from "./types";

interface LocalizedTitle {
  title: string;
  titleEn?: string | null;
  titleJa?: string | null;
}

export const resolveTitle = (entry: LocalizedTitle, locale: TitleLocale) => {
  if (locale === "ja") {
    return entry.titleJa ?? entry.title;
  }
  return entry.titleEn ?? entry.title;
};

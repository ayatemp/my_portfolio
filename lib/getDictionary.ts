import type jaDict from "@/dictionaries/ja.json";

export type Locale = "ja" | "en";
export type Dictionary = typeof jaDict;

const dictionaries: Record<Locale, () => Promise<Dictionary>> = {
  ja: () => import("@/dictionaries/ja.json").then((m) => m.default),
  en: () => import("@/dictionaries/en.json").then((m) => m.default),
};

export async function getDictionary(locale: Locale): Promise<Dictionary> {
  return dictionaries[locale]?.() ?? dictionaries.ja();
}

export function normalizeLocale(locale: string): Locale {
  return locale === "en" ? "en" : "ja";
}

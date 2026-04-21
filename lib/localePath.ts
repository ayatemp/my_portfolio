import type { Locale } from "./getDictionary";

export function lp(locale: Locale, path: string): string {
  return `/${locale}${path}`;
}

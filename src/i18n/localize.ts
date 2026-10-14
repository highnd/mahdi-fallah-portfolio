import type { Locale } from "./messages";

export type LText = { fa: string; en: string };

export function lx(locale: Locale, value: LText | string): string {
  if (typeof value === "string") return value;
  return value[locale];
}

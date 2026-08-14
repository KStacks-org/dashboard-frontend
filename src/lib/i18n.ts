import { getLocale, type locales, setLocale } from "@/paraglide/runtime";

export type AppLocale = (typeof locales)[number];

export function currentLocale(): AppLocale {
  return getLocale();
}

export function isRtl(locale: AppLocale = getLocale()): boolean {
  return locale === "ar";
}

/** Applies dir/lang to <html> so logical CSS properties resolve correctly. */
export function applyDocumentDirection(locale: AppLocale = getLocale()) {
  document.documentElement.lang = locale;
  document.documentElement.dir = isRtl(locale) ? "rtl" : "ltr";
}

export function switchLocale(next: AppLocale) {
  setLocale(next);
}

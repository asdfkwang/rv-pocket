import { en, type TranslationKey, type Translations } from "./en";
import { ko } from "./ko";

export type Lang = "en" | "ko";

const STORAGE_KEY = "rv-pocket-lang";

const dictionaries: Record<Lang, Translations> = { en, ko };

let lang: Lang = readStoredLang();

function readStoredLang(): Lang {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === "en" || stored === "ko") return stored;
  } catch { /* localStorage unavailable; fall back to default */ }
  return "en";
}

export function getLang(): Lang {
  return lang;
}

export function setLang(next: Lang): void {
  lang = next;
  try {
    localStorage.setItem(STORAGE_KEY, next);
  } catch { /* ignore write failures */ }
  if (typeof document !== "undefined") document.documentElement.lang = next;
}

export function toggleLang(): Lang {
  setLang(lang === "en" ? "ko" : "en");
  return lang;
}

/** Translate a key, replacing {placeholders} with the given values. */
export function t(key: TranslationKey, values?: Record<string, string | number>): string {
  const template = dictionaries[lang][key] ?? en[key];
  if (!values) return template;
  return template.replace(/\{(\w+)\}/g, (match, name: string) =>
    name in values ? String(values[name]) : match,
  );
}

/** Translate a whole dictionary of strings (used for chapter content bundles). */
export function tBundle(bundle: Partial<Record<Lang, unknown>> | undefined): unknown {
  if (!bundle) return undefined;
  return bundle[lang] ?? bundle.en;
}

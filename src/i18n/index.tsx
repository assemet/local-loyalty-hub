import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import { en, type TranslationKey, type Translations } from "./locales/en";
import { ru } from "./locales/ru";
import { es } from "./locales/es";
import { ar } from "./locales/ar";
import { tr } from "./locales/tr";
import { pt } from "./locales/pt";
import { it } from "./locales/it";
import { detectLocale, isRtl, LOCALES, LOCALE_LABELS, normalizeLocale, type Locale } from "./detect";

export { LOCALES, LOCALE_LABELS, isRtl };
export type { Locale };
export type { TranslationKey };

const RESOURCES: Record<Locale, Translations> = {
  en,
  ru: ru as Translations,
  es: es as Translations,
  ar: ar as Translations,
  tr: tr as Translations,
  pt: pt as Translations,
  it: it as Translations,
};

const STORAGE_KEY = "fello.locale";
const EXPLICIT_KEY = "fello.locale.explicit";

export type TranslateVars = Record<string, string | number>;

type I18nContextValue = {
  locale: Locale;
  dir: "ltr" | "rtl";
  t: (key: TranslationKey, vars?: TranslateVars) => string;
  setLocale: (locale: Locale, explicit?: boolean) => void;
  /** true when the user picked the language themselves */
  isExplicit: boolean;
  formatNumber: (value: number) => string;
  formatDate: (value: string | Date, opts?: Intl.DateTimeFormatOptions) => string;
};

const I18nContext = createContext<I18nContextValue | null>(null);

function interpolate(template: string, vars?: TranslateVars) {
  if (!vars) return template;
  return template.replace(/\{(\w+)\}/g, (_, name: string) =>
    vars[name] === undefined ? `{${name}}` : String(vars[name]),
  );
}

export function I18nProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>("en");
  const [isExplicit, setIsExplicit] = useState(false);

  // Detection happens after hydration so SSR markup stays deterministic.
  useEffect(() => {
    const stored = normalizeLocale(window.localStorage.getItem(STORAGE_KEY));
    const explicit = window.localStorage.getItem(EXPLICIT_KEY) === "1";
    if (stored) {
      setLocaleState(stored);
      setIsExplicit(explicit);
      return;
    }
    setLocaleState(detectLocale());
  }, []);

  useEffect(() => {
    const dir = isRtl(locale) ? "rtl" : "ltr";
    document.documentElement.lang = locale;
    document.documentElement.dir = dir;
  }, [locale]);

  const setLocale = useCallback((next: Locale, explicit = true) => {
    setLocaleState(next);
    window.localStorage.setItem(STORAGE_KEY, next);
    if (explicit) {
      setIsExplicit(true);
      window.localStorage.setItem(EXPLICIT_KEY, "1");
    }
  }, []);

  const value = useMemo<I18nContextValue>(() => {
    const table = RESOURCES[locale] ?? en;
    return {
      locale,
      dir: isRtl(locale) ? "rtl" : "ltr",
      isExplicit,
      t: (key, vars) => interpolate(table[key] ?? en[key] ?? key, vars),
      setLocale,
      formatNumber: (n) => new Intl.NumberFormat(locale).format(n),
      formatDate: (v, opts) =>
        new Intl.DateTimeFormat(locale, opts ?? { dateStyle: "medium" }).format(new Date(v)),
    };
  }, [locale, isExplicit, setLocale]);

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error("useI18n must be used inside <I18nProvider>");
  return ctx;
}

export function useT() {
  return useI18n().t;
}

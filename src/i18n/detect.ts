import { getTelegramUser } from "@/lib/telegram";

export const LOCALES = ["en", "ru", "es", "ar", "tr", "pt", "it"] as const;
export type Locale = (typeof LOCALES)[number];

export const RTL_LOCALES: Locale[] = ["ar"];

export const LOCALE_LABELS: Record<Locale, string> = {
  en: "English",
  ru: "Русский",
  es: "Español",
  ar: "العربية",
  tr: "Türkçe",
  pt: "Português",
  it: "Italiano",
};

// Country -> language defaults, used only as a last resort when neither
// Telegram nor the browser expose a usable language. Derived from the
// device timezone, never from GPS.
const COUNTRY_LANGUAGE: Record<string, Locale> = {
  US: "en",
  GB: "en",
  CA: "en",
  AU: "en",
  IE: "en",
  NZ: "en",
  RU: "ru",
  BY: "ru",
  KZ: "ru",
  KG: "ru",
  UZ: "ru",
  AM: "ru",
  ES: "es",
  MX: "es",
  AR: "es",
  CO: "es",
  CL: "es",
  PE: "es",
  VE: "es",
  EC: "es",
  UY: "es",
  SA: "ar",
  AE: "ar",
  EG: "ar",
  QA: "ar",
  KW: "ar",
  BH: "ar",
  OM: "ar",
  JO: "ar",
  LB: "ar",
  IQ: "ar",
  MA: "ar",
  DZ: "ar",
  TN: "ar",
  LY: "ar",
  SD: "ar",
  YE: "ar",
  PS: "ar",
  SY: "ar",
  TR: "tr",
  PT: "pt",
  BR: "pt",
  AO: "pt",
  MZ: "pt",
  IT: "it",
  CH: "it",
  SM: "it",
};

// Timezone -> country hints (coarse region signal, no permission required).
const TIMEZONE_COUNTRY: Record<string, string> = {
  "Europe/Moscow": "RU",
  "Europe/Madrid": "ES",
  "Europe/Lisbon": "PT",
  "Europe/Rome": "IT",
  "Europe/Istanbul": "TR",
  "Europe/London": "GB",
  "Europe/Dublin": "IE",
  "America/New_York": "US",
  "America/Chicago": "US",
  "America/Denver": "US",
  "America/Los_Angeles": "US",
  "America/Toronto": "CA",
  "America/Mexico_City": "MX",
  "America/Sao_Paulo": "BR",
  "America/Bogota": "CO",
  "America/Argentina/Buenos_Aires": "AR",
  "America/Santiago": "CL",
  "America/Lima": "PE",
  "Asia/Riyadh": "SA",
  "Asia/Dubai": "AE",
  "Africa/Cairo": "EG",
  "Asia/Qatar": "QA",
  "Asia/Kuwait": "KW",
  "Asia/Beirut": "LB",
  "Asia/Amman": "JO",
  "Asia/Baghdad": "IQ",
  "Africa/Casablanca": "MA",
  "Africa/Algiers": "DZ",
  "Africa/Tunis": "TN",
  "Africa/Tripoli": "LY",
  "Australia/Sydney": "AU",
};

export function normalizeLocale(raw?: string | null): Locale | null {
  if (!raw) return null;
  const lower = raw.toLowerCase();
  const base = lower.split(/[-_]/)[0] as Locale;
  if ((LOCALES as readonly string[]).includes(base)) return base;
  return null;
}

function fromTimezone(): Locale | null {
  try {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    const country = tz ? TIMEZONE_COUNTRY[tz] : undefined;
    return country ? (COUNTRY_LANGUAGE[country] ?? null) : null;
  } catch {
    return null;
  }
}

function fromRegionTag(): Locale | null {
  if (typeof navigator === "undefined") return null;
  for (const tag of navigator.languages ?? [navigator.language]) {
    const region = tag?.split(/[-_]/)[1]?.toUpperCase();
    if (region && COUNTRY_LANGUAGE[region]) return COUNTRY_LANGUAGE[region];
  }
  return null;
}

/**
 * Best-effort automatic language detection, in priority order:
 * 1. Telegram user language
 * 2. Browser / device languages
 * 3. Region from the browser locale tag
 * 4. Coarse country hint from the device timezone
 */
export function detectLocale(): Locale {
  const telegram = normalizeLocale(getTelegramUser()?.language_code);
  if (telegram) return telegram;

  if (typeof navigator !== "undefined") {
    for (const tag of navigator.languages ?? [navigator.language]) {
      const match = normalizeLocale(tag);
      if (match) return match;
    }
  }

  return fromRegionTag() ?? fromTimezone() ?? "en";
}

export function isRtl(locale: Locale): boolean {
  return RTL_LOCALES.includes(locale);
}

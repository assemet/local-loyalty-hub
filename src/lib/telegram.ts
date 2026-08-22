// Thin, isolated adapter around the Telegram WebApp API.
// Telegram is a channel, not the core of Fello: everything here degrades
// gracefully when the app runs in a normal browser.

export type TelegramUser = {
  id: number;
  first_name?: string;
  last_name?: string;
  username?: string;
  language_code?: string;
  photo_url?: string;
};

type TelegramWebApp = {
  initData: string;
  initDataUnsafe?: { user?: TelegramUser };
  ready: () => void;
  expand?: () => void;
  colorScheme?: string;
  HapticFeedback?: { impactOccurred?: (style: string) => void };
};

export function getTelegramWebApp(): TelegramWebApp | null {
  if (typeof window === "undefined") return null;
  const tg = (window as unknown as { Telegram?: { WebApp?: TelegramWebApp } }).Telegram?.WebApp;
  if (!tg || typeof tg.initData !== "string") return null;
  return tg;
}

export function isTelegramEnvironment(): boolean {
  const tg = getTelegramWebApp();
  return Boolean(tg && tg.initData.length > 0);
}

export function getTelegramInitData(): string | null {
  const tg = getTelegramWebApp();
  if (!tg || !tg.initData) return null;
  return tg.initData;
}

export function getTelegramUser(): TelegramUser | null {
  return getTelegramWebApp()?.initDataUnsafe?.user ?? null;
}

export function telegramReady() {
  const tg = getTelegramWebApp();
  tg?.ready();
  tg?.expand?.();
}

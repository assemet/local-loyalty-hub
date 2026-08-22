import type { TranslationKey } from "@/i18n/locales/en";

const KNOWN_CODES = [
  "INVALID_QR",
  "EXPIRED_QR",
  "NOT_A_MEMBER",
  "ALREADY_REDEEMED",
  "INSUFFICIENT_BALANCE",
  "REWARD_EXPIRED",
  "REWARD_INACTIVE",
  "UNAUTHORIZED_STORE",
  "UNAUTHORIZED",
  "UNAUTHENTICATED",
  "WRONG_MODE",
  "INVALID_AMOUNT",
  "NO_PROGRAM",
  "INVALID_REWARD",
  "INVALID_STATUS",
] as const;

/**
 * Maps backend failures to user-facing translation keys.
 * Raw database/technical messages are never shown to users.
 */
export function errorKey(error: unknown): TranslationKey {
  const message =
    typeof error === "string"
      ? error
      : error instanceof Error
        ? error.message
        : ((error as { message?: string })?.message ?? "");

  for (const code of KNOWN_CODES) {
    if (message.includes(code)) return `errors.${code}` as TranslationKey;
  }
  if (/fetch|network|Failed to send/i.test(message)) return "errors.NETWORK";
  if (/telegram/i.test(message)) return "errors.TELEGRAM_AUTH";
  return "errors.generic";
}

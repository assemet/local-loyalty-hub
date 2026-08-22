import { Languages } from "lucide-react";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { LOCALES, LOCALE_LABELS, useI18n, type Locale } from "@/i18n";
import { useAuth } from "@/hooks/useAuth";

/** Always-available language switcher. Persists to the user profile when signed in. */
export function LanguageSelect({ className }: { className?: string }) {
  const { locale, setLocale, t } = useI18n();
  const { session, saveProfile } = useAuth();

  return (
    <Select
      value={locale}
      onValueChange={(next) => {
        setLocale(next as Locale, true);
        if (session) void saveProfile({ language: next });
      }}
    >
      <SelectTrigger className={className} aria-label={t("common.language")}>
        <Languages className="size-4 text-muted-foreground" aria-hidden />
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {LOCALES.map((code) => (
          <SelectItem key={code} value={code}>
            {LOCALE_LABELS[code]}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

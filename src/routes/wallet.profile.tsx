import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";

import { LanguageSelect } from "@/components/LanguageSelect";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useAuth } from "@/hooks/useAuth";
import { useI18n } from "@/i18n";
import { errorKey } from "@/lib/errors";

export const Route = createFileRoute("/wallet/profile")({
  component: ProfilePage,
});

function ProfilePage() {
  const { t } = useI18n();
  const navigate = useNavigate();
  const { profile, saveProfile, signOut } = useAuth();
  const [name, setName] = useState(profile?.full_name ?? "");
  const [busy, setBusy] = useState(false);

  const save = async () => {
    setBusy(true);
    try {
      await saveProfile({ full_name: name });
      toast.success(t("merchant.saved"));
    } catch (error) {
      toast.error(t(errorKey(error)));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-6 p-4">
      <h1 className="text-2xl font-bold">{t("customer.profile")}</h1>

      <div className="surface-card space-y-4 p-5">
        <div className="flex items-center gap-3">
          {profile?.avatar_url ? (
            <img
              src={profile.avatar_url}
              alt={profile.full_name ?? ""}
              loading="lazy"
              className="size-14 rounded-2xl object-cover"
            />
          ) : null}
          <div className="text-sm">
            <p className="font-semibold">{profile?.full_name}</p>
            <p className="text-muted-foreground">
              {profile?.telegram_id
                ? `${t("customer.telegram_connected")}${profile.telegram_username ? ` · @${profile.telegram_username}` : ""}`
                : t("customer.telegram_not_connected")}
            </p>
          </div>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="p-name">{t("common.name")}</Label>
          <Input id="p-name" value={name} onChange={(e) => setName(e.target.value)} />
        </div>

        <div className="space-y-1.5">
          <Label>{t("common.language")}</Label>
          <LanguageSelect className="w-full" />
        </div>

        <div className="flex items-center justify-between gap-4 rounded-xl bg-muted p-3">
          <div>
            <p className="text-sm font-medium">{t("customer.notifications")}</p>
            <p className="text-xs text-muted-foreground">{t("customer.notifications_hint")}</p>
          </div>
          <Switch
            checked={profile?.notifications_enabled ?? true}
            onCheckedChange={(checked) => void saveProfile({ notifications_enabled: checked })}
            aria-label={t("customer.notifications")}
          />
        </div>

        <Button onClick={save} disabled={busy} className="w-full">
          {t("common.save")}
        </Button>
      </div>

      <Button
        variant="outline"
        className="w-full"
        onClick={async () => {
          await signOut();
          void navigate({ to: "/", replace: true });
        }}
      >
        {t("common.sign_out")}
      </Button>
    </div>
  );
}

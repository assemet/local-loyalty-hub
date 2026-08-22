import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { MerchantShell, PageHeader } from "@/components/merchant/MerchantShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAuth } from "@/hooks/useAuth";
import { useMerchantStore } from "@/hooks/useStore";
import { useI18n } from "@/i18n";
import { updateStore } from "@/lib/api";
import { CURRENCIES, STORE_CATEGORIES } from "@/lib/domain";
import { errorKey } from "@/lib/errors";

export const Route = createFileRoute("/_authenticated/settings")({
  component: SettingsPage,
});

function SettingsPage() {
  const { t } = useI18n();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user, signOut } = useAuth();
  const { store, stores, selectStore } = useMerchantStore();

  const [name, setName] = useState("");
  const [category, setCategory] = useState("coffee");
  const [currency, setCurrency] = useState("USD");
  const [logoUrl, setLogoUrl] = useState("");
  const [address, setAddress] = useState("");
  const [phone, setPhone] = useState("");

  useEffect(() => {
    if (!store) return;
    setName(store.name);
    setCategory(store.category);
    setCurrency(store.currency);
    setLogoUrl(store.logo_url ?? "");
    setAddress(store.address ?? "");
    setPhone(store.phone ?? "");
  }, [store]);

  const save = useMutation({
    mutationFn: () =>
      updateStore(store!.id, {
        name,
        category,
        currency,
        logo_url: logoUrl || null,
        address: address || null,
        phone: phone || null,
      }),
    onSuccess: () => {
      toast.success(t("merchant.saved"));
      void queryClient.invalidateQueries({ queryKey: ["my-stores", user?.id] });
    },
    onError: (error) => toast.error(t(errorKey(error))),
  });

  return (
    <MerchantShell>
      <PageHeader title={t("merchant.settings")} description={store?.name ?? ""} />

      <div className="grid max-w-4xl gap-6 lg:grid-cols-2">
        <section className="surface-card space-y-4 p-5">
          {stores.length > 1 ? (
            <div className="space-y-1.5">
              <Label>{t("merchant.switch_store")}</Label>
              <Select value={store?.id ?? ""} onValueChange={selectStore}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {stores.map((item) => (
                    <SelectItem key={item.id} value={item.id}>
                      {item.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          ) : null}

          <div className="space-y-1.5">
            <Label htmlFor="s-name">{t("merchant.store_name")}</Label>
            <Input id="s-name" value={name} onChange={(e) => setName(e.target.value)} />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label>{t("merchant.category")}</Label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {STORE_CATEGORIES.map((item) => (
                    <SelectItem key={item} value={item}>
                      {t(`category.${item}`)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>{t("merchant.currency")}</Label>
              <Select value={currency} onValueChange={setCurrency}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CURRENCIES.map((item) => (
                    <SelectItem key={item} value={item}>
                      {item}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="s-logo">
              {t("merchant.logo_url")} ({t("common.optional")})
            </Label>
            <Input
              id="s-logo"
              dir="ltr"
              value={logoUrl}
              onChange={(e) => setLogoUrl(e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="s-address">
              {t("merchant.address")} ({t("common.optional")})
            </Label>
            <Input id="s-address" value={address} onChange={(e) => setAddress(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="s-phone">
              {t("merchant.phone")} ({t("common.optional")})
            </Label>
            <Input
              id="s-phone"
              dir="ltr"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />
          </div>

          <Button
            className="w-full"
            disabled={!store || save.isPending}
            onClick={() => save.mutate()}
          >
            {t("common.save")}
          </Button>
        </section>

        <section className="surface-card h-fit space-y-3 p-5">
          <h2 className="font-semibold">{t("merchant.account")}</h2>
          <p className="text-sm text-muted-foreground">{user?.email}</p>
          <Button asChild variant="outline" className="w-full">
            <Link to="/wallet">{t("merchant.open_wallet")}</Link>
          </Button>
          <Button
            variant="ghost"
            className="w-full"
            onClick={async () => {
              await queryClient.cancelQueries();
              queryClient.clear();
              await signOut();
              void navigate({ to: "/auth", replace: true });
            }}
          >
            {t("common.sign_out")}
          </Button>
        </section>
      </div>
    </MerchantShell>
  );
}

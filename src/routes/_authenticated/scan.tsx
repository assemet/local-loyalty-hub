import { useMutation } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { CheckCircle2, Star, Ticket } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { MerchantShell, PageHeader } from "@/components/merchant/MerchantShell";
import { QrScanner } from "@/components/QrScanner";
import { StoreAvatar } from "@/components/Logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useMerchantStore } from "@/hooks/useStore";
import { useI18n } from "@/i18n";
import {
  awardLoyalty,
  confirmRedemption,
  lookupCustomer,
  validateRewardToken,
} from "@/lib/api";
import { currencySymbol, type CustomerLookup, type RewardValidation } from "@/lib/domain";
import { errorKey } from "@/lib/errors";

export const Route = createFileRoute("/_authenticated/scan")({
  component: ScanPage,
});

function ScanPage() {
  const { t } = useI18n();
  const { store, program } = useMerchantStore();

  return (
    <MerchantShell>
      <PageHeader title={t("merchant.scan")} description={store?.name ?? ""} />
      <Tabs defaultValue="customer" className="max-w-xl">
        <TabsList className="w-full">
          <TabsTrigger value="customer" className="flex-1">
            {t("merchant.scan_customer")}
          </TabsTrigger>
          <TabsTrigger value="reward" className="flex-1">
            {t("merchant.scan_reward")}
          </TabsTrigger>
        </TabsList>
        <TabsContent value="customer">
          {store ? <AwardFlow storeId={store.id} currency={store.currency} /> : null}
        </TabsContent>
        <TabsContent value="reward">
          {store ? <RedeemFlow storeId={store.id} /> : null}
        </TabsContent>
      </Tabs>
      {program ? null : null}
    </MerchantShell>
  );
}

function AwardFlow({ storeId, currency }: { storeId: string; currency: string }) {
  const { t, formatNumber } = useI18n();
  const [token, setToken] = useState<string | null>(null);
  const [customer, setCustomer] = useState<CustomerLookup | null>(null);
  const [amount, setAmount] = useState("");

  const lookup = useMutation({
    mutationFn: (value: string) => lookupCustomer(value, storeId),
    onSuccess: (result, value) => {
      setCustomer(result);
      setToken(value);
    },
    onError: (error) => toast.error(t(errorKey(error))),
  });

  const award = useMutation({
    mutationFn: (input: { action: "points" | "stamp"; amount?: number }) =>
      awardLoyalty({
        token: token!,
        storeId,
        action: input.action,
        ...(input.amount === undefined ? {} : { amount: input.amount }),
      }),
    onSuccess: (result) => {
      toast.success(
        result.stamps_awarded > 0
          ? t("merchant.awarded_stamp")
          : t("merchant.awarded_points", { count: formatNumber(result.points_awarded) }),
      );
      setCustomer(null);
      setToken(null);
      setAmount("");
    },
    onError: (error) => toast.error(t(errorKey(error))),
  });

  if (!customer) {
    return (
      <div className="surface-card mt-4 p-5">
        <QrScanner onResult={(value) => lookup.mutate(value)} busy={lookup.isPending} />
      </div>
    );
  }

  return (
    <div className="surface-card mt-4 space-y-4 p-5">
      <div className="flex items-center gap-3">
        <StoreAvatar name={customer.customer_name ?? "?"} logoUrl={customer.avatar_url} />
        <div>
          <p className="text-xs text-muted-foreground">{t("merchant.customer_found")}</p>
          <p className="font-semibold">{customer.customer_name}</p>
          <p className="text-sm text-muted-foreground">
            {t("merchant.balance")}:{" "}
            {customer.mode === "stamps"
              ? t("loyalty.stamps_value", {
                  current: customer.stamps_balance,
                  total: customer.stamps_required ?? 0,
                })
              : t("loyalty.points_value", { count: formatNumber(customer.points_balance) })}
          </p>
        </div>
      </div>

      {customer.mode === "stamps" ? (
        <Button
          className="w-full"
          size="lg"
          disabled={award.isPending}
          onClick={() => award.mutate({ action: "stamp" })}
        >
          <Ticket className="size-4" aria-hidden />
          {t("merchant.add_stamp")}
        </Button>
      ) : (
        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor="amount">
              {t("merchant.purchase_amount")} ({currencySymbol(currency).trim()})
            </Label>
            <Input
              id="amount"
              type="number"
              min="0"
              step="0.01"
              dir="ltr"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />
          </div>
          <Button
            className="w-full"
            size="lg"
            disabled={award.isPending || !amount}
            onClick={() => award.mutate({ action: "points", amount: Number(amount) })}
          >
            <Star className="size-4" aria-hidden />
            {t("merchant.add_points")}
          </Button>
        </div>
      )}

      <Button
        variant="ghost"
        className="w-full"
        onClick={() => {
          setCustomer(null);
          setToken(null);
        }}
      >
        {t("common.cancel")}
      </Button>
    </div>
  );
}

function RedeemFlow({ storeId }: { storeId: string }) {
  const { t } = useI18n();
  const [token, setToken] = useState<string | null>(null);
  const [validation, setValidation] = useState<RewardValidation | null>(null);

  const validate = useMutation({
    mutationFn: (value: string) => validateRewardToken(value, storeId),
    onSuccess: (result, value) => {
      setValidation(result);
      setToken(value);
    },
    onError: (error) => toast.error(t(errorKey(error))),
  });

  const confirm = useMutation({
    mutationFn: () => confirmRedemption(token!, storeId),
    onSuccess: () => {
      toast.success(t("merchant.redeemed_ok"));
      setValidation(null);
      setToken(null);
    },
    onError: (error) => toast.error(t(errorKey(error))),
  });

  if (!validation) {
    return (
      <div className="surface-card mt-4 p-5">
        <QrScanner onResult={(value) => validate.mutate(value)} busy={validate.isPending} />
      </div>
    );
  }

  return (
    <div className="surface-card mt-4 space-y-4 p-5 text-center">
      <p className="flex items-center justify-center gap-2 font-display text-xl font-bold text-primary">
        <CheckCircle2 className="size-5" aria-hidden />
        {t("merchant.valid_reward")}
      </p>
      <div>
        <p className="text-lg font-semibold">{validation.reward_name}</p>
        {validation.reward_description ? (
          <p className="text-sm text-muted-foreground">{validation.reward_description}</p>
        ) : null}
        <p className="mt-1 text-sm text-muted-foreground">{validation.customer_name}</p>
      </div>
      <Button
        className="w-full"
        size="lg"
        disabled={confirm.isPending}
        onClick={() => confirm.mutate()}
      >
        {t("merchant.confirm_redemption")}
      </Button>
      <Button
        variant="ghost"
        className="w-full"
        onClick={() => {
          setValidation(null);
          setToken(null);
        }}
      >
        {t("common.cancel")}
      </Button>
    </div>
  );
}

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { StampRow } from "@/components/loyalty/StampRow";
import { MerchantShell, PageHeader } from "@/components/merchant/MerchantShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { useMerchantStore } from "@/hooks/useStore";
import { useI18n } from "@/i18n";
import { upsertProgram } from "@/lib/api";
import { currencySymbol, type LoyaltyMode } from "@/lib/domain";
import { errorKey } from "@/lib/errors";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/program")({
  component: ProgramPage,
});

function ProgramPage() {
  const { t, formatNumber } = useI18n();
  const queryClient = useQueryClient();
  const { store, program, loading } = useMerchantStore();

  const [mode, setMode] = useState<LoyaltyMode>("points");
  const [pointsPerCurrency, setPointsPerCurrency] = useState("1");
  const [stampsRequired, setStampsRequired] = useState("10");
  const [welcomePoints, setWelcomePoints] = useState("0");
  const [welcomeStamps, setWelcomeStamps] = useState("0");

  useEffect(() => {
    if (!program) return;
    setMode(program.mode);
    setPointsPerCurrency(String(program.points_per_currency));
    setStampsRequired(String(program.stamps_required));
    setWelcomePoints(String(program.welcome_points));
    setWelcomeStamps(String(program.welcome_stamps));
  }, [program]);

  const save = useMutation({
    mutationFn: () =>
      upsertProgram({
        ...(program?.id ? { id: program.id } : {}),
        store_id: store!.id,
        mode,
        points_per_currency: Number(pointsPerCurrency),
        stamps_required: Number(stampsRequired),
        welcome_points: Number(welcomePoints),
        welcome_stamps: Number(welcomeStamps),
      }),
    onSuccess: () => {
      toast.success(t("merchant.saved"));
      void queryClient.invalidateQueries({ queryKey: ["program", store?.id] });
    },
    onError: (error) => toast.error(t(errorKey(error))),
  });

  if (loading) {
    return (
      <MerchantShell>
        <Skeleton className="h-64 w-full rounded-2xl" />
      </MerchantShell>
    );
  }

  return (
    <MerchantShell>
      <PageHeader title={t("merchant.program")} description={store?.name ?? ""} />

      <div className="grid max-w-4xl gap-6 lg:grid-cols-2">
        <section className="surface-card space-y-4 p-5">
          <div className="space-y-2">
            <Label>{t("merchant.mode")}</Label>
            <div className="grid grid-cols-2 gap-3">
              {(["points", "stamps"] as const).map((option) => (
                <button
                  key={option}
                  type="button"
                  onClick={() => setMode(option)}
                  className={cn(
                    "rounded-2xl border p-4 text-start transition-colors",
                    mode === option
                      ? "border-primary bg-primary/5"
                      : "border-border hover:bg-secondary",
                  )}
                >
                  <p className="font-semibold">
                    {option === "points" ? t("loyalty.mode_points") : t("loyalty.mode_stamps")}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {option === "points"
                      ? t("landing.points_mode_desc")
                      : t("landing.stamps_mode_desc")}
                  </p>
                </button>
              ))}
            </div>
          </div>

          {mode === "points" ? (
            <>
              <div className="space-y-1.5">
                <Label htmlFor="ppc">{t("merchant.points_per_currency")}</Label>
                <Input
                  id="ppc"
                  type="number"
                  min="0"
                  step="0.1"
                  dir="ltr"
                  value={pointsPerCurrency}
                  onChange={(e) => setPointsPerCurrency(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="wp">
                  {t("merchant.welcome_bonus")} ({t("loyalty.points")})
                </Label>
                <Input
                  id="wp"
                  type="number"
                  min="0"
                  dir="ltr"
                  value={welcomePoints}
                  onChange={(e) => setWelcomePoints(e.target.value)}
                />
              </div>
            </>
          ) : (
            <>
              <div className="space-y-1.5">
                <Label htmlFor="sr">{t("merchant.stamps_required")}</Label>
                <Input
                  id="sr"
                  type="number"
                  min="1"
                  max="30"
                  dir="ltr"
                  value={stampsRequired}
                  onChange={(e) => setStampsRequired(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="ws">
                  {t("merchant.welcome_bonus")} ({t("loyalty.stamps")})
                </Label>
                <Input
                  id="ws"
                  type="number"
                  min="0"
                  dir="ltr"
                  value={welcomeStamps}
                  onChange={(e) => setWelcomeStamps(e.target.value)}
                />
              </div>
            </>
          )}

          <Button className="w-full" disabled={save.isPending} onClick={() => save.mutate()}>
            {t("common.save")}
          </Button>
        </section>

        <section className="surface-card p-5">
          <h2 className="font-semibold">{t("landing.preview_wallet")}</h2>
          <div className="mt-4 rounded-2xl bg-muted p-5">
            <p className="text-sm font-medium">{store?.name}</p>
            {mode === "points" ? (
              <>
                <p className="mt-2 font-display text-3xl font-bold">
                  {t("loyalty.points_value", { count: formatNumber(120) })}
                </p>
                <p className="mt-2 text-sm text-muted-foreground">
                  {t("loyalty.rule_points", {
                    currency: currencySymbol(store?.currency ?? "USD"),
                    points: pointsPerCurrency || "0",
                  })}
                </p>
              </>
            ) : (
              <>
                <div className="mt-3">
                  <StampRow current={3} total={Math.max(1, Number(stampsRequired) || 10)} />
                </div>
                <p className="mt-3 text-sm text-muted-foreground">
                  {t("loyalty.rule_stamps", { count: stampsRequired || "0" })}
                </p>
              </>
            )}
          </div>
        </section>
      </div>
    </MerchantShell>
  );
}

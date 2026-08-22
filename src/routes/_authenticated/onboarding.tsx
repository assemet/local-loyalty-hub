import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ArrowRight, Check, Copy } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { Logo } from "@/components/Logo";
import { LanguageSelect } from "@/components/LanguageSelect";
import { QrCode as QrCodeView } from "@/components/QrCode";
import { StampRow } from "@/components/loyalty/StampRow";
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
import { useI18n } from "@/i18n";
import { createReward, createStore, upsertProgram } from "@/lib/api";
import { CURRENCIES, STORE_CATEGORIES, currencySymbol, type LoyaltyMode } from "@/lib/domain";
import { errorKey } from "@/lib/errors";
import { storeJoinUrl } from "@/lib/loyalty";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/onboarding")({
  component: OnboardingPage,
});

const STEPS = ["step_store", "step_mode", "step_rules", "step_reward", "step_qr"] as const;

function OnboardingPage() {
  const { t } = useI18n();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = useAuth();

  const [step, setStep] = useState(0);
  const [name, setName] = useState("");
  const [category, setCategory] = useState<string>("coffee");
  const [currency, setCurrency] = useState("USD");
  const [mode, setMode] = useState<LoyaltyMode>("points");
  const [pointsPerCurrency, setPointsPerCurrency] = useState("1");
  const [stampsRequired, setStampsRequired] = useState("10");
  const [welcome, setWelcome] = useState("0");
  const [rewardName, setRewardName] = useState("");
  const [rewardCostValue, setRewardCostValue] = useState("");
  const [joinToken, setJoinToken] = useState<string | null>(null);

  const finish = useMutation({
    mutationFn: async () => {
      const store = await createStore({
        owner_id: user!.id,
        name,
        category,
        currency,
      });
      const program = await upsertProgram({
        store_id: store.id,
        mode,
        points_per_currency: Number(pointsPerCurrency) || 1,
        stamps_required: Number(stampsRequired) || 10,
        welcome_points: mode === "points" ? Number(welcome) || 0 : 0,
        welcome_stamps: mode === "stamps" ? Number(welcome) || 0 : 0,
      });
      if (rewardName && rewardCostValue) {
        await createReward({
          store_id: store.id,
          program_id: program.id,
          name: rewardName,
          points_cost: mode === "points" ? Number(rewardCostValue) : null,
          stamps_cost: mode === "stamps" ? Number(rewardCostValue) : null,
        });
      }
      return store;
    },
    onSuccess: (store) => {
      setJoinToken(store.join_token);
      setStep(4);
      void queryClient.invalidateQueries({ queryKey: ["my-stores", user?.id] });
    },
    onError: (error) => toast.error(t(errorKey(error))),
  });

  return (
    <div className="min-h-screen bg-muted/40">
      <header className="flex items-center justify-between border-b border-border bg-card px-4 py-4">
        <Logo />
        <LanguageSelect className="w-[140px]" />
      </header>

      <main className="mx-auto w-full max-w-xl px-4 py-8">
        <h1 className="font-display text-3xl font-bold">{t("merchant.onboarding_title")}</h1>

        <ol className="mt-6 flex items-center gap-2">
          {STEPS.map((key, index) => (
            <li key={key} className="flex flex-1 items-center gap-2">
              <span
                className={cn(
                  "flex size-7 shrink-0 items-center justify-center rounded-full text-xs font-bold",
                  index <= step
                    ? "bg-primary text-primary-foreground"
                    : "bg-secondary text-muted-foreground",
                )}
              >
                {index < step ? <Check className="size-3.5" aria-hidden /> : index + 1}
              </span>
              {index < STEPS.length - 1 ? (
                <span
                  className={cn("h-0.5 flex-1", index < step ? "bg-primary" : "bg-border")}
                  aria-hidden
                />
              ) : null}
            </li>
          ))}
        </ol>
        <p className="mt-3 text-sm font-medium text-muted-foreground">
          {t(`merchant.${STEPS[step]!}`)}
        </p>

        <div className="surface-card mt-4 space-y-4 p-6">
          {step === 0 ? (
            <>
              <div className="space-y-1.5">
                <Label htmlFor="o-name">{t("merchant.store_name")}</Label>
                <Input id="o-name" value={name} onChange={(e) => setName(e.target.value)} />
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
              <Button className="w-full" disabled={!name} onClick={() => setStep(1)}>
                {t("common.next")}
                <ArrowRight className="size-4 flip-rtl" aria-hidden />
              </Button>
            </>
          ) : null}

          {step === 1 ? (
            <>
              <div className="grid gap-3 sm:grid-cols-2">
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
              <div className="flex gap-2">
                <Button variant="ghost" className="flex-1" onClick={() => setStep(0)}>
                  {t("common.back")}
                </Button>
                <Button className="flex-1" onClick={() => setStep(2)}>
                  {t("common.next")}
                </Button>
              </div>
            </>
          ) : null}

          {step === 2 ? (
            <>
              {mode === "points" ? (
                <div className="space-y-1.5">
                  <Label htmlFor="o-ppc">{t("merchant.points_per_currency")}</Label>
                  <Input
                    id="o-ppc"
                    type="number"
                    min="0"
                    step="0.1"
                    dir="ltr"
                    value={pointsPerCurrency}
                    onChange={(e) => setPointsPerCurrency(e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground">
                    {t("loyalty.rule_points", {
                      currency: currencySymbol(currency),
                      points: pointsPerCurrency || "0",
                    })}
                  </p>
                </div>
              ) : (
                <div className="space-y-1.5">
                  <Label htmlFor="o-sr">{t("merchant.stamps_required")}</Label>
                  <Input
                    id="o-sr"
                    type="number"
                    min="1"
                    max="30"
                    dir="ltr"
                    value={stampsRequired}
                    onChange={(e) => setStampsRequired(e.target.value)}
                  />
                  <div className="pt-2">
                    <StampRow current={0} total={Math.max(1, Number(stampsRequired) || 10)} />
                  </div>
                </div>
              )}
              <div className="space-y-1.5">
                <Label htmlFor="o-welcome">{t("merchant.welcome_bonus")}</Label>
                <Input
                  id="o-welcome"
                  type="number"
                  min="0"
                  dir="ltr"
                  value={welcome}
                  onChange={(e) => setWelcome(e.target.value)}
                />
              </div>
              <div className="flex gap-2">
                <Button variant="ghost" className="flex-1" onClick={() => setStep(1)}>
                  {t("common.back")}
                </Button>
                <Button className="flex-1" onClick={() => setStep(3)}>
                  {t("common.next")}
                </Button>
              </div>
            </>
          ) : null}

          {step === 3 ? (
            <>
              <div className="space-y-1.5">
                <Label htmlFor="o-reward">{t("merchant.reward_name")}</Label>
                <Input
                  id="o-reward"
                  value={rewardName}
                  onChange={(e) => setRewardName(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="o-cost">
                  {t("merchant.reward_cost")} (
                  {mode === "stamps" ? t("loyalty.stamps") : t("loyalty.points")})
                </Label>
                <Input
                  id="o-cost"
                  type="number"
                  min="1"
                  dir="ltr"
                  value={rewardCostValue}
                  onChange={(e) => setRewardCostValue(e.target.value)}
                />
              </div>
              <div className="flex gap-2">
                <Button variant="ghost" className="flex-1" onClick={() => setStep(2)}>
                  {t("common.back")}
                </Button>
                <Button
                  className="flex-1"
                  disabled={finish.isPending}
                  onClick={() => finish.mutate()}
                >
                  {t("common.create")}
                </Button>
              </div>
            </>
          ) : null}

          {step === 4 && joinToken ? (
            <div className="flex flex-col items-center gap-4 text-center">
              <p className="font-semibold">{t("merchant.store_qr")}</p>
              <QrCodeView
                value={storeJoinUrl(joinToken)}
                size={220}
                label={t("merchant.store_qr")}
              />
              <p className="text-sm text-muted-foreground">{t("merchant.store_qr_hint")}</p>
              <div className="flex w-full gap-2">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={async () => {
                    await navigator.clipboard.writeText(storeJoinUrl(joinToken));
                    toast.success(t("common.copied"));
                  }}
                >
                  <Copy className="size-4" aria-hidden />
                  {t("common.copy")}
                </Button>
                <Button
                  className="flex-1"
                  onClick={() => void navigate({ to: "/dashboard", replace: true })}
                >
                  {t("common.done")}
                </Button>
              </div>
              <Button asChild variant="link">
                <Link to="/dashboard">{t("merchant.dashboard")}</Link>
              </Button>
            </div>
          ) : null}
        </div>
      </main>
    </div>
  );
}

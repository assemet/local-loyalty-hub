import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { ChevronRight, Gift, QrCode, Sparkles } from "lucide-react";

import { LanguageSelect } from "@/components/LanguageSelect";
import { Logo, StoreAvatar } from "@/components/Logo";
import { StampRow } from "@/components/loyalty/StampRow";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/hooks/useAuth";
import { useI18n } from "@/i18n";
import { fetchWallet } from "@/lib/api";
import type { WalletEntry } from "@/lib/domain";
import { nextReward, rewardCost, unlockedRewards } from "@/lib/loyalty";

export const Route = createFileRoute("/wallet/")({
  component: WalletHome,
});

function WalletHome() {
  const { t, formatDate } = useI18n();
  const { user, profile } = useAuth();

  const { data, isLoading } = useQuery({
    queryKey: ["wallet", user?.id],
    queryFn: () => fetchWallet(user!.id),
    enabled: Boolean(user?.id),
  });

  const firstName = (profile?.full_name ?? "").split(" ")[0] || "👋";

  return (
    <div className="space-y-6 p-4">
      <header className="flex items-start justify-between gap-3">
        <div>
          <Logo withName={false} />
          <h1 className="mt-3 text-2xl font-bold">{t("customer.hello", { name: firstName })}</h1>
        </div>
        <LanguageSelect className="w-[124px]" />
      </header>

      <div className="grid grid-cols-2 gap-3">
        <Button asChild size="lg" className="h-auto flex-col gap-1 py-4">
          <Link to="/wallet/qr">
            <QrCode className="size-5" aria-hidden />
            {t("customer.my_qr")}
          </Link>
        </Button>
        <Button asChild size="lg" variant="secondary" className="h-auto flex-col gap-1 py-4">
          <Link to="/wallet/rewards">
            <Gift className="size-5" aria-hidden />
            {t("customer.rewards")}
          </Link>
        </Button>
      </div>

      <section className="space-y-3">
        <h2 className="text-sm font-semibold tracking-wide text-muted-foreground uppercase">
          {t("customer.my_loyalty")}
        </h2>

        {isLoading ? (
          <>
            <Skeleton className="h-32 w-full rounded-2xl" />
            <Skeleton className="h-32 w-full rounded-2xl" />
          </>
        ) : null}

        {!isLoading && (data ?? []).length === 0 ? (
          <div className="surface-card p-6 text-center">
            <QrCode className="mx-auto size-8 text-muted-foreground" aria-hidden />
            <p className="mt-3 font-semibold">{t("customer.no_programs")}</p>
            <p className="mt-1 text-sm text-muted-foreground">{t("customer.no_programs_hint")}</p>
          </div>
        ) : null}

        {(data ?? []).map((entry) => (
          <MembershipCard key={entry.membership.id} entry={entry} formatDate={formatDate} />
        ))}
      </section>
    </div>
  );
}

function MembershipCard({
  entry,
  formatDate,
}: {
  entry: WalletEntry;
  formatDate: (value: string) => string;
}) {
  const { t, formatNumber } = useI18n();
  const { membership, store, program, rewards } = entry;
  const unlocked = unlockedRewards(rewards, membership, program);
  const goal = nextReward(rewards, membership, program);
  const goalCost = goal ? rewardCost(goal, program.mode) : 0;

  return (
    <Link
      to="/wallet/rewards"
      className="surface-card block p-4 transition-shadow hover:shadow-lift"
    >
      <div className="flex items-start gap-3">
        <StoreAvatar name={store.name} logoUrl={store.logo_url} />
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-2">
            <p className="truncate font-semibold">{store.name}</p>
            <ChevronRight className="size-4 shrink-0 text-muted-foreground flip-rtl" aria-hidden />
          </div>
          <p className="text-xs text-muted-foreground">
            {program.mode === "points" ? t("loyalty.mode_points") : t("loyalty.mode_stamps")}
          </p>

          {program.mode === "points" ? (
            <p className="mt-2 font-display text-2xl font-bold">
              {t("loyalty.points_value", { count: formatNumber(membership.points_balance) })}
            </p>
          ) : (
            <div className="mt-2">
              <StampRow
                current={membership.stamps_balance % program.stamps_required}
                total={program.stamps_required}
              />
              <p className="mt-1.5 font-display text-2xl font-bold">
                {t("loyalty.stamps_value", {
                  current: membership.stamps_balance,
                  total: program.stamps_required,
                })}
              </p>
            </div>
          )}

          {goal ? (
            <>
              {program.mode === "points" ? (
                <Progress
                  value={Math.min(100, (membership.points_balance / Math.max(goalCost, 1)) * 100)}
                  className="mt-3"
                />
              ) : null}
              <p className="mt-2 text-sm text-muted-foreground">
                {program.mode === "points"
                  ? t("loyalty.to_next_points", {
                      count: goalCost - membership.points_balance,
                      reward: goal.name,
                    })
                  : goalCost - membership.stamps_balance === 1
                    ? t("loyalty.one_more_visit", { reward: goal.name })
                    : t("loyalty.to_next_stamps", {
                        count: goalCost - membership.stamps_balance,
                        reward: goal.name,
                      })}
              </p>
            </>
          ) : null}

          {unlocked.length > 0 ? (
            <Badge className="mt-3 gap-1">
              <Sparkles className="size-3" aria-hidden />
              {t("loyalty.reward_ready")}
            </Badge>
          ) : null}

          <p className="mt-3 text-xs text-muted-foreground">
            {t("customer.last_activity")}: {formatDate(membership.last_activity_at)}
          </p>
        </div>
      </div>
    </Link>
  );
}

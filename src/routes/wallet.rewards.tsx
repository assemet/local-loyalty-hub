import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { Lock, Sparkles } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { QrCode as QrCodeView } from "@/components/QrCode";
import { StoreAvatar } from "@/components/Logo";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/hooks/useAuth";
import { useI18n } from "@/i18n";
import { claimReward, fetchCustomerRedemptions, fetchWallet } from "@/lib/api";
import type { Reward, RewardClaim, WalletEntry } from "@/lib/domain";
import { errorKey } from "@/lib/errors";
import { balanceFor, isRewardUsable, isUnlocked, rewardCost } from "@/lib/loyalty";

export const Route = createFileRoute("/wallet/rewards")({
  component: RewardsPage,
});

function RewardsPage() {
  const { t, formatDate } = useI18n();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [claim, setClaim] = useState<RewardClaim | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["wallet", user?.id],
    queryFn: () => fetchWallet(user!.id),
    enabled: Boolean(user?.id),
  });

  const { data: redemptions } = useQuery({
    queryKey: ["redemptions", user?.id],
    queryFn: () => fetchCustomerRedemptions(user!.id),
    enabled: Boolean(user?.id),
  });

  const pending = (redemptions ?? []).filter((r) => r.status === "pending");

  const redeem = useMutation({
    mutationFn: ({ membershipId, rewardId }: { membershipId: string; rewardId: string }) =>
      claimReward(membershipId, rewardId),
    onSuccess: (result) => {
      setClaim(result);
      void queryClient.invalidateQueries({ queryKey: ["wallet", user?.id] });
      void queryClient.invalidateQueries({ queryKey: ["redemptions", user?.id] });
    },
    onError: (error) => toast.error(t(errorKey(error))),
  });

  return (
    <div className="space-y-6 p-4">
      <h1 className="text-2xl font-bold">{t("customer.rewards")}</h1>

      {pending.length > 0 ? (
        <section className="space-y-2">
          <h2 className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
            {t("rewards.my_claims")}
          </h2>
          <ul className="surface-card divide-y divide-border">
            {pending.map((redemption) => (
              <li key={redemption.id} className="flex items-center justify-between gap-3 p-4">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">{t("rewards.pending")}</p>
                  <p className="text-xs text-muted-foreground">
                    {t("rewards.expires", { date: formatDate(redemption.expires_at) })}
                  </p>
                </div>
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() =>
                    setClaim({
                      redemption_id: redemption.id,
                      token: redemption.token,
                      expires_at: redemption.expires_at,
                      reward_name: t("rewards.redeem"),
                      points_balance: 0,
                      stamps_balance: 0,
                    })
                  }
                >
                  {t("rewards.claimed_title")}
                </Button>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {isLoading ? <Skeleton className="h-48 w-full rounded-2xl" /> : null}

      {!isLoading && (data ?? []).length === 0 ? (
        <div className="surface-card p-6 text-center text-sm text-muted-foreground">
          {t("rewards.none")}
        </div>
      ) : null}

      {(data ?? []).map((entry) => (
        <StoreRewards
          key={entry.membership.id}
          entry={entry}
          busy={redeem.isPending}
          onRedeem={(reward) =>
            redeem.mutate({ membershipId: entry.membership.id, rewardId: reward.id })
          }
        />
      ))}

      <Dialog open={Boolean(claim)} onOpenChange={(open) => !open && setClaim(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>{t("rewards.claimed_title")}</DialogTitle>
          </DialogHeader>
          {claim ? (
            <div className="flex flex-col items-center gap-3 pb-2">
              <QrCodeView value={claim.token} size={220} label={claim.reward_name} />
              <p className="font-semibold">{claim.reward_name}</p>
              <p className="text-center text-sm text-muted-foreground">
                {t("rewards.claimed_hint")}
              </p>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function StoreRewards({
  entry,
  busy,
  onRedeem,
}: {
  entry: WalletEntry;
  busy: boolean;
  onRedeem: (reward: Reward) => void;
}) {
  const { t, formatDate, formatNumber } = useI18n();
  const { store, program, membership, rewards } = entry;
  const balance = balanceFor(membership, program.mode);

  return (
    <section className="space-y-3">
      <div className="flex items-center gap-3">
        <StoreAvatar name={store.name} logoUrl={store.logo_url} className="size-10" />
        <div>
          <h2 className="font-semibold">{store.name}</h2>
          <p className="text-xs text-muted-foreground">
            {program.mode === "points"
              ? t("loyalty.points_value", { count: formatNumber(membership.points_balance) })
              : t("loyalty.stamps_value", {
                  current: membership.stamps_balance,
                  total: program.stamps_required,
                })}
          </p>
        </div>
      </div>

      {rewards.filter(isRewardUsable).length === 0 ? (
        <p className="surface-card p-4 text-sm text-muted-foreground">{t("rewards.none")}</p>
      ) : null}

      <ul className="space-y-3">
        {rewards.filter(isRewardUsable).map((reward) => {
          const cost = rewardCost(reward, program.mode);
          const unlocked = isUnlocked(reward, membership, program);
          const missing = Math.max(0, cost - balance);
          return (
            <li key={reward.id} className="surface-card overflow-hidden">
              {reward.image_url ? (
                <img
                  src={reward.image_url}
                  alt={reward.name}
                  loading="lazy"
                  className="h-32 w-full object-cover"
                />
              ) : null}
              <div className="flex items-start gap-3 p-4">
                <div className="min-w-0 flex-1">
                  <p className="font-semibold">{reward.name}</p>
                  {reward.description ? (
                    <p className="mt-0.5 text-sm text-muted-foreground">{reward.description}</p>
                  ) : null}
                  <p className="mt-2 text-sm font-medium">
                    {program.mode === "points"
                      ? t("rewards.cost_points", { count: formatNumber(cost) })
                      : t("rewards.cost_stamps", { count: cost })}
                  </p>
                  {reward.expires_at ? (
                    <p className="mt-1 text-xs text-muted-foreground">
                      {t("rewards.expires", { date: formatDate(reward.expires_at) })}
                    </p>
                  ) : null}
                  {!unlocked ? (
                    <p className="mt-1 text-xs text-muted-foreground">
                      {program.mode === "points"
                        ? t("rewards.need_points", { count: formatNumber(missing) })
                        : t("rewards.need_stamps", { count: missing })}
                    </p>
                  ) : null}
                </div>
                <div className="flex flex-col items-end gap-2">
                  {unlocked ? (
                    <Badge className="gap-1">
                      <Sparkles className="size-3" aria-hidden />
                      {t("rewards.unlocked")}
                    </Badge>
                  ) : (
                    <Badge variant="secondary" className="gap-1">
                      <Lock className="size-3" aria-hidden />
                      {t("rewards.locked")}
                    </Badge>
                  )}
                  <Button size="sm" disabled={!unlocked || busy} onClick={() => onRedeem(reward)}>
                    {t("rewards.redeem")}
                  </Button>
                </div>
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

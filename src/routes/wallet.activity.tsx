import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { Gift, Sparkles, Star, Ticket } from "lucide-react";

import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/hooks/useAuth";
import { useI18n } from "@/i18n";
import { fetchCustomerTransactions, fetchWallet } from "@/lib/api";
import type { Transaction } from "@/lib/domain";

export const Route = createFileRoute("/wallet/activity")({
  component: ActivityPage,
});

const ICONS = {
  welcome_bonus: Sparkles,
  points_earned: Star,
  stamp_earned: Ticket,
  reward_claimed: Gift,
  reward_redeemed: Gift,
} as const;

function ActivityPage() {
  const { t, formatDate } = useI18n();
  const { user } = useAuth();

  const { data: transactions, isLoading } = useQuery({
    queryKey: ["transactions", user?.id],
    queryFn: () => fetchCustomerTransactions(user!.id),
    enabled: Boolean(user?.id),
  });

  const { data: wallet } = useQuery({
    queryKey: ["wallet", user?.id],
    queryFn: () => fetchWallet(user!.id),
    enabled: Boolean(user?.id),
  });

  const storeName = (storeId: string) =>
    wallet?.find((entry) => entry.store.id === storeId)?.store.name ?? "";

  const label = (tx: Transaction) => {
    if (tx.type === "welcome_bonus") return t("tx.welcome_bonus");
    if (tx.type === "points_earned") return t("tx.points_earned");
    if (tx.type === "stamp_earned") return t("tx.stamp_earned");
    if (tx.type === "reward_claimed") return t("tx.reward_claimed");
    return t("tx.reward_redeemed");
  };

  const amount = (tx: Transaction) => {
    if (tx.points_delta !== 0) return `${tx.points_delta > 0 ? "+" : ""}${tx.points_delta}`;
    if (tx.stamps_delta !== 0) return `${tx.stamps_delta > 0 ? "+" : ""}${tx.stamps_delta}`;
    return "";
  };

  const dayLabel = (iso: string) => {
    const date = new Date(iso);
    const today = new Date();
    const yesterday = new Date(today.getTime() - 86_400_000);
    if (date.toDateString() === today.toDateString()) return t("common.today");
    if (date.toDateString() === yesterday.toDateString()) return t("common.yesterday");
    return formatDate(iso);
  };

  const grouped = (transactions ?? []).reduce<Record<string, Transaction[]>>((acc, tx) => {
    const key = dayLabel(tx.created_at);
    acc[key] = [...(acc[key] ?? []), tx];
    return acc;
  }, {});

  return (
    <div className="space-y-6 p-4">
      <h1 className="text-2xl font-bold">{t("customer.activity")}</h1>

      {isLoading ? <Skeleton className="h-40 w-full rounded-2xl" /> : null}

      {!isLoading && (transactions ?? []).length === 0 ? (
        <div className="surface-card p-6 text-center text-sm text-muted-foreground">
          {t("customer.no_activity")}
        </div>
      ) : null}

      {Object.entries(grouped).map(([day, items]) => (
        <section key={day} className="space-y-2">
          <h2 className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
            {day}
          </h2>
          <ul className="surface-card divide-y divide-border">
            {items.map((tx) => {
              const Icon = ICONS[tx.type] ?? Star;
              return (
                <li key={tx.id} className="flex items-center gap-3 p-4">
                  <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-secondary text-secondary-foreground">
                    <Icon className="size-4" aria-hidden />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{label(tx)}</p>
                    <p className="truncate text-xs text-muted-foreground">
                      {storeName(tx.store_id)}
                    </p>
                  </div>
                  <span className="font-display text-lg font-bold" dir="ltr">
                    {amount(tx)}
                  </span>
                </li>
              );
            })}
          </ul>
        </section>
      ))}
    </div>
  );
}

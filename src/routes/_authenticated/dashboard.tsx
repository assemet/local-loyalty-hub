import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link, Navigate } from "@tanstack/react-router";
import { Copy, Gift, Star, Ticket, Users } from "lucide-react";
import { toast } from "sonner";

import { MerchantShell, PageHeader } from "@/components/merchant/MerchantShell";
import { QrCode as QrCodeView } from "@/components/QrCode";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useI18n } from "@/i18n";
import { useMerchantStore } from "@/hooks/useStore";
import { fetchStoreStats, fetchStoreTransactions } from "@/lib/api";
import { storeJoinUrl } from "@/lib/loyalty";

export const Route = createFileRoute("/_authenticated/dashboard")({
  component: DashboardPage,
});

function DashboardPage() {
  const { t, formatNumber, formatDate } = useI18n();
  const { store, program, loading, stores } = useMerchantStore();

  const stats = useQuery({
    queryKey: ["store-stats", store?.id],
    queryFn: () => fetchStoreStats(store!.id),
    enabled: Boolean(store?.id),
  });

  const transactions = useQuery({
    queryKey: ["store-transactions", store?.id],
    queryFn: () => fetchStoreTransactions(store!.id, 12),
    enabled: Boolean(store?.id),
  });

  if (!loading && stores.length === 0) return <Navigate to="/onboarding" replace />;

  const joinUrl = store ? storeJoinUrl(store.join_token) : "";

  const cards = [
    { label: t("merchant.total_members"), value: stats.data?.total_members ?? 0, icon: Users },
    { label: t("merchant.active_members"), value: stats.data?.active_members ?? 0, icon: Users },
    program?.mode === "stamps"
      ? { label: t("merchant.stamps_issued"), value: stats.data?.stamps_issued ?? 0, icon: Ticket }
      : { label: t("merchant.points_issued"), value: stats.data?.points_issued ?? 0, icon: Star },
    { label: t("merchant.rewards_redeemed"), value: stats.data?.rewards_redeemed ?? 0, icon: Gift },
  ];

  return (
    <MerchantShell>
      <PageHeader
        title={store?.name ?? t("merchant.dashboard")}
        description={t("merchant.dashboard")}
        action={
          <Button asChild variant="outline">
            <Link to="/scan">{t("merchant.scan_customer")}</Link>
          </Button>
        }
      />

      {loading ? (
        <Skeleton className="h-32 w-full rounded-2xl" />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {cards.map((card) => (
            <div key={card.label} className="surface-card p-5">
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">{card.label}</p>
                <card.icon className="size-4 text-muted-foreground" aria-hidden />
              </div>
              <p className="mt-2 font-display text-3xl font-bold">{formatNumber(card.value)}</p>
            </div>
          ))}
        </div>
      )}

      <div className="mt-6 grid gap-6 lg:grid-cols-[320px_1fr]">
        <section className="surface-card p-5">
          <h2 className="font-semibold">{t("merchant.store_qr")}</h2>
          <p className="mt-1 text-sm text-muted-foreground">{t("merchant.store_qr_hint")}</p>
          <div className="mt-4 flex flex-col items-center gap-3">
            {store ? (
              <QrCodeView value={joinUrl} size={200} label={t("merchant.store_qr")} />
            ) : (
              <Skeleton className="size-[200px] rounded-2xl" />
            )}
            <div className="flex w-full gap-2">
              <Button
                variant="outline"
                className="flex-1"
                onClick={async () => {
                  await navigator.clipboard.writeText(joinUrl);
                  toast.success(t("common.copied"));
                }}
              >
                <Copy className="size-4" aria-hidden />
                {t("common.copy")}
              </Button>
              <Button variant="secondary" className="flex-1" onClick={() => window.print()}>
                {t("common.print")}
              </Button>
            </div>
          </div>
        </section>

        <section className="surface-card p-5">
          <h2 className="font-semibold">{t("merchant.recent_activity")}</h2>
          {transactions.isLoading ? <Skeleton className="mt-4 h-40 w-full rounded-xl" /> : null}
          {!transactions.isLoading && (transactions.data ?? []).length === 0 ? (
            <p className="mt-4 text-sm text-muted-foreground">{t("merchant.no_transactions")}</p>
          ) : null}
          <ul className="mt-3 divide-y divide-border">
            {(transactions.data ?? []).map((tx) => (
              <li key={tx.id} className="flex items-center justify-between gap-3 py-3 text-sm">
                <span className="font-medium">{t(`tx.${tx.type}`)}</span>
                <span className="text-muted-foreground">{formatDate(tx.created_at)}</span>
                <span className="font-display text-base font-bold" dir="ltr">
                  {tx.points_delta !== 0
                    ? `${tx.points_delta > 0 ? "+" : ""}${tx.points_delta}`
                    : tx.stamps_delta !== 0
                      ? `${tx.stamps_delta > 0 ? "+" : ""}${tx.stamps_delta}`
                      : ""}
                </span>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </MerchantShell>
  );
}

import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";

import { MerchantShell, PageHeader } from "@/components/merchant/MerchantShell";
import { Skeleton } from "@/components/ui/skeleton";
import { useMerchantStore } from "@/hooks/useStore";
import { useI18n } from "@/i18n";
import { fetchStoreMembers, fetchStoreTransactions } from "@/lib/api";

export const Route = createFileRoute("/_authenticated/transactions")({
  component: TransactionsPage,
});

function TransactionsPage() {
  const { t, formatDate } = useI18n();
  const { store } = useMerchantStore();

  const transactions = useQuery({
    queryKey: ["store-transactions", store?.id, "all"],
    queryFn: () => fetchStoreTransactions(store!.id, 200),
    enabled: Boolean(store?.id),
  });

  const members = useQuery({
    queryKey: ["store-members", store?.id],
    queryFn: () => fetchStoreMembers(store!.id),
    enabled: Boolean(store?.id),
  });

  const customerName = (customerId: string) =>
    members.data?.find((m) => m.customer_id === customerId)?.profile?.full_name ?? "—";

  return (
    <MerchantShell>
      <PageHeader title={t("merchant.transactions")} description={store?.name ?? ""} />

      {transactions.isLoading ? <Skeleton className="h-64 w-full rounded-2xl" /> : null}

      {!transactions.isLoading && (transactions.data ?? []).length === 0 ? (
        <div className="surface-card p-8 text-center text-sm text-muted-foreground">
          {t("merchant.no_transactions")}
        </div>
      ) : null}

      {(transactions.data ?? []).length > 0 ? (
        <div className="surface-card overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b border-border text-start text-xs text-muted-foreground uppercase">
              <tr>
                <th className="p-4 text-start font-semibold">{t("common.name")}</th>
                <th className="p-4 text-start font-semibold">{t("merchant.transactions")}</th>
                <th className="p-4 text-start font-semibold">{t("merchant.balance")}</th>
                <th className="p-4 text-start font-semibold">{t("customer.activity")}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {(transactions.data ?? []).map((tx) => (
                <tr key={tx.id}>
                  <td className="p-4">{customerName(tx.customer_id)}</td>
                  <td className="p-4">{t(`tx.${tx.type}`)}</td>
                  <td className="p-4 font-display font-bold" dir="ltr">
                    {tx.points_delta !== 0
                      ? `${tx.points_delta > 0 ? "+" : ""}${tx.points_delta}`
                      : tx.stamps_delta !== 0
                        ? `${tx.stamps_delta > 0 ? "+" : ""}${tx.stamps_delta}`
                        : "—"}
                  </td>
                  <td className="p-4 text-muted-foreground">{formatDate(tx.created_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}
    </MerchantShell>
  );
}

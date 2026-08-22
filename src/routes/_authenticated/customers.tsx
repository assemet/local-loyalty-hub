import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";

import { StoreAvatar } from "@/components/Logo";
import { MerchantShell, PageHeader } from "@/components/merchant/MerchantShell";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { useMerchantStore } from "@/hooks/useStore";
import { useI18n } from "@/i18n";
import { fetchStoreMembers } from "@/lib/api";

export const Route = createFileRoute("/_authenticated/customers")({
  component: CustomersPage,
});

function CustomersPage() {
  const { t, formatNumber, formatDate } = useI18n();
  const { store, program } = useMerchantStore();
  const [query, setQuery] = useState("");

  const members = useQuery({
    queryKey: ["store-members", store?.id],
    queryFn: () => fetchStoreMembers(store!.id),
    enabled: Boolean(store?.id),
  });

  const filtered = (members.data ?? []).filter((member) =>
    (member.profile?.full_name ?? "").toLowerCase().includes(query.trim().toLowerCase()),
  );

  return (
    <MerchantShell>
      <PageHeader title={t("merchant.customers")} description={store?.name ?? ""} />

      <Input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder={t("common.name")}
        className="mb-4 max-w-sm"
      />

      {members.isLoading ? <Skeleton className="h-48 w-full rounded-2xl" /> : null}

      {!members.isLoading && (members.data ?? []).length === 0 ? (
        <div className="surface-card p-8 text-center">
          <p className="font-semibold">{t("merchant.no_customers")}</p>
          <p className="mt-1 text-sm text-muted-foreground">{t("merchant.no_customers_hint")}</p>
        </div>
      ) : null}

      {filtered.length > 0 ? (
        <ul className="surface-card divide-y divide-border">
          {filtered.map((member) => (
            <li key={member.id} className="flex items-center gap-3 p-4">
              <StoreAvatar
                name={member.profile?.full_name ?? "?"}
                logoUrl={member.profile?.avatar_url ?? null}
                className="size-10"
              />
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium">{member.profile?.full_name ?? "—"}</p>
                <p className="text-xs text-muted-foreground">
                  {t("customer.joined")}: {formatDate(member.joined_at)}
                </p>
              </div>
              <div className="text-end">
                <p className="font-display text-lg font-bold">
                  {program?.mode === "stamps"
                    ? t("loyalty.stamps_value", {
                        current: member.stamps_balance,
                        total: program.stamps_required,
                      })
                    : t("loyalty.points_value", { count: formatNumber(member.points_balance) })}
                </p>
                <p className="text-xs text-muted-foreground">
                  {t("customer.last_activity")}: {formatDate(member.last_activity_at)}
                </p>
              </div>
            </li>
          ))}
        </ul>
      ) : null}
    </MerchantShell>
  );
}

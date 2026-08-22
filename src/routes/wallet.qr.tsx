import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { RefreshCw } from "lucide-react";

import { QrCode as QrCodeView } from "@/components/QrCode";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/hooks/useAuth";
import { useI18n } from "@/i18n";
import { issueCustomerQr } from "@/lib/api";

export const Route = createFileRoute("/wallet/qr")({
  component: MyQrPage,
});

/**
 * The Customer QR carries only a short-lived, non-guessable token issued by
 * the backend — never balances or personal data.
 */
function MyQrPage() {
  const { t } = useI18n();
  const { user, profile } = useAuth();

  const { data, isLoading, refetch, isFetching } = useQuery({
    queryKey: ["customer-qr", user?.id],
    queryFn: () => issueCustomerQr(),
    enabled: Boolean(user?.id),
    refetchInterval: 4 * 60 * 1000,
    staleTime: 0,
    gcTime: 0,
  });

  return (
    <div className="space-y-6 p-4">
      <header>
        <h1 className="text-2xl font-bold">{t("customer.my_qr")}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{t("customer.qr_hint")}</p>
      </header>

      <div className="surface-card flex flex-col items-center gap-4 p-6">
        {isLoading || !data ? (
          <Skeleton className="size-[240px] rounded-2xl" />
        ) : (
          <QrCodeView value={data} size={240} label={t("customer.my_qr")} />
        )}
        <p className="font-semibold">{profile?.full_name}</p>
        <p className="text-xs text-muted-foreground">{t("customer.qr_expires")}</p>
        <Button variant="outline" onClick={() => refetch()} disabled={isFetching}>
          <RefreshCw className="size-4" aria-hidden />
          {t("customer.qr_refresh")}
        </Button>
      </div>
    </div>
  );
}

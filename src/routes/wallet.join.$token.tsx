import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, Link, useParams } from "@tanstack/react-router";
import { CheckCircle2, Gift, Sparkles } from "lucide-react";
import { toast } from "sonner";

import { StoreAvatar } from "@/components/Logo";
import { StampRow } from "@/components/loyalty/StampRow";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/hooks/useAuth";
import { useI18n } from "@/i18n";
import { joinStore, previewStore } from "@/lib/api";
import { currencySymbol } from "@/lib/domain";
import { errorKey } from "@/lib/errors";

export const Route = createFileRoute("/wallet/join/$token")({
  component: JoinPage,
});

/** Reached by scanning a store's printed Fello QR. */
function JoinPage() {
  const { token } = useParams({ from: "/wallet/join/$token" });
  const { t, formatNumber } = useI18n();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["store-preview", token],
    queryFn: () => previewStore(token),
  });

  const join = useMutation({
    mutationFn: () => joinStore(token),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["wallet", user?.id] });
      void queryClient.invalidateQueries({ queryKey: ["store-preview", token] });
    },
    onError: (error) => toast.error(t(errorKey(error))),
  });

  if (isLoading) {
    return (
      <div className="space-y-4 p-4">
        <Skeleton className="h-40 w-full rounded-2xl" />
        <Skeleton className="h-12 w-full rounded-xl" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="p-4">
        <div className="surface-card p-6 text-center">
          <p className="font-semibold">{t("join.invalid")}</p>
          <Button asChild className="mt-4">
            <Link to="/wallet">{t("join.open_wallet")}</Link>
          </Button>
        </div>
      </div>
    );
  }

  const joined = join.data;
  const alreadyMember = data.already_member || Boolean(joined);

  return (
    <div className="space-y-6 p-4">
      <div className="surface-card p-6 text-center">
        <div className="flex justify-center">
          <StoreAvatar name={data.store_name} logoUrl={data.logo_url} />
        </div>
        <h1 className="mt-4 text-2xl font-bold">{data.store_name}</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {joined ? t("join.success_body") : t("join.title")}
        </p>

        <div className="mt-5 rounded-2xl bg-muted p-4 text-sm">
          {data.mode === "points" ? (
            <p>
              {t("loyalty.rule_points", {
                currency: currencySymbol(data.currency),
                points: formatNumber(data.points_per_currency),
              })}
            </p>
          ) : (
            <>
              <StampRow current={0} total={data.stamps_required} />
              <p className="mt-2">{t("loyalty.rule_stamps", { count: data.stamps_required })}</p>
            </>
          )}
        </div>

        {data.mode === "points" && data.welcome_points > 0 ? (
          <p className="mt-4 flex items-center justify-center gap-2 text-sm font-medium text-primary">
            <Gift className="size-4" aria-hidden />
            {t("join.welcome_points", { count: formatNumber(data.welcome_points) })}
          </p>
        ) : null}
        {data.mode === "stamps" && data.welcome_stamps > 0 ? (
          <p className="mt-4 flex items-center justify-center gap-2 text-sm font-medium text-primary">
            <Gift className="size-4" aria-hidden />
            {t("join.welcome_stamps", { count: data.welcome_stamps })}
          </p>
        ) : null}

        {joined ? (
          <div className="mt-6 space-y-3">
            <p className="flex items-center justify-center gap-2 font-semibold text-primary">
              <CheckCircle2 className="size-5" aria-hidden />
              {t("join.success_title", { store: data.store_name })}
            </p>
            <Button asChild className="w-full">
              <Link to="/wallet">{t("join.open_wallet")}</Link>
            </Button>
          </div>
        ) : alreadyMember ? (
          <div className="mt-6 space-y-3">
            <p className="text-sm text-muted-foreground">{t("join.already_member")}</p>
            <Button asChild className="w-full">
              <Link to="/wallet">{t("join.open_wallet")}</Link>
            </Button>
          </div>
        ) : (
          <Button
            className="mt-6 w-full"
            size="lg"
            disabled={join.isPending}
            onClick={() => join.mutate()}
          >
            <Sparkles className="size-4" aria-hidden />
            {t("join.confirm")}
          </Button>
        )}
      </div>
    </div>
  );
}

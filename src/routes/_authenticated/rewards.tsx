import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { MerchantShell, PageHeader } from "@/components/merchant/MerchantShell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { useMerchantStore } from "@/hooks/useStore";
import { useI18n } from "@/i18n";
import { createReward, deleteReward, fetchRewards, updateReward } from "@/lib/api";
import { errorKey } from "@/lib/errors";

export const Route = createFileRoute("/_authenticated/rewards")({
  component: MerchantRewardsPage,
});

function MerchantRewardsPage() {
  const { t, formatDate, formatNumber } = useI18n();
  const queryClient = useQueryClient();
  const { store, program } = useMerchantStore();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [cost, setCost] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [expiresAt, setExpiresAt] = useState("");

  const rewards = useQuery({
    queryKey: ["rewards", store?.id],
    queryFn: () => fetchRewards(store!.id),
    enabled: Boolean(store?.id),
  });

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ["rewards", store?.id] });

  const create = useMutation({
    mutationFn: () =>
      createReward({
        store_id: store!.id,
        program_id: program?.id ?? null,
        name,
        description: description || null,
        image_url: imageUrl || null,
        points_cost: program?.mode === "points" ? Number(cost) : null,
        stamps_cost: program?.mode === "stamps" ? Number(cost) : null,
        expires_at: expiresAt || null,
      }),
    onSuccess: () => {
      toast.success(t("merchant.saved"));
      setOpen(false);
      setName("");
      setDescription("");
      setCost("");
      setImageUrl("");
      setExpiresAt("");
      void invalidate();
    },
    onError: (error) => toast.error(t(errorKey(error))),
  });

  const toggle = useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      updateReward(id, { is_active: isActive }),
    onSuccess: () => void invalidate(),
    onError: (error) => toast.error(t(errorKey(error))),
  });

  const remove = useMutation({
    mutationFn: (id: string) => deleteReward(id),
    onSuccess: () => void invalidate(),
    onError: (error) => toast.error(t(errorKey(error))),
  });

  return (
    <MerchantShell>
      <PageHeader
        title={t("merchant.rewards")}
        description={store?.name ?? ""}
        action={
          <Button onClick={() => setOpen(true)} disabled={!store}>
            <Plus className="size-4" aria-hidden />
            {t("merchant.create_reward")}
          </Button>
        }
      />

      {rewards.isLoading ? <Skeleton className="h-48 w-full rounded-2xl" /> : null}

      {!rewards.isLoading && (rewards.data ?? []).length === 0 ? (
        <div className="surface-card p-8 text-center text-sm text-muted-foreground">
          {t("merchant.no_rewards")}
        </div>
      ) : null}

      <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {(rewards.data ?? []).map((reward) => (
          <li key={reward.id} className="surface-card overflow-hidden">
            {reward.image_url ? (
              <img
                src={reward.image_url}
                alt={reward.name}
                loading="lazy"
                className="h-32 w-full object-cover"
              />
            ) : null}
            <div className="space-y-3 p-4">
              <div className="flex items-start justify-between gap-2">
                <p className="font-semibold">{reward.name}</p>
                <Badge variant={reward.is_active ? "default" : "secondary"}>
                  {reward.is_active ? t("common.active") : t("common.inactive")}
                </Badge>
              </div>
              {reward.description ? (
                <p className="text-sm text-muted-foreground">{reward.description}</p>
              ) : null}
              <p className="text-sm font-medium">
                {reward.points_cost !== null
                  ? t("rewards.cost_points", { count: formatNumber(reward.points_cost) })
                  : t("rewards.cost_stamps", { count: reward.stamps_cost ?? 0 })}
              </p>
              {reward.expires_at ? (
                <p className="text-xs text-muted-foreground">
                  {t("rewards.expires", { date: formatDate(reward.expires_at) })}
                </p>
              ) : null}
              <div className="flex items-center justify-between gap-2 border-t border-border pt-3">
                <div className="flex items-center gap-2">
                  <Switch
                    checked={reward.is_active}
                    onCheckedChange={(checked) =>
                      toggle.mutate({ id: reward.id, isActive: checked })
                    }
                    aria-label={t("common.active")}
                  />
                  <span className="text-xs text-muted-foreground">{t("common.active")}</span>
                </div>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => remove.mutate(reward.id)}
                  aria-label={t("common.delete")}
                >
                  <Trash2 className="size-4" aria-hidden />
                </Button>
              </div>
            </div>
          </li>
        ))}
      </ul>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("merchant.create_reward")}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="r-name">{t("merchant.reward_name")}</Label>
              <Input id="r-name" value={name} onChange={(e) => setName(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="r-desc">{t("merchant.reward_desc")}</Label>
              <Textarea
                id="r-desc"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="r-cost">
                {t("merchant.reward_cost")} (
                {program?.mode === "stamps" ? t("loyalty.stamps") : t("loyalty.points")})
              </Label>
              <Input
                id="r-cost"
                type="number"
                min="1"
                dir="ltr"
                value={cost}
                onChange={(e) => setCost(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="r-image">
                {t("merchant.reward_image")} ({t("common.optional")})
              </Label>
              <Input
                id="r-image"
                dir="ltr"
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="r-exp">
                {t("merchant.reward_expires")} ({t("common.optional")})
              </Label>
              <Input
                id="r-exp"
                type="date"
                dir="ltr"
                value={expiresAt}
                onChange={(e) => setExpiresAt(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setOpen(false)}>
              {t("common.cancel")}
            </Button>
            <Button disabled={!name || !cost || create.isPending} onClick={() => create.mutate()}>
              {t("common.create")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </MerchantShell>
  );
}

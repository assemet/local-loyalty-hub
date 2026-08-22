import { supabase } from "@/integrations/supabase/client";
import type {
  AwardResult,
  CustomerLookup,
  JoinResult,
  LoyaltyProgram,
  Membership,
  Profile,
  Reward,
  RewardClaim,
  RewardValidation,
  Store,
  StorePreview,
  StoreStats,
  Transaction,
  Redemption,
  WalletEntry,
} from "@/lib/domain";

/**
 * Data-access layer. All balance-changing operations go through database
 * functions (SECURITY DEFINER) so the frontend can never award or spend
 * loyalty value on its own.
 */

function unwrap<T>(res: { data: unknown; error: unknown }): T {
  if (res.error) throw res.error;
  return res.data as T;
}

// ---------- profile ----------

export async function fetchProfile(userId: string): Promise<Profile | null> {
  const { data, error } = await supabase.from("profiles").select("*").eq("id", userId).maybeSingle();
  if (error) throw error;
  return (data as Profile | null) ?? null;
}

export async function updateProfile(userId: string, patch: Partial<Profile>) {
  const { error } = await supabase.from("profiles").update(patch).eq("id", userId);
  if (error) throw error;
}

// ---------- customer wallet ----------

export async function fetchWallet(userId: string): Promise<WalletEntry[]> {
  const memberships = unwrap<Membership[]>(
    await supabase
      .from("memberships")
      .select("*")
      .eq("customer_id", userId)
      .order("last_activity_at", { ascending: false }),
  );
  if (memberships.length === 0) return [];

  const storeIds = memberships.map((m) => m.store_id);
  const [stores, programs, rewards] = await Promise.all([
    supabase.from("stores").select("*").in("id", storeIds),
    supabase.from("loyalty_programs").select("*").in("store_id", storeIds).eq("is_active", true),
    supabase.from("rewards").select("*").in("store_id", storeIds).eq("is_active", true),
  ]);

  const storeList = unwrap<Store[]>(stores);
  const programList = unwrap<LoyaltyProgram[]>(programs);
  const rewardList = unwrap<Reward[]>(rewards);

  return memberships
    .map((membership) => {
      const store = storeList.find((s) => s.id === membership.store_id);
      const program = programList.find((p) => p.store_id === membership.store_id);
      if (!store || !program) return null;
      return {
        membership,
        store,
        program,
        rewards: rewardList
          .filter((r) => r.store_id === membership.store_id)
          .sort((a, b) => (a.points_cost ?? a.stamps_cost ?? 0) - (b.points_cost ?? b.stamps_cost ?? 0)),
      } satisfies WalletEntry;
    })
    .filter((entry): entry is WalletEntry => entry !== null);
}

export async function fetchCustomerTransactions(userId: string, limit = 60) {
  return unwrap<Transaction[]>(
    await supabase
      .from("transactions")
      .select("*")
      .eq("customer_id", userId)
      .order("created_at", { ascending: false })
      .limit(limit),
  );
}

export async function fetchCustomerRedemptions(userId: string) {
  return unwrap<Redemption[]>(
    await supabase
      .from("redemptions")
      .select("*")
      .eq("customer_id", userId)
      .order("created_at", { ascending: false }),
  );
}

export async function issueCustomerQr(): Promise<string> {
  const { data, error } = await supabase.rpc("issue_customer_qr");
  if (error) throw error;
  return data as unknown as string;
}

export async function previewStore(joinToken: string): Promise<StorePreview | null> {
  const { data, error } = await supabase.rpc("get_store_by_join_token", { _token: joinToken });
  if (error) throw error;
  const rows = (data ?? []) as unknown as StorePreview[];
  return rows[0] ?? null;
}

export async function joinStore(joinToken: string): Promise<JoinResult> {
  const { data, error } = await supabase.rpc("join_store", { _token: joinToken });
  if (error) throw error;
  return data as unknown as JoinResult;
}

export async function claimReward(membershipId: string, rewardId: string): Promise<RewardClaim> {
  const { data, error } = await supabase.rpc("redeem_reward", {
    _membership_id: membershipId,
    _reward_id: rewardId,
  });
  if (error) throw error;
  return data as unknown as RewardClaim;
}

// ---------- merchant ----------

export async function fetchMyStores(userId: string) {
  return unwrap<Store[]>(
    await supabase
      .from("stores")
      .select("*")
      .eq("owner_id", userId)
      .order("created_at", { ascending: true }),
  );
}

export async function createStore(input: {
  owner_id: string;
  name: string;
  category: string;
  currency: string;
  logo_url?: string | null;
  address?: string | null;
  phone?: string | null;
}) {
  return unwrap<Store>(await supabase.from("stores").insert(input).select().single());
}

export async function updateStore(storeId: string, patch: Partial<Store>) {
  const { error } = await supabase.from("stores").update(patch).eq("id", storeId);
  if (error) throw error;
}

export async function fetchProgram(storeId: string): Promise<LoyaltyProgram | null> {
  const { data, error } = await supabase
    .from("loyalty_programs")
    .select("*")
    .eq("store_id", storeId)
    .eq("is_active", true)
    .maybeSingle();
  if (error) throw error;
  return (data as LoyaltyProgram | null) ?? null;
}

export async function upsertProgram(input: {
  id?: string;
  store_id: string;
  mode: "points" | "stamps";
  points_per_currency: number;
  stamps_required: number;
  welcome_points: number;
  welcome_stamps: number;
}) {
  if (input.id) {
    const { id, ...patch } = input;
    return unwrap<LoyaltyProgram>(
      await supabase.from("loyalty_programs").update(patch).eq("id", id).select().single(),
    );
  }
  return unwrap<LoyaltyProgram>(
    await supabase.from("loyalty_programs").insert(input).select().single(),
  );
}

export async function fetchRewards(storeId: string) {
  return unwrap<Reward[]>(
    await supabase
      .from("rewards")
      .select("*")
      .eq("store_id", storeId)
      .order("created_at", { ascending: true }),
  );
}

export async function createReward(input: {
  store_id: string;
  program_id: string | null;
  name: string;
  description?: string | null;
  image_url?: string | null;
  points_cost?: number | null;
  stamps_cost?: number | null;
  expires_at?: string | null;
}) {
  return unwrap<Reward>(await supabase.from("rewards").insert(input).select().single());
}

export async function updateReward(rewardId: string, patch: Partial<Reward>) {
  const { error } = await supabase.from("rewards").update(patch).eq("id", rewardId);
  if (error) throw error;
}

export async function deleteReward(rewardId: string) {
  const { error } = await supabase.from("rewards").delete().eq("id", rewardId);
  if (error) throw error;
}

export async function fetchStoreStats(storeId: string): Promise<StoreStats> {
  const { data, error } = await supabase.rpc("store_stats", { _store_id: storeId });
  if (error) throw error;
  return data as unknown as StoreStats;
}

export async function fetchStoreMembers(storeId: string) {
  const memberships = unwrap<Membership[]>(
    await supabase
      .from("memberships")
      .select("*")
      .eq("store_id", storeId)
      .order("last_activity_at", { ascending: false }),
  );
  if (memberships.length === 0) return [] as (Membership & { profile: Profile | null })[];
  const profiles = unwrap<Profile[]>(
    await supabase
      .from("profiles")
      .select("*")
      .in(
        "id",
        memberships.map((m) => m.customer_id),
      ),
  );
  return memberships.map((m) => ({
    ...m,
    profile: profiles.find((p) => p.id === m.customer_id) ?? null,
  }));
}

export async function fetchStoreTransactions(storeId: string, limit = 100) {
  return unwrap<Transaction[]>(
    await supabase
      .from("transactions")
      .select("*")
      .eq("store_id", storeId)
      .order("created_at", { ascending: false })
      .limit(limit),
  );
}

export async function lookupCustomer(token: string, storeId: string): Promise<CustomerLookup> {
  const { data, error } = await supabase.rpc("lookup_customer_qr", {
    _token: token,
    _store_id: storeId,
  });
  if (error) throw error;
  return data as unknown as CustomerLookup;
}

export async function awardLoyalty(input: {
  token: string;
  storeId: string;
  action: "points" | "stamp";
  amount?: number;
}): Promise<AwardResult> {
  const { data, error } = await supabase.rpc("award_loyalty", {
    _token: input.token,
    _store_id: input.storeId,
    _action: input.action,
    ...(input.amount === undefined ? {} : { _amount: input.amount }),
  });
  if (error) throw error;
  return data as unknown as AwardResult;
}

export async function validateRewardToken(
  token: string,
  storeId: string,
): Promise<RewardValidation> {
  const { data, error } = await supabase.rpc("validate_reward_token", {
    _token: token,
    _store_id: storeId,
  });
  if (error) throw error;
  return data as unknown as RewardValidation;
}

export async function confirmRedemption(token: string, storeId: string) {
  const { data, error } = await supabase.rpc("confirm_redemption", {
    _token: token,
    _store_id: storeId,
  });
  if (error) throw error;
  return data as unknown as { redemption_id: string; reward_name: string; notification_id: string };
}

import type { LoyaltyProgram, Membership, Reward } from "@/lib/domain";

/**
 * Pure loyalty helpers. All of these are presentation-side derivations of
 * balances the backend owns — they never award or spend value.
 */

export function rewardCost(reward: Reward, mode: LoyaltyProgram["mode"]) {
  return (mode === "points" ? reward.points_cost : reward.stamps_cost) ?? 0;
}

export function isRewardUsable(reward: Reward) {
  return reward.is_active && (!reward.expires_at || new Date(reward.expires_at) > new Date());
}

export function balanceFor(membership: Membership, mode: LoyaltyProgram["mode"]) {
  return mode === "points" ? membership.points_balance : membership.stamps_balance;
}

export function isUnlocked(reward: Reward, membership: Membership, program: LoyaltyProgram) {
  const cost = rewardCost(reward, program.mode);
  return isRewardUsable(reward) && cost > 0 && balanceFor(membership, program.mode) >= cost;
}

/** The cheapest reward the customer cannot afford yet — their next goal. */
export function nextReward(rewards: Reward[], membership: Membership, program: LoyaltyProgram) {
  const balance = balanceFor(membership, program.mode);
  return (
    rewards
      .filter((r) => isRewardUsable(r) && rewardCost(r, program.mode) > balance)
      .sort((a, b) => rewardCost(a, program.mode) - rewardCost(b, program.mode))[0] ?? null
  );
}

export function unlockedRewards(rewards: Reward[], membership: Membership, program: LoyaltyProgram) {
  return rewards.filter((r) => isUnlocked(r, membership, program));
}

export function progressPercent(membership: Membership, program: LoyaltyProgram, target: number) {
  if (target <= 0) return 100;
  return Math.min(100, Math.round((balanceFor(membership, program.mode) / target) * 100));
}

/** Public URL encoded in a store's printed Fello QR. */
export function storeJoinUrl(joinToken: string) {
  const origin = typeof window === "undefined" ? "" : window.location.origin;
  return `${origin}/wallet/join/${joinToken}`;
}

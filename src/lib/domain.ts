/**
 * Domain types shared by the customer wallet and the merchant dashboard.
 * Business logic lives in the database (security definer functions);
 * these types describe the shapes crossing the boundary.
 */

export type LoyaltyMode = "points" | "stamps";

export type Profile = {
  id: string;
  full_name: string | null;
  avatar_url: string | null;
  language: string;
  telegram_id: number | null;
  telegram_username: string | null;
  notifications_enabled: boolean;
  is_merchant: boolean;
};

export type Store = {
  id: string;
  owner_id: string;
  name: string;
  category: string;
  logo_url: string | null;
  currency: string;
  address: string | null;
  phone: string | null;
  join_token: string;
  is_active: boolean;
  created_at: string;
};

export type LoyaltyProgram = {
  id: string;
  store_id: string;
  mode: LoyaltyMode;
  points_per_currency: number;
  stamps_required: number;
  welcome_points: number;
  welcome_stamps: number;
  is_active: boolean;
};

export type Reward = {
  id: string;
  store_id: string;
  program_id: string | null;
  name: string;
  description: string | null;
  image_url: string | null;
  points_cost: number | null;
  stamps_cost: number | null;
  expires_at: string | null;
  is_active: boolean;
  created_at: string;
};

export type Membership = {
  id: string;
  store_id: string;
  customer_id: string;
  points_balance: number;
  stamps_balance: number;
  lifetime_points: number;
  lifetime_stamps: number;
  status: string;
  joined_at: string;
  last_activity_at: string;
};

export type TransactionType =
  | "welcome_bonus"
  | "points_earned"
  | "stamp_earned"
  | "reward_claimed"
  | "reward_redeemed";

export type Transaction = {
  id: string;
  store_id: string;
  membership_id: string;
  customer_id: string;
  type: TransactionType;
  points_delta: number;
  stamps_delta: number;
  purchase_amount: number | null;
  reward_id: string | null;
  note: string | null;
  created_at: string;
};

export type Redemption = {
  id: string;
  store_id: string;
  membership_id: string;
  customer_id: string;
  reward_id: string;
  token: string;
  status: "pending" | "redeemed" | "expired" | "cancelled";
  points_spent: number;
  stamps_spent: number;
  expires_at: string;
  redeemed_at: string | null;
  created_at: string;
};

/** A membership joined with its store, program and rewards — the wallet card. */
export type WalletEntry = {
  membership: Membership;
  store: Store;
  program: LoyaltyProgram;
  rewards: Reward[];
};

export type StoreStats = {
  total_members: number;
  active_members: number;
  points_issued: number;
  stamps_issued: number;
  rewards_redeemed: number;
};

export type CustomerLookup = {
  customer_id: string;
  customer_name: string | null;
  avatar_url: string | null;
  is_member: boolean;
  membership_id: string | null;
  points_balance: number;
  stamps_balance: number;
  mode: LoyaltyMode | null;
  stamps_required: number | null;
  points_per_currency: number | null;
};

export type AwardResult = {
  membership_id: string;
  points_awarded: number;
  stamps_awarded: number;
  points_balance: number;
  stamps_balance: number;
  reward_unlocked: boolean;
  notification_id: string | null;
};

export type JoinResult = {
  membership_id: string;
  store_id: string;
  store_name: string;
  already_member: boolean;
  welcome_points: number;
  welcome_stamps: number;
  points_balance: number;
  stamps_balance: number;
};

export type StorePreview = {
  store_id: string;
  store_name: string;
  logo_url: string | null;
  category: string;
  currency: string;
  mode: LoyaltyMode;
  welcome_points: number;
  welcome_stamps: number;
  stamps_required: number;
  points_per_currency: number;
  already_member: boolean;
};

export type RewardClaim = {
  redemption_id: string;
  token: string;
  expires_at: string;
  reward_name: string;
  points_balance: number;
  stamps_balance: number;
};

export type RewardValidation = {
  redemption_id: string;
  status: Redemption["status"];
  expired: boolean;
  reward_name: string;
  reward_description: string | null;
  customer_name: string | null;
  store_name: string;
  redeemed_at: string | null;
};

export const STORE_CATEGORIES = [
  "coffee",
  "restaurant",
  "bakery",
  "barber",
  "salon",
  "gym",
  "car_wash",
  "other",
] as const;

export const CURRENCIES = ["USD", "EUR", "GBP", "RUB", "TRY", "BRL", "AED", "SAR"] as const;

export function currencySymbol(code: string) {
  const map: Record<string, string> = {
    USD: "$",
    EUR: "€",
    GBP: "£",
    RUB: "₽",
    TRY: "₺",
    BRL: "R$",
    AED: "AED ",
    SAR: "SAR ",
  };
  return map[code] ?? `${code} `;
}

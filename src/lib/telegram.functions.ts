import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

/**
 * Telegram integration boundary.
 *
 * Both functions require TELEGRAM_BOT_TOKEN to be configured as a backend
 * secret. Nothing about the bot ever reaches the browser.
 */

const initDataSchema = z.object({ initData: z.string().min(1) });

type TelegramUser = {
  id: number;
  first_name?: string;
  last_name?: string;
  username?: string;
  language_code?: string;
  photo_url?: string;
};

async function hmac(keyData: ArrayBuffer | Uint8Array, message: string) {
  const key = await crypto.subtle.importKey(
    "raw",
    keyData as ArrayBuffer,
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  return new Uint8Array(await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(message)));
}

function toHex(bytes: Uint8Array) {
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

/** Validates Telegram WebApp initData per the official HMAC-SHA256 scheme. */
async function verifyInitData(initData: string, botToken: string): Promise<TelegramUser> {
  const params = new URLSearchParams(initData);
  const hash = params.get("hash");
  if (!hash) throw new Error("TELEGRAM_AUTH_INVALID");
  params.delete("hash");

  const dataCheckString = [...params.entries()]
    .map(([k, v]) => `${k}=${v}`)
    .sort()
    .join("\n");

  const secretKey = await hmac(new TextEncoder().encode("WebAppData"), botToken);
  const signature = toHex(await hmac(secretKey, dataCheckString));
  if (signature !== hash) throw new Error("TELEGRAM_AUTH_INVALID");

  const authDate = Number(params.get("auth_date") ?? 0);
  if (!authDate || Date.now() / 1000 - authDate > 86400) throw new Error("TELEGRAM_AUTH_EXPIRED");

  const userRaw = params.get("user");
  if (!userRaw) throw new Error("TELEGRAM_AUTH_INVALID");
  return JSON.parse(userRaw) as TelegramUser;
}

/**
 * Verifies Telegram identity server-side, provisions the Fello profile on
 * first launch, and returns a one-time token the client exchanges for a
 * session (no password ever crosses the wire).
 */
export const telegramSignIn = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => initDataSchema.parse(input))
  .handler(async ({ data }) => {
    const botToken = process.env["TELEGRAM_BOT_TOKEN"];
    if (!botToken) return { ok: false as const, reason: "NOT_CONFIGURED" as const };

    const tgUser = await verifyInitData(data.initData, botToken);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const email = `tg${tgUser.id}@telegram.fello.app`;
    const fullName = [tgUser.first_name, tgUser.last_name].filter(Boolean).join(" ") || "Friend";
    const metadata = {
      full_name: fullName,
      avatar_url: tgUser.photo_url ?? null,
      telegram_id: String(tgUser.id),
      telegram_username: tgUser.username ?? null,
      language: tgUser.language_code ?? "en",
    };

    const existing = await supabaseAdmin
      .from("profiles")
      .select("id")
      .eq("telegram_id", tgUser.id)
      .maybeSingle();

    let userId = (existing.data as { id: string } | null)?.id ?? null;

    if (!userId) {
      const created = await supabaseAdmin.auth.admin.createUser({
        email,
        email_confirm: true,
        user_metadata: metadata,
      });
      if (created.error || !created.data.user) throw new Error("TELEGRAM_AUTH_PROVISION_FAILED");
      userId = created.data.user.id;
    } else {
      await supabaseAdmin
        .from("profiles")
        .update({
          full_name: fullName,
          avatar_url: tgUser.photo_url ?? null,
          telegram_username: tgUser.username ?? null,
        })
        .eq("id", userId);
    }

    const link = await supabaseAdmin.auth.admin.generateLink({ type: "magiclink", email });
    if (link.error || !link.data.properties?.hashed_token) {
      throw new Error("TELEGRAM_AUTH_SESSION_FAILED");
    }

    return {
      ok: true as const,
      tokenHash: link.data.properties.hashed_token,
      email,
    };
  });

const notifySchema = z.object({ notificationId: z.string().uuid() });

const MESSAGES: Record<string, (p: Record<string, unknown>) => string> = {
  joined_store: (p) =>
    `🎉 Welcome to ${p["store_name"]}!` +
    (Number(p["points"]) > 0 ? `\n+${p["points"]} Points` : "") +
    (Number(p["stamps"]) > 0 ? `\n+${p["stamps"]} Stamps` : ""),
  points_earned: (p) =>
    `⭐ You earned ${p["points"]} points at ${p["store_name"]}!\nYour balance is now ${p["points_balance"]}.` +
    (p["reward_unlocked"] ? `\n\n🎁 A reward is ready for you!` : ""),
  stamp_earned: (p) =>
    `☕ Stamp added at ${p["store_name"]}!\nYou now have ${p["stamps_balance"]}/${p["stamps_required"]} stamps.` +
    (p["reward_unlocked"] ? `\n\n🎁 A reward is ready for you!` : ""),
  reward_unlocked: (p) => `🎁 Reward unlocked!\nYou have a ${p["reward_name"]} waiting at ${p["store_name"]}.`,
  reward_redeemed: (p) => `✅ ${p["reward_name"]} redeemed successfully at ${p["store_name"]}.`,
};

/**
 * Delivers a stored loyalty event to the customer over Telegram.
 * The caller must be the owner of the store the event belongs to, or the
 * customer the event belongs to.
 */
export const deliverNotification = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => notifySchema.parse(input))
  .handler(async ({ data, context }) => {
    // RLS on notifications already restricts visibility to the customer and
    // the owning merchant, so this read is the authorization check.
    const { data: notification, error } = await context.supabase
      .from("notifications")
      .select("*")
      .eq("id", data.notificationId)
      .maybeSingle();
    if (error || !notification) return { sent: false as const, reason: "NOT_FOUND" as const };

    const row = notification as {
      id: string;
      customer_id: string;
      event_type: string;
      payload: Record<string, unknown>;
      delivered: boolean;
    };
    if (row.delivered) return { sent: false as const, reason: "ALREADY_SENT" as const };

    const botToken = process.env["TELEGRAM_BOT_TOKEN"];
    if (!botToken) return { sent: false as const, reason: "NOT_CONFIGURED" as const };

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const profile = await supabaseAdmin
      .from("profiles")
      .select("telegram_id, notifications_enabled")
      .eq("id", row.customer_id)
      .maybeSingle();

    const target = profile.data as { telegram_id: number | null; notifications_enabled: boolean } | null;
    if (!target?.telegram_id || !target.notifications_enabled) {
      return { sent: false as const, reason: "NO_TELEGRAM" as const };
    }

    const build = MESSAGES[row.event_type];
    const text = build ? build(row.payload) : `Fello update: ${row.event_type}`;

    const response = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ chat_id: target.telegram_id, text }),
    });

    const ok = response.ok;
    await supabaseAdmin
      .from("notifications")
      .update({
        delivered: ok,
        delivered_at: ok ? new Date().toISOString() : null,
        error: ok ? null : `telegram_${response.status}`,
      })
      .eq("id", row.id);

    return ok ? { sent: true as const } : { sent: false as const, reason: "SEND_FAILED" as const };
  });

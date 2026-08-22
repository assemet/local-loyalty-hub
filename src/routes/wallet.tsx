import { createFileRoute, Link, Outlet, useRouterState } from "@tanstack/react-router";
import { Activity, Gift, Home, QrCode, User } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { Logo } from "@/components/Logo";
import { LanguageSelect } from "@/components/LanguageSelect";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/hooks/useAuth";
import { useI18n } from "@/i18n";
import { errorKey } from "@/lib/errors";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/wallet")({
  head: () => ({
    meta: [
      { title: "My Fello wallet — loyalty cards in one place" },
      {
        name: "description",
        content:
          "Your Fello wallet keeps every local loyalty card in one place: points, stamp cards, rewards and your customer QR.",
      },
      { property: "og:title", content: "My Fello wallet" },
      {
        property: "og:description",
        content: "Points, stamps and rewards from every local store you love, in one wallet.",
      },
    ],
  }),
  component: WalletLayout,
});

/**
 * Customer shell. Only Telegram users can access the wallet now.
 * This enforces the requirement for Telegram-only authentication.
 */
function WalletLayout() {
  const { t } = useI18n();
  const { session, loading, telegramStatus } = useAuth();

  if (loading) {
    return (
      <div className="mx-auto max-w-md space-y-4 p-4">
        <Skeleton className="h-24 w-full rounded-2xl" />
        <Skeleton className="h-32 w-full rounded-2xl" />
        <Skeleton className="h-32 w-full rounded-2xl" />
      </div>
    );
  }

  if (!session) {
    return <TelegramRequired />;
  }

  return (
    <div className="min-h-screen bg-background pb-24">
      <div className="mx-auto max-w-md">
        <Outlet />
      </div>
      <BottomNav />
    </div>
  );
}

function TelegramRequired() {
  const { t } = useI18n();
  const { telegramStatus } = useAuth();

  if (telegramStatus === "signing_in") {
    return (
      <div className="flex min-h-screen flex-col bg-background">
        <header className="flex items-center justify-between px-4 py-4">
          <Link to="/">
            <Logo />
          </Link>
          <LanguageSelect className="w-[132px]" />
        </header>
        <main className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center px-4 pb-12">
          <div className="surface-card p-6">
            <h1 className="text-2xl font-bold">Signing in...</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Verifying your Telegram identity, please wait.
            </p>

            <div className="mt-6 flex flex-col items-center justify-center">
              <div className="size-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
              <p className="mt-4 text-sm text-muted-foreground">Authenticating with Telegram...</p>
            </div>
          </div>
        </main>
      </div>
    );
  }

  if (telegramStatus === "failed") {
    return (
      <div className="flex min-h-screen flex-col bg-background">
        <header className="flex items-center justify-between px-4 py-4">
          <Link to="/">
            <Logo />
          </Link>
          <LanguageSelect className="w-[132px]" />
        </header>
        <main className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center px-4 pb-12">
          <div className="surface-card p-6">
            <h1 className="text-2xl font-bold">Authentication Failed</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Failed to verify your Telegram identity.
            </p>

            <div className="mt-6 rounded-lg border border-red-200 bg-red-50 p-4 text-red-800">
              <p className="font-medium">Authentication Error</p>
              <p className="mt-1 text-sm">
                There was an error verifying your Telegram session. Please restart the app within Telegram.
              </p>
            </div>

            <p className="mt-6 text-center text-sm text-muted-foreground">
              You need to open this application within Telegram to access your wallet.
            </p>
          </div>
        </main>
      </div>
    );
  }

  if (telegramStatus === "not_configured") {
    return (
      <div className="flex min-h-screen flex-col bg-background">
        <header className="flex items-center justify-between px-4 py-4">
          <Link to="/">
            <Logo />
          </Link>
          <LanguageSelect className="w-[132px]" />
        </header>
        <main className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center px-4 pb-12">
          <div className="surface-card p-6">
            <h1 className="text-2xl font-bold">Telegram Setup Required</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              The Telegram integration is not configured yet.
            </p>

            <div className="mt-6 rounded-lg border border-yellow-200 bg-yellow-50 p-4 text-yellow-800">
              <p className="font-medium">Configuration Missing</p>
              <p className="mt-1 text-sm">
                The Telegram bot token is not configured in the environment. This is required to access your wallet.
              </p>
            </div>

            <p className="mt-6 text-center text-sm text-muted-foreground">
              You need to open this application within Telegram to access your wallet.
            </p>
          </div>
        </main>
      </div>
    );
  }

  // Not in Telegram environment
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="flex items-center justify-between px-4 py-4">
        <Link to="/">
          <Logo />
        </Link>
        <LanguageSelect className="w-[132px]" />
      </header>
      <main className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center px-4 pb-12">
        <div className="surface-card p-6">
          <h1 className="text-2xl font-bold">Telegram Required</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            You need to open this in Telegram to access your Fello wallet.
          </p>

          <div className="mt-6 rounded-lg border border-yellow-200 bg-yellow-50 p-4 text-yellow-800">
            <p className="font-medium">Telegram Required</p>
            <p className="mt-1 text-sm">
              This application is only accessible within the Telegram application. Please open Fello in your Telegram chat with the bot to continue.
            </p>
          </div>

          <p className="mt-6 text-center text-sm text-muted-foreground">
            The Fello wallet is designed to work exclusively within Telegram for security and convenience.
          </p>
        </div>
      </main>
    </div>
  );
}

function BottomNav() {
  const { t } = useI18n();
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  const items: { to: string; label: string; icon: typeof Home; exact?: boolean }[] = [
    { to: "/wallet", label: t("customer.home"), icon: Home, exact: true },
    { to: "/wallet/rewards", label: t("customer.rewards"), icon: Gift },
    { to: "/wallet/qr", label: t("customer.my_qr"), icon: QrCode },
    { to: "/wallet/activity", label: t("customer.activity"), icon: Activity },
    { to: "/wallet/profile", label: t("customer.profile"), icon: User },
  ];

  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-card/95 backdrop-blur">
      <ul className="mx-auto flex max-w-md items-stretch justify-between px-2 py-2">
        {items.map((item) => {
          const active = item.exact ? pathname === item.to : pathname.startsWith(item.to);
          return (
            <li key={item.to} className="flex-1">
              <Link
                to={item.to}
                className={cn(
                  "flex flex-col items-center gap-1 rounded-xl px-2 py-1.5 text-[11px] font-medium transition-colors",
                  active ? "text-primary" : "text-muted-foreground hover:text-foreground",
                )}
              >
                <item.icon className="size-5" aria-hidden />
                {item.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

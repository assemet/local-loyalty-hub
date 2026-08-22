import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { z } from "zod";

import { Logo } from "@/components/Logo";
import { LanguageSelect } from "@/components/LanguageSelect";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/hooks/useAuth";
import { useI18n } from "@/i18n";
import { errorKey } from "@/lib/errors";
import { lovable } from "@/integrations/lovable/index";
import { isTelegramEnvironment } from "@/lib/telegram";

const searchSchema = z.object({
  mode: z.enum(["signin", "signup"]).optional(),
});

export const Route = createFileRoute("/auth")({
  validateSearch: searchSchema,
  head: () => ({
    meta: [
      { title: "Merchant sign in — Fello" },
      {
        name: "description",
        content: "Sign in to your Fello merchant dashboard to manage your loyalty program, rewards and customers.",
      },
      { property: "og:title", content: "Merchant sign in — Fello" },
      { property: "og:description", content: "Manage your Fello loyalty program, rewards and customers." },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const { t } = useI18n();
  const { session, telegramStatus } = useAuth();
  const navigate = useNavigate();
  const isTelegram = isTelegramEnvironment();
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (session) void navigate({ to: "/dashboard", replace: true });
  }, [session, navigate]);

  const isNotConfigured = telegramStatus === "not_configured";
  const isFailed = telegramStatus === "failed";
  const isUnavailable = telegramStatus === "unavailable";

  if (!isTelegram && !isNotConfigured && !isFailed && !isUnavailable) {
    return (
      <div className="flex min-h-screen flex-col bg-background">
        <header className="mx-auto flex w-full max-w-5xl items-center justify-between px-4 py-4">
          <Link to="/">
            <Logo />
          </Link>
          <LanguageSelect className="w-[132px]" />
        </header>

        <main className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center px-4 pb-16">
          <div className="surface-card p-6">
            <h1 className="text-2xl font-bold">Sign in with Telegram</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              You need to open this in Telegram to access your merchant account.
            </p>

            <div className="mt-6 rounded-lg border border-yellow-200 bg-yellow-50 p-4 text-yellow-800">
              <p className="font-medium">Telegram Required</p>
              <p className="mt-1 text-sm">
                This application is only accessible within the Telegram application. Please open Fello in your Telegram chat with the bot to continue.
              </p>
            </div>

            <p className="mt-6 text-center text-sm text-muted-foreground">
              <Link to="/wallet" className="underline-offset-4 hover:underline">
                {t("landing.customer_entry")}
              </Link>
            </p>
          </div>
        </main>
      </div>
    );
  }

  if (isNotConfigured) {
    return (
      <div className="flex min-h-screen flex-col bg-background">
        <header className="mx-auto flex w-full max-w-5xl items-center justify-between px-4 py-4">
          <Link to="/">
            <Logo />
          </Link>
          <LanguageSelect className="w-[132px]" />
        </header>

        <main className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center px-4 pb-16">
          <div className="surface-card p-6">
            <h1 className="text-2xl font-bold">Telegram Setup Required</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              The Telegram integration is not configured yet. Please contact your administrator.
            </p>

            <div className="mt-6 rounded-lg border border-red-200 bg-red-50 p-4 text-red-800">
              <p className="font-medium">Configuration Missing</p>
              <p className="mt-1 text-sm">
                The Telegram bot token is not configured in the environment. This is required for authentication.
              </p>
            </div>
          </div>
        </main>
      </div>
    );
  }

  if (isFailed) {
    return (
      <div className="flex min-h-screen flex-col bg-background">
        <header className="mx-auto flex w-full max-w-5xl items-center justify-between px-4 py-4">
          <Link to="/">
            <Logo />
          </Link>
          <LanguageSelect className="w-[132px]" />
        </header>

        <main className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center px-4 pb-16">
          <div className="surface-card p-6">
            <h1 className="text-2xl font-bold">Authentication Failed</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Failed to verify your Telegram identity. Please try opening this app again in Telegram.
            </p>

            <div className="mt-6 rounded-lg border border-red-200 bg-red-50 p-4 text-red-800">
              <p className="font-medium">Verification Error</p>
              <p className="mt-1 text-sm">
                There was an error verifying your Telegram session. Please restart the app within Telegram.
              </p>
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="mx-auto flex w-full max-w-5xl items-center justify-between px-4 py-4">
        <Link to="/">
          <Logo />
        </Link>
        <LanguageSelect className="w-[132px]" />
      </header>

      <main className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center px-4 pb-16">
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

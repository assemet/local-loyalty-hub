import { Link, useRouterState } from "@tanstack/react-router";
import {
  Gift,
  LayoutDashboard,
  ListOrdered,
  QrCode,
  Settings,
  Sparkles,
  Users,
} from "lucide-react";
import type { ReactNode } from "react";

import { LanguageSelect } from "@/components/LanguageSelect";
import { Logo } from "@/components/Logo";
import { useI18n } from "@/i18n";
import { cn } from "@/lib/utils";

export function MerchantShell({ children }: { children: ReactNode }) {
  const { t } = useI18n();
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  const items = [
    { to: "/dashboard", label: t("merchant.dashboard"), icon: LayoutDashboard },
    { to: "/scan", label: t("merchant.scan"), icon: QrCode },
    { to: "/customers", label: t("merchant.customers"), icon: Users },
    { to: "/program", label: t("merchant.program"), icon: Sparkles },
    { to: "/rewards", label: t("merchant.rewards"), icon: Gift },
    { to: "/transactions", label: t("merchant.transactions"), icon: ListOrdered },
    { to: "/settings", label: t("merchant.settings"), icon: Settings },
  ] as const;

  return (
    <div className="min-h-screen bg-muted/40">
      <div className="mx-auto flex w-full max-w-7xl flex-col md:flex-row">
        <aside className="sticky top-0 z-30 border-b border-border bg-card md:h-screen md:w-60 md:shrink-0 md:border-r md:border-b-0">
          <div className="flex items-center justify-between gap-2 p-4">
            <Link to="/dashboard">
              <Logo />
            </Link>
            <LanguageSelect className="w-[120px] md:hidden" />
          </div>
          <nav className="overflow-x-auto px-2 pb-3 md:pb-0">
            <ul className="flex gap-1 md:flex-col">
              {items.map((item) => {
                const active = pathname === item.to;
                return (
                  <li key={item.to} className="shrink-0">
                    <Link
                      to={item.to}
                      className={cn(
                        "flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium whitespace-nowrap transition-colors",
                        active
                          ? "bg-primary text-primary-foreground"
                          : "text-muted-foreground hover:bg-secondary hover:text-foreground",
                      )}
                    >
                      <item.icon className="size-4" aria-hidden />
                      {item.label}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>
          <div className="hidden p-4 md:block">
            <LanguageSelect className="w-full" />
          </div>
        </aside>
        <main className="min-w-0 flex-1 p-4 md:p-8">{children}</main>
      </div>
    </div>
  );
}

export function PageHeader({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <header className="mb-6 flex flex-wrap items-end justify-between gap-3">
      <div>
        <h1 className="font-display text-3xl font-bold">{title}</h1>
        {description ? <p className="mt-1 text-sm text-muted-foreground">{description}</p> : null}
      </div>
      {action}
    </header>
  );
}

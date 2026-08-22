import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowRight,
  BadgeCheck,
  Coffee,
  Gift,
  QrCode,
  Repeat,
  Sparkles,
  Star,
  Store,
  Wallet,
} from "lucide-react";

import heroShop from "@/assets/hero-shop.jpg";
import counterQr from "@/assets/counter-qr.png";
import { Logo } from "@/components/Logo";
import { LanguageSelect } from "@/components/LanguageSelect";
import { StampRow } from "@/components/loyalty/StampRow";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useI18n } from "@/i18n";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Fello — Turn customers into regulars" },
      {
        name: "description",
        content:
          "Launch a digital loyalty program for your local business in minutes. Points or stamp cards, secure QR codes, and a customer wallet that lives in Telegram.",
      },
      { property: "og:title", content: "Fello — Turn customers into regulars" },
      {
        property: "og:description",
        content:
          "Digital loyalty for coffee shops, salons, gyms and every local business. Points or stamps, no app development required.",
      },
    ],
  }),
  component: Landing,
});

function Landing() {
  const { t } = useI18n();

  const steps = [
    { icon: Store, label: t("landing.step1") },
    { icon: QrCode, label: t("landing.step2") },
    { icon: Wallet, label: t("landing.step3") },
    { icon: Star, label: t("landing.step4") },
    { icon: Gift, label: t("landing.step5") },
    { icon: Repeat, label: t("landing.step6") },
  ];

  const features = [
    { icon: Wallet, title: t("landing.feat1_t"), body: t("landing.feat1_d") },
    { icon: BadgeCheck, title: t("landing.feat2_t"), body: t("landing.feat2_d") },
    { icon: Sparkles, title: t("landing.feat3_t"), body: t("landing.feat3_d") },
  ];

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-40 border-b border-border/70 bg-background/85 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3">
          <Logo />
          <nav className="hidden items-center gap-6 text-sm text-muted-foreground md:flex">
            <a href="#how" className="transition-colors hover:text-foreground">
              {t("landing.nav_how")}
            </a>
            <a href="#modes" className="transition-colors hover:text-foreground">
              {t("landing.nav_modes")}
            </a>
            <Link to="/wallet" className="transition-colors hover:text-foreground">
              {t("landing.customer_entry")}
            </Link>
          </nav>
          <div className="flex items-center gap-2">
            <LanguageSelect className="w-[132px]" />
            <Button asChild variant="ghost" className="hidden sm:inline-flex">
              <Link to="/auth">{t("landing.nav_signin")}</Link>
            </Button>
            <Button asChild>
              <Link to="/auth" search={{ mode: "signup" }}>
                {t("landing.cta_primary")}
              </Link>
            </Button>
          </div>
        </div>
      </header>

      <main>
        {/* Hero */}
        <section className="mx-auto grid max-w-6xl items-center gap-10 px-4 py-14 md:grid-cols-2 md:py-20">
          <div>
            <p className="inline-flex items-center gap-2 rounded-full bg-secondary px-3 py-1 text-xs font-medium text-secondary-foreground">
              <Sparkles className="size-3.5" aria-hidden />
              {t("landing.badge")}
            </p>
            <h1 className="mt-5 text-4xl leading-tight font-bold text-balance md:text-6xl">
              {t("landing.hero_title")}
            </h1>
            <p className="mt-5 max-w-xl text-lg text-muted-foreground">{t("landing.hero_sub")}</p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button asChild size="lg">
                <Link to="/auth" search={{ mode: "signup" }}>
                  {t("landing.cta_primary")}
                  <ArrowRight className="size-4 flip-rtl" aria-hidden />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline">
                <a href="#how">{t("landing.cta_secondary")}</a>
              </Button>
            </div>
          </div>
          <div className="relative">
            <img
              src={heroShop}
              alt={t("landing.preview_wallet")}
              width={1280}
              height={960}
              className="w-full rounded-3xl border border-border object-cover shadow-lift"
            />
            <div className="surface-card absolute -bottom-6 start-4 w-56 p-4 sm:start-8">
              <div className="flex items-center gap-2">
                <Coffee className="size-4 text-primary" aria-hidden />
                <span className="text-sm font-semibold">ABC Coffee</span>
              </div>
              <p className="mt-2 font-display text-2xl font-bold">340</p>
              <p className="text-xs text-muted-foreground">{t("loyalty.points")}</p>
              <Progress value={63} className="mt-3" />
            </div>
          </div>
        </section>

        {/* How it works */}
        <section id="how" className="border-y border-border bg-card/60 py-16">
          <div className="mx-auto max-w-6xl px-4">
            <h2 className="text-3xl font-bold md:text-4xl">{t("landing.how_title")}</h2>
            <ol className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {steps.map((step, index) => (
                <li key={step.label} className="surface-card flex items-start gap-4 p-5">
                  <span className="brand-gradient flex size-10 shrink-0 items-center justify-center rounded-xl text-primary-foreground">
                    <step.icon className="size-5" aria-hidden />
                  </span>
                  <div>
                    <p className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                      {index + 1}
                    </p>
                    <p className="mt-1 font-medium">{step.label}</p>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </section>

        {/* Loyalty modes */}
        <section id="modes" className="mx-auto max-w-6xl px-4 py-16">
          <h2 className="text-3xl font-bold md:text-4xl">{t("landing.modes_title")}</h2>
          <div className="mt-10 grid gap-6 md:grid-cols-2">
            <article className="surface-card p-6">
              <div className="flex items-center gap-2 text-primary">
                <Star className="size-5" aria-hidden />
                <h3 className="text-xl font-semibold">{t("landing.points_mode")}</h3>
              </div>
              <p className="mt-3 text-muted-foreground">{t("landing.points_mode_desc")}</p>
              <div className="mt-6 rounded-2xl bg-muted p-5">
                <p className="text-sm text-muted-foreground">{t("loyalty.rule_points", { currency: "$", points: 2 })}</p>
                <p className="mt-2 font-display text-3xl font-bold">
                  {t("loyalty.points_value", { count: 340 })}
                </p>
                <Progress value={68} className="mt-4" />
                <p className="mt-2 text-sm text-muted-foreground">
                  {t("loyalty.to_next_points", { count: 60, reward: "Free Coffee" })}
                </p>
              </div>
            </article>
            <article className="surface-card p-6">
              <div className="flex items-center gap-2 text-primary">
                <Coffee className="size-5" aria-hidden />
                <h3 className="text-xl font-semibold">{t("landing.stamps_mode")}</h3>
              </div>
              <p className="mt-3 text-muted-foreground">{t("landing.stamps_mode_desc")}</p>
              <div className="mt-6 rounded-2xl bg-muted p-5">
                <p className="text-sm text-muted-foreground">{t("loyalty.rule_stamps", { count: 5 })}</p>
                <StampRow current={4} total={5} className="mt-3" />
                <p className="mt-3 font-display text-3xl font-bold">
                  {t("loyalty.stamps_value", { current: 4, total: 5 })}
                </p>
                <p className="mt-2 text-sm text-muted-foreground">
                  {t("loyalty.one_more_visit", { reward: "Free Haircut" })}
                </p>
              </div>
            </article>
          </div>
        </section>

        {/* Features */}
        <section className="border-y border-border bg-card/60 py-16">
          <div className="mx-auto grid max-w-6xl items-center gap-10 px-4 md:grid-cols-2">
            <div>
              <h2 className="text-3xl font-bold md:text-4xl">{t("landing.features_title")}</h2>
              <ul className="mt-8 space-y-6">
                {features.map((feature) => (
                  <li key={feature.title} className="flex gap-4">
                    <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-secondary text-secondary-foreground">
                      <feature.icon className="size-5" aria-hidden />
                    </span>
                    <div>
                      <p className="font-semibold">{feature.title}</p>
                      <p className="text-sm text-muted-foreground">{feature.body}</p>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
            <img
              src={counterQr}
              alt={t("landing.preview_dashboard")}
              loading="lazy"
              width={1024}
              height={1024}
              className="mx-auto w-full max-w-md"
            />
          </div>
        </section>

        {/* Final CTA */}
        <section className="mx-auto max-w-4xl px-4 py-20 text-center">
          <h2 className="text-3xl font-bold text-balance md:text-4xl">
            {t("landing.cta_footer_title")}
          </h2>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Button asChild size="lg">
              <Link to="/auth" search={{ mode: "signup" }}>
                {t("landing.cta_primary")}
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link to="/wallet">{t("landing.customer_entry")}</Link>
            </Button>
          </div>
        </section>
      </main>

      <footer className="border-t border-border py-8">
        <div className="mx-auto flex max-w-6xl flex-col items-center gap-4 px-4 text-sm text-muted-foreground sm:flex-row sm:justify-between">
          <Logo />
          <p>{t("landing.footer")}</p>
        </div>
      </footer>
    </div>
  );
}

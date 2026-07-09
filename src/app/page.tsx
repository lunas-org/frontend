"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  SealCheck,
  PlusCircle,
  ShareNetwork,
  CheckCircle,
  Lightning,
  GlobeHemisphereEast,
  DeviceMobile,
  Receipt,
  CaretDown,
} from "@phosphor-icons/react/dist/ssr";
import { Frame } from "@/components/Frame";
import { useI18n } from "@/lib/i18n";
import { LanguageToggle } from "@/components/LanguageToggle";

// Landing page — not part of CLAUDE.md's original locked screens, added so the deployed root
// URL isn't blank. Keeps the same calm/quiet-confidence tone and banned-words rules as the
// rest of the app (see context/banned-words.md) — no wallet/chain/crypto talk here either.
// Layout follows the Claude Design mockup (lunasui/Lunas App standalone src.html, screen 01).

export default function Home() {
  const { t } = useI18n();
  const heroRef = useRef<HTMLDivElement>(null);
  const footerRef = useRef<HTMLElement>(null);
  const [heroGone, setHeroGone] = useState(false);
  const [atFooter, setAtFooter] = useState(false);

  // Reveal the sticky bottom CTA once the hero (with its own CTAs) has scrolled out of view, so
  // the primary action is one tap away down the page without scrolling back up. Hide it again at
  // the footer, which already has its own CTA — otherwise the two buttons stack awkwardly.
  useEffect(() => {
    const hero = heroRef.current;
    const footer = footerRef.current;
    const ioHero = new IntersectionObserver(([e]) => setHeroGone(!e.isIntersecting), { threshold: 0 });
    const ioFooter = new IntersectionObserver(([e]) => setAtFooter(e.isIntersecting), { threshold: 0 });
    if (hero) ioHero.observe(hero);
    if (footer) ioFooter.observe(footer);
    return () => {
      ioHero.disconnect();
      ioFooter.disconnect();
    };
  }, []);

  const showCta = heroGone && !atFooter;

  return (
    <Frame>
      <div className="animate-fade-up">
        <header className="sticky top-0 z-20 flex items-center justify-between border-b border-line bg-paper/90 px-5 py-3.5 backdrop-blur-md">
          <div className="flex items-center gap-2">
            <Image src="/icon.png" alt="" width={30} height={30} />
            <span className="font-display text-[19px] font-extrabold tracking-tight text-primary">Lunas</span>
          </div>
          <div className="flex items-center gap-2.5">
            <LanguageToggle />
            <Link
              href="/login"
              className="flex h-[38px] items-center rounded-[10px] glass-btn px-4 text-[13.5px] font-semibold text-white transition-opacity hover:opacity-90 active:scale-95"
            >
              {t("landing.signIn")}
            </Link>
          </div>
        </header>

        <div ref={heroRef} className="flex flex-col items-center gap-5 px-6 pb-11 pt-[44px] text-center">
          <Image src="/hero.png" alt="" width={340} height={227} priority className="animate-float" />
          <h1 className="font-display max-w-xs text-[42px] font-extrabold leading-[1.05] tracking-tight text-ink">
            {t("landing.heroTitle")}
          </h1>
          <p className="max-w-[320px] text-[15.5px] leading-relaxed text-muted">{t("landing.heroSubtitle")}</p>
          <div className="mt-1.5 flex w-full max-w-[320px] flex-col gap-2.5">
            <Link
              href="/login"
              className="flex h-[52px] items-center justify-center rounded-2xl glass-btn text-base font-semibold text-white transition-transform active:scale-[.97]"
            >
              {t("landing.startSelling")}
            </Link>
            <Link
              href="/checkout?demo=1&title=Workshop+ticket&price=25.00&merchant=Studio+Mira"
              className="glass-card flex h-[52px] items-center justify-center rounded-2xl text-[15px] font-medium text-ink transition-transform active:scale-[.97]"
            >
              {t("landing.seeCheckout")}
            </Link>
          </div>
          <div className="flex items-center gap-2 text-[12.5px] text-muted">
            <SealCheck weight="fill" className="text-[16px] text-success" />
            {t("landing.noFees")}
          </div>
        </div>

        <section className="border-t border-line px-6 py-9">
          <p className="mb-5 text-center text-xs font-semibold uppercase tracking-[.12em] text-muted">
            {t("landing.howTitle")}
          </p>
          <div className="flex flex-col gap-3">
            <HowStep icon={<PlusCircle weight="regular" />} title={t("landing.how1Title")} desc={t("landing.how1Desc")} />
            <HowStep icon={<ShareNetwork weight="regular" />} title={t("landing.how2Title")} desc={t("landing.how2Desc")} />
            <HowStep icon={<CheckCircle weight="regular" />} title={t("landing.how3Title")} desc={t("landing.how3Desc")} accent />
          </div>
        </section>

        <section className="border-t border-line px-6 py-9">
          <p className="mb-5 text-center text-xs font-semibold uppercase tracking-[.12em] text-muted">{t("landing.whyTitle")}</p>
          <div className="grid grid-cols-2 gap-3">
            <WhyCard icon={<Lightning />} title={t("landing.why1Title")} desc={t("landing.why1Desc")} />
            <WhyCard icon={<GlobeHemisphereEast />} title={t("landing.why2Title")} desc={t("landing.why2Desc")} />
            <WhyCard icon={<DeviceMobile />} title={t("landing.why3Title")} desc={t("landing.why3Desc")} />
            <WhyCard icon={<Receipt />} title={t("landing.why4Title")} desc={t("landing.why4Desc")} />
          </div>
        </section>

        <section className="border-t border-line px-6 py-9">
          <p className="mb-5 text-center text-xs font-semibold uppercase tracking-[.12em] text-muted">{t("landing.pricingTitle")}</p>
          <div className="glass-panel rounded-[22px] px-6 py-8 text-center">
            <div className="pointer-events-none absolute -right-8 -top-10 h-40 w-40 rounded-full bg-white/10 blur-2xl" />
            <div className="pointer-events-none absolute -bottom-12 -left-8 h-36 w-36 rounded-full bg-mint/20 blur-2xl" />
            <p className="font-display relative text-[48px] font-extrabold leading-none tracking-tight">1%</p>
            <p className="relative mt-2 text-[14.5px] text-white/80">{t("landing.pricingPer")}</p>
            <p className="relative mt-3.5 text-[12.5px] text-white/55">{t("landing.pricingSub")}</p>
          </div>
        </section>

        <section className="border-t border-line px-6 py-9">
          <p className="mb-[18px] text-center text-xs font-semibold uppercase tracking-[.12em] text-muted">{t("landing.faqTitle")}</p>
          <div className="flex flex-col gap-2">
            <Faq q={t("landing.faq1Q")} a={t("landing.faq1A")} />
            <Faq q={t("landing.faq2Q")} a={t("landing.faq2A")} />
            <Faq q={t("landing.faq3Q")} a={t("landing.faq3A")} />
          </div>
        </section>

        <footer ref={footerRef} className="flex flex-col items-center gap-3.5 border-t border-line px-6 pb-10 pt-8 text-center">
          <Image src="/icon.png" alt="" width={36} height={36} className="opacity-90" />
          <Link
            href="/login"
            className="flex h-12 items-center rounded-[13px] glass-btn px-7 text-[15px] font-semibold text-white transition-transform active:scale-[.97]"
          >
            {t("landing.startFree")}
          </Link>
          <p className="text-xs text-muted">{t("landing.footer")}</p>
        </footer>
      </div>

      <div
        className={`pointer-events-none fixed inset-x-0 bottom-0 z-30 flex justify-center transition-all duration-300 ${
          showCta ? "translate-y-0 opacity-100" : "translate-y-full opacity-0"
        }`}
      >
        <div className="w-full max-w-[430px] bg-gradient-to-t from-paper via-paper/95 to-transparent px-5 pb-[calc(14px+env(safe-area-inset-bottom))] pt-6">
          <Link
            href="/login"
            className="pointer-events-auto flex h-[52px] items-center justify-center rounded-2xl glass-btn text-base font-semibold text-white transition-transform active:scale-[.97]"
          >
            {t("landing.startSelling")}
          </Link>
        </div>
      </div>
    </Frame>
  );
}

function HowStep({
  icon,
  title,
  desc,
  accent,
}: {
  icon: React.ReactNode;
  title: string;
  desc: string;
  accent?: boolean;
}) {
  return (
    <div className="flex items-start gap-4 rounded-2xl glass-card p-[18px]">
      <div
        className={`flex h-10 w-10 flex-none items-center justify-center rounded-xl text-[21px] ${
          accent ? "bg-success/10 text-success" : "bg-primary/[.08] text-primary"
        }`}
      >
        {icon}
      </div>
      <div>
        <p className="font-display mb-0.5 text-base font-bold text-ink">{title}</p>
        <p className="text-[13.5px] leading-relaxed text-muted">{desc}</p>
      </div>
    </div>
  );
}

function WhyCard({ icon, title, desc }: { icon: React.ReactNode; title: string; desc: string }) {
  return (
    <div className="flex flex-col gap-2 rounded-2xl glass-card p-4">
      <span className="text-[22px] text-primary">{icon}</span>
      <p className="font-display text-[14.5px] font-bold text-ink">{title}</p>
      <p className="text-[12.5px] leading-snug text-muted">{desc}</p>
    </div>
  );
}

function Faq({ q, a }: { q: string; a: string }) {
  return (
    <details className="group rounded-[14px] glass-card px-[18px] py-4">
      <summary className="flex cursor-pointer list-none items-center justify-between gap-3 text-[14.5px] font-semibold text-ink [&::-webkit-details-marker]:hidden">
        {q}
        <CaretDown className="flex-none text-base text-muted transition-transform duration-200 group-open:rotate-180" />
      </summary>
      <p className="mt-2.5 text-[13.5px] leading-relaxed text-muted">{a}</p>
    </details>
  );
}

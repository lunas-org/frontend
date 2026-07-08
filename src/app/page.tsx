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

// Landing page — not part of CLAUDE.md's original locked screens, added so the deployed root
// URL isn't blank. Keeps the same calm/quiet-confidence tone and banned-words rules as the
// rest of the app (see context/banned-words.md) — no wallet/chain/crypto talk here either.
// Layout follows the Claude Design mockup (lunasui/Lunas App standalone src.html, screen 01).

export default function Home() {
  return (
    <Frame>
      <div className="animate-fade-up">
        <header className="sticky top-0 z-20 flex items-center justify-between border-b border-line bg-paper/90 px-5 py-3.5 backdrop-blur-md">
          <div className="flex items-center gap-2">
            <Image src="/icon.png" alt="" width={30} height={30} />
            <span className="font-display text-[19px] font-extrabold tracking-tight text-primary">Lunas</span>
          </div>
          <Link
            href="/login"
            className="flex h-[38px] items-center rounded-[10px] bg-primary px-4 text-[13.5px] font-semibold text-white transition-opacity hover:opacity-90 active:scale-95"
          >
            Sign in
          </Link>
        </header>

        <div className="flex flex-col items-center gap-5 px-6 pb-11 pt-[44px] text-center">
          <Image src="/hero.png" alt="" width={340} height={227} priority className="animate-float" />
          <h1 className="font-display max-w-xs text-[42px] font-extrabold leading-[1.05] tracking-tight text-ink">
            Get paid from anywhere.
          </h1>
          <p className="max-w-[320px] text-[15.5px] leading-relaxed text-muted">
            Create a payment link in seconds. Your buyer pays however they like — the status
            flips to Lunas&nbsp;✓ the moment it&apos;s done.
          </p>
          <div className="mt-1.5 flex w-full max-w-[320px] flex-col gap-2.5">
            <Link
              href="/login"
              className="flex h-[52px] items-center justify-center rounded-2xl bg-primary text-base font-semibold text-white shadow-[0_8px_24px_rgba(47,42,107,0.28)] transition-transform active:scale-[.97]"
            >
              Start selling
            </Link>
            <Link
              href="/checkout?demo=1&title=Workshop+ticket&price=25.00&merchant=Studio+Mira"
              className="flex h-[52px] items-center justify-center rounded-2xl border border-line bg-transparent text-[15px] font-medium text-ink transition-colors hover:bg-black/[.04] active:scale-[.97]"
            >
              See a live checkout
            </Link>
          </div>
          <div className="flex items-center gap-2 text-[12.5px] text-muted">
            <SealCheck weight="fill" className="text-[16px] text-success" />
            No setup fees · settle in seconds
          </div>
        </div>

        <section className="border-t border-line px-6 py-9">
          <p className="mb-5 text-center text-xs font-semibold uppercase tracking-[.12em] text-muted">
            How it works
          </p>
          <div className="flex flex-col gap-3">
            <HowStep icon={<PlusCircle weight="regular" />} title="Create a product" desc="Add a name and price. You get a payment link and QR instantly." />
            <HowStep icon={<ShareNetwork weight="regular" />} title="Share it" desc="Send the link on WhatsApp, or let buyers scan the QR in person." />
            <HowStep icon={<CheckCircle weight="regular" />} title="Get Lunas ✓" desc="The moment payment lands, you both see it confirmed. No chasing." accent />
          </div>
        </section>

        <section className="border-t border-line px-6 py-9">
          <p className="mb-5 text-center text-xs font-semibold uppercase tracking-[.12em] text-muted">Why Lunas</p>
          <div className="grid grid-cols-2 gap-3">
            <WhyCard icon={<Lightning />} title="Instant confirmation" desc="Payments confirm in seconds, not days." />
            <WhyCard icon={<GlobeHemisphereEast />} title="Borderless" desc="Get paid by anyone, anywhere in the world." />
            <WhyCard icon={<DeviceMobile />} title="No app needed" desc="Buyers pay from any phone browser." />
            <WhyCard icon={<Receipt />} title="Clean receipts" desc="Every payment gets a shareable receipt." />
          </div>
        </section>

        <section className="border-t border-line px-6 py-9">
          <p className="mb-5 text-center text-xs font-semibold uppercase tracking-[.12em] text-muted">Pricing</p>
          <div className="rounded-[20px] bg-primary px-6 py-7 text-center text-white">
            <p className="font-display text-[44px] font-extrabold tracking-tight">1%</p>
            <p className="mt-1.5 text-[14.5px] text-white/75">per successful payment. That&apos;s it.</p>
            <p className="mt-3.5 text-[12.5px] text-white/55">No monthly fees · no setup cost · no minimums</p>
          </div>
        </section>

        <section className="border-t border-line px-6 py-9">
          <p className="mb-[18px] text-center text-xs font-semibold uppercase tracking-[.12em] text-muted">Questions</p>
          <div className="flex flex-col gap-2">
            <Faq q="Do my buyers need an account?" a="No. They open your link, scan, and pay. That's the whole flow." />
            <Faq q="When do I get my money?" a="Immediately. Your balance updates the second a payment confirms." />
            <Faq q={'What does "Lunas" mean?'} a='It means "paid in full." The green check is our promise: when you see Lunas ✓, the money is yours.' />
          </div>
        </section>

        <footer className="flex flex-col items-center gap-3.5 border-t border-line px-6 pb-10 pt-8 text-center">
          <Image src="/icon.png" alt="" width={36} height={36} className="opacity-90" />
          <Link
            href="/login"
            className="flex h-12 items-center rounded-[13px] bg-primary px-7 text-[15px] font-semibold text-white transition-transform active:scale-[.97]"
          >
            Start selling free
          </Link>
          <p className="text-xs text-muted">© 2026 Lunas · Terms · Privacy</p>
        </footer>
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
    <div className="flex items-start gap-4 rounded-2xl border border-line bg-white p-[18px]">
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
    <div className="flex flex-col gap-2 rounded-2xl border border-line bg-white p-4">
      <span className="text-[22px] text-primary">{icon}</span>
      <p className="font-display text-[14.5px] font-bold text-ink">{title}</p>
      <p className="text-[12.5px] leading-snug text-muted">{desc}</p>
    </div>
  );
}

function Faq({ q, a }: { q: string; a: string }) {
  return (
    <details className="group rounded-[14px] border border-line bg-white px-[18px] py-4">
      <summary className="flex cursor-pointer list-none items-center justify-between gap-3 text-[14.5px] font-semibold text-ink [&::-webkit-details-marker]:hidden">
        {q}
        <CaretDown className="flex-none text-base text-muted transition-transform duration-200 group-open:rotate-180" />
      </summary>
      <p className="mt-2.5 text-[13.5px] leading-relaxed text-muted">{a}</p>
    </details>
  );
}

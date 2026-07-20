# Market Analysis

## Who this is for

Lunas targets two roles, kept intentionally simple:

- **The merchant ("Sinta")** — an independent seller with a digital or low-logistics product:
  Lightroom presets, design templates, an online course, a consulting session, a small shop's
  catalog. This is exactly the segment already comfortable using a payment-link tool (Xendit,
  Midtrans, a Stripe Payment Link, a Gumroad page) but who currently has no equivalent for crypto
  payments that doesn't require them to understand chains.
- **The buyer ("Budi")** — someone who already holds crypto, but not necessarily on the specific
  chain or in the specific token a given merchant expects. This includes buyers whose funds sit
  on a centralized exchange, buyers who are "chain-poor" on the merchant's preferred network but
  "chain-rich" elsewhere, and newer crypto users who don't yet distinguish between chains at all.

## Market context

Indonesia is a large, digitally native creator and micro-commerce economy — presets, templates,
digital courses, freelance services, and small D2C shops are a substantial and growing share of
online transactions, most of it currently settled through card/e-wallet rails (Midtrans, Xendit,
QRIS) or informal bank transfer. Crypto ownership in Indonesia is also large and growing, but the
two worlds — everyday digital commerce and crypto holdings — rarely intersect at the point of
sale, precisely because of the friction described in [The Problem](problem.md). Lunas sits at
that intersection: it doesn't ask a buyer to acquire crypto to make a purchase, it asks them to
spend crypto they already have, the same way they already spend rupiah.

Beyond Indonesia specifically, the same shape of problem exists anywhere a seller wants to accept
crypto from a global audience without forcing every buyer onto one specific chain — which is most
of the addressable market for crypto-accepting small merchants today.

## Competitive landscape

| Category | Examples | What they solve | What they don't solve |
|---|---|---|---|
| **Traditional payment gateways** | Midtrans, Xendit, Stripe | Cards, e-wallets, bank transfer, QRIS — familiar UX, zero crypto exposure | No crypto acceptance at all |
| **Generic crypto payment processors** | Coinbase Commerce, NOWPayments, plain wallet-address QR | Accept crypto on a merchant-chosen chain | Buyer must already hold the right token, on the right chain; UI exposes chain/gas/address jargon; buyer often left confirming via a block explorer |
| **DEX/bridge aggregators** | Standalone bridge UIs | Let a *technical* user move funds between chains manually | This is a tool for the buyer to operate themselves, mid-checkout — the opposite of invisible; not integrated into a merchant checkout at all |
| **Lunas** | — | Buyer pays from any supported chain/token they already hold; merchant receives one settled asset on one chain; deposit itself triggers fulfillment; zero jargon on either side | Currently USDC-in / USDC-settled only (see [Roadmap](roadmap.md)); off-ramp to fiat bank rails is a separate, deferred integration |

The gap Lunas fills is specifically the **checkout layer**: existing crypto payment processors
assume the "any chain → my chain" problem is the buyer's to solve before they even reach
checkout. Lunas moves that problem *into* the payment rail itself, via ZeroDev's Smart Routing
Address, so it disappears for both sides instead of being handed to whichever party is less
equipped to deal with it.

## Why now

This product is only possible because of infrastructure that matured very recently:

- **Chain-abstracted routing addresses (ZeroDev SRA)** that can both accept multiple
  source-chain/token combinations into one address *and* trigger a destination-chain contract
  call the instant funds land — not just route funds, but route-and-act atomically.
- **Embedded, walletless smart accounts (ZeroDev Kernel + Magic)** mature enough to onboard a
  merchant with nothing but a Google login, with gas sponsorship so a $5 sale doesn't get eaten by
  fees.
- **Arbitrum as a fast, cheap, credible settlement layer** with first-class ZeroDev support,
  making per-transaction cost negligible even at small ticket sizes.

Before these were production-ready together, "crypto checkout that feels like cash" required
either a centralized custodian in the middle (defeating self-custody) or forcing the friction
described in [The Problem](problem.md) onto the buyer. Lunas is a bet that this infrastructure
window is now open.

## Go-to-market angle (post-hackathon)

The natural wedge is sellers who already distribute payment links informally over WhatsApp and
Instagram — digital creators and micro-shops — since Lunas's product shape (title + price → link
+ QR, shared the same way) requires no behavior change from how they already sell, only a new
option for how buyers can pay. Adoption doesn't require merchants to understand crypto either:
their side of the product is a normal-looking payment-link dashboard with a balance and a list of
orders.

# Our Solution

## Lunas: a payment link that doesn't care where the money starts

Lunas gives a merchant a QR code that behaves like a normal payment link — but underneath, it is
a **ZeroDev Smart Routing Address (SRA)**: a single address that accepts supported tokens from
multiple source chains and automatically routes them to one destination. A buyer pays from
whatever they already hold — ETH on Base, USDC on Optimism, a balance sitting on an exchange —
and it arrives, seconds later, as USDC on Arbitrum, already forwarded to the merchant.

Neither party ever picks a chain. The merchant never says "make sure you're on Arbitrum." The
buyer never bridges anything manually. That's the entire product.

## The magic moment

> A buyer pays from a completely different chain than the merchant settles on, the order is
> fulfilled on Arbitrum instantly, and the buyer never knew a bridge happened.

This is deliberately the one thing the product is built to make undeniable. Everything else —
onboarding, dashboard, receipts — exists to support this moment without diluting it.

## How the pieces fit together

**1. Invisible accounts.** A merchant logs in with Google (via Magic). This silently creates a
smart contract account (a ZeroDev Kernel account) behind the scenes — no seed phrase, no
"connect wallet" prompt, no key the merchant has to manage or lose.

**2. A payment link *is* a routing address.** When a merchant creates a product, Lunas asks
ZeroDev to mint a Smart Routing Address for that specific order, configured with:
- which chains/tokens it will accept from (any of Ethereum, Optimism, Base, Arbitrum, Polygon,
  BSC — USDC on each),
- where it settles (Arbitrum One), and
- **what happens the instant funds arrive** — not just "hold the money," but *execute a
  contract call on deposit*.

That third part is the innovative core of the ZeroDev subtrack this project targets: the deposit
itself triggers order fulfillment. There is no separate "confirm payment" step, no webhook a
merchant has to wire up, no polling a bank API. The blockchain event *is* the confirmation.

**3. The deposit-triggered action.** On arrival, the SRA executes two calls against our
`Checkout.sol` contract on Arbitrum: hand over the delivered USDC, then call `fulfillOrder`,
which records the order as paid and forwards the funds straight to the merchant's own balance.
See [Smart Contract](smart-contract.md) for exactly why it's two calls, not one.

**4. Confirmation without a spinner of doubt.** The frontend watches for the `OrderPaid` event on
Arbitrum. The moment it fires, the buyer's screen flips to **"Lunas ✓"** — no page refresh, no
manual "I've paid" button, no ambiguity. The few seconds of routing delay are framed as
"Pembayaran kamu lagi di jalan…" ("your payment is on its way") — an intentional, calm state, not
an error.

**5. Money the merchant can actually see and prove.** The merchant's dashboard balance is read
directly from their smart account's USDC balance on Arbitrum — not a cached number — and every
paid order links straight to its Arbiscan transaction, so "we got paid" is independently
verifiable, not just a UI claim.

## Why this had to be built on SRA specifically, not bolted on

A simpler version of this product could accept payment on a single fixed chain and call it done —
but that collapses back into exactly the friction described in [The Problem](problem.md): the
buyer still has to already be on the right chain, holding the right token. The Smart Routing
Address is not an optimization on top of a normal payment flow; it **is** the payment flow. Remove
it, and the QR code becomes an ordinary single-chain address, and the product loses the one thing
that makes it different from a wallet address printed on a napkin.

## What the user actually sees

No jargon, ever — not "wallet," "chain," "gas," "bridge," "token," "sign," or "approve." Instead:

| Instead of | Lunas says |
|---|---|
| Connect Wallet | Lanjut dengan Google |
| Transaction pending | Pembayaran kamu lagi di jalan… |
| Transaction confirmed | Lunas ✓ |
| Balance | Saldo |
| Send | Kirim |
| Receipt | Struk |

Full flow and screen-by-screen detail: [Concept & User Flow](concept.md).

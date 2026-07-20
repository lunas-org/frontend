# Roadmap

Everything below is a deliberately deferred, real gap — not an oversight. Each is scoped out of
the hackathon MVP because it doesn't make the core "pay from anywhere, see Lunas ✓ instantly"
moment more convincing, only adds surface area.

## Merchant withdrawal to an external address

**Status: real code exists, currently blocked by a paid-plan requirement, on purpose left
visible.** Once a buyer pays, USDC lands automatically in the merchant's smart account — that
part works today, proven with real funds (see [Deployments](deployments.md)). Moving that balance
elsewhere requires operating the smart account on Arbitrum One's mainnet bundler, which returns
HTTP 402 ("No Plan found") without a paid ZeroDev plan. The withdraw screen calls the real
transfer function and surfaces that real error rather than faking success — an explicit product
decision, not a missing feature dressed up. Two paths forward:

1. Purchase a ZeroDev mainnet plan (Launch tier, ~$69/mo).
2. Change where the SRA forwards funds to a plain externally-owned account instead of a smart
   contract account — an EOA can send a standard transaction with a small amount of ETH for gas,
   no bundler or plan required. Worth real consideration for a production version, since it
   removes a paid dependency entirely.

Three small real test deposits (roughly $2.50 total) remain stranded at their SRA addresses from
early testing, recoverable the same way once a plan or the EOA approach exists — deliberately not
worth purchasing a monthly plan to reclaim.

## Off-ramp to a bank account

Moving USDC out of the merchant's own account is a different problem from turning that USDC into
rupiah in a bank account. The latter needs an integration with a centralized exchange or an
off-ramp provider (Indodax, Tokocrypto, or a Transak/MoonPay-style API with Indonesia support),
which brings KYC and compliance requirements well beyond hackathon scope. Today, the withdraw
screen includes a plain-language walkthrough for merchants who want to send their balance on to
an exchange themselves; a fully integrated in-app off-ramp is future work.

## Supporting assets beyond USDC

The product intentionally accepts and settles only USDC today. Supporting a buyer paying in a
native asset (ETH) or another token would require a swap-to-USDC step inside the SRA's
destination action — a DEX call ahead of `fulfillOrder` — rather than simply adding more entries
to the accepted source list. Not attempted yet; the current scope proved out the routing +
fulfillment mechanic first.

## Bring-your-own-wallet onboarding (Magic Connect)

Merchants who already hold a wallet (MetaMask, Rabby) could plug it in directly via Magic
Connect instead of going through Google login. Deliberately not built: it would reintroduce the
concept of "connect a wallet" into the merchant flow, working against the product's central rule
that crypto infrastructure should never surface as a user-facing choice. If ever added, it's
purely an onboarding-layer change — the Smart Routing Address doesn't care whether the receiving
address came from a Kernel smart account or a raw EOA, so nothing about the payment flow would
need to change.

## Explicitly out of scope for this product shape

- Multi-merchant organizations, business accounts, KYC.
- Subscriptions or recurring payments — a fundamentally different, more fragile primitive than a
  one-time payment link.
- A merchant's own token or loyalty points — would introduce a new asset/liquidity surface this
  product is specifically designed to avoid.
- A native mobile app — a PWA covers "add to home screen" app-like behavior without App Store
  distribution overhead.
- Analytics dashboards, complex invoicing, refund flows.

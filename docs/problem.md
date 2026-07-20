# The Problem

## Getting paid in crypto is still a technical negotiation

Imagine a small Indonesian creator — call her Sinta — sells Lightroom presets for $5. A buyer,
Budi, wants to pay her in crypto instead of a card. Today, that simple transaction turns into a
back-and-forth neither of them signed up for:

1. **Sinta has to pick and expose a chain.** She gives Budi a wallet address and has to specify
   which network it's on — Ethereum? Arbitrum? Polygon? If she gets this wrong, or Budi sends the
   right token on the wrong network, the money can be unrecoverable.
2. **Budi has to already hold the right asset, on the right chain.** If his funds are on Binance,
   or bridged into Base, or sitting as ETH instead of USDC, he now has to become his own bridge
   operator: withdraw, swap, bridge, wait, confirm — five extra steps and five extra chances to
   pay a fee, hit a stuck transaction, or send to the wrong place, before he's even paid for the
   preset.
3. **Both sides are exposed to jargon that has nothing to do with the purchase.** "Connect
   wallet," "approve," "gas," "confirm on your network," "bridge first" — none of this is about
   the product being $5. It's infrastructure friction, and it lands entirely on two people who
   just want to complete a sale.
4. **Existing "crypto payment" tools solve the wrong half of this.** Generic crypto checkout
   widgets render a QR code for a single address on a single chain and stop there — they assume
   the buyer has already done the hard part (holding the right token, on the right chain,
   themselves). That assumption is exactly where real buyers get stuck.
5. **Confirmation is uncertain from the buyer's side.** Even when a payment does go through,
   many crypto checkouts leave the buyer staring at a spinner or a block explorer, unsure whether
   anything actually happened — the opposite of the instant, legible confirmation a cash or card
   payment gives.

The result: sellers who would benefit from receiving crypto (no chargebacks, global reach, instant
settlement) either don't offer it, or offer it in a way that only their most technical buyers can
actually use. The addressable *audience* for crypto payments is far smaller than the addressable
audience for the underlying value proposition, purely because of interface friction — not because
people don't want to pay this way.

## What has to be true for this to disappear

For a non-technical buyer and a non-technical seller to transact in crypto and have it feel like
cash changing hands, three things have to hold simultaneously:

- The seller never has to think about which chain they're "on."
- The buyer never has to think about which chain or token they're paying *from* — whatever they
  already hold, wherever it sits, should just work.
- Confirmation has to be immediate and unambiguous, without either party needing to read a block
  explorer to know if it worked.

Before early 2026, the infrastructure to make all three true *simultaneously*, for a real dApp,
did not reliably exist. See [Our Solution](solution.md) for how ZeroDev's Smart Routing Address
changes that, and why it's the mechanism this entire product is built around rather than bolted
onto.

# Design Principles

## Brand thesis

**"Crypto that feels like paying with cash."** Calm, trustworthy, fast, friendly, Indonesian-
first. The product's personality is quiet confidence: it does something technically complex and
makes it feel boringly easy.

## The one non-negotiable rule

No screen, error message, or tooltip may ever contain the words *wallet, chain, network, bridge,
gas, address, token, blockchain, crypto, sign, approve, transaction hash, smart account,* or
*gwei.* Instead: **Bayar, Saldo, Lunas, Kirim, Produk, Pesanan, Struk, Bagikan.** Money is always
shown as a currency amount ("Rp75.000" / "$5") — never raw token decimals. This is treated as a
hard constraint, checked before every demo, not a style preference.

## Visual language

- **Type** — a characterful display face for amounts and headlines (the number is the hero on
  every screen: large, tabular-figured, confident), a clean body face for everything else.
- **Palette** — warm near-white background, near-black ink, a deep indigo primary for trust and
  action, a mint-forward green reserved for "Lunas" moments.
- **Surfaces** — generous corner radii, flat surfaces, restrained use of gradients, a
  liquid-glass treatment used sparingly for elevation rather than decoration.
- **Signature moment** — the "Lunas ✓" receipt: a satisfying check and receipt slide-in, quick and
  earned, never confetti-overload. This is the one thing the product should be remembered by.

## Mobile-first, always

Every screen is designed at 375px width first — most buyers open a payment link from a phone.
Primary actions live in the thumb zone, full-width, at least 48px tall. Touch targets stay at
least 44px with generous spacing, one primary action per screen. The QR on checkout is large and
centered. Secondary actions use bottom sheets, not modals.

## Motion

Motion is used to make waiting legible, not to decorate. Only `transform`/`opacity` are animated,
loops stay under two seconds, and everything respects `prefers-reduced-motion`. The handful of
seconds a cross-chain payment takes to route is framed by motion and copy as an intentional,
calm state — never as something that looks broken.

## Writing errors and empty states

Errors describe what happened and the next step, in the app's voice — never vague "something went
wrong" text and never technical detail the user can't act on. Empty states invite the next action
rather than just reporting absence.

## Reveal the magic, without adding complexity

For an audience that does understand what's happening underneath (judges, technical partners),
the product briefly surfaces a plain-language line — "Pembayaran dari Base diterima" — right
before it resolves to "Lunas ✓." A buyer reads that as "it worked." A judge reads it as proof the
cross-chain routing actually happened. It's one line, on screen for a moment, then gone — the
one deliberate crack in the "never mention infrastructure" rule, and it still never uses a banned
word.

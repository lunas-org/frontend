# Concept & User Flow

Lunas has exactly two roles, kept deliberately simple in both product and code:

- **Sinta — the merchant.** Creates products, receives money.
- **Budi — the buyer.** Pays.

## End-to-end flow

```
MERCHANT (Sinta)
  Login with Google ──► Smart account created (hidden)
        │
        ▼
  Create product "Preset Lightroom – $5"
        │
        ▼
  System creates a Smart Routing Address (destination = Arbitrum, action = fulfillOrder)
        │
        ▼
  Merchant gets: payment link + QR ──► shares via WhatsApp/IG

BUYER (Budi)
  Opens link ──► sees product + price + QR
        │
        ▼
  Scans QR, pays from ANY supported chain — ETH mainnet, Optimism, Base, Arbitrum,
  Polygon, or BSC — using USDC they already hold, or straight from an exchange
        │
        ▼
  SRA receives on the source chain ──► routes to Arbitrum
        │
        ▼
  On arrival, the SRA triggers fulfillOrder() on the Checkout contract:
      • marks the order paid
      • forwards the USDC to Sinta
      • emits an OrderPaid event
        │
        ▼
  Frontend (watching the event) flips to "Lunas ✓" + shows a receipt
        │
        ▼
  Sinta's dashboard: new paid order, balance up — with a link to the transaction on Arbiscan
```

## Screens

### Merchant

1. **Login** — one button: "Lanjut dengan Google." Nothing else.
2. **Dashboard** — balance ("Saldo") up top, a primary "+ Buat Produk" button in the thumb zone,
   and a list of recent orders with status pills (Menunggu / Lunas ✓), each linking to its
   on-chain proof once paid.
3. **Create product** — two fields: product name, price. One button: "Buat link bayar." Produces
   the product's QR and link.
4. **Product detail** — the QR (large), the shareable link, a "Bagikan via WhatsApp" action, a
   live count of paid orders, and the ability to delete a product that's no longer needed.
5. **Settings** — merchant profile plus a copyable account address, for merchants who do want to
   see the underlying receiving address (kept out of the primary flow, available if asked for).
6. **Withdraw** — move settled USDC out of the smart account to another address, with a built-in
   walkthrough for merchants who want to send it on to an exchange to cash out. See
   [Roadmap](roadmap.md) for the current limitation here.

### Buyer

7. **Checkout** — product name, the price as the hero element, a large centered QR, and one line
   of reassurance: "Bayar dari mana saja." No login required. Desktop buyers with a browser
   wallet can alternatively pay directly from the page instead of scanning.
8. **Paying / processing** — a calm animation and the line "Pembayaran kamu lagi di jalan…,"
   turning the few seconds of cross-chain routing into something that reads as intentional, never
   as a stall or an error.
9. **Success / receipt** — the "Lunas ✓" moment, followed by a clean e-struk (product, amount,
   date), shareable.

## States that matter as much as the happy path

- **Loading** — skeletons, not spinners, wherever practical.
- **Processing** — the "di jalan…" calm-in-between state described above.
- **Underpaid / wrong amount** — calm, directional copy, never alarmed.
- **Unsupported source token** — points the buyer to a way to retrieve funds rather than dead-
  ending them.
- **Expired / already paid** — clear and non-alarming.

## Why the roles stay this narrow

The MVP deliberately excludes multi-merchant organizations, subscriptions, a merchant's own
token/loyalty system, KYC, and a native mobile app (a PWA — "Add to Home Screen" — covers the app
feel without the App Store overhead). Every one of these would add real surface area without
making the core moment — pay from anywhere, see "Lunas ✓" instantly — any more convincing. See
[Roadmap](roadmap.md) for what's intentionally deferred and why.

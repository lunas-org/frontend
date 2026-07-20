# Lunas

**Crypto that feels like paying with cash.**

Lunas is a payment gateway for independent sellers — digital creators, small online shops,
freelancers — that lets any buyer pay from whatever crypto they already hold, on whatever chain
or exchange it happens to sit on, and have it land as a clean, spendable balance for the
merchant. No wallets to connect, no chains to pick, no bridging to figure out. The buyer scans a
QR, pays, and sees **"Lunas ✓"** — Indonesian for "paid off," the exact word a shopkeeper would
stamp on a receipt.

Everything about the product is built around one rule: **the end user must never see a single
word of crypto.** Not "wallet," not "chain," not "gas," not "bridge." If a screen leaks any of
that, it's a bug, even if the underlying mechanism is technically accurate.

This documentation covers why we built Lunas, who it's for, how it works end to end, and the
technology underneath it — for judges, partners, and anyone picking up the codebase after us.

## At a glance

| | |
|---|---|
| **Built for** | UXmaxx Hackathon — General Track, ZeroDev Smart Routing Address subtrack |
| **Settlement chain** | Arbitrum One |
| **Settlement asset** | Native USDC |
| **Core mechanism** | ZeroDev Smart Routing Address (SRA) — any chain, any supported token → USDC on Arbitrum, with a contract call triggered on arrival |
| **Onboarding** | Magic (Google login) — smart account created invisibly, no seed phrase |
| **Status** | Live on Arbitrum One mainnet. Real USDC payments from Base have been sent, routed, and settled end to end. |

## Links

- **Live app:** [lunas-payment.vercel.app](https://lunas-payment.vercel.app)
- **Checkout contract (Arbitrum One):** [`0x03ab0edfb40078fe8a5f98acbc713abd4ae4f9fb`](https://arbiscan.io/address/0x03ab0edfb40078fe8a5f98acbc713abd4ae4f9fb)
- **Demo video:** [Watch on Google Drive](https://drive.google.com/file/d/1JBVa_Q950T_Ay3cfEfqwBe_7ILkq6dLx/view?usp=sharing)
- **Pitch deck:** [View on Google Slides](https://docs.google.com/presentation/d/1ZTDcgOeLfjZX1az_G1IsdbUUOcuhxPgLvblA3Qb1SSQ/edit?usp=sharing)

## Where to start

- Not sure why this exists at all? Start with [The Problem](problem.md) and [Our Solution](solution.md).
- Evaluating the market fit? Read [Market Analysis](market-analysis.md).
- Want the product walkthrough? Read [Concept & User Flow](concept.md).
- Here for the engineering? Jump straight to [Architecture](architecture.md), [Tech Stack](tech-stack.md), and [Smart Contract](smart-contract.md).

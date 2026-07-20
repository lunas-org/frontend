# Tech Stack

| Layer | Choice | Why |
|---|---|---|
| Framework | **Next.js 14 (App Router) + TypeScript** | Server-rendered checkout links for fast first paint; API routes double as the backend — no separate service. |
| Styling | **Tailwind CSS** | Mobile-first utility classes, container-query responsive layout. |
| Motion | **Framer Motion** | The "Lunas ✓" moment and the calm "processing" state; respects `prefers-reduced-motion`. |
| Smart accounts (AA) | **ZeroDev SDK** (`@zerodev/sdk`, `@zerodev/ecdsa-validator`) | ERC-4337 Kernel smart accounts (`KERNEL_V3_3`), gas sponsorship. |
| Chain abstraction | **ZeroDev Smart Routing Address** (`@zerodev/smart-routing-address`) | `createSmartRoutingAddress`, `createCall`, `FLEX` placeholders, `getWithdrawTokensCalls` — the core payment rail; see [Architecture](architecture.md). |
| Social login (signer) | **Magic** (`magic-sdk`) | Google login → an EIP-1193 provider, passed directly into ZeroDev's Kernel account as its signer — no seed phrase, no separate wallet step. |
| EVM libraries | **viem** | Public clients, event log queries (`getLogs`), ABI encoding, unit parsing. |
| Smart contract | **Solidity 0.8.20 + Foundry** | `Checkout.sol`; OpenZeppelin `SafeERC20` + `Ownable`. |
| QR generation | **`qrcode.react`** | Renders the Smart Routing Address as the buyer-facing QR. |
| Off-chain metadata | **`localStorage`** (hackathon build), namespaced per merchant address | Product/order cache — payment truth stays on-chain (see [Architecture](architecture.md)). Designed to swap for Supabase/Postgres without touching payment logic. |
| Icons | **Phosphor Icons** | UI iconography. |
| PWA | **`next-pwa`** | "Add to Home Screen," full-screen app feel, no App Store distribution needed. |
| i18n | Custom lightweight provider (`src/lib/i18n.tsx`) | English/Indonesian UI copy. |
| Hosting | **Vercel** | Frontend + API routes together. |

## Chains and assets

- **Settlement chain:** Arbitrum One (mainnet), chain ID `42161`.
- **Settlement asset:** native USDC (`0xaf88d065e77c8cC2239327C5EDb3A432268e5831` — Circle-issued,
  verified against Arbiscan).
- **Accepted source chains/tokens:** USDC on Ethereum mainnet, Optimism, Base, Arbitrum, Polygon,
  and BSC. Deliberately USDC-only on both ends — see [Roadmap](roadmap.md) for why native-asset
  support (e.g. paying in ETH) isn't in yet.

## A note on how this was built

None of ZeroDev's or Magic's SDK signatures were taken from memory or assumed from documentation
snippets alone — every non-trivial call (`createSmartRoutingAddress`'s parameter shape, where
`version` nests inside `config`, the exact signer type Magic's provider satisfies) was confirmed
directly against the installed package's TypeScript type definitions before being used. This
mattered in practice: a same-chain native-route bug and a misplaced `version` parameter were both
found this way, not by reading docs.

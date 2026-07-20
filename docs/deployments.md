# Deployments

## Live links

- **Live app:** [lunas-payment.vercel.app](https://lunas-payment.vercel.app)
- **Checkout contract (v2, Arbitrum One):** [`0x03ab0edfb40078fe8a5f98acbc713abd4ae4f9fb`](https://arbiscan.io/address/0x03ab0edfb40078fe8a5f98acbc713abd4ae4f9fb) on Arbiscan

## Checkout.sol

| Network | Chain ID | Address | USDC used | Status |
|---|---|---|---|---|
| Arbitrum Sepolia (testnet) | 421614 | `0x6674b5a82fd97E07EB26Cd5aab0D25866Afd76C9` | testnet USDC | live |
| Arbitrum One (mainnet) — v1 | 42161 | `0x309Da073796E6Bd75135174EB7EC3Fb5E4c21282` | `0xaf88d065e77c8cC2239327C5EDb3A432268e5831` | **dead — do not use** |
| Arbitrum One (mainnet) — v2 | 42161 | [`0x03ab0edfb40078fe8a5f98acbc713abd4ae4f9fb`](https://arbiscan.io/address/0x03ab0edfb40078fe8a5f98acbc713abd4ae4f9fb) | `0xaf88d065e77c8cC2239327C5EDb3A432268e5831` (verified on Arbiscan — Circle native USDC) | **live** |

v1 is dead: it had `onlyRouter` on `fulfillOrder` and its SRA action only called `fulfillOrder`
without first transferring USDC into the contract. A real payment bridged successfully but the
fulfillment call reverted, stranding funds at the SRA address. v2 fixed both issues — see
[Smart Contract](smart-contract.md) and [Security](security.md) for the full story.

## Verified live on mainnet (v2)

```
owner()  -> 0x92F9778c18D43b9721E58A7a634cb65eeA80661d
usdc()   -> 0xaf88d065e77c8cC2239327C5EDb3A432268e5831
paused() -> false
```

## Real-money validation

Two consecutive real USDC payments from Base were sent through the live product end to end after
the v2 fix:

1. **$1 USDC, Base → Arbitrum.** Confirmed on-chain via `cast call`: the merchant's real USDC
   balance increased on Arbitrum One, the order flipped to "Lunas ✓" without a manual refresh,
   and the transaction is visible on Arbiscan. This is the flow the product is built around,
   proven with real funds, not a simulation.
2. An earlier $0.50 (too small to route) and $1.50 (paid in ETH, which the contract doesn't
   accept — see [Security](security.md)) test each surfaced a real bug, both since fixed or
   understood and documented. Those two deposits remain stranded at their respective SRA
   addresses; recovering them requires a paid ZeroDev mainnet plan the team has deliberately not
   purchased for ~$2.50 of test funds (see [Roadmap](roadmap.md)).

## Deploying

Testnet: `forge script script/Checkout.s.sol:DeployCheckout --rpc-url <rpc> --broadcast`, reading
`DEPLOYER_PRIVATE_KEY` and `ARBITRUM_SEPOLIA_USDC` from a gitignored `contracts/.env`.

Mainnet: a dedicated script, `forge script script/CheckoutMainnet.s.sol:DeployCheckoutMainnet
--rpc-url $ARBITRUM_ONE_RPC --broadcast`, reading `DEPLOYER_PRIVATE_KEY` and `ARBITRUM_ONE_USDC`
— kept separate from the testnet script specifically so a wrong `--rpc-url` can't silently deploy
against the wrong USDC address.

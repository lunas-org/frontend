# Architecture

## System overview

```
┌─────────────┐        Google login          ┌───────────────────┐
│   Merchant   │ ────────────────────────────► │  Magic (signer)   │
│   (Sinta)    │                                └─────────┬─────────┘
└──────┬───────┘                                          │ EIP-1193 provider
       │ creates product                                  ▼
       │                                        ┌───────────────────┐
       │                                        │ ZeroDev Kernel     │
       │                                        │ smart account      │
       │                                        │ (ERC-4337)         │
       │                                        └─────────┬─────────┘
       ▼                                                  │ owner
┌─────────────────────────────────────────────────────────▼─────────┐
│  createSmartRoutingAddress()                                       │
│  owner = merchant's smart account · destChain = Arbitrum One       │
│  srcTokens = USDC on {Ethereum, Optimism, Base, Arbitrum, Polygon,  │
│              BSC} · action = [transfer→Checkout, fulfillOrder]     │
└─────────────────────────────────────┬───────────────────────────┘
                                       │ QR / link encodes this address
                                       ▼
┌──────────────┐   pays USDC from any of the above chains    ┌──────────────────────┐
│  Buyer (Budi) │ ────────────────────────────────────────────►│ Smart Routing Address │
└──────────────┘                                               └──────────┬───────────┘
                                                                            │ bridges + delivers
                                                                            ▼
                                                                 ┌────────────────────┐
                                                                 │  Arbitrum One       │
                                                                 │  1. USDC.transfer   │
                                                                 │     → Checkout.sol  │
                                                                 │  2. fulfillOrder()  │
                                                                 │     → forwards USDC │
                                                                 │       to merchant   │
                                                                 │     → emits         │
                                                                 │       OrderPaid     │
                                                                 └──────────┬─────────┘
                                                                            │ event
                                                                            ▼
                                                                 ┌────────────────────┐
                                                                 │ Frontend watches    │
                                                                 │ OrderPaid via viem  │
                                                                 │ → flips UI to       │
                                                                 │   "Lunas ✓"         │
                                                                 └────────────────────┘
```

## Why the deposit-triggered action is two calls, not one

A Smart Routing Address executes its configured action **as itself** — it delivers the bridged
USDC to its own address on Arbitrum, then calls the configured action *from* that address. So the
action for each order is two atomic calls:

1. `USDC.transfer(checkoutAddress, amount)` — the SRA hands the USDC it just received to
   `Checkout.sol`.
2. `fulfillOrder(orderId, merchant, amount)` — the contract forwards that USDC to the merchant and
   records the order as paid.

Both calls happen atomically, in the same action. This shape was arrived at after a real payment
against an earlier design (one call, a fixed-router permission check) got stuck: the earlier
version assumed a fixed address would call `fulfillOrder`, but the actual caller is the SRA
itself, and the contract never held any USDC to forward in the first place. The fix, and the full
post-mortem, is documented in [Smart Contract](smart-contract.md) and [Security](security.md).

## Data model

Payment *truth* lives on-chain — the `OrderPaid` event and the contract's `paid` mapping are
authoritative. Off-chain storage exists purely as a fast, human-readable cache:

```
Merchant { id, email, smartAccountAddress, createdAt }
Product  { id, merchantId, title, priceUsd, createdAt }
Order    { id (= orderId), productId, sraAddress, status: 'pending' | 'paid',
           txHash?, chainId, paidAt? }
```

For the hackathon build this cache is `localStorage`, namespaced per merchant smart-account
address (so switching Google accounts on the same browser never leaks another merchant's data —
see [Security](security.md)). The intended production replacement is Supabase/Postgres, with the
same shape; nothing about the payment logic changes when that swap happens, since payment truth
was never stored there.

## Payment detection

1. When a checkout page opens, an `Order` is ensured to exist, tied to its SRA.
2. The frontend polls (with an event-log lookup) for the `OrderPaid` event on Arbitrum, filtered
   to that order's `orderId`, via viem's `getLogs`.
3. On a match: the order's local status flips to `paid`, its `txHash` is recorded, and the UI
   flips to **Lunas ✓** — no manual refresh, no "I've paid" button.
4. The merchant's dashboard balance is read live from their smart account's on-chain USDC
   balance, not from a running local total — so the number shown is never out of sync with
   reality.

## Merchant balance and withdrawal

Because `fulfillOrder` forwards USDC directly to the merchant's smart account the instant an
order settles, "Saldo" is simply that account's real USDC balance on Arbitrum One — there is no
pooled or custodial balance anywhere in this system. Moving that balance elsewhere (to an
exchange, to cash out) is a separate on-chain transfer from the merchant's own smart account; see
[Roadmap](roadmap.md) for the current status of that flow.

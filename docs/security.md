# Security

## Contract audit history

`Checkout.sol` went through an internal audit pass before the mainnet deploy. Two real findings
came out of it, both addressed before funds were put at risk:

**Critical (fixed) — the original router-permission design.** The first version of the contract
gated `fulfillOrder` behind `onlyRouter`, checked against a fixed address. In practice, the Smart
Routing Address calls the destination action *as itself* on deposit, not from a fixed router
address — so the permission check was checking the wrong thing entirely. Combined with the SRA's
action only containing the `fulfillOrder` call (not a preceding USDC transfer into the contract),
this meant a real payment would bridge successfully but then revert on arrival, stranding funds
at the SRA address with no way to complete the order. This was caught during live mainnet
testing, not by the initial audit — see [Deployments](deployments.md) for the specific incident —
and led to a full v2 rewrite: the permission check was removed (safe, because `fulfillOrder` can
only move USDC the contract actually holds — see [Smart Contract](smart-contract.md)), and the
SRA's action was changed to two calls so the contract actually receives funds before forwarding
them.

**Medium (fixed) — no emergency stop.** The original contract had no way to pause fulfillment if
the owner key or SRA configuration were ever suspected compromised. `setPaused`/`paused` were
added, owner-gated, with no fund-custody implications since the contract never holds a balance
between orders.

**Low-severity items** (input validation on zero address/zero amount, disabling
`renounceOwnership` so it can't permanently lock out the pause switch) were also addressed and
are covered by the test suite described in [Smart Contract](smart-contract.md).

## Operational security

- **The deployer/owner key is a hot wallet, not a throwaway.** It holds real fund-forwarding
  authority (`setPaused`) on a live mainnet contract and is treated with the same care as any key
  that can affect real user funds — stored only in a gitignored `.env`, never committed.
- **Merchant funds are never custodied by Lunas.** `fulfillOrder` forwards USDC to the merchant's
  own smart account in the same transaction it's received — there is no intermediate balance
  anyone but the merchant controls.
- **Deployment was verified independently before broadcasting.** The USDC contract address and
  RPC endpoint used for the mainnet deploy were cross-checked against Arbiscan and Arbitrum's own
  documentation, not taken from a single source, and the deploy transaction was simulated
  (`forge script` without `--broadcast`) before being sent for real.

## Known, accepted limitations

- **USDC-only, deliberately.** Accepting native ETH as a source asset was tried and reverted: the
  SRA delivers whatever token the buyer actually sent — it does not auto-swap into USDC — so an
  ETH payment would bridge successfully but then have nothing for `fulfillOrder`'s USDC transfer
  to move, exactly the same failure mode as the router bug above, just from a different cause.
  Confirmed with a real, now-stuck $1.50 test payment. Restricting to USDC on both ends means the
  delivered asset always matches what the contract expects to move. See [Roadmap](roadmap.md) for
  what supporting other assets would require.
- **Merchant withdrawal to an external address requires a paid ZeroDev mainnet plan** (see
  [Roadmap](roadmap.md)) — currently surfaces the real HTTP 402 from ZeroDev's bundler rather
  than a fake success state, by design: it's honest about what's blocked and proves the
  integration is real.
- **Local order/product cache is not yet a hardened backend.** It's `localStorage`, namespaced
  per logged-in merchant address specifically to prevent cross-account data leakage (a real bug
  found and fixed during this build — switching Google accounts on the same browser was briefly
  showing a previous merchant's data before this was namespaced). It remains, by design, only a
  cache: the authoritative payment record is always the on-chain `OrderPaid` event, so even a
  fully lost or corrupted local cache cannot make an unpaid order look paid, or vice versa.

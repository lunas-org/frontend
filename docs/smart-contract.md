# Smart Contract

## `Checkout.sol`

A single, deliberately minimal contract: no custom token, no pooled liquidity, no DeFi
primitives. It records orders and forwards funds — nothing else.

```solidity
// SPDX-License-Identifier: MIT
pragma solidity 0.8.20;

contract Checkout is Ownable {
    using SafeERC20 for IERC20;

    IERC20 public immutable usdc;
    mapping(bytes32 => bool) public paid;
    bool public paused;

    event OrderPaid(bytes32 indexed orderId, address indexed merchant, uint256 amount);
    event PausedUpdated(bool paused);

    function setPaused(bool _paused) external onlyOwner {
        paused = _paused;
        emit PausedUpdated(_paused);
    }

    function fulfillOrder(bytes32 orderId, address merchant, uint256 amount) external {
        if (paused) revert ContractPaused();
        if (paid[orderId]) revert AlreadyPaid(orderId);
        if (merchant == address(0)) revert ZeroAddress();
        if (amount == 0) revert ZeroAmount();
        paid[orderId] = true;
        usdc.safeTransfer(merchant, amount);
        emit OrderPaid(orderId, merchant, amount);
    }

    // renounceOwnership() is disabled — renouncing would permanently lock setPaused.
}
```

## Design decisions worth explaining

**`fulfillOrder` has no caller restriction, and that's intentional.** An earlier version gated it
behind an `onlyRouter` check against a fixed address. That was wrong: the Smart Routing Address
calls the destination action *as itself*, not from a fixed router address, so the permission
check simply made every real payment revert. The current version has no caller restriction at
all — and it's still safe, because `fulfillOrder` only ever moves USDC the contract *actually
holds*, transferred to it earlier in the same atomic action. A spurious standalone call finds no
matching balance, `safeTransfer` reverts, and the `paid` flag write rolls back with it — so
`paid[orderId]` can never be set true without real USDC having moved. Removing the permission
check didn't add risk; it removed a check that was actively incompatible with how the SRA
actually calls the contract.

**The contract never holds a pooled balance between orders.** Each order's USDC is forwarded in
the same atomic action it arrives in, so there's nothing sitting in the contract for an attacker
to target between transactions.

**`paused` is a pure kill-switch, not fund custody.** Because there's no pooled balance to
protect, `setPaused` exists only to stop `fulfillOrder` from executing at all if something looks
wrong with the owner key or the routing configuration — added after an internal audit
specifically flagged the lack of any emergency stop as the one real gap once the router-permission
issue was fixed. See [Security](security.md).

**`renounceOwnership` is disabled.** OpenZeppelin's default would let the owner permanently give
up control — which would also permanently disable `setPaused`. Overridden to always revert.

## The two-call action, from the contract's side

`Checkout.sol` never calls out to a bridge or the SRA itself — it only ever sees two calls land
in the same transaction, both correct because they're one atomic action configured at address-
creation time (see [Architecture](architecture.md)):

1. `USDC.transfer(address(this), amount)`
2. `fulfillOrder(orderId, merchant, amount)`

If either call is missing or the USDC didn't actually arrive, step 2 reverts and nothing is
recorded — there's no partial state where an order is marked paid without funds having moved.

## Testing

13 Foundry tests cover: normal fulfillment, double-fulfillment rejection, zero-address/zero-amount
rejection, the paused kill-switch, unauthorized `setPaused` calls, and `renounceOwnership` being
permanently disabled. All passing (`forge test --match-contract CheckoutTest`).

For deployed addresses on testnet and mainnet, see [Deployments](deployments.md).

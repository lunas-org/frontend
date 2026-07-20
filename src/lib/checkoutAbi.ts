// Minimal ABI for Checkout.sol — just what the app needs (SRA's deposit-triggered call, and
// reading payment status). Keep in sync with contracts/src/Checkout.sol.

/** Standalone event descriptor for the OrderPaid event, for use with viem's `getLogs({ event })`
 * — kept separate (not just indexed into checkoutAbi) because that form type-infers `args`
 * correctly, where passing the whole abi array + an eventName string did not. */
export const orderPaidEvent = {
  type: "event",
  name: "OrderPaid",
  inputs: [
    { name: "orderId", type: "bytes32", indexed: true },
    { name: "merchant", type: "address", indexed: true },
    { name: "amount", type: "uint256", indexed: false },
  ],
} as const;

export const checkoutAbi = [
  {
    type: "function",
    name: "fulfillOrder",
    inputs: [
      { name: "orderId", type: "bytes32" },
      { name: "merchant", type: "address" },
      { name: "amount", type: "uint256" },
    ],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "paid",
    inputs: [{ name: "", type: "bytes32" }],
    outputs: [{ name: "", type: "bool" }],
    stateMutability: "view",
  },
  orderPaidEvent,
] as const;

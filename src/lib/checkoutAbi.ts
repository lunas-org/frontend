// Minimal ABI for Checkout.sol — just what the app needs (SRA's deposit-triggered call, and
// reading payment status). Keep in sync with contracts/src/Checkout.sol.
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
] as const;

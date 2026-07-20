"use client";

// Lightweight local data store — stands in for Supabase (CLAUDE.md §8's data model) until
// that's set up. Uses localStorage so the merchant dashboard/product pages have real data to
// show. Payment *truth* still lives on-chain (Checkout.sol's `paid` mapping) — this store only
// caches product/order metadata, matching CLAUDE.md §8's "DB is a cache" principle.
//
// Namespaced per merchant address (see setActiveAddress): plain localStorage keys are shared by
// the whole browser, not per Google account, so without this, switching Google accounts on the
// same device would show the previous account's products/orders/profile — confirmed as a real
// bug (2026-07-20). `setActiveAddress` must be called right after resolving the merchant's
// smart account address (see createSmartAccountFromProvider callers) and before any read/write
// below, so every store call in that page session is scoped to the right account.

export type Product = {
  id: string;
  merchant: `0x${string}`;
  title: string;
  priceUsd: string;
  createdAt: number;
};

export type Order = {
  id: `0x${string}`; // = on-chain orderId
  productId: string;
  sraAddress: `0x${string}`;
  checkoutAddress: `0x${string}`;
  chainId: number;
  status: "pending" | "paid";
  createdAt: number;
  paidAt?: number;
  txHash?: `0x${string}`; // the fulfillOrder transaction that settled this order, for explorer links
};

export type Profile = {
  displayName: string;
  avatarDataUrl?: string;
  waNumber?: string;
};

const ACTIVE_ADDRESS_KEY = "lunas:activeAddress"; // unscoped on purpose — this IS the scope key
const PRODUCTS_SUFFIX = "products";
const ORDERS_SUFFIX = "orders";
const PROFILE_SUFFIX = "profile";
const PROFILE_SETUP_SEEN_SUFFIX = "profile-setup-seen";

/** Call this right after resolving the merchant's smart account address (post-login), before
 * any other store.ts function — every read/write below is scoped under this address so
 * switching Google accounts on the same browser never shows the previous account's data. */
export function setActiveAddress(address: string) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(ACTIVE_ADDRESS_KEY, address.toLowerCase());
}

export function getActiveAddress(): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(ACTIVE_ADDRESS_KEY);
}

export function clearActiveAddress() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(ACTIVE_ADDRESS_KEY);
}

/** Builds the actual localStorage key for a given data suffix, namespaced to whichever address
 * was last set via setActiveAddress. Falls back to an "anon" bucket if none is set yet (should
 * only happen transiently before a page's first login-check effect runs). */
function scopedKey(suffix: string): string {
  const addr = getActiveAddress() ?? "anon";
  return `lunas:${addr}:${suffix}`;
}

function read<T>(suffix: string): T[] {
  if (typeof window === "undefined") return [];
  const raw = window.localStorage.getItem(scopedKey(suffix));
  if (!raw) return [];
  try {
    return JSON.parse(raw) as T[];
  } catch {
    return [];
  }
}

function write<T>(suffix: string, items: T[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(scopedKey(suffix), JSON.stringify(items));
}

export function saveProduct(product: Product) {
  const products = read<Product>(PRODUCTS_SUFFIX);
  products.unshift(product);
  write(PRODUCTS_SUFFIX, products);
}

export function listProducts(): Product[] {
  return read<Product>(PRODUCTS_SUFFIX);
}

export function getProduct(id: string): Product | undefined {
  return listProducts().find((p) => p.id === id);
}

/** Deletes a product and its orders. Local-cache-only, like everything else here — it does not
 * touch the on-chain Checkout contract or the SRA (a deleted product's payment link, if someone
 * still has it, would still technically route funds on-chain; this only removes it from the
 * merchant's own dashboard). */
export function deleteProduct(id: string) {
  write(PRODUCTS_SUFFIX, read<Product>(PRODUCTS_SUFFIX).filter((p) => p.id !== id));
  write(ORDERS_SUFFIX, read<Order>(ORDERS_SUFFIX).filter((o) => o.productId !== id));
}

export function saveOrder(order: Order) {
  const orders = read<Order>(ORDERS_SUFFIX);
  orders.unshift(order);
  write(ORDERS_SUFFIX, orders);
}

export function listOrders(): Order[] {
  return read<Order>(ORDERS_SUFFIX);
}

export function getOrdersForProduct(productId: string): Order[] {
  return listOrders().filter((o) => o.productId === productId);
}

export function getOrder(id: string): Order | undefined {
  return listOrders().find((o) => o.id === id);
}

export function markOrderPaid(id: string, txHash?: `0x${string}`) {
  const orders = read<Order>(ORDERS_SUFFIX);
  const updated = orders.map((o) =>
    o.id === id ? { ...o, status: "paid" as const, paidAt: Date.now(), txHash: txHash ?? o.txHash } : o
  );
  write(ORDERS_SUFFIX, updated);
}

export function getProfile(): Profile | null {
  if (typeof window === "undefined") return null;
  const raw = window.localStorage.getItem(scopedKey(PROFILE_SUFFIX));
  if (!raw) return null;
  try {
    return JSON.parse(raw) as Profile;
  } catch {
    return null;
  }
}

export function saveProfile(profile: Profile) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(scopedKey(PROFILE_SUFFIX), JSON.stringify(profile));
}

export function hasSeenProfileSetup(): boolean {
  if (typeof window === "undefined") return false;
  return window.localStorage.getItem(scopedKey(PROFILE_SETUP_SEEN_SUFFIX)) === "1";
}

export function markProfileSetupSeen() {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(scopedKey(PROFILE_SETUP_SEEN_SUFFIX), "1");
}

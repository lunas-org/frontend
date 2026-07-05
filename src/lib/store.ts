"use client";

// Lightweight local data store — stands in for Supabase (CLAUDE.md §8's data model) until
// that's set up. Uses localStorage so the merchant dashboard/product pages have real data to
// show. Payment *truth* still lives on-chain (Checkout.sol's `paid` mapping) — this store only
// caches product/order metadata, matching CLAUDE.md §8's "DB is a cache" principle.

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
};

const PRODUCTS_KEY = "lunas:products";
const ORDERS_KEY = "lunas:orders";

function read<T>(key: string): T[] {
  if (typeof window === "undefined") return [];
  const raw = window.localStorage.getItem(key);
  if (!raw) return [];
  try {
    return JSON.parse(raw) as T[];
  } catch {
    return [];
  }
}

function write<T>(key: string, items: T[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(key, JSON.stringify(items));
}

export function saveProduct(product: Product) {
  const products = read<Product>(PRODUCTS_KEY);
  products.unshift(product);
  write(PRODUCTS_KEY, products);
}

export function listProducts(): Product[] {
  return read<Product>(PRODUCTS_KEY);
}

export function getProduct(id: string): Product | undefined {
  return listProducts().find((p) => p.id === id);
}

export function saveOrder(order: Order) {
  const orders = read<Order>(ORDERS_KEY);
  orders.unshift(order);
  write(ORDERS_KEY, orders);
}

export function listOrders(): Order[] {
  return read<Order>(ORDERS_KEY);
}

export function getOrdersForProduct(productId: string): Order[] {
  return listOrders().filter((o) => o.productId === productId);
}

export function getOrder(id: string): Order | undefined {
  return listOrders().find((o) => o.id === id);
}

export function markOrderPaid(id: string) {
  const orders = read<Order>(ORDERS_KEY);
  const updated = orders.map((o) => (o.id === id ? { ...o, status: "paid" as const, paidAt: Date.now() } : o));
  write(ORDERS_KEY, updated);
}

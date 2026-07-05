"use client";

// Magic integration — social login (Google) signer, no seed phrase.
// See context/magic.md. `magic.rpcProvider` is a plain EIP-1193 provider, which ZeroDev's
// signerToEcdsaValidator accepts directly (see src/lib/zerodev.ts) — no ethers wrapping needed,
// confirmed by reading @zerodev/sdk's toSigner() implementation directly.

import { Magic } from "magic-sdk";
import { OAuthExtension } from "@magic-ext/oauth2";

function createMagicInstance(key: string) {
  return new Magic(key, {
    extensions: [new OAuthExtension()],
  });
}

let magicInstance: ReturnType<typeof createMagicInstance> | null = null;

export function getMagic() {
  if (typeof window === "undefined") return null;

  if (!magicInstance) {
    const key = process.env.NEXT_PUBLIC_MAGIC_PUBLISHABLE_KEY;
    if (!key) throw new Error("NEXT_PUBLIC_MAGIC_PUBLISHABLE_KEY is not set");
    magicInstance = createMagicInstance(key);
  }

  return magicInstance;
}

export async function loginWithGoogle(redirectURI: string) {
  const magic = getMagic();
  if (!magic) throw new Error("Magic can only run in the browser");
  await magic.oauth2.loginWithRedirect({
    provider: "google",
    redirectURI,
    scope: ["email"],
  });
}

export async function handleOAuthRedirect() {
  const magic = getMagic();
  if (!magic) throw new Error("Magic can only run in the browser");
  return magic.oauth2.getRedirectResult();
}

export function getMagicProvider() {
  const magic = getMagic();
  if (!magic) throw new Error("Magic can only run in the browser");
  return magic.rpcProvider;
}

export async function isLoggedIn() {
  const magic = getMagic();
  if (!magic) return false;
  return magic.user.isLoggedIn();
}

export async function logout() {
  const magic = getMagic();
  if (!magic) return;
  await magic.user.logout();
}

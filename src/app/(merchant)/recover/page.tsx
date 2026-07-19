"use client";

// One-off recovery tool for funds stuck at a Smart Routing Address (see context/zerodev-sra.md).
// The SRA's withdraw() only authorizes its owner — the merchant's smart account — so this must run
// logged in as that merchant. Gas is sponsored (paymaster), so the smart account needs no ETH.
// Not linked from the app nav; reach it directly at /recover.

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { zeroAddress } from "viem";
import { isLoggedIn, getMagicProvider } from "@/lib/magic";
import { recoverStuckTokens } from "@/lib/zerodev";

// The known stuck deposits. Each is one SRA + the token(s) to pull back on Arbitrum.
const STUCK = [
  {
    id: "eth-arb",
    label: "0.000769 ETH — bridged from Base, stuck as ETH on Arbitrum",
    sra: "0x3523148c50392eE51285d91263fC9212AB3e9775" as `0x${string}`,
    tokens: [{ chainId: 42161, token: zeroAddress as `0x${string}` }],
  },
];

type State = "checking" | "needs-login" | "ready" | "recovering" | "done" | "error";

export default function RecoverPage() {
  const router = useRouter();
  const [state, setState] = useState<State>("checking");
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{ userOpHash: string; receiver: string } | null>(null);
  const ranRef = useRef(false);

  useEffect(() => {
    if (ranRef.current) return;
    ranRef.current = true;
    (async () => {
      setState((await isLoggedIn()) ? "ready" : "needs-login");
    })();
  }, []);

  async function recover(entry: (typeof STUCK)[number]) {
    setState("recovering");
    setError(null);
    try {
      const provider = getMagicProvider();
      const res = await recoverStuckTokens({ provider, sraAddress: entry.sra, tokens: entry.tokens });
      setResult(res);
      setState("done");
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
      setState("error");
    }
  }

  return (
      <div className="flex min-h-screen flex-col gap-5 px-6 py-8 @lg:mx-auto @lg:max-w-[520px]">
        <h1 className="font-display text-2xl font-extrabold tracking-tight text-ink">Recover stuck funds</h1>

        {state === "checking" && <p className="text-sm text-muted">Checking your session…</p>}

        {state === "needs-login" && (
          <div className="rounded-2xl border border-line bg-white p-5">
            <p className="text-sm text-muted">
              You need to sign in with the same Google account that created these payment links —
              only that account can withdraw the funds.
            </p>
            <button
              onClick={() => router.push("/login")}
              className="mt-4 h-11 rounded-xl bg-primary px-5 text-sm font-semibold text-white active:scale-95"
            >
              Sign in
            </button>
          </div>
        )}

        {(state === "ready" || state === "recovering") &&
          STUCK.map((entry) => (
            <div key={entry.id} className="rounded-2xl border border-line bg-white p-5">
              <p className="text-sm font-semibold text-ink">{entry.label}</p>
              <p className="mt-1 break-all font-mono text-[11px] text-muted">{entry.sra}</p>
              <button
                onClick={() => recover(entry)}
                disabled={state === "recovering"}
                className="mt-4 flex h-11 items-center justify-center gap-2 rounded-xl bg-primary px-5 text-sm font-semibold text-white active:scale-95 disabled:opacity-60"
              >
                {state === "recovering" && (
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                )}
                {state === "recovering" ? "Recovering… (confirm may take ~30s)" : "Recover to my account"}
              </button>
            </div>
          ))}

        {state === "done" && result && (
          <div className="rounded-2xl border border-success/30 bg-success/5 p-5">
            <p className="font-display text-lg font-bold text-success">Recovered ✓</p>
            <p className="mt-2 text-sm text-muted">
              Funds sent to your smart account:
              <br />
              <span className="break-all font-mono text-[11px]">{result.receiver}</span>
            </p>
            <p className="mt-2 break-all text-[11px] text-muted">userOp: {result.userOpHash}</p>
          </div>
        )}

        {state === "error" && (
          <div className="rounded-2xl border border-danger/30 bg-danger/5 p-5">
            <p className="text-sm font-semibold text-danger">Recovery failed</p>
            <p className="mt-2 break-words text-[12px] text-muted">{error}</p>
            <button
              onClick={() => setState("ready")}
              className="mt-4 h-10 rounded-xl border border-line px-4 text-sm font-semibold text-ink active:scale-95"
            >
              Try again
            </button>
          </div>
        )}
      </div>
  );
}

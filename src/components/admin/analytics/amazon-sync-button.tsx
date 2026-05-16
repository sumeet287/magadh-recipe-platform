"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Loader2, RefreshCw, History, ListTree } from "lucide-react";

type SyncResponse = {
  ok?: boolean;
  error?: string;
};

export function AmazonManualSyncButton() {
  const router = useRouter();
  const [busy, setBusy] = useState<"none" | "incremental" | "historical" | "lines">("none");
  const [msg, setMsg] = useState<string | null>(null);

  async function run(mode: "incremental" | "historical" | "lines") {
    setBusy(mode);
    setMsg(null);
    try {
      const res = await fetch("/api/admin/amazon/sync-orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode }),
      });
      const data = (await res.json()) as SyncResponse;
      if (!res.ok || !data.ok) {
        setMsg(data.error ?? "Sync failed.");
        return;
      }
      router.refresh();
    } catch {
      setMsg("Network error.");
    } finally {
      setBusy("none");
    }
  }

  const disabled = busy !== "none";

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-3 flex-wrap">
        <button
          type="button"
          disabled={disabled}
          onClick={() => run("incremental")}
          className="inline-flex items-center gap-2 text-xs font-semibold px-4 py-2 rounded-lg bg-gray-800 border border-gray-700 text-gray-200 hover:bg-gray-700 hover:text-white transition-colors disabled:opacity-50"
        >
          {busy === "incremental" ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <RefreshCw className="w-4 h-4" />
          )}
          Pull latest (recent updates)
        </button>
        <button
          type="button"
          disabled={disabled}
          onClick={() => {
            const ok =
              typeof window !== "undefined" &&
              window.confirm(
                "Import order headers from Amazon Created-date windows (defaults to ~720 days · ~90-day chunks).\nFirst run prioritises speed (no SKU lines).\nThen use “Fetch SKU lines” batches.\n\nContinue?"
              );
            if (!ok) return;
            run("historical");
          }}
          className="inline-flex items-center gap-2 text-xs font-semibold px-4 py-2 rounded-lg bg-brand-950/55 border border-brand-900/85 text-brand-100 hover:bg-brand-900/50 transition-colors disabled:opacity-50"
        >
          {busy === "historical" ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <History className="w-4 h-4" />
          )}
          Import full history (~2y)
        </button>
        <button
          type="button"
          disabled={disabled}
          onClick={() => run("lines")}
          title="Loads getOrderItems for orders stored without line rows yet"
          className="inline-flex items-center gap-2 text-xs font-semibold px-4 py-2 rounded-lg bg-gray-800 border border-gray-700 text-gray-200 hover:bg-gray-700 hover:text-white transition-colors disabled:opacity-50"
        >
          {busy === "lines" ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <ListTree className="w-4 h-4" />
          )}
          Fetch SKU lines (batch)
        </button>
      </div>
      {msg && (
        <p className="text-xs text-red-400/95 border border-red-900/55 bg-red-950/35 rounded-lg px-3 py-2 max-w-xl" role="alert">
          {msg}
        </p>
      )}
    </div>
  );
}

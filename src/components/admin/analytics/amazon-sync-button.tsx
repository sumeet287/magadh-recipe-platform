"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Loader2, RefreshCw } from "lucide-react";

export function AmazonManualSyncButton() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  async function run() {
    setBusy(true);
    setMsg(null);
    try {
      const res = await fetch("/api/admin/amazon/sync-orders", { method: "POST" });
      const data = (await res.json()) as {
        ok?: boolean;
        error?: string;
        ordersUpserted?: number;
        lineRowsWritten?: number;
      };
      if (!res.ok || !data.ok) {
        setMsg(data.error ?? "Sync failed.");
        return;
      }
      setMsg(
        `Updated ${data.ordersUpserted ?? 0} orders and ${data.lineRowsWritten ?? 0} line rows. Refreshing…`
      );
      router.refresh();
    } catch {
      setMsg("Network error.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex items-center gap-3 flex-wrap">
      <button
        type="button"
        disabled={busy}
        onClick={run}
        className="inline-flex items-center gap-2 text-xs font-semibold px-4 py-2 rounded-lg bg-gray-800 border border-gray-700 text-gray-200 hover:bg-gray-700 hover:text-white transition-colors disabled:opacity-50"
      >
        {busy ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <RefreshCw className="w-4 h-4" />
        )}
        Pull latest from Amazon
      </button>
      {msg && <p className="text-xs text-gray-500 max-w-xl">{msg}</p>}
    </div>
  );
}

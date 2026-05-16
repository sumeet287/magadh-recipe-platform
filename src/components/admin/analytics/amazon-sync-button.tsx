"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Loader2, RefreshCw, History, ListTree } from "lucide-react";

type SyncResponse = {
  ok?: boolean;
  error?: string;
  listingMode?: string;
  ordersSeen?: number;
  ordersUpserted?: number;
  lineRowsWritten?: number;
  listPages?: number;
  historicalChunks?: number;
  querySummary?: string;
  ordersExamined?: number;
  ordersWithLinesFetched?: number;
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
      if (mode === "lines") {
        setMsg(
          `Line items for ${data.ordersWithLinesFetched ?? 0}/${data.ordersExamined ?? 0} checked orders (${data.lineRowsWritten ?? 0} rows written). Refreshing…`
        );
      } else {
        const seen = data.ordersSeen ?? 0;
        const cap = mode === "historical" ? ` · ${data.historicalChunks ?? 1} created-date chunk(s)` : "";
        const listNote = typeof data.listPages === "number" ? ` · ${data.listPages} Orders list page(s)` : "";
        setMsg(
          `Listing: ${seen} order(s) from Amazon API${cap}${listNote}. DB upserts: ${data.ordersUpserted ?? 0} orders · ${data.lineRowsWritten ?? 0} line rows. Refreshing…`
        );
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
      <p className="text-[10px] text-gray-600 leading-relaxed max-w-3xl">
        &quot;All time&quot; on this dashboard is <strong className="text-gray-500">everything in your database</strong>, not live Amazon.
        <span className="mx-1">·</span>
        <strong className="text-gray-500">Pull latest</strong> only lists orders Amazon reports as{" "}
        <em>recently updated</em> (~21 days by default — override with{" "}
        <code className="text-gray-500">AMAZON_ORDERS_SYNC_LOOKBACK_DAYS</code>).{" "}
        <strong className="text-gray-500">Import full history</strong> walks <em>Created</em> windows so older orders appear. SP-API (India){" "}
        exposes roughly orders from the{" "}
        <a
          href="https://developer-docs.amazon.com/sp-api/reference/getorders-v0"
          className="text-brand-400 hover:underline"
          target="_blank"
          rel="noreferrer"
        >
          last two years in the Orders API
        </a>.
      </p>
      {msg && <p className="text-xs text-gray-500 max-w-xl">{msg}</p>}
    </div>
  );
}

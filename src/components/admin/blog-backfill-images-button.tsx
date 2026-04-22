"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ImageIcon, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

export function BlogBackfillImagesButton({
  missingCount,
}: {
  missingCount: number;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  if (missingCount === 0) return null;

  async function run() {
    setBusy(true);
    const loadingId = toast.loading(
      `Fetching cover images for ${missingCount} post${missingCount === 1 ? "" : "s"}…`,
    );
    try {
      const res = await fetch("/api/admin/blog/backfill-images", {
        method: "POST",
      });
      const data: {
        ok?: boolean;
        error?: string;
        updated?: number;
        failed?: number;
        scanned?: number;
      } = await res.json();
      toast.dismiss(loadingId);
      if (!res.ok || !data.ok) {
        toast.error(data.error || "Backfill failed");
        return;
      }
      toast.success(
        `Updated ${data.updated ?? 0} post${data.updated === 1 ? "" : "s"}`,
        {
          description:
            data.failed && data.failed > 0
              ? `${data.failed} could not be matched`
              : "Cover images saved.",
        },
      );
      router.refresh();
    } catch (err) {
      toast.dismiss(loadingId);
      toast.error(err instanceof Error ? err.message : "Backfill failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Button
      onClick={run}
      disabled={busy}
      variant="outline"
      className="border-amber-500/30 text-amber-400 hover:bg-amber-500/10 hover:text-amber-300"
    >
      {busy ? (
        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
      ) : (
        <ImageIcon className="w-4 h-4 mr-2" />
      )}
      Backfill images ({missingCount})
    </Button>
  );
}

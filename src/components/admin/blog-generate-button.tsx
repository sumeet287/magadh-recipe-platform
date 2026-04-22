"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Sparkles, Loader2, ChevronDown } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

const BUCKETS = [
  { key: "auto", label: "Auto (by weekday)" },
  { key: "cultural", label: "Cultural / story" },
  { key: "recipe", label: "Recipe / how-to" },
  { key: "comparison", label: "Comparison / guide" },
  { key: "health", label: "Health / nutrition" },
  { key: "trend", label: "Trend / lifestyle" },
  { key: "seasonal", label: "Seasonal" },
] as const;

type BucketKey = (typeof BUCKETS)[number]["key"];

export function BlogGenerateButton() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (!wrapRef.current?.contains(e.target as Node)) setOpen(false);
    }
    if (open) document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  async function generate(bucket: BucketKey) {
    setOpen(false);
    setBusy(true);
    const loadingId = toast.loading("Generating blog… this takes 30–60 sec.");
    try {
      const res = await fetch("/api/admin/blog/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bucket: bucket === "auto" ? undefined : bucket,
        }),
      });
      const data: {
        ok?: boolean;
        error?: string;
        slug?: string;
        title?: string;
        status?: string;
      } = await res.json();
      toast.dismiss(loadingId);
      if (!res.ok || !data.ok) {
        toast.error(data.error || "Generation failed");
        return;
      }
      toast.success(
        `${data.status === "PUBLISHED" ? "Published" : "Drafted"}: ${data.title}`,
        { description: `/blog/${data.slug}` },
      );
      router.refresh();
    } catch (err) {
      toast.dismiss(loadingId);
      toast.error(err instanceof Error ? err.message : "Generation failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="relative" ref={wrapRef}>
      <Button
        disabled={busy}
        onClick={() => setOpen((o) => !o)}
        className="bg-gradient-to-r from-amber-500 to-brand-500 hover:from-amber-400 hover:to-brand-400 text-white"
      >
        {busy ? (
          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
        ) : (
          <Sparkles className="w-4 h-4 mr-2" />
        )}
        Generate with AI
        <ChevronDown className="w-3.5 h-3.5 ml-1.5" />
      </Button>
      {open && !busy ? (
        <div className="absolute right-0 mt-2 w-60 rounded-xl bg-gray-900 border border-gray-800 shadow-xl z-50 overflow-hidden">
          <p className="px-3 pt-3 pb-1 text-[10px] uppercase tracking-wider text-gray-500 font-semibold">
            Pick a topic bucket
          </p>
          <div className="py-1">
            {BUCKETS.map((b) => (
              <button
                key={b.key}
                type="button"
                onClick={() => generate(b.key)}
                className="w-full text-left px-3 py-2 text-sm text-gray-200 hover:bg-gray-800 hover:text-white transition-colors"
              >
                {b.label}
              </button>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}

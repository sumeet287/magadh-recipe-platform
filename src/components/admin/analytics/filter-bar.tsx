"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useMemo, useState, useTransition } from "react";
import { Calendar, RefreshCw, Loader2 } from "lucide-react";
import type { DateRangePreset } from "@/lib/analytics";
import { PRESET_OPTIONS } from "@/lib/analytics";

interface Props {
  activePreset: DateRangePreset;
  from?: string;
  to?: string;
  rangeLabel: string;
}

function toInputDate(dateStr?: string) {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return "";
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function AnalyticsFilterBar({ activePreset, from, to, rangeLabel }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const [showCustom, setShowCustom] = useState(activePreset === "custom");
  const [fromDate, setFromDate] = useState(toInputDate(from));
  const [toDate, setToDate] = useState(toInputDate(to));

  const applyPreset = useCallback(
    (preset: DateRangePreset) => {
      const params = new URLSearchParams(searchParams.toString());
      params.set("preset", preset);
      params.delete("from");
      params.delete("to");
      setShowCustom(preset === "custom");
      startTransition(() => {
        router.push(`/admin/analytics?${params.toString()}`);
      });
    },
    [router, searchParams]
  );

  const applyCustom = useCallback(() => {
    if (!fromDate || !toDate) return;
    const params = new URLSearchParams(searchParams.toString());
    params.set("preset", "custom");
    params.set("from", fromDate);
    params.set("to", toDate);
    startTransition(() => {
      router.push(`/admin/analytics?${params.toString()}`);
    });
  }, [fromDate, toDate, router, searchParams]);

  const refresh = useCallback(() => {
    startTransition(() => {
      router.refresh();
    });
  }, [router]);

  const presets = useMemo(() => [...PRESET_OPTIONS, { value: "custom" as const, label: "Custom" }], []);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2 text-sm text-gray-400">
          <Calendar className="w-4 h-4" />
          <span className="text-white font-medium">{rangeLabel}</span>
          {isPending && <Loader2 className="w-3.5 h-3.5 animate-spin text-gray-500" />}
        </div>
        <button
          onClick={refresh}
          disabled={isPending}
          className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-white px-3 py-1.5 rounded-lg bg-gray-800 hover:bg-gray-700 transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`w-3 h-3 ${isPending ? "animate-spin" : ""}`} />
          Refresh
        </button>
      </div>

      <div className="flex items-center gap-2 flex-wrap">
        {presets.map((p) => {
          const active = activePreset === p.value;
          return (
            <button
              key={p.value}
              onClick={() => (p.value === "custom" ? setShowCustom((s) => !s) : applyPreset(p.value))}
              disabled={isPending}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors disabled:opacity-50 ${
                active
                  ? "bg-brand-600 text-white"
                  : "bg-gray-800 text-gray-400 hover:text-white hover:bg-gray-700"
              }`}
            >
              {p.label}
            </button>
          );
        })}
      </div>

      {showCustom && (
        <div className="flex items-end gap-3 flex-wrap bg-gray-900 border border-gray-800 rounded-xl p-3">
          <div className="flex flex-col gap-1">
            <label className="text-[10px] uppercase tracking-wider text-gray-500">From</label>
            <input
              type="date"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              className="bg-gray-800 border border-gray-700 text-white text-sm rounded-lg px-3 py-1.5 focus:outline-none focus:border-brand-500"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-[10px] uppercase tracking-wider text-gray-500">To</label>
            <input
              type="date"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
              className="bg-gray-800 border border-gray-700 text-white text-sm rounded-lg px-3 py-1.5 focus:outline-none focus:border-brand-500"
            />
          </div>
          <button
            onClick={applyCustom}
            disabled={!fromDate || !toDate || isPending}
            className="bg-brand-600 hover:bg-brand-700 disabled:opacity-40 disabled:cursor-not-allowed text-white text-xs font-medium px-4 py-2 rounded-lg transition-colors"
          >
            Apply
          </button>
        </div>
      )}
    </div>
  );
}

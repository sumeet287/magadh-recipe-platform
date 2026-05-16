"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";

interface Props {
  channel: "website" | "amazon";
}

export function AnalyticsChannelTabs({ channel }: Props) {
  const params = useSearchParams();

  function hrefFor(next: "website" | "amazon") {
    const p = new URLSearchParams(params.toString());
    if (next === "website") p.delete("channel");
    else p.set("channel", "amazon");
    const qs = p.toString();
    return qs ? `/admin/analytics?${qs}` : "/admin/analytics";
  }

  const tabClass = (active: boolean) =>
    `px-4 py-2 rounded-lg text-xs font-semibold transition-colors ${
      active ? "bg-brand-600 text-white shadow-sm" : "text-gray-400 hover:text-white hover:bg-gray-700/70"
    }`;

  return (
    <div className="inline-flex gap-1 p-1 rounded-xl bg-gray-800/70 border border-gray-700">
      <Link href={hrefFor("website")} prefetch={false} className={tabClass(channel === "website")}>
        Website
      </Link>
      <Link href={hrefFor("amazon")} prefetch={false} className={tabClass(channel === "amazon")}>
        Amazon
      </Link>
    </div>
  );
}

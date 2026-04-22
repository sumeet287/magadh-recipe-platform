import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import type { LucideIcon } from "lucide-react";

interface Props {
  label: string;
  value: string;
  sub?: string;
  previousValue?: number;
  currentValue?: number;
  /** If true, a negative delta is framed as good (e.g. cancel rate). */
  inverseTrend?: boolean;
  icon?: LucideIcon;
  tone?: "default" | "success" | "warning" | "danger" | "info";
}

const toneColors: Record<NonNullable<Props["tone"]>, string> = {
  default: "bg-gray-800 text-gray-400",
  success: "bg-green-900/40 text-green-400",
  warning: "bg-amber-900/40 text-amber-400",
  danger: "bg-red-900/40 text-red-400",
  info: "bg-blue-900/40 text-blue-400",
};

export function MetricCard({
  label,
  value,
  sub,
  previousValue,
  currentValue,
  inverseTrend,
  icon: Icon,
  tone = "default",
}: Props) {
  let trend: number | null = null;
  if (previousValue !== undefined && currentValue !== undefined && previousValue > 0) {
    trend = ((currentValue - previousValue) / previousValue) * 100;
  } else if (previousValue === 0 && currentValue && currentValue > 0) {
    trend = 100;
  }

  const isGood = trend === null ? null : inverseTrend ? trend <= 0 : trend >= 0;
  const TrendIcon = trend === null ? Minus : trend === 0 ? Minus : trend > 0 ? TrendingUp : TrendingDown;

  return (
    <div className="bg-gray-900 rounded-2xl p-5 border border-gray-800 flex flex-col gap-3">
      <div className="flex items-start justify-between">
        {Icon ? (
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${toneColors[tone]}`}>
            <Icon className="w-5 h-5" />
          </div>
        ) : (
          <div className="w-10 h-10" />
        )}
        {trend !== null && (
          <div
            className={`flex items-center gap-1 text-xs font-medium ${
              isGood ? "text-green-400" : "text-red-400"
            }`}
          >
            <TrendIcon className="w-3 h-3" />
            {Math.abs(Math.round(trend))}%
          </div>
        )}
      </div>
      <div>
        <p className="text-2xl font-bold text-white leading-tight">{value}</p>
        <p className="text-xs text-gray-500 mt-1">{label}</p>
        {sub && <p className="text-xs text-gray-600 mt-0.5">{sub}</p>}
      </div>
    </div>
  );
}

interface PercentileBarProps {
  value: number;
  allValues: number[];
  label: string;
}

export function PercentileBar({ value, allValues, label }: PercentileBarProps) {
  const rank = allValues.filter((v) => v < value).length;
  const percentile = allValues.length > 0 ? (rank / allValues.length) * 100 : 0;
  const topPct = Math.max(1, Math.round(100 - percentile));

  const barColor =
    topPct <= 10
      ? "bg-amber-500"
      : topPct <= 50
        ? "bg-white"
        : "bg-slate-500";

  return (
    <div>
      <div className="flex items-center justify-between text-sm">
        <span className="text-slate-400">{label}</span>
        <span className="font-medium text-white">
          {typeof value === "number" ? value.toFixed(2) : value}
        </span>
      </div>
      <div className="mt-1 flex items-center gap-2">
        <div className="h-2 flex-1 overflow-hidden rounded-full bg-surface-800">
          <div
            className={`h-full rounded-full ${barColor} transition-all`}
            style={{ width: `${percentile}%` }}
          />
        </div>
        <span className="w-16 text-right text-xs text-slate-400">
          Top {topPct}%
        </span>
      </div>
    </div>
  );
}

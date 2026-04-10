import { AnimatedNumber } from "./AnimatedNumber";

interface StatCardProps {
  label: string;
  value: number;
}

export function StatCard({ label, value }: StatCardProps) {
  return (
    <div className="rounded-lg border border-surface-800 bg-surface-900 p-6 transition-all duration-200 hover:scale-[1.01] hover:border-accent">
      <p className="text-3xl font-bold text-accent">
        <AnimatedNumber target={value} />
      </p>
      <p className="mt-1 text-sm text-slate-400">{label}</p>
    </div>
  );
}

import { LucideIcon } from "lucide-react";

interface MetricCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  change?: string;
  changeType?: "positive" | "negative" | "neutral";
  subtitle?: string;
}

export function MetricCard({ 
  title, 
  value, 
  icon: Icon, 
  change, 
  changeType = "neutral",
  subtitle 
}: MetricCardProps) {
  const changeColors = {
    positive: "text-emerald-400",
    negative: "text-red-400",
    neutral: "text-slate-400",
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 hover:border-slate-700 transition-all">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-slate-400 mb-1">{title}</p>
          <h3 className="text-3xl font-bold text-slate-100 mb-1">{value}</h3>
          {subtitle && (
            <p className="text-xs text-slate-500">{subtitle}</p>
          )}
          {change && (
            <p className={`text-sm mt-2 ${changeColors[changeType]}`}>
              {change}
            </p>
          )}
        </div>
        <div className="w-12 h-12 bg-emerald-500/10 rounded-lg flex items-center justify-center">
          <Icon className="w-6 h-6 text-emerald-400" />
        </div>
      </div>
    </div>
  );
}

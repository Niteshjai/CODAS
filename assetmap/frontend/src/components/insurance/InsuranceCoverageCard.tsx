import React from 'react';

interface Props {
  title: string;
  current: number;
  recommended: number;
  gap: number;
  icon: React.ReactNode;
}

export default function InsuranceCoverageCard({ title, current, recommended, gap, icon }: Props) {
  const formatCurrency = (paise: number) => {
    const v = paise / 100;
    if (v >= 10000000) return `₹${(v / 10000000).toFixed(2)} Cr`;
    if (v >= 100000) return `₹${(v / 100000).toFixed(1)} L`;
    return `₹${Math.round(v).toLocaleString('en-IN')}`;
  };

  const progress = recommended > 0 ? Math.min(100, Math.round((current / recommended) * 100)) : 100;

  return (
    <div className="bg-gradient-to-br from-zinc-200/90 via-zinc-100/90 to-zinc-300/90 dark:from-[#1A1D27]/95 dark:via-[#21253A]/95 dark:to-[#1A1D27]/95 backdrop-blur-xl rounded-[28px] p-6 border border-zinc-300 dark:border-[#2E3148] shadow-sm flex flex-col justify-between">
      <div>
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">{title}</span>
          <div className="size-8 rounded-xl bg-white/70 dark:bg-white/5 border border-zinc-200/80 dark:border-white/10 flex items-center justify-center">
            {icon}
          </div>
        </div>
        <div className="text-2xl sm:text-3xl font-bold font-display text-zinc-900 dark:text-zinc-100 tracking-tight">
          {formatCurrency(current)}
        </div>
        <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1 font-medium">
          Recommended: <span className="font-semibold text-zinc-700 dark:text-zinc-300">{formatCurrency(recommended)}</span>
        </p>
      </div>

      <div className="mt-5">
        <div className="flex items-center justify-between text-[11px] font-semibold text-zinc-500 dark:text-zinc-400 mb-1.5">
          <span>Coverage Progress</span>
          <span className={progress >= 100 ? 'text-emerald-600 dark:text-lime-400' : progress > 50 ? 'text-amber-500' : 'text-rose-500'}>
            {progress}%
          </span>
        </div>
        <div className="w-full bg-zinc-200/80 dark:bg-white/10 h-2 rounded-full overflow-hidden">
          <div 
            className={`h-full rounded-full transition-all duration-700 ${progress >= 100 ? 'bg-lime-400' : progress > 50 ? 'bg-amber-400' : 'bg-rose-500'}`} 
            style={{ width: `${progress}%` }}
          />
        </div>
        
        {gap > 0 ? (
          <div className="mt-3 inline-flex items-center gap-1.5 text-xs font-semibold text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-500/10 px-2.5 py-1 rounded-full border border-rose-200/60 dark:border-rose-500/20">
            <span>Coverage Shortfall:</span>
            <strong>{formatCurrency(gap)}</strong>
          </div>
        ) : (
          <div className="mt-3 inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-600 dark:text-lime-400 bg-emerald-50 dark:bg-lime-400/10 px-2.5 py-1 rounded-full border border-emerald-200/60 dark:border-lime-400/20">
            <span>Fully Covered</span>
          </div>
        )}
      </div>
    </div>
  );
}

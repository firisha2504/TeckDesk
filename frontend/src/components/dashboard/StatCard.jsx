import React from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';

export const StatCard = ({
  title,
  value,
  trend,
  trendDirection = 'up',
  icon: Icon,
  iconColor = 'text-cyan-500',
  iconBg = 'bg-cyan-500/10',
  description,
  className = '',
}) => {
  const isPositive = trendDirection === 'up';

  return (
    <div
      className={`p-5 rounded-2xl border border-slate-200 dark:border-navy-800 bg-white dark:bg-navy-900 shadow-sm hover:border-blue-500/40 dark:hover:border-cyan-500/40 transition-all duration-200 ${className}`}
    >
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
          {title}
        </span>
        {Icon && (
          <div className={`p-2.5 rounded-xl ${iconBg} ${iconColor} shrink-0`}>
            <Icon className="w-4 h-4" />
          </div>
        )}
      </div>

      <div className="flex items-baseline justify-between gap-2">
        <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight">
          {value}
        </div>

        {trend && (
          <div
            className={`inline-flex items-center gap-1 text-xs font-bold px-2 py-0.5 rounded-full ${
              isPositive
                ? 'text-emerald-500 bg-emerald-500/10'
                : 'text-rose-500 bg-rose-500/10'
            }`}
          >
            {isPositive ? (
              <TrendingUp className="w-3 h-3" />
            ) : (
              <TrendingDown className="w-3 h-3" />
            )}
            <span>{trend}</span>
          </div>
        )}
      </div>

      {description && (
        <p className="mt-2 text-[11px] text-slate-400 truncate">{description}</p>
      )}
    </div>
  );
};

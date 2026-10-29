import React from 'react';

export const LoadingSkeleton = ({
  type = 'card',
  count = 1,
  className = '',
}) => {
  const items = Array.from({ length: count });

  if (type === 'table') {
    return (
      <div className={`space-y-3 animate-pulse ${className}`}>
        <div className="h-10 bg-slate-200 dark:bg-navy-800 rounded-lg w-full" />
        {items.map((_, i) => (
          <div key={i} className="h-14 bg-slate-100 dark:bg-navy-850 rounded-lg w-full" />
        ))}
      </div>
    );
  }

  if (type === 'stat') {
    return (
      <div className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 animate-pulse ${className}`}>
        {items.map((_, i) => (
          <div
            key={i}
            className="p-5 rounded-2xl border border-slate-200 dark:border-navy-800 bg-white dark:bg-navy-900 space-y-3"
          >
            <div className="flex justify-between items-center">
              <div className="h-4 bg-slate-200 dark:bg-navy-800 rounded w-24" />
              <div className="w-8 h-8 rounded-lg bg-slate-200 dark:bg-navy-800" />
            </div>
            <div className="h-8 bg-slate-300 dark:bg-navy-750 rounded w-16" />
            <div className="h-3 bg-slate-200 dark:bg-navy-800 rounded w-32" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className={`space-y-4 animate-pulse ${className}`}>
      {items.map((_, i) => (
        <div
          key={i}
          className="p-5 rounded-2xl border border-slate-200 dark:border-navy-800 bg-white dark:bg-navy-900 space-y-3"
        >
          <div className="h-5 bg-slate-200 dark:bg-navy-800 rounded w-1/3" />
          <div className="h-4 bg-slate-100 dark:bg-navy-850 rounded w-3/4" />
          <div className="h-4 bg-slate-100 dark:bg-navy-850 rounded w-1/2" />
        </div>
      ))}
    </div>
  );
};

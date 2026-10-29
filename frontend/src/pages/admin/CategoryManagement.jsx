import React from 'react';
import { Tag, CheckCircle2, ShieldAlert } from 'lucide-react';
import { PageHeader } from '../../components/layout/PageHeader.jsx';
import { CATEGORIES } from '../../utils/constants.js';

export const CategoryManagement = () => {
  return (
    <div className="max-w-4xl space-y-6">
      <PageHeader
        title="Incident Category Routing"
        description="Standard system categories mapped to specialist skills and automated SLA policies."
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {CATEGORIES.map((category) => (
          <div
            key={category}
            className="p-5 rounded-2xl border border-slate-200 dark:border-navy-800 bg-white dark:bg-navy-900 shadow-sm flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center gap-2 mb-2">
                <div className="p-2 rounded-xl bg-cyan-500/10 text-cyan-500">
                  <Tag className="w-4 h-4" />
                </div>
                <h4 className="font-bold text-sm text-slate-900 dark:text-slate-100">
                  {category}
                </h4>
              </div>
              <p className="text-xs text-slate-400">
                Routed to technicians with matching skill tag or team specialization.
              </p>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-100 dark:border-navy-800 flex items-center justify-between text-xs">
              <span className="text-emerald-500 font-medium flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" /> Active Route
              </span>
              <span className="text-slate-400 font-mono text-[10px]">Tier 1 / Tier 2</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

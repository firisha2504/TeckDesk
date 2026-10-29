import React from 'react';
import { CATEGORIES } from '../../utils/constants.js';
import { Filter, AlertCircle } from 'lucide-react';

const STATUS_TABS = [
  { key: '', label: 'All' },
  { key: 'Open', label: 'Open' },
  { key: 'In Progress', label: 'In Progress' },
  { key: 'Pending User', label: 'Pending User' },
  { key: 'Resolved', label: 'Resolved' },
  { key: 'Closed', label: 'Closed' },
];

export const TicketFilters = ({
  status = '',
  onStatusChange,
  priority = '',
  onPriorityChange,
  category = '',
  onCategoryChange,
  overdue = false,
  onOverdueToggle,
}) => {
  return (
    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
      {/* Quick Status Tabs matching design */}
      <div className="flex items-center gap-1 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
        {STATUS_TABS.map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => onStatusChange(tab.key)}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all duration-150 ${
              status === tab.key
                ? 'bg-blue-600 text-white shadow-sm'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-600 dark:bg-navy-850 dark:hover:bg-navy-800 dark:text-slate-300'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Dropdown Filters */}
      <div className="flex items-center gap-2.5 flex-wrap">
        {/* Priority Select */}
        <select
          value={priority}
          onChange={(e) => onPriorityChange(e.target.value)}
          className="text-xs rounded-xl bg-slate-100 dark:bg-navy-850 border border-slate-200 dark:border-navy-750 text-slate-700 dark:text-slate-300 px-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-cyan-500 cursor-pointer"
        >
          <option value="">Priority: All</option>
          <option value="Critical">Critical</option>
          <option value="High">High</option>
          <option value="Medium">Medium</option>
          <option value="Low">Low</option>
        </select>

        {/* Category Select */}
        <select
          value={category}
          onChange={(e) => onCategoryChange(e.target.value)}
          className="text-xs rounded-xl bg-slate-100 dark:bg-navy-850 border border-slate-200 dark:border-navy-750 text-slate-700 dark:text-slate-300 px-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-cyan-500 cursor-pointer"
        >
          <option value="">Category: All</option>
          {CATEGORIES.map((cat) => (
            <option key={cat} value={cat}>
              {cat}
            </option>
          ))}
        </select>

        {/* Overdue Toggle */}
        <button
          type="button"
          onClick={() => onOverdueToggle(!overdue)}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium border transition-colors ${
            overdue
              ? 'bg-rose-500/10 border-rose-500/40 text-rose-500 font-semibold'
              : 'border-slate-200 dark:border-navy-750 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-navy-850'
          }`}
        >
          <AlertCircle className="w-3.5 h-3.5" />
          Overdue Only
        </button>
      </div>
    </div>
  );
};

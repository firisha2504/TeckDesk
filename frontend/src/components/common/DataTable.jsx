import React from 'react';
import { LoadingSkeleton } from './LoadingSkeleton.jsx';
import { EmptyState } from './EmptyState.jsx';

export const DataTable = ({
  columns = [],
  data = [],
  loading = false,
  emptyTitle = 'No data available',
  emptyDescription = 'There are no records to display.',
  onRowClick,
  className = '',
}) => {
  if (loading) {
    return <LoadingSkeleton type="table" count={5} />;
  }

  if (!data || data.length === 0) {
    return <EmptyState title={emptyTitle} description={emptyDescription} />;
  }

  return (
    <div
      className={`overflow-x-auto rounded-2xl border border-slate-200 dark:border-navy-800 bg-white dark:bg-navy-900 shadow-sm ${className}`}
    >
      <table className="w-full text-left border-collapse text-xs sm:text-sm">
        <thead>
          <tr className="border-b border-slate-200 dark:border-navy-800 bg-slate-50/70 dark:bg-navy-950/50">
            {columns.map((col, idx) => (
              <th
                key={col.key || idx}
                className={`py-3.5 px-4 font-semibold text-slate-600 dark:text-slate-300 text-xs uppercase tracking-wider ${
                  col.align === 'right'
                    ? 'text-right'
                    : col.align === 'center'
                    ? 'text-center'
                    : 'text-left'
                } ${col.headerClassName || ''}`}
              >
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 dark:divide-navy-800/60">
          {data.map((row, rowIdx) => (
            <tr
              key={row._id || rowIdx}
              onClick={() => onRowClick?.(row)}
              className={`transition-colors duration-150 ${
                onRowClick
                  ? 'cursor-pointer hover:bg-slate-50/80 dark:hover:bg-navy-800/50'
                  : ''
              }`}
            >
              {columns.map((col, colIdx) => (
                <td
                  key={col.key || colIdx}
                  className={`py-3.5 px-4 text-slate-700 dark:text-slate-300 ${
                    col.align === 'right'
                      ? 'text-right'
                      : col.align === 'center'
                      ? 'text-center'
                      : 'text-left'
                  } ${col.cellClassName || ''}`}
                >
                  {col.render ? col.render(row, rowIdx) : row[col.key]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

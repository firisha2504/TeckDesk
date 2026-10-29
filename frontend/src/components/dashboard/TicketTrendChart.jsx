import React from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { TrendingUp } from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext.jsx';

export const TicketTrendChart = ({ data = [], title = 'Ticket Overview' }) => {
  const { isDark } = useTheme();

  if (!data || data.length === 0) {
    return (
      <div className="p-5 rounded-2xl border border-slate-200 dark:border-navy-800 bg-white dark:bg-navy-900 shadow-sm flex flex-col justify-between">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">{title}</h3>
            <p className="text-xs text-slate-400">Created vs. Resolved performance</p>
          </div>
        </div>
        <div className="h-64 w-full flex flex-col items-center justify-center text-center p-6">
          <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 text-cyan-500 flex items-center justify-center mb-3">
            <TrendingUp className="w-6 h-6" />
          </div>
          <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
            No ticket trend data available yet
          </p>
          <p className="text-xs text-slate-400 max-w-sm mt-1">
            Activity metrics will populate here automatically as new incidents are submitted and resolved across your organization.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-5 rounded-2xl border border-slate-200 dark:border-navy-800 bg-white dark:bg-navy-900 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">{title}</h3>
          <p className="text-xs text-slate-400">Created vs. Resolved performance</p>
        </div>
      </div>

      <div className="h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="createdGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#06B6D4" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#06B6D4" stopOpacity={0.0} />
              </linearGradient>
              <linearGradient id="resolvedGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#3B82F6" stopOpacity={0.0} />
              </linearGradient>
            </defs>
            <CartesianGrid
              strokeDasharray="3 3"
              stroke={isDark ? '#1E293B' : '#E2E8F0'}
              vertical={false}
            />
            <XAxis
              dataKey="_id"
              stroke={isDark ? '#64748B' : '#94A3B8'}
              fontSize={11}
              tickLine={false}
            />
            <YAxis
              stroke={isDark ? '#64748B' : '#94A3B8'}
              fontSize={11}
              tickLine={false}
              allowDecimals={false}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: isDark ? '#0B132B' : '#FFFFFF',
                borderColor: isDark ? '#1E356D' : '#E2E8F0',
                borderRadius: '12px',
                fontSize: '12px',
                color: isDark ? '#F8FAFC' : '#0F172A',
                boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.3)',
              }}
            />
            <Legend
              wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }}
              iconType="circle"
            />
            <Area
              type="monotone"
              dataKey="created"
              name="Created"
              stroke="#06B6D4"
              strokeWidth={2.5}
              fillOpacity={1}
              fill="url(#createdGrad)"
            />
            <Area
              type="monotone"
              dataKey="resolved"
              name="Resolved"
              stroke="#3B82F6"
              strokeWidth={2.5}
              fillOpacity={1}
              fill="url(#resolvedGrad)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

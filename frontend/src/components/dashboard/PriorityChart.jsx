import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { useTheme } from '../../contexts/ThemeContext.jsx';

const PRIORITY_COLORS = {
  Critical: '#F43F5E',
  High: '#F59E0B',
  Medium: '#3B82F6',
  Low: '#64748B',
};

export const PriorityChart = ({
  data = { Critical: 0, High: 0, Medium: 0, Low: 0 },
  title = 'Tickets by Priority',
}) => {
  const { isDark } = useTheme();

  const chartData = [
    { name: 'Critical', value: data.Critical || 0, color: PRIORITY_COLORS.Critical },
    { name: 'High', value: data.High || 0, color: PRIORITY_COLORS.High },
    { name: 'Medium', value: data.Medium || 0, color: PRIORITY_COLORS.Medium },
    { name: 'Low', value: data.Low || 0, color: PRIORITY_COLORS.Low },
  ];

  const total = chartData.reduce((acc, curr) => acc + curr.value, 0);

  if (total === 0) {
    return (
      <div className="p-5 rounded-2xl border border-slate-200 dark:border-navy-800 bg-white dark:bg-navy-900 shadow-sm flex flex-col justify-between min-h-[300px]">
        <div className="mb-2">
          <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">{title}</h3>
          <p className="text-xs text-slate-400">Incident urgency distribution</p>
        </div>
        <div className="h-48 w-full flex flex-col items-center justify-center text-center p-4">
          <p className="text-xs font-semibold text-slate-600 dark:text-slate-400">
            No incidents recorded yet
          </p>
          <p className="text-[11px] text-slate-400 max-w-xs mt-1">
            Priority distribution will display automatically once tickets are created.
          </p>
        </div>
        <div className="pt-2 border-t border-slate-100 dark:border-navy-800/80 text-[11px] text-slate-400 text-center">
          0 incidents logged
        </div>
      </div>
    );
  }

  return (
    <div className="p-5 rounded-2xl border border-slate-200 dark:border-navy-800 bg-white dark:bg-navy-900 shadow-sm flex flex-col justify-between">
      <div className="mb-2">
        <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">{title}</h3>
        <p className="text-xs text-slate-400">Incident urgency distribution</p>
      </div>

      <div className="relative h-48 w-full flex items-center justify-center my-2">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Tooltip
              contentStyle={{
                backgroundColor: isDark ? '#0B132B' : '#FFFFFF',
                borderColor: isDark ? '#1E356D' : '#E2E8F0',
                borderRadius: '12px',
                fontSize: '12px',
                color: isDark ? '#F8FAFC' : '#0F172A',
              }}
            />
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              innerRadius={55}
              outerRadius={75}
              paddingAngle={4}
              dataKey="value"
            >
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} stroke={isDark ? '#0B132B' : '#FFFFFF'} strokeWidth={2} />
              ))}
            </Pie>
          </PieChart>
        </ResponsiveContainer>

        {/* Center Total Count */}
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          <span className="text-2xl font-black text-slate-900 dark:text-slate-100">
            {total}
          </span>
          <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
            Total
          </span>
        </div>
      </div>

      {/* Legend Grid matching reference design */}
      <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100 dark:border-navy-800/80 text-xs">
        {chartData.map((item) => (
          <div key={item.name} className="flex items-center justify-between px-2 py-1 rounded-lg bg-slate-50 dark:bg-navy-850">
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
              <span className="text-slate-600 dark:text-slate-300 font-medium">{item.name}</span>
            </div>
            <span className="font-bold text-slate-900 dark:text-slate-100">{item.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

import React, { useState, useEffect } from 'react';
import { Download, BarChart2, Clock, ShieldCheck, Ticket, Calendar } from 'lucide-react';
import { analyticsService } from '../../services/analyticsService.js';
import { PageHeader } from '../../components/layout/PageHeader.jsx';
import { StatCard } from '../../components/dashboard/StatCard.jsx';
import { TicketTrendChart } from '../../components/dashboard/TicketTrendChart.jsx';
import { PriorityChart } from '../../components/dashboard/PriorityChart.jsx';
import { Button } from '../../components/common/Button.jsx';
import { LoadingSkeleton } from '../../components/common/LoadingSkeleton.jsx';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { useTheme } from '../../contexts/ThemeContext.jsx';
import { useModal } from '../../contexts/ModalContext.jsx';

const CATEGORY_COLORS = ['#06B6D4', '#3B82F6', '#8B5CF6', '#F59E0B', '#F43F5E', '#64748B'];

export const AnalyticsDashboard = () => {
  const { isDark } = useTheme();
  const { showError } = useModal();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState('7d');
  const [isExporting, setIsExporting] = useState(false);

  useEffect(() => {
    async function loadMetrics() {
      try {
        setLoading(true);
        const res = await analyticsService.getManagerMetrics();
        setData(res);
      } catch (err) {
        console.error('Failed to load analytics:', err);
      } finally {
        setLoading(false);
      }
    }
    loadMetrics();
  }, [dateRange]);

  const handleExport = async () => {
    if (isExporting) return;
    setIsExporting(true);
    try {
      await analyticsService.exportCSV();
    } catch (err) {
      showError({
        title: 'Export Failed',
        message: 'Failed to export CSV: ' + (err.response?.data?.message || err.message),
      });
    } finally {
      setIsExporting(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <LoadingSkeleton type="card" count={1} />
        <LoadingSkeleton type="stat" count={4} />
      </div>
    );
  }

  const categoryChartData = Object.entries(data?.categoryBreakdown || {}).map(([name, value], idx) => ({
    name,
    value,
    color: CATEGORY_COLORS[idx % CATEGORY_COLORS.length],
  }));

  return (
    <div className="space-y-6">
      <PageHeader
        title="Analytics & Incident Reports"
        description="Enterprise operational metrics, resolution times, and team throughput distribution."
        actions={
          <div className="flex items-center gap-3">
            <Button
              variant="primary"
              size="sm"
              leftIcon={Download}
              isLoading={isExporting}
              disabled={isExporting}
              onClick={handleExport}
            >
              Export CSV
            </Button>
          </div>
        }
      />

      {/* Metrics Row matching visual mockup */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
        <StatCard
          title="Total Tickets"
          value={data?.totalTickets ?? 0}
          icon={Ticket}
          iconColor="text-blue-500"
          iconBg="bg-blue-500/10"
        />

        <StatCard
          title="Avg. Response Time"
          value={data?.avgResponseTime || 'N/A'}
          icon={Clock}
          iconColor="text-cyan-500"
          iconBg="bg-cyan-500/10"
        />

        <StatCard
          title="Avg. Resolution Time"
          value={data?.avgResolutionTime || 'N/A'}
          icon={Clock}
          iconColor="text-purple-500"
          iconBg="bg-purple-500/10"
        />

        <StatCard
          title="SLA Compliance"
          value={data?.slaComplianceRate || '100%'}
          icon={ShieldCheck}
          iconColor="text-emerald-500"
          iconBg="bg-emerald-500/10"
        />
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Tickets by Category */}
        <div className="p-5 rounded-2xl border border-slate-200 dark:border-navy-800 bg-white dark:bg-navy-900 shadow-sm flex flex-col justify-between min-h-[300px]">
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
              Tickets by Category
            </h3>
            <p className="text-xs text-slate-400">Distribution across IT domains</p>
          </div>

          {categoryChartData.length === 0 ? (
            <div className="h-56 w-full flex flex-col items-center justify-center text-center p-4">
              <p className="text-xs text-slate-400">No ticket category data recorded yet</p>
            </div>
          ) : (
            <>
              <div className="h-56 w-full flex items-center justify-center my-3">
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
                      data={categoryChartData}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={75}
                      paddingAngle={3}
                      dataKey="value"
                    >
                      {categoryChartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} stroke={isDark ? '#0B132B' : '#FFFFFF'} strokeWidth={2} />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-3 border-t border-slate-100 dark:border-navy-800 text-xs">
                {categoryChartData.map((c) => (
                  <div key={c.name} className="flex items-center justify-between p-2 rounded-lg bg-slate-50 dark:bg-navy-850">
                    <div className="flex items-center gap-1.5 truncate">
                      <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: c.color }} />
                      <span className="truncate text-slate-600 dark:text-slate-300 font-medium">{c.name}</span>
                    </div>
                    <span className="font-bold text-slate-900 dark:text-slate-100 ml-1">{c.value}</span>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Priority Breakdown */}
        <PriorityChart data={data?.priorityBreakdown} />
      </div>

      {/* 7-day trend chart */}
      <TicketTrendChart data={data?.trends || []} />
    </div>
  );
};

import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, Building, Ticket, Server, ShieldCheck, ArrowRight } from 'lucide-react';
import { analyticsService } from '../../services/analyticsService.js';
import { PageHeader } from '../../components/layout/PageHeader.jsx';
import { StatCard } from '../../components/dashboard/StatCard.jsx';
import { TicketTrendChart } from '../../components/dashboard/TicketTrendChart.jsx';
import { Button } from '../../components/common/Button.jsx';
import { LoadingSkeleton } from '../../components/common/LoadingSkeleton.jsx';
import { formatRelativeTime } from '../../utils/formatDate.js';

export const AdminDashboard = () => {
  const navigate = useNavigate();
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        const data = await analyticsService.getAdminMetrics();
        setMetrics(data);
      } catch (err) {
        console.error('Failed to load admin metrics:', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  if (loading) {
    return (
      <div className="space-y-6">
        <LoadingSkeleton type="card" count={1} />
        <LoadingSkeleton type="stat" count={4} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="System Overview"
        description="Platform statistics, user accounts, tenant boundaries, and security health status."
        actions={
          <div className="flex items-center gap-2.5">
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate('/admin/audit-logs')}
            >
              Audit Trail
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={() => navigate('/users')}
            >
              Manage Users
            </Button>
          </div>
        }
      />

      {/* Metrics matching reference visual design */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
        <StatCard
          title="Total Users"
          value={metrics?.totalUsers ?? 0}
          icon={Users}
          iconColor="text-blue-500"
          iconBg="bg-blue-500/10"
          description="Active accounts in organization"
        />

        <StatCard
          title="Total Organizations"
          value={metrics?.totalOrganizations ?? 0}
          icon={Building}
          iconColor="text-amber-500"
          iconBg="bg-amber-500/10"
          description="Configured enterprise tenants"
        />

        <StatCard
          title="Open Tickets"
          value={metrics?.openTickets ?? 0}
          icon={Ticket}
          iconColor="text-cyan-500"
          iconBg="bg-cyan-500/10"
          description="Active across all departments"
        />

        <StatCard
          title="System Health"
          value={metrics?.systemUptime ?? 'Active'}
          trend="Optimal"
          trendDirection="up"
          icon={Server}
          iconColor="text-emerald-500"
          iconBg="bg-emerald-500/10"
          description="All background services running"
        />
      </div>

      {/* Charts & System Activity Feed matching visual reference */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <TicketTrendChart
            title="System Incident Trends"
            data={metrics?.trends || []}
          />
        </div>

        {/* Recent Activity / Audit Log Feed */}
        <div className="lg:col-span-1 p-5 rounded-2xl border border-slate-200 dark:border-navy-800 bg-white dark:bg-navy-900 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                  Recent Activity
                </h3>
                <p className="text-xs text-slate-400">System audit events stream</p>
              </div>
              <button
                type="button"
                onClick={() => navigate('/admin/audit-logs')}
                className="text-xs font-semibold text-blue-600 dark:text-cyan-400 hover:underline flex items-center gap-1"
              >
                View all <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="divide-y divide-slate-100 dark:divide-navy-800/80">
              {metrics?.recentAuditLogs?.length === 0 ? (
                <div className="py-8 text-center text-xs text-slate-400">
                  No audit events recorded yet
                </div>
              ) : (
                metrics?.recentAuditLogs?.slice(0, 5).map((log) => (
                  <div key={log._id} className="py-3 flex items-start gap-3 text-xs">
                    <div className="p-1.5 rounded-lg bg-blue-500/10 text-blue-500 shrink-0 mt-0.5">
                      <ShieldCheck className="w-3.5 h-3.5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-slate-800 dark:text-slate-200 truncate">
                        {log.action.replace(/_/g, ' ')}
                      </p>
                      <p className="text-[11px] text-slate-400">
                        {log.actor?.name || 'System'} • {formatRelativeTime(log.createdAt)}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

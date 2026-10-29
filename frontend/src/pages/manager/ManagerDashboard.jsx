import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Ticket, AlertCircle, Clock, ShieldCheck, Download, Users } from 'lucide-react';
import { analyticsService } from '../../services/analyticsService.js';
import { PageHeader } from '../../components/layout/PageHeader.jsx';
import { StatCard } from '../../components/dashboard/StatCard.jsx';
import { PriorityChart } from '../../components/dashboard/PriorityChart.jsx';
import { Button } from '../../components/common/Button.jsx';
import { LoadingSkeleton } from '../../components/common/LoadingSkeleton.jsx';

export const ManagerDashboard = () => {
  const navigate = useNavigate();
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        const data = await analyticsService.getManagerMetrics();
        setMetrics(data);
      } catch (err) {
        console.error('Failed to load manager metrics:', err);
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

  const handleExport = async () => {
    try {
      await analyticsService.exportCSV();
    } catch (err) {
      alert('Failed to export CSV: ' + err.message);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Team Overview"
        description="Track your department's incident resolution performance, SLA compliance, and workload distribution."
        actions={
          <div className="flex items-center gap-2.5">
            <Button
              variant="outline"
              size="sm"
              leftIcon={Download}
              onClick={handleExport}
            >
              Export CSV
            </Button>
            <Button
              variant="primary"
              size="sm"
              leftIcon={Users}
              onClick={() => navigate('/teams')}
            >
              Manage Teams
            </Button>
          </div>
        }
      />

      {/* Metrics matching reference visual design */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
        <StatCard
          title="Total Tickets"
          value={metrics?.totalTickets ?? 0}
          icon={Ticket}
          iconColor="text-blue-500"
          iconBg="bg-blue-500/10"
        />

        <StatCard
          title="Open Tickets"
          value={metrics?.openTickets ?? 0}
          icon={AlertCircle}
          iconColor="text-amber-500"
          iconBg="bg-amber-500/10"
        />

        <StatCard
          title="Avg. Resolution Time"
          value={metrics?.avgResolutionTime || 'N/A'}
          icon={Clock}
          iconColor="text-cyan-500"
          iconBg="bg-cyan-500/10"
        />

        <StatCard
          title="SLA Compliance"
          value={metrics?.slaComplianceRate || '100%'}
          icon={ShieldCheck}
          iconColor="text-emerald-500"
          iconBg="bg-emerald-500/10"
        />
      </div>

      {/* Charts & Team Performance Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Priority Donut Chart */}
        <div className="lg:col-span-1">
          <PriorityChart
            title="Tickets by Priority"
            data={metrics?.priorityBreakdown}
          />
        </div>

        {/* Team Performance Table matching visual mockup */}
        <div className="lg:col-span-2 p-5 rounded-2xl border border-slate-200 dark:border-navy-800 bg-white dark:bg-navy-900 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                  Team Performance
                </h3>
                <p className="text-xs text-slate-400">
                  Workload and SLA delivery per technician
                </p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-100 dark:border-navy-800 text-slate-400 font-semibold uppercase tracking-wider text-[11px]">
                    <th className="py-2.5 px-3">Technician</th>
                    <th className="py-2.5 px-3 text-center">Assigned</th>
                    <th className="py-2.5 px-3 text-center">Resolved</th>
                    <th className="py-2.5 px-3 text-right">SLA Compliance</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-navy-800/60 font-medium">
                  {!metrics?.technicianPerformance || metrics.technicianPerformance.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="py-8 text-center text-slate-400 text-xs">
                        No technician activity recorded yet
                      </td>
                    </tr>
                  ) : (
                    metrics.technicianPerformance.map((tech) => (
                      <tr key={tech._id} className="hover:bg-slate-50 dark:hover:bg-navy-850/50">
                        <td className="py-3 px-3 flex items-center gap-2.5">
                          {tech.avatar ? (
                            <img
                              src={tech.avatar}
                              alt={tech.name}
                              className="w-7 h-7 rounded-full object-cover"
                            />
                          ) : (
                            <div className="w-7 h-7 rounded-full bg-blue-600 text-white font-bold flex items-center justify-center text-[10px]">
                              {tech.name?.charAt(0)}
                            </div>
                          )}
                          <div>
                            <div className="font-semibold text-slate-900 dark:text-slate-100">
                              {tech.name}
                            </div>
                            <div className="text-[10px] text-slate-400">{tech.email}</div>
                          </div>
                        </td>
                        <td className="py-3 px-3 text-center text-slate-700 dark:text-slate-300 font-bold">
                          {tech.assignedCount}
                        </td>
                        <td className="py-3 px-3 text-center text-slate-700 dark:text-slate-300 font-bold">
                          {tech.resolvedCount}
                        </td>
                        <td className="py-3 px-3 text-right">
                          <span
                            className={`inline-block px-2 py-0.5 rounded-full font-bold text-[11px] ${
                              tech.slaPercent >= 90
                                ? 'text-emerald-500 bg-emerald-500/10'
                                : 'text-amber-500 bg-amber-500/10'
                            }`}
                          >
                            {tech.slaPercent}%
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

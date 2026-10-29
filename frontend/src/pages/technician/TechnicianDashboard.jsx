import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Briefcase, AlertTriangle, Clock, CheckCircle2, ArrowRight } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext.jsx';
import { analyticsService } from '../../services/analyticsService.js';
import { PageHeader } from '../../components/layout/PageHeader.jsx';
import { StatCard } from '../../components/dashboard/StatCard.jsx';
import { TicketTable } from '../../components/tickets/TicketTable.jsx';
import { Button } from '../../components/common/Button.jsx';
import { LoadingSkeleton } from '../../components/common/LoadingSkeleton.jsx';

export const TechnicianDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        const data = await analyticsService.getTechnicianMetrics();
        setMetrics(data);
      } catch (err) {
        console.error('Failed to load technician metrics:', err);
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
        <LoadingSkeleton type="table" count={5} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Technician Workspace: ${user?.name}`}
        description="Monitor active assignments, SLA countdowns, and quick resolution workflows."
        actions={
          <Button
            variant="primary"
            onClick={() => navigate('/tickets/assigned')}
          >
            Manage Queue
          </Button>
        }
      />

      {/* Technician Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
        <StatCard
          title="Assigned Workload"
          value={metrics?.assignedWorkload ?? 0}
          icon={Briefcase}
          iconColor="text-cyan-500"
          iconBg="bg-cyan-500/10"
          description="Active incidents in your queue"
        />

        <StatCard
          title="Overdue Incidents"
          value={metrics?.overdueCount ?? 0}
          icon={AlertTriangle}
          iconColor="text-rose-500"
          iconBg="bg-rose-500/10"
          trend={metrics?.overdueCount > 0 ? 'Action required' : 'Clear'}
          trendDirection={metrics?.overdueCount > 0 ? 'down' : 'up'}
          description="SLA resolution deadline passed"
        />

        <StatCard
          title="Approaching SLA (<30m)"
          value={metrics?.approachingSLA ?? 0}
          icon={Clock}
          iconColor="text-amber-500"
          iconBg="bg-amber-500/10"
          description="Requires prompt response"
        />

        <StatCard
          title="Avg. Resolution Time"
          value={`${metrics?.avgResolutionHours ?? 3.2}h`}
          icon={CheckCircle2}
          iconColor="text-emerald-500"
          iconBg="bg-emerald-500/10"
          trend="↓ 20%"
          trendDirection="up"
          description="Personal turnaround benchmark"
        />
      </div>

      {/* Assigned Tickets Priority Queue */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
              Active Assigned Queue
            </h3>
            <p className="text-xs text-slate-400">
              Ranked by nearest SLA resolution deadline
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate('/tickets/assigned')}
            rightIcon={ArrowRight}
          >
            View all assigned
          </Button>
        </div>

        <TicketTable tickets={metrics?.assignedTickets || []} />
      </div>
    </div>
  );
};

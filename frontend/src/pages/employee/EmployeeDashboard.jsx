import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PlusCircle, Clock, CheckCircle2, Ticket, AlertCircle } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext.jsx';
import { analyticsService } from '../../services/analyticsService.js';
import { PageHeader } from '../../components/layout/PageHeader.jsx';
import { StatCard } from '../../components/dashboard/StatCard.jsx';
import { TicketTrendChart } from '../../components/dashboard/TicketTrendChart.jsx';
import { RecentActivity } from '../../components/dashboard/RecentActivity.jsx';
import { Button } from '../../components/common/Button.jsx';
import { LoadingSkeleton } from '../../components/common/LoadingSkeleton.jsx';

export const EmployeeDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        const data = await analyticsService.getEmployeeMetrics();
        setMetrics(data);
      } catch (err) {
        console.error('Failed to load employee metrics:', err);
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

  const firstName = user?.name ? user.name.split(' ')[0] : 'User';

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Welcome back, ${firstName}`}
        description="Here's what's happening with your support tickets today."
        actions={
          <Button
            variant="primary"
            leftIcon={PlusCircle}
            onClick={() => navigate('/tickets/create')}
          >
            Create Ticket
          </Button>
        }
      />

      {/* Stat Cards matching visual mockup */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
        <StatCard
          title="My Open Tickets"
          value={metrics?.openCount ?? 0}
          icon={AlertCircle}
          iconColor="text-blue-500"
          iconBg="bg-blue-500/10"
          description="Awaiting initial response"
        />

        <StatCard
          title="In Progress"
          value={metrics?.inProgressCount ?? 0}
          icon={Clock}
          iconColor="text-cyan-500"
          iconBg="bg-cyan-500/10"
          description="Currently being worked on"
        />

        <StatCard
          title="Resolved Today"
          value={metrics?.resolvedTodayCount ?? 0}
          icon={CheckCircle2}
          iconColor="text-emerald-500"
          iconBg="bg-emerald-500/10"
          description="Completed in last 24h"
        />

        <StatCard
          title="Total Tickets"
          value={metrics?.totalCount ?? 0}
          icon={Ticket}
          iconColor="text-purple-500"
          iconBg="bg-purple-500/10"
          description="Lifetime submitted"
        />
      </div>

      {/* Chart & Recent Tickets Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <TicketTrendChart
            title="Ticket Overview"
            data={metrics?.trends || []}
          />
        </div>

        <div className="lg:col-span-1">
          <RecentActivity
            title="Recent Tickets"
            tickets={metrics?.recentTickets || []}
            viewAllLink="/tickets/my"
          />
        </div>
      </div>
    </div>
  );
};

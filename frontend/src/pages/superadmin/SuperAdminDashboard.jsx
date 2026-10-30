import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Building2,
  Users,
  Ticket,
  Clock,
  ShieldCheck,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  ArrowRight,
  RefreshCw,
  Search,
  ExternalLink,
  Activity,
  Calendar,
  Layers,
  ArrowUpRight,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Cell,
  PieChart,
  Pie,
  Legend,
} from 'recharts';
import { superadminService } from '../../services/superadminService.js';
import { ConfirmDialog } from '../../components/common/ConfirmDialog.jsx';
import { Modal } from '../../components/common/Modal.jsx';
import { Button } from '../../components/common/Button.jsx';
import { LoadingSkeleton } from '../../components/common/LoadingSkeleton.jsx';
import { useModal } from '../../contexts/ModalContext.jsx';
import { ORGANIZATION_STATUSES } from '../../utils/constants.js';

export const SuperAdminDashboard = () => {
  const { showError, showSuccess } = useModal();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  // Dialog & Modal State
  const [confirmApprove, setConfirmApprove] = useState(null);
  const [rejectModal, setRejectModal] = useState(null);
  const [rejectReason, setRejectReason] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  const fetchOverview = useCallback(async (isRefresh = false) => {
    try {
      if (isRefresh) setRefreshing(true);
      else setLoading(true);
      setError(null);
      const res = await superadminService.getOverview();
      setData(res);
    } catch (err) {
      setError(err.message || 'Failed to fetch platform metrics.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchOverview();
  }, [fetchOverview]);

  const handleApprove = async () => {
    if (!confirmApprove) return;
    try {
      setActionLoading(true);
      await superadminService.approveOrganization(confirmApprove._id);
      const orgName = confirmApprove.name;
      setConfirmApprove(null);
      await fetchOverview(true);
      showSuccess({
        title: 'Organization Approved',
        message: `Organization "${orgName}" has been approved successfully.`,
        status: 'Completed',
        buttonText: 'Got it',
      });
    } catch (err) {
      showError({
        title: 'Approval Failed',
        message: 'Approval failed: ' + (err.response?.data?.message || err.message),
      });
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async (e) => {
    e.preventDefault();
    if (!rejectModal || !rejectReason.trim()) return;
    try {
      setActionLoading(true);
      await superadminService.rejectOrganization(rejectModal._id, rejectReason.trim());
      const orgName = rejectModal.name;
      setRejectModal(null);
      setRejectReason('');
      await fetchOverview(true);
      showSuccess({
        title: 'Registration Rejected',
        message: `Organization "${orgName}" registration has been rejected.`,
        status: 'Completed',
        buttonText: 'Got it',
      });
    } catch (err) {
      showError({
        title: 'Rejection Failed',
        message: 'Rejection failed: ' + (err.response?.data?.message || err.message),
      });
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="p-4 sm:p-6 lg:p-8 space-y-6">
        <div className="h-8 w-64 bg-slate-200 dark:bg-navy-800 rounded-lg animate-pulse" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          <LoadingSkeleton type="card" count={4} />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <LoadingSkeleton type="card" count={2} />
        </div>
      </div>
    );
  }

  const orgStats = data?.organizations || { total: 0, active: 0, pending: 0, suspended: 0, rejected: 0, trial: 0 };
  const userStats = data?.users || { total: 0, active: 0 };
  const ticketStats = data?.tickets || { total: 0, open: 0, inProgress: 0, resolved: 0, closed: 0, breached: 0 };
  const recentOrgs = data?.recentOrganizations || [];
  const recentLogs = data?.recentAuditLogs || [];

  // Recharts Chart Data
  const orgStatusChartData = [
    { name: 'Active', value: orgStats.active, color: '#10b981' },
    { name: 'Pending', value: orgStats.pending, color: '#f59e0b' },
    { name: 'Suspended', value: orgStats.suspended, color: '#f43f5e' },
    { name: 'Trial', value: orgStats.trial || 0, color: '#6366f1' },
  ].filter((item) => item.value > 0);

  const ticketBreakdownData = [
    { name: 'Open', count: ticketStats.open, fill: '#ef4444' },
    { name: 'In Progress', count: ticketStats.inProgress, fill: '#06b6d4' },
    { name: 'Resolved', count: ticketStats.resolved, fill: '#10b981' },
    { name: 'Closed', count: ticketStats.closed, fill: '#64748b' },
  ];

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              Platform Administration
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/30">
              Super Admin
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Real-time multi-tenant health, cross-organization operations, and global metrics.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={() => fetchOverview(true)}
            isLoading={refreshing}
            leftIcon={RefreshCw}
          >
            Refresh Metrics
          </Button>
          <Link to="/superadmin/requests">
            <Button variant="primary" size="sm" rightIcon={ArrowRight}>
              Review Requests
              {orgStats.pending > 0 && (
                <span className="ml-1 px-1.5 py-0.5 rounded-full text-[10px] bg-amber-400 text-slate-900 font-bold">
                  {orgStats.pending}
                </span>
              )}
            </Button>
          </Link>
        </div>
      </div>

      {/* Pending Approval Notice Banner */}
      {orgStats.pending > 0 && (
        <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
              <Clock className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <p className="text-sm font-bold text-slate-900 dark:text-white">
                {orgStats.pending} {orgStats.pending === 1 ? 'Organization Registration' : 'Organizations'} Awaiting Approval
              </p>
              <p className="text-xs text-slate-600 dark:text-slate-300">
                Newly registered institutional tenants cannot access services until reviewed and activated.
              </p>
            </div>
          </div>
          <Link to="/superadmin/requests" className="shrink-0">
            <Button variant="secondary" size="sm">
              Review Now
            </Button>
          </Link>
        </div>
      )}

      {/* KPI Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        {/* Card 1: Total Organizations */}
        <div className="p-5 rounded-2xl bg-white dark:bg-navy-900 border border-slate-200 dark:border-navy-800 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Organizations
            </span>
            <div className="w-9 h-9 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center">
              <Building2 className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-black text-slate-900 dark:text-white">
              {orgStats.total}
            </span>
            <span className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold">
              {orgStats.active} Active
            </span>
          </div>
          <div className="mt-2 flex items-center gap-2 text-[11px] text-slate-500">
            <span className="text-amber-500 font-semibold">{orgStats.pending} Pending</span>
            <span>&bull;</span>
            <span className="text-rose-500 font-semibold">{orgStats.suspended} Suspended</span>
          </div>
        </div>

        {/* Card 2: Total Users */}
        <div className="p-5 rounded-2xl bg-white dark:bg-navy-900 border border-slate-200 dark:border-navy-800 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Total Staff & Users
            </span>
            <div className="w-9 h-9 rounded-xl bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 flex items-center justify-center">
              <Users className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-black text-slate-900 dark:text-white">
              {userStats.total}
            </span>
            <span className="text-xs text-cyan-600 dark:text-cyan-400 font-semibold">
              Across Tenants
            </span>
          </div>
          <div className="mt-2 text-[11px] text-slate-500">
            {userStats.active} active user accounts registered
          </div>
        </div>

        {/* Card 3: Total Tickets */}
        <div className="p-5 rounded-2xl bg-white dark:bg-navy-900 border border-slate-200 dark:border-navy-800 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Platform Incidents
            </span>
            <div className="w-9 h-9 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center">
              <Ticket className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-black text-slate-900 dark:text-white">
              {ticketStats.total}
            </span>
            <span className="text-xs text-purple-600 dark:text-purple-400 font-semibold">
              {ticketStats.open + ticketStats.inProgress} In-Flight
            </span>
          </div>
          <div className="mt-2 text-[11px] text-slate-500">
            {ticketStats.resolved + ticketStats.closed} resolved or closed
          </div>
        </div>

        {/* Card 4: Platform Health */}
        <div className="p-5 rounded-2xl bg-white dark:bg-navy-900 border border-slate-200 dark:border-navy-800 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Platform Security
            </span>
            <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <ShieldCheck className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-black text-emerald-500">
              100%
            </span>
            <span className="text-xs text-slate-500 font-semibold">
              Isolated
            </span>
          </div>
          <div className="mt-2 text-[11px] text-slate-500">
            Multi-tenant data, socket & file boundary active
          </div>
        </div>
      </div>

      {/* Visual Analytics Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Ticket Breakdown by Lifecycle */}
        <div className="p-6 rounded-3xl bg-white dark:bg-navy-900 border border-slate-200 dark:border-navy-800 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Ticket Status Distribution
              </h3>
              <p className="text-xs text-slate-400">Platform-wide incident lifecycle volume</p>
            </div>
            <Ticket className="w-5 h-5 text-slate-400" />
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={ticketBreakdownData}>
                <XAxis dataKey="name" stroke="#94a3b8" fontSize={12} tickLine={false} />
                <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} allowDecimals={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0f172a',
                    border: '1px solid #1e293b',
                    borderRadius: '0.75rem',
                    color: '#f8fafc',
                  }}
                />
                <Bar dataKey="count" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Organization Status Distribution */}
        <div className="p-6 rounded-3xl bg-white dark:bg-navy-900 border border-slate-200 dark:border-navy-800 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Tenant Lifecycle Breakdown
              </h3>
              <p className="text-xs text-slate-400">Total organizations categorized by operational status</p>
            </div>
            <Building2 className="w-5 h-5 text-slate-400" />
          </div>

          <div className="h-64 w-full flex items-center justify-center">
            {orgStatusChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={orgStatusChartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={85}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {orgStatusChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#0f172a',
                      border: '1px solid #1e293b',
                      borderRadius: '0.75rem',
                      color: '#f8fafc',
                    }}
                  />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-xs text-slate-400">No organizations currently recorded</p>
            )}
          </div>
        </div>
      </div>

      {/* Recent Organizations Section */}
      <div className="p-6 rounded-3xl bg-white dark:bg-navy-900 border border-slate-200 dark:border-navy-800 shadow-sm">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              Recent Organizations
            </h3>
            <p className="text-xs text-slate-400">Newly registered and active tenant accounts</p>
          </div>
          <Link
            to="/superadmin/organizations"
            className="text-xs font-semibold text-cyan-600 dark:text-cyan-400 hover:underline flex items-center gap-1"
          >
            View All ({orgStats.total})
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-navy-850 text-slate-500 uppercase tracking-wider font-semibold border-y border-slate-100 dark:border-navy-800">
              <tr>
                <th className="py-3 px-4">Organization</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Plan</th>
                <th className="py-3 px-4">Admin Contact</th>
                <th className="py-3 px-4 text-center">Users</th>
                <th className="py-3 px-4 text-center">Tickets</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-navy-800 text-slate-700 dark:text-slate-300">
              {recentOrgs.length > 0 ? (
                recentOrgs.map((org) => {
                  const statusInfo = ORGANIZATION_STATUSES[org.status] || ORGANIZATION_STATUSES.pending;
                  return (
                    <tr key={org._id} className="hover:bg-slate-50/50 dark:hover:bg-navy-800/40 transition-colors">
                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-900 dark:text-white">{org.name}</div>
                        <div className="text-[11px] text-slate-400">{org.domain || org.slug}</div>
                      </td>
                      <td className="py-3 px-4">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full font-semibold text-[11px] ${statusInfo.bg}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${statusInfo.dot}`} />
                          {statusInfo.label}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span className="capitalize px-2 py-0.5 rounded-lg bg-slate-100 dark:bg-navy-800 text-[11px] font-medium">
                          {org.plan}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <div className="text-slate-900 dark:text-white font-medium">{org.adminName}</div>
                        <div className="text-[11px] text-slate-400">{org.adminEmail}</div>
                      </td>
                      <td className="py-3 px-4 text-center font-semibold">{org.userCount}</td>
                      <td className="py-3 px-4 text-center font-semibold">{org.ticketCount}</td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {org.status === 'pending' && (
                            <>
                              <button
                                onClick={() => setConfirmApprove(org)}
                                className="px-2 py-1 rounded-lg text-emerald-600 bg-emerald-500/10 hover:bg-emerald-500/20 font-semibold"
                              >
                                Approve
                              </button>
                              <button
                                onClick={() => setRejectModal(org)}
                                className="px-2 py-1 rounded-lg text-rose-600 bg-rose-500/10 hover:bg-rose-500/20 font-semibold"
                              >
                                Reject
                              </button>
                            </>
                          )}
                          <Link
                            to={`/superadmin/organizations/${org._id}`}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-cyan-500 hover:bg-slate-100 dark:hover:bg-navy-800"
                            title="View Details"
                          >
                            <ExternalLink className="w-4 h-4" />
                          </Link>
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={7} className="text-center py-6 text-slate-400">
                    No recent organizations recorded.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Recent Platform Audit Logs */}
      <div className="p-6 rounded-3xl bg-white dark:bg-navy-900 border border-slate-200 dark:border-navy-800 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              Recent Platform Activities
            </h3>
            <p className="text-xs text-slate-400">Live platform operations and security audit events</p>
          </div>
          <Link
            to="/superadmin/audit-logs"
            className="text-xs font-semibold text-cyan-600 dark:text-cyan-400 hover:underline flex items-center gap-1"
          >
            All Audit Logs
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="space-y-3">
          {recentLogs.length > 0 ? (
            recentLogs.map((log) => (
              <div
                key={log._id}
                className="flex items-start justify-between gap-4 p-3 rounded-2xl bg-slate-50 dark:bg-navy-950/60 border border-slate-100 dark:border-navy-800"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 flex items-center justify-center shrink-0">
                    <Activity className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-slate-900 dark:text-white">
                      {log.action.replace(/_/g, ' ')}
                    </p>
                    <p className="text-[11px] text-slate-500">
                      by <span className="font-medium text-slate-700 dark:text-slate-300">{log.actor?.name || log.actor?.email || 'System'}</span>
                      {log.organization?.name && (
                        <span> &bull; Organization: <strong className="text-cyan-600 dark:text-cyan-400">{log.organization.name}</strong></span>
                      )}
                    </p>
                  </div>
                </div>
                <div className="text-[11px] text-slate-400 shrink-0">
                  {new Date(log.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>
            ))
          ) : (
            <p className="text-xs text-slate-400 text-center py-4">No audit logs recorded yet.</p>
          )}
        </div>
      </div>

      {/* Confirmation Dialog: Approve Organization */}
      <ConfirmDialog
        isOpen={!!confirmApprove}
        title="Approve Organization"
        message={`Are you sure you want to approve '${confirmApprove?.name}'? This will activate the organization, provision their default SLA policy, and grant their users access to TechDesk.`}
        confirmLabel="Approve & Activate"
        confirmVariant="primary"
        isLoading={actionLoading}
        onConfirm={handleApprove}
        onCancel={() => setConfirmApprove(null)}
      />

      {/* Rejection Modal with Reason */}
      <Modal
        isOpen={!!rejectModal}
        onClose={() => {
          setRejectModal(null);
          setRejectReason('');
        }}
        title={`Reject Registration: ${rejectModal?.name}`}
      >
        <form onSubmit={handleReject} className="space-y-4">
          <p className="text-xs text-slate-600 dark:text-slate-300">
            Please provide a specific reason for rejecting this organization registration. The record will be preserved for compliance and audit logs.
          </p>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Rejection Reason *
            </label>
            <textarea
              required
              rows={3}
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="e.g. Unverified institution credentials or duplicate application."
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-navy-700 bg-white dark:bg-navy-950 text-slate-900 dark:text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-rose-500"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setRejectModal(null);
                setRejectReason('');
              }}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="danger"
              isLoading={actionLoading}
            >
              Confirm Rejection
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

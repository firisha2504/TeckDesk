import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  Building2,
  ArrowLeft,
  Users,
  Ticket,
  Clock,
  ShieldCheck,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Mail,
  Phone,
  MapPin,
  Globe,
  Calendar,
  Layers,
  Activity,
  Sliders,
  Save,
  RefreshCw,
} from 'lucide-react';
import { superadminService } from '../../services/superadminService.js';
import { ConfirmDialog } from '../../components/common/ConfirmDialog.jsx';
import { Modal } from '../../components/common/Modal.jsx';
import { Button } from '../../components/common/Button.jsx';
import { Input } from '../../components/common/Input.jsx';
import { LoadingSkeleton } from '../../components/common/LoadingSkeleton.jsx';
import { useModal } from '../../contexts/ModalContext.jsx';
import { ORGANIZATION_STATUSES } from '../../utils/constants.js';

export const OrganizationDetail = () => {
  const { showError, showSuccess } = useModal();
  const { id } = useParams();
  const navigate = useNavigate();

  const [details, setDetails] = useState(null);
  const [stats, setStats] = useState(null);
  const [activity, setActivity] = useState([]);
  const [activityTotal, setActivityTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const [error, setError] = useState(null);

  // Edit State
  const [editForm, setEditForm] = useState({
    name: '',
    domain: '',
    plan: 'standard',
    defaultTicketPriority: 'Medium',
    allowRegistration: true,
  });
  const [saveLoading, setSaveLoading] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState('');

  // Lifecycle Action States
  const [confirmApprove, setConfirmApprove] = useState(false);
  const [suspendModal, setSuspendModal] = useState(false);
  const [suspendReason, setSuspendReason] = useState('');
  const [confirmReactivate, setConfirmReactivate] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  const loadData = useCallback(async (isRefresh = false) => {
    try {
      if (isRefresh) setRefreshing(true);
      else setLoading(true);
      setError(null);

      const [detailsRes, statsRes, activityRes] = await Promise.all([
        superadminService.getOrganizationDetails(id),
        superadminService.getOrganizationStats(id),
        superadminService.getOrganizationActivity(id, { limit: 15 }),
      ]);

      setDetails(detailsRes);
      setStats(statsRes?.metrics || null);
      setActivity(activityRes?.logs || []);
      setActivityTotal(activityRes?.total || 0);

      if (detailsRes?.organization) {
        const org = detailsRes.organization;
        setEditForm({
          name: org.name || '',
          domain: org.domain || '',
          plan: org.plan || 'standard',
          defaultTicketPriority: org.settings?.defaultTicketPriority || 'Medium',
          allowRegistration: org.settings?.allowRegistration !== false,
        });
      }
    } catch (err) {
      setError(err.message || 'Failed to load organization profile.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [id]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleUpdate = async (e) => {
    e.preventDefault();
    try {
      setSaveLoading(true);
      setSaveSuccess('');
      await superadminService.updateOrganization(id, {
        name: editForm.name.trim(),
        domain: editForm.domain ? editForm.domain.trim().toLowerCase() : '',
        plan: editForm.plan,
        settings: {
          allowRegistration: editForm.allowRegistration,
          defaultTicketPriority: editForm.defaultTicketPriority,
        },
      });
      setSaveSuccess('Organization settings successfully updated.');
      await loadData(true);
      setTimeout(() => setSaveSuccess(''), 4000);
      showSuccess({
        title: 'Settings Saved',
        message: 'Organization settings successfully updated.',
        status: 'Completed',
        buttonText: 'Got it',
      });
    } catch (err) {
      showError({
        title: 'Update Failed',
        message: 'Failed to update organization: ' + (err.response?.data?.message || err.message),
      });
    } finally {
      setSaveLoading(false);
    }
  };

  const handleApprove = async () => {
    try {
      setActionLoading(true);
      await superadminService.approveOrganization(id);
      setConfirmApprove(false);
      await loadData(true);
      showSuccess({
        title: 'Organization Approved',
        message: 'Organization has been approved successfully.',
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

  const handleSuspend = async (e) => {
    e.preventDefault();
    if (!suspendReason.trim()) return;
    try {
      setActionLoading(true);
      await superadminService.suspendOrganization(id, suspendReason.trim());
      setSuspendModal(false);
      setSuspendReason('');
      await loadData(true);
      showSuccess({
        title: 'Organization Suspended',
        message: 'Organization has been suspended.',
        status: 'Suspended',
        buttonText: 'Got it',
      });
    } catch (err) {
      showError({
        title: 'Suspension Failed',
        message: 'Suspension failed: ' + (err.response?.data?.message || err.message),
      });
    } finally {
      setActionLoading(false);
    }
  };

  const handleReactivate = async () => {
    try {
      setActionLoading(true);
      await superadminService.reactivateOrganization(id);
      setConfirmReactivate(false);
      await loadData(true);
      showSuccess({
        title: 'Organization Reactivated',
        message: 'Organization has been reactivated successfully.',
        status: 'Completed',
        buttonText: 'Got it',
      });
    } catch (err) {
      showError({
        title: 'Reactivation Failed',
        message: 'Reactivation failed: ' + (err.response?.data?.message || err.message),
      });
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="p-4 sm:p-6 lg:p-8 space-y-6">
        <div className="h-6 w-32 bg-slate-200 dark:bg-navy-800 rounded animate-pulse" />
        <LoadingSkeleton type="card" count={3} />
      </div>
    );
  }

  if (error || !details) {
    return (
      <div className="p-8 text-center">
        <p className="text-rose-500 font-semibold mb-4">{error || 'Organization not found'}</p>
        <Link to="/superadmin/organizations">
          <Button variant="outline" leftIcon={ArrowLeft}>
            Back to Organizations
          </Button>
        </Link>
      </div>
    );
  }

  const { organization, admins, stats: orgStatsSnapshot } = details;
  const statusInfo = ORGANIZATION_STATUSES[organization.status] || ORGANIZATION_STATUSES.pending;

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6">
      {/* Breadcrumb Navigation */}
      <div className="flex items-center justify-between">
        <Link
          to="/superadmin/organizations"
          className="inline-flex items-center gap-2 text-xs font-semibold text-slate-500 hover:text-cyan-600 dark:hover:text-cyan-400 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Organizations Directory</span>
        </Link>

        <Button
          variant="outline"
          size="sm"
          onClick={() => loadData(true)}
          isLoading={refreshing}
          leftIcon={RefreshCw}
        >
          Refresh Profile
        </Button>
      </div>

      {/* Profile Header Banner */}
      <div className="p-6 rounded-3xl bg-white dark:bg-navy-900 border border-slate-200 dark:border-navy-800 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-start gap-4">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-cyan-500 to-blue-600 text-white flex items-center justify-center text-xl font-black shadow-lg shadow-cyan-500/20 shrink-0">
            {organization.name.charAt(0).toUpperCase()}
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2.5">
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                {organization.name}
              </h1>
              <span className={`inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full font-bold text-xs ${statusInfo.bg}`}>
                <span className={`w-2 h-2 rounded-full ${statusInfo.dot}`} />
                {statusInfo.label}
              </span>
              <span className="capitalize px-2.5 py-0.5 rounded-lg bg-slate-100 dark:bg-navy-800 text-xs font-semibold text-slate-600 dark:text-slate-300">
                {organization.plan} Plan
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1 flex flex-wrap items-center gap-3">
              <span>Slug: <strong className="text-slate-700 dark:text-slate-300">{organization.slug}</strong></span>
              {organization.domain && <span>&bull; Domain: <strong>{organization.domain}</strong></span>}
              <span>&bull; Created: {new Date(organization.createdAt).toLocaleDateString()}</span>
            </p>
          </div>
        </div>

        {/* Header Action Buttons */}
        <div className="flex items-center gap-3 self-end md:self-center">
          {organization.status === 'pending' && (
            <Button
              variant="primary"
              size="sm"
              onClick={() => setConfirmApprove(true)}
              leftIcon={CheckCircle2}
            >
              Approve Organization
            </Button>
          )}

          {organization.status === 'active' && (
            <Button
              variant="danger"
              size="sm"
              onClick={() => setSuspendModal(true)}
              leftIcon={AlertTriangle}
            >
              Suspend Workspace
            </Button>
          )}

          {organization.status === 'suspended' && (
            <Button
              variant="primary"
              size="sm"
              onClick={() => setConfirmReactivate(true)}
              leftIcon={CheckCircle2}
            >
              Reactivate Workspace
            </Button>
          )}
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="flex border-b border-slate-200 dark:border-navy-800 text-xs sm:text-sm font-semibold space-x-6">
        <button
          onClick={() => setActiveTab('overview')}
          className={`pb-3 transition-colors relative ${
            activeTab === 'overview'
              ? 'text-cyan-600 dark:text-cyan-400 border-b-2 border-cyan-500'
              : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-100'
          }`}
        >
          Overview & Metrics
        </button>
        <button
          onClick={() => setActiveTab('tickets')}
          className={`pb-3 transition-colors relative ${
            activeTab === 'tickets'
              ? 'text-cyan-600 dark:text-cyan-400 border-b-2 border-cyan-500'
              : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-100'
          }`}
        >
          Recent Incidents ({orgStatsSnapshot?.tickets?.total || 0})
        </button>
        <button
          onClick={() => setActiveTab('activity')}
          className={`pb-3 transition-colors relative ${
            activeTab === 'activity'
              ? 'text-cyan-600 dark:text-cyan-400 border-b-2 border-cyan-500'
              : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-100'
          }`}
        >
          Tenant Audit Activity ({activityTotal})
        </button>
        <button
          onClick={() => setActiveTab('settings')}
          className={`pb-3 transition-colors relative ${
            activeTab === 'settings'
              ? 'text-cyan-600 dark:text-cyan-400 border-b-2 border-cyan-500'
              : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-100'
          }`}
        >
          Settings & Plan
        </button>
      </div>

      {/* TAB 1: OVERVIEW & PERFORMANCE */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Top Quick Metrics */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="p-4 rounded-2xl bg-white dark:bg-navy-900 border border-slate-200 dark:border-navy-800">
              <span className="text-[11px] font-bold uppercase text-slate-400">Total Users</span>
              <p className="text-2xl font-black text-slate-900 dark:text-white mt-1">
                {orgStatsSnapshot?.users?.total || 0}
              </p>
              <span className="text-[10px] text-emerald-500 font-medium">
                {orgStatsSnapshot?.users?.active || 0} active accounts
              </span>
            </div>

            <div className="p-4 rounded-2xl bg-white dark:bg-navy-900 border border-slate-200 dark:border-navy-800">
              <span className="text-[11px] font-bold uppercase text-slate-400">Total Tickets</span>
              <p className="text-2xl font-black text-slate-900 dark:text-white mt-1">
                {orgStatsSnapshot?.tickets?.total || 0}
              </p>
              <span className="text-[10px] text-cyan-500 font-medium">
                {orgStatsSnapshot?.tickets?.open + orgStatsSnapshot?.tickets?.inProgress} ongoing
              </span>
            </div>

            <div className="p-4 rounded-2xl bg-white dark:bg-navy-900 border border-slate-200 dark:border-navy-800">
              <span className="text-[11px] font-bold uppercase text-slate-400">Resolution Rate</span>
              <p className="text-2xl font-black text-emerald-500 mt-1">
                {stats?.tickets?.resolutionRatePercent ?? 0}%
              </p>
              <span className="text-[10px] text-slate-400">
                {orgStatsSnapshot?.tickets?.resolved + orgStatsSnapshot?.tickets?.closed} resolved
              </span>
            </div>

            <div className="p-4 rounded-2xl bg-white dark:bg-navy-900 border border-slate-200 dark:border-navy-800">
              <span className="text-[11px] font-bold uppercase text-slate-400">SLA Compliance</span>
              <p className="text-2xl font-black text-purple-500 mt-1">
                {stats?.tickets?.slaCompliancePercent ?? 100}%
              </p>
              <span className="text-[10px] text-rose-500 font-medium">
                {orgStatsSnapshot?.tickets?.breached || 0} breaches
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Organization Metadata Card */}
            <div className="p-6 rounded-3xl bg-white dark:bg-navy-900 border border-slate-200 dark:border-navy-800">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider mb-4 flex items-center gap-2">
                <Building2 className="w-4 h-4 text-cyan-500" />
                Institution Information
              </h3>
              <div className="space-y-3 text-xs">
                <div className="flex justify-between py-1.5 border-b border-slate-100 dark:border-navy-800">
                  <span className="text-slate-400">Organization Type</span>
                  <span className="font-semibold text-slate-900 dark:text-slate-100">{organization.type || 'Enterprise'}</span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-slate-100 dark:border-navy-800">
                  <span className="text-slate-400">Official Domain</span>
                  <span className="font-semibold text-slate-900 dark:text-slate-100">{organization.domain || 'N/A'}</span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-slate-100 dark:border-navy-800">
                  <span className="text-slate-400">Official Contact Email</span>
                  <span className="font-semibold text-slate-900 dark:text-slate-100">{organization.officialEmail || 'N/A'}</span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-slate-100 dark:border-navy-800">
                  <span className="text-slate-400">Contact Phone</span>
                  <span className="font-semibold text-slate-900 dark:text-slate-100">{organization.phone || 'N/A'}</span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-slate-100 dark:border-navy-800">
                  <span className="text-slate-400">Headquarters Address</span>
                  <span className="font-semibold text-slate-900 dark:text-slate-100 text-right">{organization.address || 'N/A'}</span>
                </div>
                <div className="flex justify-between py-1.5">
                  <span className="text-slate-400">Self-Registration Allowed</span>
                  <span className="font-semibold text-slate-900 dark:text-slate-100">
                    {organization.settings?.allowRegistration !== false ? 'Enabled' : 'Disabled'}
                  </span>
                </div>
              </div>
            </div>

            {/* Primary Administrators Card */}
            <div className="p-6 rounded-3xl bg-white dark:bg-navy-900 border border-slate-200 dark:border-navy-800">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider mb-4 flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-cyan-500" />
                Organization Administrator
              </h3>

              {admins && admins.length > 0 ? (
                admins.map((adm) => (
                  <div key={adm._id} className="p-3.5 rounded-2xl bg-slate-50 dark:bg-navy-950/60 border border-slate-100 dark:border-navy-800 mb-3 last:mb-0">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-blue-600 text-white font-bold flex items-center justify-center text-sm">
                        {adm.name.charAt(0)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-slate-900 dark:text-white text-xs truncate">
                          {adm.name}
                        </p>
                        <p className="text-[11px] text-slate-400 truncate">{adm.email}</p>
                      </div>
                      <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-500/10 text-emerald-500">
                        Active Admin
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-xs text-slate-400 italic">No organization admin accounts assigned.</p>
              )}

              {/* Staff Roles Distribution */}
              <div className="mt-5 pt-4 border-t border-slate-100 dark:border-navy-800">
                <span className="text-[11px] font-bold uppercase text-slate-400 block mb-2">
                  User Role Distribution
                </span>
                <div className="grid grid-cols-4 gap-2 text-center text-xs">
                  <div className="p-2 rounded-xl bg-slate-50 dark:bg-navy-850">
                    <span className="block text-slate-400 text-[10px]">Admin</span>
                    <strong className="text-slate-900 dark:text-white font-black">{orgStatsSnapshot?.users?.roles?.admin || 0}</strong>
                  </div>
                  <div className="p-2 rounded-xl bg-slate-50 dark:bg-navy-850">
                    <span className="block text-slate-400 text-[10px]">Manager</span>
                    <strong className="text-slate-900 dark:text-white font-black">{orgStatsSnapshot?.users?.roles?.manager || 0}</strong>
                  </div>
                  <div className="p-2 rounded-xl bg-slate-50 dark:bg-navy-850">
                    <span className="block text-slate-400 text-[10px]">Tech</span>
                    <strong className="text-slate-900 dark:text-white font-black">{orgStatsSnapshot?.users?.roles?.technician || 0}</strong>
                  </div>
                  <div className="p-2 rounded-xl bg-slate-50 dark:bg-navy-850">
                    <span className="block text-slate-400 text-[10px]">Employee</span>
                    <strong className="text-slate-900 dark:text-white font-black">{orgStatsSnapshot?.users?.roles?.employee || 0}</strong>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: RECENT INCIDENTS */}
      {activeTab === 'tickets' && (
        <div className="p-6 rounded-3xl bg-white dark:bg-navy-900 border border-slate-200 dark:border-navy-800 shadow-sm">
          <h3 className="text-base font-bold text-slate-900 dark:text-white mb-4">
            Incident Tickets ({orgStatsSnapshot?.tickets?.total || 0})
          </h3>
          {details.stats?.recentTickets && details.stats.recentTickets.length > 0 ? (
            <div className="divide-y divide-slate-100 dark:divide-navy-800">
              {details.stats.recentTickets.map((t) => (
                <div key={t._id} className="py-3 flex items-center justify-between gap-4">
                  <div>
                    <span className="text-xs font-bold text-cyan-600 dark:text-cyan-400 mr-2">
                      {t.ticketNumber}
                    </span>
                    <span className="text-xs font-semibold text-slate-900 dark:text-slate-100">
                      {t.title}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-100 dark:bg-navy-800 text-slate-600 dark:text-slate-300">
                      {t.priority}
                    </span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-cyan-500/10 text-cyan-500">
                      {t.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-slate-400 py-6 text-center">No incident tickets logged yet.</p>
          )}
        </div>
      )}

      {/* TAB 3: TENANT AUDIT ACTIVITY */}
      {activeTab === 'activity' && (
        <div className="p-6 rounded-3xl bg-white dark:bg-navy-900 border border-slate-200 dark:border-navy-800 shadow-sm">
          <h3 className="text-base font-bold text-slate-900 dark:text-white mb-4">
            Audit Activity Log
          </h3>
          {activity.length > 0 ? (
            <div className="space-y-3">
              {activity.map((log) => (
                <div
                  key={log._id}
                  className="p-3.5 rounded-2xl bg-slate-50 dark:bg-navy-950/60 border border-slate-100 dark:border-navy-800 flex items-start justify-between gap-4 text-xs"
                >
                  <div>
                    <p className="font-bold text-slate-900 dark:text-white">
                      {log.action.replace(/_/g, ' ')}
                    </p>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Actor: <strong className="text-slate-700 dark:text-slate-300">{log.actor?.name || log.actor?.email || 'System'}</strong> &bull; Resource: {log.resource}
                    </p>
                  </div>
                  <span className="text-[11px] text-slate-400 shrink-0">
                    {new Date(log.createdAt).toLocaleString()}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-slate-400 py-6 text-center">No activity logs recorded for this tenant.</p>
          )}
        </div>
      )}

      {/* TAB 4: SETTINGS & PLAN */}
      {activeTab === 'settings' && (
        <div className="p-6 rounded-3xl bg-white dark:bg-navy-900 border border-slate-200 dark:border-navy-800 shadow-sm max-w-2xl">
          <h3 className="text-base font-bold text-slate-900 dark:text-white mb-2">
            Configure Tenant Settings
          </h3>
          <p className="text-xs text-slate-400 mb-6">
            Modify tenant metadata, subscription tier, and policy constraints.
          </p>

          {saveSuccess && (
            <div className="mb-4 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{saveSuccess}</span>
            </div>
          )}

          <form onSubmit={handleUpdate} className="space-y-4 text-xs">
            <Input
              label="Organization Name"
              required
              value={editForm.name}
              onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
            />

            <Input
              label="Primary Domain"
              value={editForm.domain}
              onChange={(e) => setEditForm({ ...editForm, domain: e.target.value })}
              placeholder="e.g. university.edu"
            />

            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Subscription Plan
              </label>
              <select
                value={editForm.plan}
                onChange={(e) => setEditForm({ ...editForm, plan: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-navy-700 bg-white dark:bg-navy-950 text-slate-900 dark:text-slate-100"
              >
                <option value="free">Free</option>
                <option value="standard">Standard</option>
                <option value="enterprise">Enterprise</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Default Ticket Priority
              </label>
              <select
                value={editForm.defaultTicketPriority}
                onChange={(e) => setEditForm({ ...editForm, defaultTicketPriority: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-navy-700 bg-white dark:bg-navy-950 text-slate-900 dark:text-slate-100"
              >
                <option value="Low">Low</option>
                <option value="Medium">Medium</option>
                <option value="High">High</option>
                <option value="Critical">Critical</option>
              </select>
            </div>

            <div className="pt-2">
              <label className="flex items-center gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={editForm.allowRegistration}
                  onChange={(e) => setEditForm({ ...editForm, allowRegistration: e.target.checked })}
                  className="rounded border-slate-300 dark:border-navy-700 text-cyan-500"
                />
                <span className="font-semibold text-slate-700 dark:text-slate-300">
                  Allow Employee Self-Registration under this Organization
                </span>
              </label>
            </div>

            <div className="pt-4">
              <Button
                type="submit"
                variant="primary"
                isLoading={saveLoading}
                leftIcon={Save}
              >
                Save Changes
              </Button>
            </div>
          </form>
        </div>
      )}

      {/* Approve Dialog */}
      <ConfirmDialog
        isOpen={confirmApprove}
        title="Approve Organization"
        message={`Approve '${organization.name}' and activate all tenant services?`}
        confirmLabel="Approve & Activate"
        confirmVariant="primary"
        isLoading={actionLoading}
        onConfirm={handleApprove}
        onCancel={() => setConfirmApprove(false)}
      />

      {/* Suspend Modal */}
      <Modal
        isOpen={suspendModal}
        onClose={() => setSuspendModal(false)}
        title={`Suspend Workspace: ${organization.name}`}
      >
        <form onSubmit={handleSuspend} className="space-y-4">
          <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 text-xs">
            <strong>Warning:</strong> Suspending this organization blocks all tenant users immediately. Data remains intact.
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Reason for Suspension *
            </label>
            <textarea
              required
              rows={3}
              value={suspendReason}
              onChange={(e) => setSuspendReason(e.target.value)}
              placeholder="State the violation or administrative reason..."
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-navy-700 bg-white dark:bg-navy-950 text-slate-900 dark:text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-rose-500"
            />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="outline" onClick={() => setSuspendModal(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="danger" isLoading={actionLoading}>
              Suspend Workspace
            </Button>
          </div>
        </form>
      </Modal>

      {/* Reactivate Dialog */}
      <ConfirmDialog
        isOpen={confirmReactivate}
        title="Reactivate Organization"
        message={`Reactivate workspace access for '${organization.name}'? Users will immediately regain access to their portal and tickets.`}
        confirmLabel="Reactivate Workspace"
        confirmVariant="primary"
        isLoading={actionLoading}
        onConfirm={handleReactivate}
        onCancel={() => setConfirmReactivate(false)}
      />
    </div>
  );
};

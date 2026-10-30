import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  UserCheck,
  CheckCircle2,
  XCircle,
  Building2,
  Mail,
  Phone,
  Globe,
  MapPin,
  Clock,
  RefreshCw,
  Search,
  ExternalLink,
  ShieldCheck,
} from 'lucide-react';
import { superadminService } from '../../services/superadminService.js';
import { ConfirmDialog } from '../../components/common/ConfirmDialog.jsx';
import { Modal } from '../../components/common/Modal.jsx';
import { Button } from '../../components/common/Button.jsx';
import { LoadingSkeleton } from '../../components/common/LoadingSkeleton.jsx';
import { EmptyState } from '../../components/common/EmptyState.jsx';
import { ORGANIZATION_STATUSES } from '../../utils/constants.js';

export const RegistrationRequests = () => {
  const [pendingRequests, setPendingRequests] = useState([]);
  const [historyRequests, setHistoryRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState('pending'); // 'pending' | 'history'

  // Action States
  const [confirmApprove, setConfirmApprove] = useState(null);
  const [rejectModal, setRejectModal] = useState(null);
  const [rejectReason, setRejectReason] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  const fetchRequests = useCallback(async (isRefresh = false) => {
    try {
      if (isRefresh) setRefreshing(true);
      else setLoading(true);

      const [pendingRes, historyRes] = await Promise.all([
        superadminService.listOrganizations({ status: 'pending', limit: 50 }),
        superadminService.listOrganizations({ limit: 50 }),
      ]);

      setPendingRequests(pendingRes?.organizations || []);
      // Filter history for approved/rejected or all non-pending
      const hist = (historyRes?.organizations || []).filter((o) => o.status !== 'pending');
      setHistoryRequests(hist);
    } catch (err) {
      console.error('Failed to load requests:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchRequests();
  }, [fetchRequests]);

  const handleApprove = async () => {
    if (!confirmApprove) return;
    try {
      setActionLoading(true);
      await superadminService.approveOrganization(confirmApprove._id);
      setConfirmApprove(null);
      await fetchRequests(true);
    } catch (err) {
      alert(`Approval failed: ${err.message}`);
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
      setRejectModal(null);
      setRejectReason('');
      await fetchRequests(true);
    } catch (err) {
      alert(`Rejection failed: ${err.message}`);
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              Registration Requests
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/30">
              {pendingRequests.length} Pending
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Review, verify, and provision institutional tenants requesting platform onboarding.
          </p>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={() => fetchRequests(true)}
          isLoading={refreshing}
          leftIcon={RefreshCw}
        >
          Refresh Queue
        </Button>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 dark:border-navy-800 text-xs sm:text-sm font-semibold space-x-6">
        <button
          onClick={() => setActiveTab('pending')}
          className={`pb-3 transition-colors relative flex items-center gap-2 ${
            activeTab === 'pending'
              ? 'text-cyan-600 dark:text-cyan-400 border-b-2 border-cyan-500'
              : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-100'
          }`}
        >
          <span>Pending Review</span>
          {pendingRequests.length > 0 && (
            <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-amber-400 text-slate-900 font-bold">
              {pendingRequests.length}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('history')}
          className={`pb-3 transition-colors relative ${
            activeTab === 'history'
              ? 'text-cyan-600 dark:text-cyan-400 border-b-2 border-cyan-500'
              : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-100'
          }`}
        >
          Resolution History ({historyRequests.length})
        </button>
      </div>

      {/* TAB 1: PENDING QUEUE */}
      {activeTab === 'pending' && (
        <div className="space-y-4">
          {loading ? (
            <LoadingSkeleton type="card" count={3} />
          ) : pendingRequests.length > 0 ? (
            pendingRequests.map((req) => (
              <div
                key={req._id}
                className="p-6 rounded-3xl bg-white dark:bg-navy-900 border border-slate-200 dark:border-navy-800 shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                  {/* Left: Organization Overview */}
                  <div className="space-y-3 flex-1">
                    <div className="flex flex-wrap items-center gap-3">
                      <span className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center font-bold text-base">
                        {req.name.charAt(0)}
                      </span>
                      <div>
                        <h3 className="text-base font-bold text-slate-900 dark:text-white">
                          {req.name}
                        </h3>
                        <p className="text-xs text-slate-400">
                          Slug: <strong className="text-slate-700 dark:text-slate-300">{req.slug}</strong>
                          {req.domain && ` • Domain: ${req.domain}`}
                        </p>
                      </div>
                      <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                        Pending Verification
                      </span>
                    </div>

                    {/* Metadata Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs pt-2">
                      <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-navy-850">
                        <span className="text-[10px] text-slate-400 uppercase font-semibold block">
                          Type & Plan
                        </span>
                        <strong className="text-slate-900 dark:text-slate-100">
                          {req.type || 'Enterprise'} &bull; {req.plan || 'standard'}
                        </strong>
                      </div>

                      <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-navy-850">
                        <span className="text-[10px] text-slate-400 uppercase font-semibold block">
                          Administrator Contact
                        </span>
                        <strong className="text-slate-900 dark:text-slate-100 truncate block">
                          {req.adminUser ? `${req.adminUser.name} (${req.adminUser.email})` : 'N/A'}
                        </strong>
                      </div>

                      <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-navy-850">
                        <span className="text-[10px] text-slate-400 uppercase font-semibold block">
                          Submitted Date
                        </span>
                        <strong className="text-slate-900 dark:text-slate-100">
                          {new Date(req.createdAt).toLocaleString()}
                        </strong>
                      </div>
                    </div>
                  </div>

                  {/* Right: Actions */}
                  <div className="flex sm:flex-col lg:flex-row items-center gap-2.5 shrink-0">
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => setConfirmApprove(req)}
                      leftIcon={CheckCircle2}
                    >
                      Approve & Activate
                    </Button>
                    <Button
                      variant="danger"
                      size="sm"
                      onClick={() => setRejectModal(req)}
                      leftIcon={XCircle}
                    >
                      Reject Request
                    </Button>
                    <Link to={`/superadmin/organizations/${req._id}`}>
                      <Button variant="outline" size="sm">
                        Inspect
                      </Button>
                    </Link>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <EmptyState
              title="All Caught Up!"
              description="There are currently no institutional registration requests awaiting review."
            />
          )}
        </div>
      )}

      {/* TAB 2: RESOLUTION HISTORY */}
      {activeTab === 'history' && (
        <div className="bg-white dark:bg-navy-900 border border-slate-200 dark:border-navy-800 rounded-3xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-navy-850 text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-100 dark:border-navy-800">
                <tr>
                  <th className="py-3 px-5">Organization</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Admin Contact</th>
                  <th className="py-3 px-4">Decision Date</th>
                  <th className="py-3 px-5 text-right">Profile</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-navy-800 text-slate-700 dark:text-slate-300">
                {historyRequests.length > 0 ? (
                  historyRequests.map((org) => {
                    const statusInfo = ORGANIZATION_STATUSES[org.status] || ORGANIZATION_STATUSES.active;
                    return (
                      <tr key={org._id} className="hover:bg-slate-50/50 dark:hover:bg-navy-800/40">
                        <td className="py-3 px-5">
                          <strong className="text-slate-900 dark:text-white block">{org.name}</strong>
                          <span className="text-[11px] text-slate-400">{org.slug}</span>
                        </td>
                        <td className="py-3 px-4">
                          <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full font-semibold text-[11px] ${statusInfo.bg}`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${statusInfo.dot}`} />
                            {statusInfo.label}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          {org.adminUser ? org.adminUser.email : 'N/A'}
                        </td>
                        <td className="py-3 px-4 text-slate-400 text-[11px]">
                          {new Date(org.updatedAt || org.createdAt).toLocaleDateString()}
                        </td>
                        <td className="py-3 px-5 text-right">
                          <Link
                            to={`/superadmin/organizations/${org._id}`}
                            className="text-cyan-600 dark:text-cyan-400 hover:underline font-semibold"
                          >
                            View
                          </Link>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={5} className="text-center py-6 text-slate-400">
                      No historical registrations recorded.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Confirmation Dialog: Approve Organization */}
      <ConfirmDialog
        isOpen={!!confirmApprove}
        title="Approve Institutional Tenant"
        message={`Approve '${confirmApprove?.name}'? This provisions the organization workspace, seeds the standard SLA policy, and enables login for ${confirmApprove?.adminUser?.email || 'the primary administrator'}.`}
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
            Please enter the formal rejection reason. This reason will be recorded in platform audit logs without deleting the organization registration history.
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
              placeholder="e.g. Failure to verify institutional credentials."
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-navy-700 bg-white dark:bg-navy-950 text-slate-900 dark:text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-rose-500"
            />
          </div>

          <div className="flex justify-end gap-3 pt-2">
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

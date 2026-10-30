import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import {
  Building2,
  Search,
  Filter,
  CheckCircle2,
  XCircle,
  AlertOctagon,
  RefreshCw,
  ExternalLink,
  ShieldAlert,
  Users,
  Ticket,
  Sliders,
  Plus,
} from 'lucide-react';
import { superadminService } from '../../services/superadminService.js';
import { ConfirmDialog } from '../../components/common/ConfirmDialog.jsx';
import { Modal } from '../../components/common/Modal.jsx';
import { Button } from '../../components/common/Button.jsx';
import { Pagination } from '../../components/common/Pagination.jsx';
import { LoadingSkeleton } from '../../components/common/LoadingSkeleton.jsx';
import { EmptyState } from '../../components/common/EmptyState.jsx';
import { ORGANIZATION_STATUSES } from '../../utils/constants.js';

export const OrganizationList = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  const [organizations, setOrganizations] = useState([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  // Filters State
  const [search, setSearch] = useState(searchParams.get('search') || '');
  const [status, setStatus] = useState(searchParams.get('status') || '');
  const [plan, setPlan] = useState(searchParams.get('plan') || '');
  const [page, setPage] = useState(parseInt(searchParams.get('page') || '1', 10));

  // Modals & Action States
  const [confirmApprove, setConfirmApprove] = useState(null);
  const [rejectModal, setRejectModal] = useState(null);
  const [rejectReason, setRejectReason] = useState('');
  const [suspendModal, setSuspendModal] = useState(null);
  const [suspendReason, setSuspendReason] = useState('');
  const [confirmReactivate, setConfirmReactivate] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  const fetchOrganizations = useCallback(async (isRefresh = false) => {
    try {
      if (isRefresh) setRefreshing(true);
      else setLoading(true);
      setError(null);

      const params = {
        page,
        limit: 15,
        status: status || undefined,
        plan: plan || undefined,
        search: search.trim() || undefined,
      };

      const res = await superadminService.listOrganizations(params);
      setOrganizations(res?.organizations || []);
      setTotal(res?.total || 0);
      setTotalPages(res?.totalPages || 1);
    } catch (err) {
      setError(err.message || 'Failed to load organizations.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [page, status, plan, search]);

  useEffect(() => {
    fetchOrganizations();
  }, [fetchOrganizations]);

  // Synchronize URL search params
  const handleFilterChange = (newStatus, newPlan, newSearch) => {
    const params = new URLSearchParams();
    if (newStatus) params.set('status', newStatus);
    if (newPlan) params.set('plan', newPlan);
    if (newSearch) params.set('search', newSearch);
    params.set('page', '1');
    setSearchParams(params);
    setPage(1);
  };

  const handleApprove = async () => {
    if (!confirmApprove) return;
    try {
      setActionLoading(true);
      await superadminService.approveOrganization(confirmApprove._id);
      setConfirmApprove(null);
      await fetchOrganizations(true);
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
      await fetchOrganizations(true);
    } catch (err) {
      alert(`Rejection failed: ${err.message}`);
    } finally {
      setActionLoading(false);
    }
  };

  const handleSuspend = async (e) => {
    e.preventDefault();
    if (!suspendModal || !suspendReason.trim()) return;
    try {
      setActionLoading(true);
      await superadminService.suspendOrganization(suspendModal._id, suspendReason.trim());
      setSuspendModal(null);
      setSuspendReason('');
      await fetchOrganizations(true);
    } catch (err) {
      alert(`Suspension failed: ${err.message}`);
    } finally {
      setActionLoading(false);
    }
  };

  const handleReactivate = async () => {
    if (!confirmReactivate) return;
    try {
      setActionLoading(true);
      await superadminService.reactivateOrganization(confirmReactivate._id);
      setConfirmReactivate(null);
      await fetchOrganizations(true);
    } catch (err) {
      alert(`Reactivation failed: ${err.message}`);
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Organizations Directory
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Manage all onboarded tenant institutions, review lifecycle status, and adjust subscription plans.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={() => fetchOrganizations(true)}
            isLoading={refreshing}
            leftIcon={RefreshCw}
          >
            Refresh
          </Button>
          <Link to="/register-organization" target="_blank">
            <Button variant="primary" size="sm" leftIcon={Plus}>
              New Registration
            </Button>
          </Link>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-4 rounded-2xl bg-white dark:bg-navy-900 border border-slate-200 dark:border-navy-800 shadow-sm space-y-3">
        <div className="flex flex-col sm:flex-row gap-3">
          {/* Search Input */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                handleFilterChange(status, plan, e.target.value);
              }}
              placeholder="Search by organization name, slug, or domain..."
              className="w-full pl-10 pr-4 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 dark:border-navy-700 bg-slate-50 dark:bg-navy-950 text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500"
            />
          </div>

          {/* Status Filter */}
          <select
            value={status}
            onChange={(e) => {
              setStatus(e.target.value);
              handleFilterChange(e.target.value, plan, search);
            }}
            className="px-3.5 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 dark:border-navy-700 bg-slate-50 dark:bg-navy-950 text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-cyan-500"
          >
            <option value="">All Statuses</option>
            <option value="active">Active</option>
            <option value="pending">Pending Review</option>
            <option value="suspended">Suspended</option>
            <option value="rejected">Rejected</option>
            <option value="trial">Trial</option>
          </select>

          {/* Plan Filter */}
          <select
            value={plan}
            onChange={(e) => {
              setPlan(e.target.value);
              handleFilterChange(status, e.target.value, search);
            }}
            className="px-3.5 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 dark:border-navy-700 bg-slate-50 dark:bg-navy-950 text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-cyan-500"
          >
            <option value="">All Plans</option>
            <option value="enterprise">Enterprise</option>
            <option value="standard">Standard</option>
            <option value="free">Free</option>
          </select>
        </div>
      </div>

      {/* Organizations Table */}
      <div className="bg-white dark:bg-navy-900 border border-slate-200 dark:border-navy-800 rounded-3xl shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-8">
            <LoadingSkeleton type="table" count={6} />
          </div>
        ) : organizations.length > 0 ? (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 dark:bg-navy-850 text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-100 dark:border-navy-800">
                  <tr>
                    <th className="py-3.5 px-5">Organization Name</th>
                    <th className="py-3.5 px-4">Status</th>
                    <th className="py-3.5 px-4">Plan</th>
                    <th className="py-3.5 px-4">Admin Contact</th>
                    <th className="py-3.5 px-4 text-center">Users</th>
                    <th className="py-3.5 px-4 text-center">Tickets</th>
                    <th className="py-3.5 px-4">Registered</th>
                    <th className="py-3.5 px-5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-navy-800 text-slate-700 dark:text-slate-300">
                  {organizations.map((org) => {
                    const statusInfo = ORGANIZATION_STATUSES[org.status] || ORGANIZATION_STATUSES.pending;
                    return (
                      <tr
                        key={org._id}
                        className="hover:bg-slate-50/70 dark:hover:bg-navy-800/40 transition-colors"
                      >
                        <td className="py-3.5 px-5">
                          <Link
                            to={`/superadmin/organizations/${org._id}`}
                            className="font-bold text-slate-900 dark:text-white hover:text-cyan-600 dark:hover:text-cyan-400 transition-colors"
                          >
                            {org.name}
                          </Link>
                          <div className="text-[11px] text-slate-400">
                            {org.domain ? org.domain : org.slug}
                          </div>
                        </td>
                        <td className="py-3.5 px-4">
                          <span
                            className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full font-semibold text-[11px] ${statusInfo.bg}`}
                          >
                            <span className={`w-1.5 h-1.5 rounded-full ${statusInfo.dot}`} />
                            {statusInfo.label}
                          </span>
                        </td>
                        <td className="py-3.5 px-4">
                          <span className="capitalize px-2 py-0.5 rounded-lg bg-slate-100 dark:bg-navy-800 text-[11px] font-medium">
                            {org.plan}
                          </span>
                        </td>
                        <td className="py-3.5 px-4">
                          {org.adminUser ? (
                            <div>
                              <div className="font-medium text-slate-900 dark:text-white">
                                {org.adminUser.name}
                              </div>
                              <div className="text-[11px] text-slate-400">{org.adminUser.email}</div>
                            </div>
                          ) : (
                            <span className="text-slate-400 italic">No admin assigned</span>
                          )}
                        </td>
                        <td className="py-3.5 px-4 text-center font-semibold">
                          {org.userCount || 0}
                        </td>
                        <td className="py-3.5 px-4 text-center font-semibold">
                          {org.ticketCount || 0}
                        </td>
                        <td className="py-3.5 px-4 text-slate-400 text-[11px]">
                          {new Date(org.createdAt).toLocaleDateString()}
                        </td>
                        <td className="py-3.5 px-5 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {/* Pending State Actions */}
                            {org.status === 'pending' && (
                              <>
                                <button
                                  onClick={() => setConfirmApprove(org)}
                                  className="px-2 py-1 rounded-lg text-emerald-600 bg-emerald-500/10 hover:bg-emerald-500/20 font-semibold"
                                  title="Approve Organization"
                                >
                                  Approve
                                </button>
                                <button
                                  onClick={() => setRejectModal(org)}
                                  className="px-2 py-1 rounded-lg text-rose-600 bg-rose-500/10 hover:bg-rose-500/20 font-semibold"
                                  title="Reject Registration"
                                >
                                  Reject
                                </button>
                              </>
                            )}

                            {/* Active State Action -> Suspend */}
                            {org.status === 'active' && (
                              <button
                                onClick={() => setSuspendModal(org)}
                                className="px-2 py-1 rounded-lg text-amber-600 bg-amber-500/10 hover:bg-amber-500/20 font-semibold"
                                title="Suspend Organization Access"
                              >
                                Suspend
                              </button>
                            )}

                            {/* Suspended State Action -> Reactivate */}
                            {org.status === 'suspended' && (
                              <button
                                onClick={() => setConfirmReactivate(org)}
                                className="px-2 py-1 rounded-lg text-emerald-600 bg-emerald-500/10 hover:bg-emerald-500/20 font-semibold"
                                title="Reactivate Organization"
                              >
                                Reactivate
                              </button>
                            )}

                            {/* View Full Profile */}
                            <Link
                              to={`/superadmin/organizations/${org._id}`}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-cyan-500 hover:bg-slate-100 dark:hover:bg-navy-800 transition-colors"
                              title="View Details"
                            >
                              <ExternalLink className="w-4 h-4" />
                            </Link>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="p-4 border-t border-slate-100 dark:border-navy-800">
                <Pagination
                  currentPage={page}
                  totalPages={totalPages}
                  onPageChange={(p) => {
                    setPage(p);
                    const params = new URLSearchParams(searchParams);
                    params.set('page', p.toString());
                    setSearchParams(params);
                  }}
                />
              </div>
            )}
          </>
        ) : (
          <EmptyState
            title="No organizations found"
            description="No institutional tenants match your search and filter criteria."
            actionLabel="Clear Filters"
            onAction={() => {
              setSearch('');
              setStatus('');
              setPlan('');
              handleFilterChange('', '', '');
            }}
          />
        )}
      </div>

      {/* Confirmation Dialog: Approve Organization */}
      <ConfirmDialog
        isOpen={!!confirmApprove}
        title="Approve Organization"
        message={`Are you sure you want to approve '${confirmApprove?.name}'? This will activate their workspace and grant immediate access to their users.`}
        confirmLabel="Approve & Activate"
        confirmVariant="primary"
        isLoading={actionLoading}
        onConfirm={handleApprove}
        onCancel={() => setConfirmApprove(null)}
      />

      {/* Modal: Reject Organization */}
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
            Please enter a formal reason for rejecting this registration. The organization record and audit trail will remain preserved in the database.
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
              placeholder="e.g. Incomplete verification or policy non-compliance."
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

      {/* Modal: Suspend Organization */}
      <Modal
        isOpen={!!suspendModal}
        onClose={() => {
          setSuspendModal(null);
          setSuspendReason('');
        }}
        title={`Suspend Organization: ${suspendModal?.name}`}
      >
        <form onSubmit={handleSuspend} className="space-y-4">
          <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 text-xs">
            <strong>Warning:</strong> Suspending this organization immediately revokes access for all its users, blocks real-time WebSocket communication, and denies attachment downloads. Data will NOT be deleted.
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
              placeholder="e.g. Terms violation or billing arrears."
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-navy-700 bg-white dark:bg-navy-950 text-slate-900 dark:text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-rose-500"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setSuspendModal(null);
                setSuspendReason('');
              }}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="danger"
              isLoading={actionLoading}
            >
              Suspend Organization
            </Button>
          </div>
        </form>
      </Modal>

      {/* Confirmation Dialog: Reactivate Organization */}
      <ConfirmDialog
        isOpen={!!confirmReactivate}
        title="Reactivate Organization"
        message={`Are you sure you want to restore workspace access for '${confirmReactivate?.name}'? Users will immediately regain access to their tickets and services.`}
        confirmLabel="Reactivate Workspace"
        confirmVariant="primary"
        isLoading={actionLoading}
        onConfirm={handleReactivate}
        onCancel={() => setConfirmReactivate(null)}
      />
    </div>
  );
};

import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  UserCheck,
  ArrowRightLeft,
  Clock,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  RefreshCw,
  Inbox,
  Filter,
  User,
  Users,
} from 'lucide-react';
import { ticketService } from '../../services/ticketService.js';
import { PageHeader } from '../../components/layout/PageHeader.jsx';
import { TicketTable } from '../../components/tickets/TicketTable.jsx';
import { RejectReassignmentModal } from '../../components/tickets/RejectReassignmentModal.jsx';
import { Button } from '../../components/common/Button.jsx';
import { LoadingSkeleton } from '../../components/common/LoadingSkeleton.jsx';
import { formatDate } from '../../utils/formatDate.js';
import { useModal } from '../../contexts/ModalContext.jsx';
import { useSocket } from '../../hooks/useSocket.js';

export const AssignmentQueue = () => {
  const { showConfirm, showSuccess, showError } = useModal();

  const [activeTab, setActiveTab] = useState('reassignments'); // 'reassignments' | 'unassigned'
  const [statusFilter, setStatusFilter] = useState('pending'); // 'pending' | 'approved' | 'rejected' | 'all'

  const [unassignedTickets, setUnassignedTickets] = useState([]);
  const [requests, setRequests] = useState([]);
  const [pendingCount, setPendingCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [actionLoadingId, setActionLoadingId] = useState(null);

  // Reject modal state
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState(null);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const [ticketsRes, reassignmentRes] = await Promise.all([
        ticketService.listTickets({ assignee: 'unassigned' }),
        ticketService.listReassignments({
          status: statusFilter === 'all' ? undefined : statusFilter,
          limit: 50,
        }),
      ]);

      setUnassignedTickets(ticketsRes?.tickets || ticketsRes || []);
      setRequests(reassignmentRes?.data?.requests || reassignmentRes?.requests || []);
      setPendingCount(reassignmentRes?.data?.pendingCount || reassignmentRes?.pendingCount || 0);
    } catch (err) {
      console.error('Failed to load assignment queue data:', err);
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Socket real-time updates
  useSocket({
    'reassignment:updated': () => {
      loadData();
    },
    'ticket:updated': () => {
      loadData();
    },
    'ticket:assigned': () => {
      loadData();
    },
  });

  const handleApprove = async (request) => {
    const confirmed = await showConfirm({
      title: 'Approve Ticket Reassignment',
      message: `Approve reassignment of ticket #${request.ticket?.ticketNumber || ''} to ${
        request.targetTechnician?.name
          ? `specialist ${request.targetTechnician.name}`
          : request.targetTeam?.name
          ? `team ${request.targetTeam.name}`
          : 'the designated target'
      }?`,
      confirmLabel: 'Approve Reassignment',
      type: 'info',
    });
    if (!confirmed) return;

    setActionLoadingId(request._id);
    try {
      await ticketService.approveReassignment(request._id);
      showSuccess({
        title: 'Reassignment Approved',
        message: 'The ticket assignment and history have been updated.',
        status: 'Approved',
        buttonText: 'Done',
      });
      await loadData();
    } catch (err) {
      showError({
        title: 'Approval Failed',
        message: err.response?.data?.message || err.message || 'Failed to approve request.',
      });
    } finally {
      setActionLoadingId(null);
    }
  };

  const openRejectModal = (request) => {
    setSelectedRequest(request);
    setRejectModalOpen(true);
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'pending':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-500 border border-amber-500/20">
            <Clock className="w-3 h-3" /> Pending Review
          </span>
        );
      case 'approved':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
            <CheckCircle2 className="w-3 h-3" /> Approved
          </span>
        );
      case 'rejected':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-500/10 text-rose-500 border border-rose-500/20">
            <XCircle className="w-3 h-3" /> Rejected
          </span>
        );
      case 'cancelled':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-500/10 text-slate-400 border border-slate-500/20">
            Cancelled
          </span>
        );
      default:
        return (
          <span className="px-2 py-0.5 rounded text-xs bg-slate-800 text-slate-300">
            {status}
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Assignment & Reassignment Management"
        description="Review technician ticket reassignment requests, authorize allocations, and triage unassigned incidents."
        actions={
          <Button
            variant="outline"
            size="sm"
            leftIcon={RefreshCw}
            onClick={loadData}
            isLoading={loading}
          >
            Refresh Queue
          </Button>
        }
      />

      {/* Navigation Tabs */}
      <div className="flex items-center gap-4 border-b border-slate-200 dark:border-navy-800">
        <button
          type="button"
          onClick={() => setActiveTab('reassignments')}
          className={`pb-3 text-sm font-semibold flex items-center gap-2 border-b-2 transition-all ${
            activeTab === 'reassignments'
              ? 'border-cyan-500 text-cyan-500 dark:text-cyan-400 font-bold'
              : 'border-transparent text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200'
          }`}
        >
          <ArrowRightLeft className="w-4 h-4" />
          Reassignment Requests
          {pendingCount > 0 && (
            <span className="px-2 py-0.5 rounded-full text-xs bg-amber-500/20 text-amber-400 border border-amber-500/30">
              {pendingCount} pending
            </span>
          )}
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('unassigned')}
          className={`pb-3 text-sm font-semibold flex items-center gap-2 border-b-2 transition-all ${
            activeTab === 'unassigned'
              ? 'border-cyan-500 text-cyan-500 dark:text-cyan-400 font-bold'
              : 'border-transparent text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200'
          }`}
        >
          <Inbox className="w-4 h-4" />
          Unassigned Queue ({unassignedTickets.length})
        </button>
      </div>

      {/* TAB 1: REASSIGNMENT REQUESTS */}
      {activeTab === 'reassignments' && (
        <div className="space-y-4">
          {/* Sub-filter pills */}
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-400 flex items-center gap-1 font-medium">
                <Filter className="w-3.5 h-3.5" /> Filter by:
              </span>
              {[
                { key: 'pending', label: 'Pending Review' },
                { key: 'approved', label: 'Approved' },
                { key: 'rejected', label: 'Rejected' },
                { key: 'all', label: 'All History' },
              ].map((pill) => (
                <button
                  key={pill.key}
                  type="button"
                  onClick={() => setStatusFilter(pill.key)}
                  className={`px-3 py-1 text-xs rounded-full font-medium transition-all ${
                    statusFilter === pill.key
                      ? 'bg-cyan-500 text-white shadow-sm'
                      : 'bg-slate-100 dark:bg-navy-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-navy-700'
                  }`}
                >
                  {pill.label}
                </button>
              ))}
            </div>

            <span className="text-xs text-slate-400">
              Showing {requests.length} {statusFilter} request{requests.length === 1 ? '' : 's'}
            </span>
          </div>

          {loading ? (
            <LoadingSkeleton type="table" count={4} />
          ) : requests.length === 0 ? (
            <div className="rounded-2xl border border-slate-200 dark:border-navy-800 bg-white dark:bg-navy-900 p-12 text-center">
              <CheckCircle2 className="w-12 h-12 text-slate-400 mx-auto mb-3 opacity-40" />
              <h3 className="text-base font-semibold text-slate-800 dark:text-slate-200">
                No {statusFilter === 'all' ? '' : statusFilter} reassignment requests found
              </h3>
              <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                {statusFilter === 'pending'
                  ? 'All technician reassignment requests have been reviewed and processed.'
                  : 'There are no historical reassignment events matching this criteria.'}
              </p>
            </div>
          ) : (
            <div className="rounded-2xl border border-slate-200 dark:border-navy-800 bg-white dark:bg-navy-900 overflow-hidden shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 dark:bg-navy-950/70 border-b border-slate-200 dark:border-navy-800 text-slate-400 uppercase tracking-wider font-semibold">
                    <tr>
                      <th className="py-3.5 px-4">Ticket</th>
                      <th className="py-3.5 px-4">Requesting Technician</th>
                      <th className="py-3.5 px-4">Target Specialist / Team</th>
                      <th className="py-3.5 px-4">Reason</th>
                      <th className="py-3.5 px-4">Date</th>
                      <th className="py-3.5 px-4">Status</th>
                      <th className="py-3.5 px-4 text-right">Actions / Decision</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-navy-800/80">
                    {requests.map((req) => (
                      <tr
                        key={req._id}
                        className="hover:bg-slate-50/60 dark:hover:bg-navy-850/40 transition-colors"
                      >
                        {/* Ticket Column */}
                        <td className="py-3.5 px-4 font-medium">
                          {req.ticket ? (
                            <Link
                              to={`/tickets/${req.ticket._id}`}
                              className="group block"
                            >
                              <span className="font-mono text-cyan-600 dark:text-cyan-400 group-hover:underline font-bold">
                                #{req.ticket.ticketNumber}
                              </span>
                              <span className="block text-slate-700 dark:text-slate-200 truncate max-w-[200px]">
                                {req.ticket.title}
                              </span>
                            </Link>
                          ) : (
                            <span className="text-slate-400">Unknown Ticket</span>
                          )}
                        </td>

                        {/* Requesting Technician */}
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-2">
                            <div className="w-6 h-6 rounded-full bg-slate-200 dark:bg-navy-750 flex items-center justify-center text-slate-600 dark:text-slate-300 text-[10px] font-bold">
                              {req.originalTechnician?.name?.charAt(0) || 'T'}
                            </div>
                            <div>
                              <span className="font-semibold text-slate-900 dark:text-slate-100 block">
                                {req.originalTechnician?.name || 'Technician'}
                              </span>
                              <span className="text-[10px] text-slate-400">
                                {req.originalTechnician?.email}
                              </span>
                            </div>
                          </div>
                        </td>

                        {/* Target Specialist or Team */}
                        <td className="py-3.5 px-4">
                          {req.targetTechnician ? (
                            <div className="flex items-center gap-1.5 text-cyan-600 dark:text-cyan-400 font-medium">
                              <User className="w-3.5 h-3.5" />
                              <span>{req.targetTechnician.name}</span>
                            </div>
                          ) : req.targetTeam ? (
                            <div className="flex items-center gap-1.5 text-purple-600 dark:text-purple-400 font-medium">
                              <Users className="w-3.5 h-3.5" />
                              <span>Team: {req.targetTeam.name}</span>
                            </div>
                          ) : (
                            <span className="text-slate-400">Unspecified</span>
                          )}
                        </td>

                        {/* Reason */}
                        <td className="py-3.5 px-4 max-w-xs">
                          <p className="text-slate-700 dark:text-slate-300 italic truncate" title={req.reason}>
                            "{req.reason}"
                          </p>
                          {req.rejectionReason && (
                            <p className="text-rose-400 text-[11px] mt-1 truncate" title={req.rejectionReason}>
                              Rejection note: "{req.rejectionReason}"
                            </p>
                          )}
                        </td>

                        {/* Date */}
                        <td className="py-3.5 px-4 whitespace-nowrap text-slate-400 text-[11px]">
                          {formatDate(req.createdAt)}
                        </td>

                        {/* Status */}
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          {getStatusBadge(req.status)}
                        </td>

                        {/* Actions / Decision */}
                        <td className="py-3.5 px-4 text-right whitespace-nowrap">
                          {req.status === 'pending' ? (
                            <div className="flex items-center justify-end gap-1.5">
                              <Button
                                size="sm"
                                variant="success"
                                leftIcon={CheckCircle2}
                                isLoading={actionLoadingId === req._id}
                                onClick={() => handleApprove(req)}
                              >
                                Approve
                              </Button>
                              <Button
                                size="sm"
                                variant="danger"
                                leftIcon={XCircle}
                                disabled={actionLoadingId === req._id}
                                onClick={() => openRejectModal(req)}
                              >
                                Reject
                              </Button>
                            </div>
                          ) : (
                            <div className="text-[11px] text-slate-400">
                              {req.reviewedBy && (
                                <span>
                                  Reviewed by <strong className="text-slate-300">{req.reviewedBy.name}</strong>
                                </span>
                              )}
                              {req.reviewedAt && (
                                <span className="block text-[10px] text-slate-500">
                                  {formatDate(req.reviewedAt)}
                                </span>
                              )}
                            </div>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: UNASSIGNED INCIDENT QUEUE */}
      {activeTab === 'unassigned' && (
        <TicketTable
          tickets={unassignedTickets}
          emptyTitle="Unassigned Queue is Empty"
          emptyDescription="All incoming tickets have been intelligently allocated to specialists."
        />
      )}

      {/* Reject Modal */}
      <RejectReassignmentModal
        isOpen={rejectModalOpen}
        onClose={() => {
          setRejectModalOpen(false);
          setSelectedRequest(null);
        }}
        request={selectedRequest}
        ticketNumber={selectedRequest?.ticket?.ticketNumber}
        onSuccess={loadData}
      />
    </div>
  );
};

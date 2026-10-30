import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Clock,
  User,
  Shield,
  RefreshCw,
  UserPlus,
  MessageSquare,
  Paperclip,
  CheckCircle2,
  AlertTriangle,
  History,
  Info,
} from 'lucide-react';
import { ticketService } from '../../services/ticketService.js';
import { api } from '../../services/apiClient.js';
import { TicketStatusBadge, TicketPriorityBadge } from '../../components/tickets/TicketStatusBadge.jsx';
import { TicketTimeline } from '../../components/tickets/TicketTimeline.jsx';
import { TicketComments } from '../../components/tickets/TicketComments.jsx';
import { TicketAttachments } from '../../components/tickets/TicketAttachments.jsx';
import { Button } from '../../components/common/Button.jsx';
import { Modal } from '../../components/common/Modal.jsx';
import { LoadingSkeleton } from '../../components/common/LoadingSkeleton.jsx';
import { formatDate, formatSlaRemaining } from '../../utils/formatDate.js';
import { useSocket } from '../../hooks/useSocket.js';
import { useAuth } from '../../contexts/AuthContext.jsx';
import { useModal } from '../../contexts/ModalContext.jsx';
import { canReassignTicket, isStaff } from '../../utils/permissions.js';

export const TicketDetail = () => {
  const { showConfirm, showSuccess, showError } = useModal();
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [ticket, setTicket] = useState(null);
  const [comments, setComments] = useState([]);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('details'); // details, comments, attachments, history

  // Modals state
  const [statusModalOpen, setStatusModalOpen] = useState(false);
  const [targetStatus, setTargetStatus] = useState('');
  const [resolutionNotes, setResolutionNotes] = useState('');
  const [statusLoading, setStatusLoading] = useState(false);

  const [reassignModalOpen, setReassignModalOpen] = useState(false);
  const [recommendedTechs, setRecommendedTechs] = useState([]);
  const [selectedTechId, setSelectedTechId] = useState('');
  const [reassignLoading, setReassignLoading] = useState(false);

  const [isUploading, setIsUploading] = useState(false);
  const [commentLoading, setCommentLoading] = useState(false);

  const fetchTicketData = useCallback(async () => {
    try {
      setLoading(true);
      const [ticketData, commentList, eventList] = await Promise.all([
        ticketService.getTicketById(id),
        ticketService.getTicketComments(id),
        ticketService.getTicketTimeline(id),
      ]);
      setTicket(ticketData);
      setComments(commentList || []);
      setEvents(eventList || []);
      setTargetStatus(ticketData.status);
    } catch (err) {
      console.error('Failed to load ticket:', err);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchTicketData();
  }, [fetchTicketData]);

  // Connect to Socket room for this ticket
  const { joinTicket, leaveTicket } = useSocket({
    'ticket:updated': (payload) => {
      if (payload?.ticket) setTicket(payload.ticket);
    },
    'ticket:status_changed': (payload) => {
      fetchTicketData();
    },
    'ticket:comment_added': (payload) => {
      if (payload?.comment) {
        setComments((prev) => [...prev, payload.comment]);
      }
    },
    'ticket:assigned': (payload) => {
      fetchTicketData();
    },
  });

  useEffect(() => {
    if (id) {
      joinTicket(id);
      return () => leaveTicket(id);
    }
  }, [id]);

  const handleStatusChange = async (e) => {
    e.preventDefault();
    if (!targetStatus) return;

    if (targetStatus === 'Closed') {
      const confirmed = await showConfirm({
        title: 'Close Ticket',
        message: `Are you sure you want to close ticket ${ticket?.ticketId || ''}? This will mark the incident as closed.`,
        confirmLabel: 'Close Ticket',
        type: 'warning',
      });
      if (!confirmed) return;
    }

    setStatusLoading(true);
    try {
      await ticketService.changeStatus(id, targetStatus, resolutionNotes);
      setStatusModalOpen(false);
      setResolutionNotes('');
      await fetchTicketData();
    } catch (err) {
      showError({
        title: 'Status Change Failed',
        message: 'Failed to update ticket status: ' + (err.response?.data?.message || err.message),
      });
    } finally {
      setStatusLoading(false);
    }
  };

  const openReassignModal = async () => {
    setReassignModalOpen(true);
    try {
      const candidates = await ticketService.getRecommendedTechnicians(id);
      setRecommendedTechs(candidates || []);
      if (candidates && candidates.length > 0) {
        setSelectedTechId(candidates[0]._id);
      }
    } catch (err) {
      console.error('Failed to load technicians:', err);
    }
  };

  const handleReassign = async (e) => {
    e.preventDefault();
    if (!selectedTechId) return;
    setReassignLoading(true);
    try {
      await ticketService.reassignTicket(id, selectedTechId);
      setReassignModalOpen(false);
      await fetchTicketData();
    } catch (err) {
      showError({
        title: 'Reassignment Failed',
        message: 'Failed to reassign ticket: ' + (err.response?.data?.message || err.message),
      });
    } finally {
      setReassignLoading(false);
    }
  };

  const handleAddComment = async ({ content, isInternal }) => {
    try {
      setCommentLoading(true);
      await ticketService.addComment(id, content, isInternal);
      // Socket will push comment to comments state
    } catch (err) {
      showError({
        title: 'Comment Failed',
        message: 'Failed to post comment: ' + (err.response?.data?.message || err.message),
      });
    } finally {
      setCommentLoading(false);
    }
  };

  const handleUploadAttachment = async (file) => {
    try {
      setIsUploading(true);
      await ticketService.uploadAttachment(id, file);
      await fetchTicketData();
    } catch (err) {
      showError({
        title: 'Upload Failed',
        message: 'Failed to upload attachment: ' + (err.response?.data?.message || err.message),
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleDeleteAttachment = async (file) => {
    const confirmed = await showConfirm({
      title: 'Delete Attachment',
      message: `Are you sure you want to permanently delete "${file?.originalName || 'this file'}"? This action cannot be undone.`,
      confirmLabel: 'Delete Attachment',
      type: 'danger',
    });
    if (!confirmed) return;

    try {
      await api.delete(`/attachments/${file._id}`);
      showSuccess({
        title: 'Attachment Deleted',
        message: 'The attachment has been removed successfully.',
        status: 'Completed',
        buttonText: 'Got it',
      });
      await fetchTicketData();
    } catch (err) {
      showError({
        title: 'Delete Failed',
        message: 'Failed to delete attachment: ' + (err.response?.data?.message || err.message),
      });
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <LoadingSkeleton type="card" count={2} />
      </div>
    );
  }

  if (!ticket) {
    return (
      <div className="text-center py-12">
        <p className="text-slate-500">Ticket not found or access denied.</p>
        <Button variant="outline" size="sm" onClick={() => navigate('/tickets')} className="mt-4">
          Back to Tickets
        </Button>
      </div>
    );
  }

  const slaInfo = formatSlaRemaining(ticket.sla?.resolutionDeadline);

  return (
    <div className="space-y-6">
      <button
        type="button"
        onClick={() => navigate(-1)}
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-blue-500 dark:text-slate-400 dark:hover:text-cyan-400 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" /> Back to Tickets
      </button>

      {/* Main Ticket Card matching visual design */}
      <div className="rounded-3xl border border-slate-200 dark:border-navy-800 bg-white dark:bg-navy-900 shadow-xl overflow-hidden">
        {/* Ticket Header Ribbon */}
        <div className="p-6 sm:p-8 border-b border-slate-100 dark:border-navy-800">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
            <div className="flex items-center gap-3 flex-wrap">
              <span className="font-mono text-sm font-bold text-cyan-600 dark:text-cyan-400 bg-cyan-500/10 px-3 py-1 rounded-lg border border-cyan-500/20">
                #{ticket.ticketNumber}
              </span>
              <TicketPriorityBadge priority={ticket.priority} />
              <TicketStatusBadge status={ticket.status} />
              {ticket.sla?.escalated && (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-500/15 text-rose-500 border border-rose-500/30 animate-pulse">
                  <Shield className="w-3.5 h-3.5" /> Escalated
                </span>
              )}
            </div>

            {/* SLA countdown badge */}
            <div className="flex items-center gap-2 text-xs">
              <Clock className={`w-4 h-4 ${slaInfo.isBreached ? 'text-rose-500' : 'text-slate-400'}`} />
              <span className="text-slate-400">Resolution SLA:</span>
              <span
                className={`font-semibold ${
                  slaInfo.isBreached
                    ? 'text-rose-500 font-bold'
                    : slaInfo.isWarning
                    ? 'text-amber-500'
                    : 'text-slate-700 dark:text-slate-300'
                }`}
              >
                {slaInfo.label}
              </span>
            </div>
          </div>

          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-slate-100 mb-6">
            {ticket.title}
          </h2>

          {/* Metadata Cards Grid matching reference */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 border-t border-slate-100 dark:border-navy-800/80 text-xs">
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-navy-850/80 border border-slate-100 dark:border-navy-750">
              <span className="text-slate-400 block mb-1">Created By</span>
              <span className="font-semibold text-slate-800 dark:text-slate-200">
                {ticket.creator?.name || 'User'}
              </span>
              <span className="text-[10px] text-slate-400 block mt-0.5">
                ({ticket.creator?.role})
              </span>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 dark:bg-navy-850/80 border border-slate-100 dark:border-navy-750">
              <span className="text-slate-400 block mb-1">Assigned Specialist</span>
              <span className="font-semibold text-slate-800 dark:text-slate-200">
                {ticket.assignee ? ticket.assignee.name : 'Unassigned'}
              </span>
              <span className="text-[10px] text-slate-400 block mt-0.5">
                {ticket.team?.name || 'General Support'}
              </span>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 dark:bg-navy-850/80 border border-slate-100 dark:border-navy-750">
              <span className="text-slate-400 block mb-1">Timeline Dates</span>
              <span className="font-semibold text-slate-800 dark:text-slate-200 block">
                Created: {formatDate(ticket.createdAt)}
              </span>
              <span className="text-[10px] text-slate-400 block mt-0.5">
                Updated: {formatDate(ticket.updatedAt)}
              </span>
            </div>
          </div>
        </div>

        {/* Action Controls Bar */}
        <div className="px-6 sm:px-8 py-3.5 bg-slate-50 dark:bg-navy-950/50 border-b border-slate-100 dark:border-navy-800 flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              leftIcon={RefreshCw}
              onClick={() => setStatusModalOpen(true)}
            >
              Change Status
            </Button>

            {canReassignTicket(user) && (
              <Button
                variant="outline"
                size="sm"
                leftIcon={UserPlus}
                onClick={openReassignModal}
              >
                Reassign
              </Button>
            )}
          </div>

          <div className="flex items-center gap-2">
            {ticket.status !== 'Resolved' && ticket.status !== 'Closed' && isStaff(user) && (
              <Button
                variant="success"
                size="sm"
                leftIcon={CheckCircle2}
                onClick={() => {
                  setTargetStatus('Resolved');
                  setStatusModalOpen(true);
                }}
              >
                Resolve Ticket
              </Button>
            )}
            {ticket.status !== 'Closed' && (
              <Button
                variant="secondary"
                size="sm"
                onClick={() => {
                  setTargetStatus('Closed');
                  setStatusModalOpen(true);
                }}
              >
                Close
              </Button>
            )}
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="border-b border-slate-100 dark:border-navy-800 px-6 sm:px-8 flex items-center gap-6 text-xs sm:text-sm font-semibold overflow-x-auto">
          {[
            { key: 'details', label: 'Details', icon: Info },
            { key: 'comments', label: `Comments (${comments.length})`, icon: MessageSquare },
            { key: 'attachments', label: `Attachments (${ticket.attachments?.length || 0})`, icon: Paperclip },
            { key: 'history', label: `History (${events.length})`, icon: History },
          ].map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.key}
                type="button"
                onClick={() => setActiveTab(tab.key)}
                className={`py-4 flex items-center gap-2 border-b-2 font-medium transition-all ${
                  activeTab === tab.key
                    ? 'border-cyan-500 text-blue-600 dark:text-cyan-400 font-bold'
                    : 'border-transparent text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200'
                }`}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Tab Body */}
        <div className="p-6 sm:p-8">
          {activeTab === 'details' && (
            <div className="space-y-6">
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                  Issue Description
                </h4>
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-navy-950 border border-slate-100 dark:border-navy-800 text-slate-800 dark:text-slate-200 text-sm whitespace-pre-wrap leading-relaxed">
                  {ticket.description}
                </div>
              </div>

              {ticket.resolutionNotes && (
                <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 dark:text-emerald-300">
                  <h5 className="font-semibold text-xs uppercase tracking-wider mb-1 flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500" /> Resolution Notes
                  </h5>
                  <p className="text-sm whitespace-pre-wrap">{ticket.resolutionNotes}</p>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div className="p-4 rounded-2xl border border-slate-100 dark:border-navy-800 bg-white dark:bg-navy-900/60 space-y-2">
                  <span className="text-slate-400 block font-semibold">Incident Category</span>
                  <span className="font-medium text-slate-800 dark:text-slate-200">{ticket.category}</span>
                </div>
                <div className="p-4 rounded-2xl border border-slate-100 dark:border-navy-800 bg-white dark:bg-navy-900/60 space-y-2">
                  <span className="text-slate-400 block font-semibold">Target SLA Policy</span>
                  <span className="font-medium text-slate-800 dark:text-slate-200">
                    {ticket.slaPolicy?.name || 'Standard SLA Policy'}
                  </span>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'comments' && (
            <TicketComments
              comments={comments}
              onAddComment={handleAddComment}
              isLoading={commentLoading}
            />
          )}

          {activeTab === 'attachments' && (
            <TicketAttachments
              attachments={ticket.attachments || []}
              onUpload={handleUploadAttachment}
              onDelete={handleDeleteAttachment}
              isUploading={isUploading}
            />
          )}

          {activeTab === 'history' && <TicketTimeline events={events} />}
        </div>
      </div>

      {/* Change Status Modal */}
      <Modal
        isOpen={statusModalOpen}
        onClose={() => setStatusModalOpen(false)}
        title="Update Ticket Status"
        subtitle={`Current status is ${ticket.status}`}
      >
        <form onSubmit={handleStatusChange} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
              New Status
            </label>
            <select
              value={targetStatus}
              onChange={(e) => setTargetStatus(e.target.value)}
              className="w-full rounded-lg text-sm bg-white dark:bg-navy-950 border border-slate-300 dark:border-navy-750 text-slate-900 dark:text-slate-100 p-2.5 focus:outline-none focus:ring-2 focus:ring-cyan-500"
            >
              <option value="Open">Open</option>
              <option value="Assigned">Assigned</option>
              <option value="In Progress">In Progress</option>
              <option value="Pending User">Pending User</option>
              <option value="Resolved">Resolved</option>
              <option value="Closed">Closed</option>
            </select>
          </div>

          {['Resolved', 'Closed'].includes(targetStatus) && (
            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                Resolution Notes (optional)
              </label>
              <textarea
                rows={3}
                value={resolutionNotes}
                onChange={(e) => setResolutionNotes(e.target.value)}
                placeholder="Describe how the problem was resolved or reason for closure..."
                className="w-full p-2.5 rounded-lg text-xs bg-white dark:bg-navy-950 border border-slate-300 dark:border-navy-750 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-cyan-500"
              />
            </div>
          )}

          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100 dark:border-navy-800">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setStatusModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              isLoading={statusLoading}
            >
              Save Status
            </Button>
          </div>
        </form>
      </Modal>

      {/* Reassign Modal with AI/Skill & Workload Recommendations */}
      <Modal
        isOpen={reassignModalOpen}
        onClose={() => setReassignModalOpen(false)}
        title="Reassign Ticket Specialist"
        subtitle="Ranked by skills match and current active workload"
      >
        <form onSubmit={handleReassign} className="space-y-4">
          <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
            {recommendedTechs.map((tech) => (
              <label
                key={tech._id}
                className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition-all ${
                  selectedTechId === tech._id
                    ? 'border-cyan-500 bg-cyan-500/10'
                    : 'border-slate-200 dark:border-navy-800 hover:border-slate-300 dark:hover:border-navy-700'
                }`}
              >
                <div className="flex items-center gap-3">
                  <input
                    type="radio"
                    name="tech"
                    checked={selectedTechId === tech._id}
                    onChange={() => setSelectedTechId(tech._id)}
                    className="text-cyan-500 focus:ring-cyan-500"
                  />
                  <div>
                    <span className="text-xs font-bold text-slate-900 dark:text-slate-100 block">
                      {tech.name}
                    </span>
                    <span className="text-[11px] text-slate-400">
                      {tech.teamName} • Skills: {tech.skills?.join(', ') || 'General'}
                    </span>
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-[11px] font-semibold text-slate-600 dark:text-slate-300 block">
                    {tech.activeTickets} active
                  </span>
                  {tech.hasSkill && (
                    <span className="text-[10px] font-bold text-cyan-500 bg-cyan-500/10 px-1.5 py-0.5 rounded">
                      Skill match
                    </span>
                  )}
                </div>
              </label>
            ))}
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100 dark:border-navy-800">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setReassignModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              isLoading={reassignLoading}
            >
              Confirm Reassignment
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

import React from 'react';
import {
  PlusCircle,
  UserCheck,
  CheckCircle2,
  RefreshCw,
  MessageSquare,
  AlertTriangle,
  Paperclip,
  ShieldAlert,
  ArrowRightLeft,
  Clock,
  XCircle,
  UserX,
} from 'lucide-react';
import { formatDate } from '../../utils/formatDate.js';

export const TicketTimeline = ({ events = [] }) => {
  const getEventIcon = (type) => {
    switch (type) {
      case 'CREATED':
        return <PlusCircle className="w-4 h-4 text-blue-500" />;
      case 'ASSIGNED':
        return <UserCheck className="w-4 h-4 text-cyan-500" />;
      case 'REASSIGNED':
        return <ArrowRightLeft className="w-4 h-4 text-cyan-400" />;
      case 'REASSIGNMENT_REQUESTED':
        return <Clock className="w-4 h-4 text-amber-400" />;
      case 'REASSIGNMENT_APPROVED':
        return <CheckCircle2 className="w-4 h-4 text-emerald-400" />;
      case 'REASSIGNMENT_REJECTED':
        return <XCircle className="w-4 h-4 text-rose-400" />;
      case 'REASSIGNMENT_CANCELLED':
        return <UserX className="w-4 h-4 text-slate-400" />;
      case 'STATUS_CHANGED':
        return <RefreshCw className="w-4 h-4 text-purple-500" />;
      case 'RESOLVED':
        return <CheckCircle2 className="w-4 h-4 text-emerald-500" />;
      case 'CLOSED':
        return <CheckCircle2 className="w-4 h-4 text-slate-400" />;
      case 'COMMENT_ADDED':
        return <MessageSquare className="w-4 h-4 text-sky-500" />;
      case 'ATTACHMENT_ADDED':
        return <Paperclip className="w-4 h-4 text-amber-500" />;
      case 'SLA_BREACH':
      case 'ESCALATED':
        return <ShieldAlert className="w-4 h-4 text-rose-500" />;
      default:
        return <RefreshCw className="w-4 h-4 text-slate-400" />;
    }
  };

  if (!events.length) {
    return (
      <div className="py-8 text-center text-xs text-slate-400">
        No timeline events recorded yet.
      </div>
    );
  }

  return (
    <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200 dark:before:bg-navy-800">
      {events.map((event, idx) => (
        <div key={event._id || idx} className="relative group">
          {/* Node Icon */}
          <div className="absolute -left-6 top-0.5 w-5 h-5 rounded-full bg-white dark:bg-navy-900 border border-slate-300 dark:border-navy-700 flex items-center justify-center shrink-0 z-10 shadow-sm">
            {getEventIcon(event.eventType)}
          </div>

          <div>
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-semibold text-slate-900 dark:text-slate-100">
                {event.message}
              </span>
              <span className="text-[11px] text-slate-400 whitespace-nowrap">
                {formatDate(event.createdAt)}
              </span>
            </div>

            {event.actor && (
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                By {event.actor.name} ({event.actor.role})
              </p>
            )}

            {/* Reassignment specific detailed card */}
            {event.details && (event.eventType.startsWith('REASSIGNMENT_') || event.eventType === 'REASSIGNED') && (
              <div className="mt-2 text-xs p-3 rounded-lg border bg-slate-900/40 border-navy-700 space-y-1.5">
                {event.details.previousTechnician && (
                  <div className="flex items-center gap-1.5 text-slate-300">
                    <span className="text-slate-400">From:</span>
                    <span className="font-medium text-slate-200">{event.details.previousTechnician.name || 'Unassigned'}</span>
                    {event.details.newTechnician && (
                      <>
                        <span className="text-slate-500">→</span>
                        <span className="text-slate-400">To:</span>
                        <span className="font-medium text-cyan-400">{event.details.newTechnician.name}</span>
                      </>
                    )}
                  </div>
                )}

                {event.details.targetTechnician && !event.details.newTechnician && (
                  <div className="text-slate-300">
                    <span className="text-slate-400">Target Specialist: </span>
                    <span className="font-medium text-cyan-400">{event.details.targetTechnician.name}</span>
                  </div>
                )}

                {event.details.targetTeam && (
                  <div className="text-slate-300">
                    <span className="text-slate-400">Target Team: </span>
                    <span className="font-medium text-purple-400">{event.details.targetTeam.name}</span>
                  </div>
                )}

                {event.details.approvingManager && (
                  <div className="text-emerald-400 text-[11px]">
                    Approved by: {event.details.approvingManager.name}
                  </div>
                )}

                {event.details.rejectingManager && (
                  <div className="text-rose-400 text-[11px]">
                    Rejected by: {event.details.rejectingManager.name}
                  </div>
                )}

                {event.details.reason && (
                  <div className="text-slate-300">
                    <span className="text-slate-400">Request Reason: </span>
                    <span className="italic">"{event.details.reason}"</span>
                  </div>
                )}

                {event.details.rejectionReason && (
                  <div className="text-rose-400 bg-rose-500/10 p-2 rounded border border-rose-500/20 mt-1">
                    <span className="font-semibold">Rejection Reason: </span>
                    <span>"{event.details.rejectionReason}"</span>
                  </div>
                )}
              </div>
            )}

            {/* Generic reason if not a reassignment event */}
            {event.details?.reason && !event.eventType.startsWith('REASSIGNMENT_') && event.eventType !== 'REASSIGNED' && (
              <p className="text-xs text-rose-500 mt-1 bg-rose-500/10 p-2 rounded-lg border border-rose-500/20">
                Reason: {event.details.reason}
              </p>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};

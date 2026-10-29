import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronRight, Clock, AlertTriangle } from 'lucide-react';
import { TicketStatusBadge, TicketPriorityBadge } from './TicketStatusBadge.jsx';
import { formatRelativeTime, formatSlaRemaining } from '../../utils/formatDate.js';
import { DataTable } from '../common/DataTable.jsx';

export const TicketTable = ({ tickets = [], loading = false }) => {
  const navigate = useNavigate();

  const columns = [
    {
      key: 'ticketNumber',
      header: 'ID',
      render: (ticket) => (
        <span className="font-mono text-xs font-bold text-cyan-600 dark:text-cyan-400 bg-cyan-500/10 px-2.5 py-1 rounded-md border border-cyan-500/20">
          #{ticket.ticketNumber}
        </span>
      ),
    },
    {
      key: 'title',
      header: 'Title & Category',
      render: (ticket) => (
        <div>
          <div className="font-semibold text-slate-900 dark:text-slate-100 line-clamp-1 hover:text-blue-500 transition-colors">
            {ticket.title}
          </div>
          <div className="text-[11px] text-slate-400 flex items-center gap-1.5 mt-0.5">
            <span className="font-medium text-slate-500 dark:text-slate-400">
              {ticket.category}
            </span>
            <span>•</span>
            <span>{ticket.creator?.name || 'User'}</span>
          </div>
        </div>
      ),
    },
    {
      key: 'priority',
      header: 'Priority',
      render: (ticket) => <TicketPriorityBadge priority={ticket.priority} />,
    },
    {
      key: 'status',
      header: 'Status',
      render: (ticket) => <TicketStatusBadge status={ticket.status} />,
    },
    {
      key: 'assignee',
      header: 'Assignee',
      render: (ticket) => (
        <div className="flex items-center gap-2">
          {ticket.assignee ? (
            <>
              {ticket.assignee.avatar ? (
                <img
                  src={ticket.assignee.avatar}
                  alt={ticket.assignee.name}
                  className="w-6 h-6 rounded-full object-cover"
                />
              ) : (
                <div className="w-6 h-6 rounded-full bg-slate-200 dark:bg-navy-800 text-[10px] font-semibold flex items-center justify-center text-slate-700 dark:text-slate-300">
                  {ticket.assignee.name?.charAt(0)}
                </div>
              )}
              <span className="text-xs text-slate-700 dark:text-slate-300 font-medium">
                {ticket.assignee.name}
              </span>
            </>
          ) : (
            <span className="text-xs italic text-slate-400">Unassigned</span>
          )}
        </div>
      ),
    },
    {
      key: 'sla',
      header: 'SLA',
      render: (ticket) => {
        const sla = formatSlaRemaining(ticket.sla?.resolutionDeadline);
        return (
          <div className="flex items-center gap-1.5 text-xs">
            <Clock className={`w-3.5 h-3.5 ${sla.isBreached ? 'text-rose-500' : 'text-slate-400'}`} />
            <span
              className={
                sla.isBreached
                  ? 'text-rose-500 font-semibold'
                  : sla.isWarning
                  ? 'text-amber-500 font-medium'
                  : 'text-slate-500 dark:text-slate-400'
              }
            >
              {sla.label}
            </span>
          </div>
        );
      },
    },
    {
      key: 'createdAt',
      header: 'Created',
      render: (ticket) => (
        <span className="text-xs text-slate-400">{formatRelativeTime(ticket.createdAt)}</span>
      ),
    },
    {
      key: 'actions',
      header: '',
      align: 'right',
      render: () => (
        <div className="p-1 text-slate-400 group-hover:text-cyan-400">
          <ChevronRight className="w-4 h-4" />
        </div>
      ),
    },
  ];

  return (
    <DataTable
      columns={columns}
      data={tickets}
      loading={loading}
      emptyTitle="No tickets found"
      emptyDescription="No tickets match your active filter criteria."
      onRowClick={(ticket) => navigate(`/tickets/${ticket._id}`)}
    />
  );
};

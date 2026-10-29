import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Clock, User, Tag, ArrowRight } from 'lucide-react';
import { TicketStatusBadge, TicketPriorityBadge } from './TicketStatusBadge.jsx';
import { formatRelativeTime, formatSlaRemaining } from '../../utils/formatDate.js';

export const TicketCard = ({ ticket }) => {
  const navigate = useNavigate();
  const slaInfo = formatSlaRemaining(ticket.sla?.resolutionDeadline);

  return (
    <div
      onClick={() => navigate(`/tickets/${ticket._id}`)}
      className="p-4 rounded-2xl border border-slate-200 dark:border-navy-800 bg-white dark:bg-navy-900 hover:border-blue-500/50 dark:hover:border-cyan-500/50 hover:shadow-lg transition-all duration-200 cursor-pointer flex flex-col justify-between"
    >
      <div>
        <div className="flex items-center justify-between gap-2 mb-2">
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs font-bold text-cyan-600 dark:text-cyan-400">
              #{ticket.ticketNumber}
            </span>
            <TicketPriorityBadge priority={ticket.priority} />
          </div>
          <TicketStatusBadge status={ticket.status} />
        </div>

        <h4 className="text-sm font-semibold text-slate-900 dark:text-slate-100 line-clamp-1 mb-1">
          {ticket.title}
        </h4>
        <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 mb-3">
          {ticket.description}
        </p>
      </div>

      <div className="pt-3 border-t border-slate-100 dark:border-navy-800/80 flex items-center justify-between text-xs text-slate-400">
        <div className="flex items-center gap-2">
          {ticket.assignee ? (
            <span className="flex items-center gap-1 text-slate-600 dark:text-slate-300">
              <User className="w-3.5 h-3.5 text-slate-400" />
              {ticket.assignee.name}
            </span>
          ) : (
            <span className="italic text-slate-400">Unassigned</span>
          )}
        </div>

        <div className="flex items-center gap-1">
          <Clock className={`w-3.5 h-3.5 ${slaInfo.isBreached ? 'text-rose-500' : 'text-slate-400'}`} />
          <span className={slaInfo.isBreached ? 'text-rose-500 font-semibold' : ''}>
            {slaInfo.label}
          </span>
        </div>
      </div>
    </div>
  );
};

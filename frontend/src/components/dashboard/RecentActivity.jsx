import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronRight, ArrowRight, Activity, Clock } from 'lucide-react';
import { TicketStatusBadge } from '../tickets/TicketStatusBadge.jsx';
import { formatRelativeTime } from '../../utils/formatDate.js';

export const RecentActivity = ({
  tickets = [],
  title = 'Recent Tickets',
  viewAllLink = '/tickets',
}) => {
  const navigate = useNavigate();

  return (
    <div className="p-5 rounded-2xl border border-slate-200 dark:border-navy-800 bg-white dark:bg-navy-900 shadow-sm flex flex-col justify-between">
      <div>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <Activity className="w-4 h-4 text-cyan-500" />
              {title}
            </h3>
            <p className="text-xs text-slate-400">Latest active requests</p>
          </div>
          {viewAllLink && (
            <button
              type="button"
              onClick={() => navigate(viewAllLink)}
              className="text-xs font-semibold text-blue-600 dark:text-cyan-400 hover:underline flex items-center gap-1"
            >
              View all <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        <div className="divide-y divide-slate-100 dark:divide-navy-800/80">
          {tickets.length === 0 ? (
            <div className="py-8 text-center text-xs text-slate-400">
              No recent activity recorded
            </div>
          ) : (
            tickets.slice(0, 5).map((ticket) => (
              <div
                key={ticket._id}
                onClick={() => navigate(`/tickets/${ticket._id}`)}
                className="py-3 flex items-center justify-between gap-3 hover:bg-slate-50 dark:hover:bg-navy-850/60 p-2 rounded-xl cursor-pointer transition-colors"
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-[11px] font-bold text-cyan-600 dark:text-cyan-400">
                      #{ticket.ticketNumber}
                    </span>
                    <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate">
                      {ticket.title}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-[10px] text-slate-400 mt-1">
                    <span>{ticket.category}</span>
                    <span>•</span>
                    <span className="flex items-center gap-0.5">
                      <Clock className="w-3 h-3" />
                      {formatRelativeTime(ticket.createdAt)}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <TicketStatusBadge status={ticket.status} />
                  <ChevronRight className="w-4 h-4 text-slate-400" />
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

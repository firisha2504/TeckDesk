import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, Check, Clock, AlertTriangle, ShieldAlert } from 'lucide-react';
import { formatRelativeTime } from '../../utils/formatDate.js';
import { EmptyState } from '../common/EmptyState.jsx';

export const NotificationList = ({
  notifications = [],
  onMarkRead,
  onNotificationClick,
}) => {
  const navigate = useNavigate();

  const getIcon = (type) => {
    switch (type) {
      case 'SLA_BREACH':
        return <ShieldAlert className="w-5 h-5 text-rose-500" />;
      case 'SLA_WARNING':
        return <AlertTriangle className="w-5 h-5 text-amber-500" />;
      case 'STATUS_CHANGED':
        return <Clock className="w-5 h-5 text-cyan-500" />;
      default:
        return <Bell className="w-5 h-5 text-blue-500" />;
    }
  };

  if (!notifications.length) {
    return (
      <EmptyState
        icon={Bell}
        title="No notifications"
        description="You are all caught up with your support updates."
      />
    );
  }

  return (
    <div className="space-y-3">
      {notifications.map((n) => (
        <div
          key={n._id}
          onClick={() => {
            if (!n.isRead) onMarkRead?.(n._id);
            if (n.ticket) {
              const ticketId = n.ticket?._id || n.ticket;
              navigate(`/tickets/${ticketId}`);
            }
          }}
          className={`flex items-start gap-4 p-4 rounded-2xl border transition-all cursor-pointer ${
            !n.isRead
              ? 'bg-blue-500/5 dark:bg-navy-850/80 border-blue-500/30 dark:border-cyan-500/30 shadow-sm'
              : 'bg-white dark:bg-navy-900 border-slate-200 dark:border-navy-800 hover:border-slate-300 dark:hover:border-navy-700'
          }`}
        >
          <div className="p-2.5 rounded-xl bg-slate-100 dark:bg-navy-800 shrink-0">
            {getIcon(n.type)}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2">
              <h4 className="text-sm font-semibold text-slate-900 dark:text-slate-100 truncate">
                {n.title}
              </h4>
              <span className="text-xs text-slate-400 shrink-0">
                {formatRelativeTime(n.createdAt)}
              </span>
            </div>
            <p className="mt-1 text-xs sm:text-sm text-slate-600 dark:text-slate-300">
              {n.message}
            </p>
          </div>

          {!n.isRead && (
            <button
              type="button"
              title="Mark as read"
              onClick={(e) => {
                e.stopPropagation();
                onMarkRead?.(n._id);
              }}
              className="p-1.5 text-slate-400 hover:text-blue-500 dark:hover:text-cyan-400 rounded-lg hover:bg-slate-100 dark:hover:bg-navy-800"
            >
              <Check className="w-4 h-4" />
            </button>
          )}
        </div>
      ))}
    </div>
  );
};

import React, { useState } from 'react';
import { Check, Bell } from 'lucide-react';
import { useNotifications } from '../../contexts/NotificationContext.jsx';
import { PageHeader } from '../../components/layout/PageHeader.jsx';
import { NotificationList } from '../../components/notifications/NotificationList.jsx';
import { Button } from '../../components/common/Button.jsx';

export const NotificationsPage = () => {
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications();
  const [filter, setFilter] = useState('all'); // all | unread

  const displayedNotifications =
    filter === 'unread'
      ? notifications.filter((n) => !n.isRead)
      : notifications;

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <PageHeader
        title="Notifications Center"
        description="Stay up to date with automated SLA breach warnings, technician assignments, and ticket responses."
        actions={
          unreadCount > 0 && (
            <Button
              variant="outline"
              size="sm"
              leftIcon={Check}
              onClick={markAllAsRead}
            >
              Mark all as read
            </Button>
          )
        }
      />

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-navy-800 pb-3">
        <button
          type="button"
          onClick={() => setFilter('all')}
          className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors ${
            filter === 'all'
              ? 'bg-blue-600 text-white'
              : 'text-slate-500 hover:text-slate-800 dark:text-slate-400'
          }`}
        >
          All ({notifications.length})
        </button>
        <button
          type="button"
          onClick={() => setFilter('unread')}
          className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors ${
            filter === 'unread'
              ? 'bg-blue-600 text-white'
              : 'text-slate-500 hover:text-slate-800 dark:text-slate-400'
          }`}
        >
          Unread ({unreadCount})
        </button>
      </div>

      <NotificationList
        notifications={displayedNotifications}
        onMarkRead={markAsRead}
      />
    </div>
  );
};

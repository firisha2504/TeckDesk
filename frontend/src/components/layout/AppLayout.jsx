import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar.jsx';
import { Topbar } from './Topbar.jsx';
import { MobileNavigation } from './MobileNavigation.jsx';
import { useNotifications } from '../../contexts/NotificationContext.jsx';
import { Bell, X } from 'lucide-react';

export const AppLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { latestToast, dismissToast } = useNotifications();

  return (
    <div className="flex min-h-screen bg-slate-50 dark:bg-navy-950 text-slate-900 dark:text-slate-100 transition-colors duration-200">
      {/* Sidebar */}
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Main Content Column */}
      <div className="flex flex-1 flex-col min-w-0">
        <Topbar onMenuClick={() => setSidebarOpen(true)} />

        <main className="flex-1 p-4 sm:p-6 lg:p-8 pb-20 lg:pb-8 max-w-7xl mx-auto w-full">
          <Outlet />
        </main>

        <MobileNavigation />
      </div>

      {/* Real-time Push Notification Toast Popup */}
      {latestToast && (
        <div className="fixed bottom-16 right-4 sm:bottom-6 sm:right-6 z-50 flex items-start gap-3 p-4 rounded-2xl bg-white dark:bg-navy-900 border border-cyan-500/40 shadow-2xl shadow-cyan-500/20 max-w-sm animate-bounce-once">
          <div className="p-2 rounded-xl bg-cyan-500/10 text-cyan-500 shrink-0">
            <Bell className="w-5 h-5 animate-pulse" />
          </div>
          <div className="flex-1 min-w-0">
            <h5 className="text-xs font-semibold text-slate-900 dark:text-slate-100">
              {latestToast.title}
            </h5>
            <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 mt-0.5">
              {latestToast.message}
            </p>
          </div>
          <button
            type="button"
            onClick={dismissToast}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
};

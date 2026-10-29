import React from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Ticket, PlusCircle, Bell, User } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext.jsx';
import { useNotifications } from '../../contexts/NotificationContext.jsx';

export const MobileNavigation = () => {
  const { user } = useAuth();
  const { unreadCount } = useNotifications();

  return (
    <nav className="fixed bottom-0 inset-x-0 z-40 bg-white/90 dark:bg-navy-900/95 backdrop-blur-md border-t border-slate-200 dark:border-navy-800 lg:hidden flex items-center justify-around py-2 px-2 shadow-lg">
      <NavLink
        to="/dashboard"
        className={({ isActive }) =>
          `flex flex-col items-center gap-0.5 text-[10px] font-medium transition-colors ${
            isActive ? 'text-blue-600 dark:text-cyan-400 font-semibold' : 'text-slate-500 dark:text-slate-400'
          }`
        }
      >
        <LayoutDashboard className="w-5 h-5" />
        <span>Home</span>
      </NavLink>

      <NavLink
        to={user?.role === 'employee' ? '/tickets/my' : '/tickets'}
        className={({ isActive }) =>
          `flex flex-col items-center gap-0.5 text-[10px] font-medium transition-colors ${
            isActive ? 'text-blue-600 dark:text-cyan-400 font-semibold' : 'text-slate-500 dark:text-slate-400'
          }`
        }
      >
        <Ticket className="w-5 h-5" />
        <span>Tickets</span>
      </NavLink>

      <NavLink
        to="/tickets/create"
        className="flex flex-col items-center justify-center w-10 h-10 -mt-5 rounded-full bg-gradient-to-tr from-blue-600 to-cyan-500 text-white shadow-lg shadow-cyan-500/30"
      >
        <PlusCircle className="w-6 h-6" />
      </NavLink>

      <NavLink
        to="/notifications"
        className={({ isActive }) =>
          `relative flex flex-col items-center gap-0.5 text-[10px] font-medium transition-colors ${
            isActive ? 'text-blue-600 dark:text-cyan-400 font-semibold' : 'text-slate-500 dark:text-slate-400'
          }`
        }
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full bg-rose-500 text-[9px] font-bold text-white flex items-center justify-center">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
        <span>Alerts</span>
      </NavLink>

      <NavLink
        to="/settings/profile"
        className={({ isActive }) =>
          `flex flex-col items-center gap-0.5 text-[10px] font-medium transition-colors ${
            isActive ? 'text-blue-600 dark:text-cyan-400 font-semibold' : 'text-slate-500 dark:text-slate-400'
          }`
        }
      >
        <User className="w-5 h-5" />
        <span>Profile</span>
      </NavLink>
    </nav>
  );
};

import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Ticket,
  PlusCircle,
  Users,
  ShieldAlert,
  BarChart3,
  Clock,
  Settings,
  Bell,
  Sliders,
  FileText,
  X,
  Headphones,
  CheckCircle2,
  Building2,
  UserCheck,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext.jsx';
import { ROLES } from '../../utils/constants.js';

export const Sidebar = ({ isOpen, onClose }) => {
  const { user } = useAuth();
  const role = user?.role || 'employee';

  const navItems = {
    superadmin: [
      { to: '/superadmin/dashboard', label: 'Platform Overview', icon: LayoutDashboard },
      { to: '/superadmin/organizations', label: 'Organizations', icon: Building2 },
      { to: '/superadmin/requests', label: 'Registration Requests', icon: UserCheck },
      { to: '/superadmin/audit-logs', label: 'Global Audit Logs', icon: FileText },
      { to: '/superadmin/settings', label: 'Platform Settings', icon: Sliders },
      { to: '/settings/profile', label: 'Profile', icon: Users },
      { to: '/settings/appearance', label: 'Settings', icon: Settings },
    ],
    employee: [
      { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
      { to: '/tickets/my', label: 'My Tickets', icon: Ticket },
      { to: '/tickets/create', label: 'Create Ticket', icon: PlusCircle },
      { to: '/notifications', label: 'Notifications', icon: Bell },
      { to: '/settings/profile', label: 'Profile', icon: Users },
      { to: '/settings/appearance', label: 'Settings', icon: Settings },
    ],
    technician: [
      { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
      { to: '/tickets/assigned', label: 'Assigned Tickets', icon: Ticket },
      { to: '/tickets', label: 'All Tickets', icon: FileText },
      { to: '/notifications', label: 'Notifications', icon: Bell },
      { to: '/settings/profile', label: 'Profile', icon: Users },
      { to: '/settings/appearance', label: 'Settings', icon: Settings },
    ],
    manager: [
      { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
      { to: '/tickets', label: 'Tickets', icon: Ticket },
      { to: '/teams', label: 'Team', icon: Users },
      { to: '/analytics', label: 'Analytics', icon: BarChart3 },
      { to: '/sla', label: 'SLA Policies', icon: Clock },
      { to: '/notifications', label: 'Notifications', icon: Bell },
      { to: '/settings/appearance', label: 'Settings', icon: Settings },
    ],
    admin: [
      { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
      { to: '/tickets', label: 'Tickets', icon: Ticket },
      { to: '/users', label: 'Users', icon: Users },
      { to: '/analytics', label: 'Analytics', icon: BarChart3 },
      { to: '/sla', label: 'SLA Policies', icon: Clock },
      { to: '/admin/audit-logs', label: 'Audit Logs', icon: FileText },
      { to: '/admin/organization', label: 'Organization', icon: Sliders },
      { to: '/notifications', label: 'Notifications', icon: Bell },
      { to: '/settings/appearance', label: 'Settings', icon: Settings },
    ],
  };

  const currentNav = navItems[role] || navItems.employee;
  const roleInfo = ROLES[role] || ROLES.employee;

  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/60 dark:bg-navy-950/80 backdrop-blur-sm lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar container */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-64 flex-col justify-between border-r border-slate-200 dark:border-navy-800 bg-white dark:bg-navy-900 transition-transform duration-300 ease-in-out lg:static lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Top Header & Brand */}
        <div>
          <div className="flex h-16 items-center justify-between px-6 border-b border-slate-100 dark:border-navy-800">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-cyan-500 via-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-cyan-500/20">
                <Headphones className="w-5 h-5" />
              </div>
              <div>
                <span className="text-base font-bold text-slate-900 dark:text-slate-100 tracking-tight flex items-center gap-1">
                  Tech<span className="text-cyan-500 dark:text-cyan-400">Desk</span>
                </span>
                <span className="block text-[10px] text-slate-400 font-medium tracking-wider uppercase">
                  Smart IT Support
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="lg:hidden p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-navy-800"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Navigation Links */}
          <nav className="p-4 space-y-1.5">
            {currentNav.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  onClick={() => onClose?.()}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-medium transition-all duration-150 ${
                      isActive
                        ? 'bg-gradient-to-r from-blue-600 to-cyan-500 text-white shadow-md shadow-blue-500/20 font-semibold'
                        : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-navy-800/80 hover:text-slate-900 dark:hover:text-slate-100'
                    }`
                  }
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  <span>{item.label}</span>
                </NavLink>
              );
            })}
          </nav>
        </div>

        {/* Bottom Profile Summary Card */}
        <div className="p-4 border-t border-slate-100 dark:border-navy-800">
          <div className="flex items-center gap-3 p-2.5 rounded-xl bg-slate-50 dark:bg-navy-850/80 border border-slate-100 dark:border-navy-750">
            {user?.avatar ? (
              <img
                src={user.avatar}
                alt={user.name}
                className="w-9 h-9 rounded-full object-cover shrink-0 ring-1 ring-blue-500/30"
              />
            ) : (
              <div className="w-9 h-9 rounded-full bg-blue-600 text-white font-bold flex items-center justify-center text-xs shrink-0">
                {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
              </div>
            )}
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold text-slate-800 dark:text-slate-100 truncate">
                {user?.name}
              </p>
              <p className="text-[10px] text-slate-400 capitalize truncate">
                {roleInfo.label}
              </p>
            </div>
            <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
          </div>
        </div>
      </aside>
    </>
  );
};

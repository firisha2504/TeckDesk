export const PRIORITIES = {
  Critical: {
    label: 'Critical',
    bg: 'bg-rose-500/10 text-rose-500 dark:text-rose-400 border border-rose-500/30',
    dot: 'bg-rose-500',
    badge: 'bg-rose-500 text-white',
  },
  High: {
    label: 'High',
    bg: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/30',
    dot: 'bg-amber-500',
    badge: 'bg-amber-500 text-white',
  },
  Medium: {
    label: 'Medium',
    bg: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/30',
    dot: 'bg-blue-500',
    badge: 'bg-blue-500 text-white',
  },
  Low: {
    label: 'Low',
    bg: 'bg-slate-500/10 text-slate-600 dark:text-slate-400 border border-slate-500/30',
    dot: 'bg-slate-400',
    badge: 'bg-slate-500 text-white',
  },
};

export const STATUSES = {
  Open: {
    label: 'Open',
    bg: 'bg-rose-500/15 text-rose-500 dark:text-rose-400 border border-rose-500/30',
    dot: 'bg-rose-500',
  },
  Assigned: {
    label: 'Assigned',
    bg: 'bg-purple-500/15 text-purple-600 dark:text-purple-400 border border-purple-500/30',
    dot: 'bg-purple-500',
  },
  'In Progress': {
    label: 'In Progress',
    bg: 'bg-cyan-500/15 text-cyan-600 dark:text-cyan-400 border border-cyan-500/30',
    dot: 'bg-cyan-500',
  },
  'Pending User': {
    label: 'Pending User',
    bg: 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30',
    dot: 'bg-amber-500',
  },
  Resolved: {
    label: 'Resolved',
    bg: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30',
    dot: 'bg-emerald-500',
  },
  Closed: {
    label: 'Closed',
    bg: 'bg-slate-500/15 text-slate-600 dark:text-slate-400 border border-slate-500/30',
    dot: 'bg-slate-500',
  },
};

export const CATEGORIES = [
  'Hardware',
  'Software',
  'Network',
  'Account',
  'Security',
  'Other',
];

export const ROLES = {
  employee: {
    label: 'Employee',
    badge: 'bg-blue-500/10 text-blue-500 border border-blue-500/20',
  },
  technician: {
    label: 'Technician',
    badge: 'bg-cyan-500/10 text-cyan-500 border border-cyan-500/20',
  },
  manager: {
    label: 'Manager',
    badge: 'bg-purple-500/10 text-purple-500 border border-purple-500/20',
  },
  admin: {
    label: 'Administrator',
    badge: 'bg-rose-500/10 text-rose-500 border border-rose-500/20',
  },
};

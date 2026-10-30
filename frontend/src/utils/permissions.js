export const isEmployee = (user) => user?.role === 'employee';
export const isTechnician = (user) => user?.role === 'technician';
export const isManager = (user) => user?.role === 'manager';
export const isAdmin = (user) => user?.role === 'admin';

export const isStaff = (user) => ['technician', 'manager', 'admin'].includes(user?.role);
export const isLeadership = (user) => ['manager', 'admin', 'superadmin'].includes(user?.role);

export const canManageUsers = (user) => ['manager', 'admin', 'superadmin'].includes(user?.role);
export const canManageTeams = (user) => ['manager', 'admin', 'superadmin'].includes(user?.role);
export const canConfigureSLA = (user) => ['manager', 'admin', 'superadmin'].includes(user?.role);
export const canViewAuditLogs = (user) => ['admin', 'superadmin'].includes(user?.role);
export const canViewInternalNotes = (user) => ['technician', 'manager', 'admin', 'superadmin'].includes(user?.role);
export const canReassignTicket = (user) => ['manager', 'admin', 'superadmin'].includes(user?.role);
export const canExportReports = (user) => ['technician', 'manager', 'admin', 'superadmin'].includes(user?.role);

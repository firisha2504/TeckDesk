export const isEmployee = (user) => user?.role === 'employee';
export const isTechnician = (user) => user?.role === 'technician';
export const isManager = (user) => user?.role === 'manager';
export const isAdmin = (user) => user?.role === 'admin';

export const isStaff = (user) => ['technician', 'manager', 'admin'].includes(user?.role);
export const isLeadership = (user) => ['manager', 'admin'].includes(user?.role);

export const canManageUsers = (user) => ['manager', 'admin'].includes(user?.role);
export const canManageTeams = (user) => ['manager', 'admin'].includes(user?.role);
export const canConfigureSLA = (user) => ['manager', 'admin'].includes(user?.role);
export const canViewAuditLogs = (user) => user?.role === 'admin';
export const canViewInternalNotes = (user) => ['technician', 'manager', 'admin'].includes(user?.role);
export const canReassignTicket = (user) => ['technician', 'manager', 'admin'].includes(user?.role);
export const canExportReports = (user) => ['technician', 'manager', 'admin'].includes(user?.role);

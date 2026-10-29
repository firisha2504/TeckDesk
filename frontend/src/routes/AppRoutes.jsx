import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext.jsx';
import { AppLayout } from '../components/layout/AppLayout.jsx';
import { LoadingSkeleton } from '../components/common/LoadingSkeleton.jsx';

// Auth Pages
import { Login } from '../pages/auth/Login.jsx';
import { Register } from '../pages/auth/Register.jsx';
import { ForgotPassword } from '../pages/auth/ForgotPassword.jsx';
import { ResetPassword } from '../pages/auth/ResetPassword.jsx';

// Role Dashboards
import { EmployeeDashboard } from '../pages/employee/EmployeeDashboard.jsx';
import { TechnicianDashboard } from '../pages/technician/TechnicianDashboard.jsx';
import { ManagerDashboard } from '../pages/manager/ManagerDashboard.jsx';
import { AdminDashboard } from '../pages/admin/AdminDashboard.jsx';

// Tickets
import { TicketList } from '../pages/tickets/TicketList.jsx';
import { TicketDetail } from '../pages/tickets/TicketDetail.jsx';
import { CreateTicket } from '../pages/employee/CreateTicket.jsx';
import { MyTickets } from '../pages/employee/MyTickets.jsx';
import { AssignedTickets } from '../pages/technician/AssignedTickets.jsx';

// Management & Admin
import { TeamManagement } from '../pages/manager/TeamManagement.jsx';
import { AssignmentQueue } from '../pages/manager/AssignmentQueue.jsx';
import { SLAManagement } from '../pages/manager/SLAManagement.jsx';
import { UserManagement } from '../pages/admin/UserManagement.jsx';
import { OrganizationSettings } from '../pages/admin/OrganizationSettings.jsx';
import { CategoryManagement } from '../pages/admin/CategoryManagement.jsx';
import { AuditLogs } from '../pages/admin/AuditLogs.jsx';
import { AnalyticsDashboard } from '../pages/analytics/AnalyticsDashboard.jsx';

// Notifications & Settings
import { NotificationsPage } from '../pages/notifications/NotificationsPage.jsx';
import { ProfileSettings } from '../pages/settings/ProfileSettings.jsx';
import { AppearanceSettings } from '../pages/settings/AppearanceSettings.jsx';

// Error Pages
import { NotFound } from '../pages/NotFound.jsx';
import { AccessDenied } from '../pages/AccessDenied.jsx';

// Protected Route Guard
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-navy-950 p-6">
        <LoadingSkeleton type="card" count={2} />
      </div>
    );
  }

  return isAuthenticated ? children : <Navigate to="/login" replace />;
};

// Role-based Route Guard
const RoleRoute = ({ allowedRoles = [], children }) => {
  const { user } = useAuth();

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
    return <Navigate to="/access-denied" replace />;
  }

  return children;
};

// Dynamic Dashboard component matching user's active role
const DashboardDispatcher = () => {
  const { user } = useAuth();

  switch (user?.role) {
    case 'admin':
      return <AdminDashboard />;
    case 'manager':
      return <ManagerDashboard />;
    case 'technician':
      return <TechnicianDashboard />;
    case 'employee':
    default:
      return <EmployeeDashboard />;
  }
};

export const AppRoutes = () => {
  return (
    <Routes>
      {/* Public Auth Routes */}
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password" element={<ResetPassword />} />
      <Route path="/access-denied" element={<AccessDenied />} />

      {/* Protected Layout Routes */}
      <Route
        element={
          <ProtectedRoute>
            <AppLayout />
          </ProtectedRoute>
        }
      >
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="/dashboard" element={<DashboardDispatcher />} />

        {/* Tickets */}
        <Route path="/tickets" element={<TicketList />} />
        <Route path="/tickets/my" element={<MyTickets />} />
        <Route
          path="/tickets/assigned"
          element={
            <RoleRoute allowedRoles={['technician', 'manager', 'admin']}>
              <AssignedTickets />
            </RoleRoute>
          }
        />
        <Route path="/tickets/create" element={<CreateTicket />} />
        <Route path="/tickets/:id" element={<TicketDetail />} />

        {/* Manager & Admin Features */}
        <Route
          path="/teams"
          element={
            <RoleRoute allowedRoles={['manager', 'admin']}>
              <TeamManagement />
            </RoleRoute>
          }
        />
        <Route
          path="/queue"
          element={
            <RoleRoute allowedRoles={['manager', 'admin']}>
              <AssignmentQueue />
            </RoleRoute>
          }
        />
        <Route
          path="/sla"
          element={
            <RoleRoute allowedRoles={['manager', 'admin']}>
              <SLAManagement />
            </RoleRoute>
          }
        />
        <Route
          path="/analytics"
          element={
            <RoleRoute allowedRoles={['technician', 'manager', 'admin']}>
              <AnalyticsDashboard />
            </RoleRoute>
          }
        />

        {/* Admin Only Features */}
        <Route
          path="/users"
          element={
            <RoleRoute allowedRoles={['admin', 'manager']}>
              <UserManagement />
            </RoleRoute>
          }
        />
        <Route
          path="/admin/organization"
          element={
            <RoleRoute allowedRoles={['admin']}>
              <OrganizationSettings />
            </RoleRoute>
          }
        />
        <Route
          path="/admin/categories"
          element={
            <RoleRoute allowedRoles={['admin', 'manager']}>
              <CategoryManagement />
            </RoleRoute>
          }
        />
        <Route
          path="/admin/audit-logs"
          element={
            <RoleRoute allowedRoles={['admin']}>
              <AuditLogs />
            </RoleRoute>
          }
        />

        {/* User Notifications and Settings */}
        <Route path="/notifications" element={<NotificationsPage />} />
        <Route path="/settings/profile" element={<ProfileSettings />} />
        <Route path="/settings/appearance" element={<AppearanceSettings />} />
      </Route>

      {/* 404 Catch All */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};

import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext.jsx';
import { AppLayout } from '../components/layout/AppLayout.jsx';
import { PublicLayout } from '../components/layout/PublicLayout.jsx';
import { LoadingSkeleton } from '../components/common/LoadingSkeleton.jsx';

// Public Pages
import { Home } from '../pages/public/Home.jsx';
import { Features } from '../pages/public/Features.jsx';
import { About } from '../pages/public/About.jsx';
import { Contact } from '../pages/public/Contact.jsx';
import { Privacy } from '../pages/public/Privacy.jsx';
import { Terms } from '../pages/public/Terms.jsx';

// Auth Pages
import { Login } from '../pages/auth/Login.jsx';
import { Register } from '../pages/auth/Register.jsx';
import { RegisterOrganization } from '../pages/auth/RegisterOrganization.jsx';
import { ForgotPassword } from '../pages/auth/ForgotPassword.jsx';
import { ResetPassword } from '../pages/auth/ResetPassword.jsx';

// Super Admin Pages
import { SuperAdminDashboard } from '../pages/superadmin/SuperAdminDashboard.jsx';
import { OrganizationList } from '../pages/superadmin/OrganizationList.jsx';
import { OrganizationDetail } from '../pages/superadmin/OrganizationDetail.jsx';
import { RegistrationRequests } from '../pages/superadmin/RegistrationRequests.jsx';
import { GlobalAuditLogs } from '../pages/superadmin/GlobalAuditLogs.jsx';
import { PlatformSettings } from '../pages/superadmin/PlatformSettings.jsx';

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
import { EmployeeTicketDetail } from '../pages/employee/EmployeeTicketDetail.jsx';
import { AssignedTickets } from '../pages/technician/AssignedTickets.jsx';
import { TechnicianTicketDetail } from '../pages/technician/TechnicianTicketDetail.jsx';

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
    return <Navigate to="/unauthorized" replace />;
  }

  return children;
};

// Dynamic Dashboard component matching user's active role
const DashboardDispatcher = () => {
  const { user } = useAuth();

  switch (user?.role) {
    case 'superadmin':
      return <SuperAdminDashboard />;
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
      {/* 1. Public Marketing & Legal Pages */}
      <Route element={<PublicLayout />}>
        <Route path="/" element={<Home />} />
        <Route path="/features" element={<Features />} />
        <Route path="/about" element={<About />} />
        <Route path="/contact" element={<Contact />} />
        <Route path="/privacy" element={<Privacy />} />
        <Route path="/terms" element={<Terms />} />
      </Route>

      {/* 2. Public Authentication Pages */}
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/register-organization" element={<RegisterOrganization />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password" element={<ResetPassword />} />
      <Route path="/unauthorized" element={<AccessDenied />} />
      <Route path="/access-denied" element={<AccessDenied />} />

      {/* 3. Protected Authenticated Layout */}
      <Route
        element={
          <ProtectedRoute>
            <AppLayout />
          </ProtectedRoute>
        }
      >
        {/* Dynamic Role Dashboard */}
        <Route path="/dashboard" element={<DashboardDispatcher />} />

        {/* Section 5: Platform Super Admin Administration Pages */}
        <Route
          path="/superadmin/dashboard"
          element={
            <RoleRoute allowedRoles={['superadmin']}>
              <SuperAdminDashboard />
            </RoleRoute>
          }
        />
        <Route
          path="/superadmin/organizations"
          element={
            <RoleRoute allowedRoles={['superadmin']}>
              <OrganizationList />
            </RoleRoute>
          }
        />
        <Route
          path="/superadmin/organizations/:id"
          element={
            <RoleRoute allowedRoles={['superadmin']}>
              <OrganizationDetail />
            </RoleRoute>
          }
        />
        <Route
          path="/superadmin/requests"
          element={
            <RoleRoute allowedRoles={['superadmin']}>
              <RegistrationRequests />
            </RoleRoute>
          }
        />
        <Route
          path="/superadmin/audit-logs"
          element={
            <RoleRoute allowedRoles={['superadmin']}>
              <GlobalAuditLogs />
            </RoleRoute>
          }
        />
        <Route
          path="/superadmin/settings"
          element={
            <RoleRoute allowedRoles={['superadmin']}>
              <PlatformSettings />
            </RoleRoute>
          }
        />

        {/* Section 6: Employee Pages */}
        <Route
          path="/employee/dashboard"
          element={
            <RoleRoute allowedRoles={['employee', 'admin']}>
              <EmployeeDashboard />
            </RoleRoute>
          }
        />
        <Route
          path="/employee/tickets/new"
          element={
            <RoleRoute allowedRoles={['employee', 'admin']}>
              <CreateTicket />
            </RoleRoute>
          }
        />
        <Route
          path="/employee/tickets"
          element={
            <RoleRoute allowedRoles={['employee', 'admin']}>
              <MyTickets />
            </RoleRoute>
          }
        />
        <Route
          path="/employee/tickets/:id"
          element={
            <RoleRoute allowedRoles={['employee', 'admin']}>
              <EmployeeTicketDetail />
            </RoleRoute>
          }
        />
        <Route path="/employee/profile" element={<ProfileSettings />} />

        {/* Section 7: Technician Pages */}
        <Route
          path="/technician/dashboard"
          element={
            <RoleRoute allowedRoles={['technician', 'admin']}>
              <TechnicianDashboard />
            </RoleRoute>
          }
        />
        <Route
          path="/technician/tickets"
          element={
            <RoleRoute allowedRoles={['technician', 'admin', 'manager']}>
              <AssignedTickets />
            </RoleRoute>
          }
        />
        <Route
          path="/technician/tickets/:id"
          element={
            <RoleRoute allowedRoles={['technician', 'admin', 'manager']}>
              <TechnicianTicketDetail />
            </RoleRoute>
          }
        />
        <Route path="/technician/profile" element={<ProfileSettings />} />

        {/* Section 8: Manager Pages */}
        <Route
          path="/manager/dashboard"
          element={
            <RoleRoute allowedRoles={['manager', 'admin']}>
              <ManagerDashboard />
            </RoleRoute>
          }
        />
        <Route
          path="/manager/tickets"
          element={
            <RoleRoute allowedRoles={['manager', 'admin']}>
              <TicketList />
            </RoleRoute>
          }
        />
        <Route
          path="/manager/technicians"
          element={
            <RoleRoute allowedRoles={['manager', 'admin']}>
              <TeamManagement />
            </RoleRoute>
          }
        />
        <Route
          path="/manager/reports"
          element={
            <RoleRoute allowedRoles={['manager', 'admin']}>
              <AnalyticsDashboard />
            </RoleRoute>
          }
        />

        {/* Section 9: Administrator Pages */}
        <Route
          path="/admin/dashboard"
          element={
            <RoleRoute allowedRoles={['admin']}>
              <AdminDashboard />
            </RoleRoute>
          }
        />
        <Route
          path="/admin/users"
          element={
            <RoleRoute allowedRoles={['admin']}>
              <UserManagement />
            </RoleRoute>
          }
        />
        <Route
          path="/admin/settings"
          element={
            <RoleRoute allowedRoles={['admin']}>
              <OrganizationSettings />
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
        <Route
          path="/admin/notifications"
          element={
            <RoleRoute allowedRoles={['admin']}>
              <NotificationsPage />
            </RoleRoute>
          }
        />

        {/* Section 10: Shared Routes and Existing Aliases */}
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

        <Route path="/notifications" element={<NotificationsPage />} />
        <Route path="/profile" element={<ProfileSettings />} />
        <Route path="/settings/profile" element={<ProfileSettings />} />
        <Route path="/settings/appearance" element={<AppearanceSettings />} />
      </Route>

      {/* 404 Catch All */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};

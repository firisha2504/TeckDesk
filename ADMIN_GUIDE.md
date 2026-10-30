# TechDesk Administrator Guide: Super Admin, Org Admin & Managers

This operational manual details administrative procedures for **Platform Super Admins**, **Organization Administrators**, and **Departmental Managers**.

---

# Part 1: Platform Super Admin Guide

The Platform Super Admin holds platform-wide authority over multi-tenant infrastructure, tenant onboarding, compliance, and platform auditability.

## 1. Accessing the Platform Admin Portal
1. Log in with your Super Admin credentials at `/login`.
2. The navigation sidebar displays dedicated Platform Super Admin sections:
   - **Platform Dashboard**: Aggregate growth metrics, active organizations, and global activity.
   - **Organizations**: Complete directory of all institutions registered on the platform.
   - **Registration Requests**: Review queue of pending self-registered institutions.
   - **Global Audit Logs**: Platform-wide security event stream.

## 2. Reviewing & Approving Institution Registrations
When a new university, hospital, or company submits a registration request at `/register-organization`:
1. Navigate to **Registration Requests** (`/superadmin/requests`).
2. Pending organizations are displayed with submission timestamps, contact emails, and institution types.
3. Click on any row to open the full request review modal.
4. **Approval**:
   - Review domain authenticity and verify contact identity.
   - Click **Approve Organization**.
   - Select the subscription plan tier (`standard`, `pro`, `enterprise`).
   - Click **Confirm Approval**. Status immediately updates to `active`, and the initial organization admin account is enabled.
5. **Rejection**:
   - If the request cannot be validated, click **Reject Request**.
   - Enter a formal reason for the rejection (e.g. *"Unable to verify institutional accreditation"*).
   - Click **Confirm Rejection**. The organization record is preserved with `status: 'rejected'` for audit integrity.

## 3. Suspending & Reactivating Organizations
If an institution fails compliance or requests account suspension:
1. Navigate to **Organizations** (`/superadmin/organizations`).
2. Locate the target organization and click **Manage**.
3. In the organization header, click the **Suspend Organization** button.
4. Enter an administrative reason in the confirmation dialog and confirm.
   - **Immediate Enforcement**: All active WebSocket connections for users belonging to that organization are terminated. Any subsequent REST API requests from that organization are blocked with HTTP `403 Forbidden`.
5. To restore access, click **Reactivate Organization**. Workspace privileges are immediately restored.

---

# Part 2: Organization Administrator Guide

As an Organization Admin, you manage your institution's localized workspace, users, departmental teams, and SLA policies.

## 1. Setting Up Organization Profile & Business Hours
1. Navigate to **Settings** (`/settings`) from your sidebar.
2. Configure **Operational Hours**:
   - Set **Daily Start Time** (e.g., `08:30`) and **End Time** (e.g., `17:30`).
   - Select your local **Timezone** (e.g., `Africa/Addis_Ababa`).
   - *Impact*: Ticket SLA timers pause outside of your declared business hours to prevent false breaches overnight or on weekends.
3. Configure **Self-Registration**:
   - Toggle **Allow Employee Self-Registration** to permit colleagues with matching email domains to register directly.

## 2. Managing Staff Accounts & Roles
1. Navigate to **Staff & Users** (`/users`).
2. **Inviting a New Colleague**:
   - Click **+ Add User**.
   - Enter name, email, and temporary password.
   - Assign the appropriate role:
     - `admin`: Full departmental administrative control.
     - `manager`: Supervise queues, assign tickets, and view reports.
     - `technician`: Handle and resolve incidents.
     - `employee`: Standard ticket requesters.
3. **Updating Roles & Deactivating Accounts**:
   - Click the action menu next to any user.
   - Change their role or toggle account activation. Deactivated users cannot log in or receive ticket assignments.

## 3. Departmental Teams Configuration
1. Navigate to **Teams** (`/teams`).
2. Click **Create Team**.
3. Specify Team Name (e.g., *"Medical Imaging Support"* or *"Core Cloud Infrastructure"*).
4. Select an experienced technician as the **Team Lead**.
5. Select team members and assign technical specialties (`Hardware`, `Software`, `Network`, `Security`).

## 4. Configuring Localized SLA Policies
1. Navigate to **SLA Management** (`/sla`).
2. Review the priority escalation matrix:
   - **Critical Priority**: Default 15m Response, 2h Resolution.
   - **High Priority**: Default 1h Response, 8h Resolution.
   - **Medium Priority**: Default 4h Response, 24h Resolution.
   - **Low Priority**: Default 8h Response, 48h Resolution.
3. Enter your team's escalation email address to receive immediate alerts when an incident approaches breach.

---

# Part 3: Department Manager Guide

As an IT Department Manager, you monitor service delivery, balance technician workloads, and prevent SLA breaches.

## 1. Supervising the Service Queue
1. Navigate to **All Tickets** (`/tickets`).
2. Use filter pills to identify:
   - **Unassigned Incidents**: Tickets in `Open` status without a technician.
   - **Breach Warnings**: Tickets within 30 minutes of SLA deadline.
3. Open any unassigned ticket and click **Assign Technician**. The system highlights technicians with the lowest active ticket counts.

## 2. Workload Balancing & Technician Recommendations
1. When viewing a ticket, click **Recommended Technicians**.
2. The recommendation engine evaluates:
   - Active ticket load across your team.
   - Matching technical specialties (`Network`, `Database`, etc.).
   - Historical resolution velocity.
3. Click **Assign** to balance assignments evenly across staff.

## 3. Triggering Manual SLA Breach Monitoring Scans
While automated background scans run every 5 minutes:
1. Navigate to the **Manager Dashboard**.
2. Click **Scan SLA Breaches Now**.
3. The server immediately evaluates all in-flight tickets, updates compliance counters, and dispatches escalation alerts.

## 4. Exporting Audit Reports
1. Navigate to **Reports** (`/reports`).
2. Set date ranges and filter by category or priority.
3. Click **Export CSV**. A clean CSV dataset is generated containing ticket numbers, requesters, assignees, response durations, and SLA compliance flags for executive review.

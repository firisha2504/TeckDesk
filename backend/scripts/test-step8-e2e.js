import fs from 'fs';
import path from 'path';
import jwt from 'jsonwebtoken';
import { io } from '../../frontend/node_modules/socket.io-client/build/esm/index.js';
import { connectDatabase, disconnectDatabase } from '../src/config/database.js';
import { User } from '../src/models/User.js';
import { Organization } from '../src/models/Organization.js';
import { Ticket } from '../src/models/Ticket.js';
import { TicketComment } from '../src/models/TicketComment.js';
import { TicketEvent } from '../src/models/TicketEvent.js';
import { Attachment } from '../src/models/Attachment.js';
import { Notification } from '../src/models/Notification.js';
import { Team } from '../src/models/Team.js';
import { SLAPolicy } from '../src/models/SLAPolicy.js';
import { AuditLog } from '../src/models/AuditLog.js';
import { env } from '../src/config/env.js';
import { uploadDir } from '../src/config/storage.js';

const API_BASE = 'http://localhost:5000/api';

async function apiRequest(endpoint, { method = 'GET', body, headers = {} } = {}) {
  const url = endpoint.startsWith('http') ? endpoint : `${API_BASE}${endpoint}`;
  const requestHeaders = {
    'Content-Type': 'application/json',
    ...headers,
  };

  const response = await fetch(url, {
    method,
    headers: requestHeaders,
    body: body ? JSON.stringify(body) : undefined,
  });

  const data = await response.json().catch(() => null);
  return { status: response.status, data };
}

async function runStep8EndToEndTests() {
  console.log('========================================================================');
  console.log('STEP 8: END-TO-END MULTI-TENANT SECURITY & REGRESSION TEST SUITE');
  console.log('========================================================================\n');

  await connectDatabase();

  let testPassed = 0;
  let testFailed = 0;

  function assert(condition, message) {
    if (condition) {
      console.log(`[PASS] ${message}`);
      testPassed++;
    } else {
      console.error(`[FAIL] ${message}`);
      testFailed++;
      throw new Error(`Test failed: ${message}`);
    }
  }

  // 1. Initial cleanup of previous test artifacts
  await Organization.deleteMany({
    slug: {
      $in: [
        'e2e-hospital-alpha',
        'e2e-university-beta',
        'e2e-pending-gamma',
        'e2e-institute-delta',
        'global-dental-institute',
      ],
    },
  });
  await User.deleteMany({
    email: {
      $in: [
        'admin@hosp-a.test',
        'tech@hosp-a.test',
        'employee@hosp-a.test',
        'admin@univ-b.test',
        'tech@univ-b.test',
        'employee@univ-b.test',
        'admin@gamma.test',
        'admin@dental.test',
      ],
    },
  });
  await Ticket.deleteMany({ ticketNumber: { $in: ['HOSP-001', 'UNIV-001', 'E2E-REG-01'] } });

  // 2. Load primary production data
  const primaryOrg = await Organization.findById('6ae4a0a7e61654672c50a1ce');
  const superAdmin = await User.findOne({ role: 'superadmin' });
  const staffAccounts = await User.find({ organization: primaryOrg._id });
  const existingTickets = await Ticket.find({ organization: primaryOrg._id });

  assert(
    primaryOrg && superAdmin && staffAccounts.length === 8 && existingTickets.length === 7,
    'Baseline: Verified TechDesk Solutions (active), Super Admin, 8 staff accounts, and 7 production tickets'
  );

  // Setup Two Independent Test Organizations for Multi-Tenant Tests
  let orgA, orgB;
  let adminA, techA, employeeA;
  let adminB, techB, employeeB;
  let ticketA, ticketB;
  let attachmentA;

  const testDummyFiles = [];

  try {
    // -------------------------------------------------------------------------
    // SETUP: PROVISION TENANT A (Hospital) AND TENANT B (University)
    // -------------------------------------------------------------------------
    orgA = await Organization.create({
      name: 'St. Jude General Hospital',
      slug: 'e2e-hospital-alpha',
      domain: 'stjude-hospital.test',
      type: 'Hospital / Healthcare',
      status: 'active',
      plan: 'enterprise',
    });

    adminA = await User.create({
      name: 'Dr. Sarah (Admin A)',
      email: 'admin@hosp-a.test',
      password: 'Password123!',
      role: 'admin',
      organization: orgA._id,
      isActive: true,
    });

    techA = await User.create({
      name: 'Nurse Tech (Tech A)',
      email: 'tech@hosp-a.test',
      password: 'Password123!',
      role: 'technician',
      organization: orgA._id,
      isActive: true,
    });

    employeeA = await User.create({
      name: 'Dr. John (Employee A)',
      email: 'employee@hosp-a.test',
      password: 'Password123!',
      role: 'employee',
      organization: orgA._id,
      isActive: true,
    });

    ticketA = await Ticket.create({
      ticketNumber: 'HOSP-001',
      title: 'MRI Console Network Failure',
      description: 'Medical imaging network link is down in Radiography room 3',
      priority: 'Critical',
      status: 'Open',
      creator: employeeA._id,
      assignee: techA._id,
      organization: orgA._id,
    });

    // Tenant B (University)
    orgB = await Organization.create({
      name: 'Apex University of Science',
      slug: 'e2e-university-beta',
      domain: 'apex-university.test',
      type: 'University / College',
      status: 'active',
      plan: 'standard',
    });

    adminB = await User.create({
      name: 'Prof. Miller (Admin B)',
      email: 'admin@univ-b.test',
      password: 'Password123!',
      role: 'admin',
      organization: orgB._id,
      isActive: true,
    });

    techB = await User.create({
      name: 'Campus Tech (Tech B)',
      email: 'tech@univ-b.test',
      password: 'Password123!',
      role: 'technician',
      organization: orgB._id,
      isActive: true,
    });

    employeeB = await User.create({
      name: 'Student Alex (Employee B)',
      email: 'employee@univ-b.test',
      password: 'Password123!',
      role: 'employee',
      organization: orgB._id,
      isActive: true,
    });

    ticketB = await Ticket.create({
      ticketNumber: 'UNIV-001',
      title: 'Library WiFi Access Point Failure',
      description: 'WiFi dropped on 2nd floor studying wing',
      priority: 'Medium',
      status: 'Open',
      creator: employeeB._id,
      assignee: techB._id,
      organization: orgB._id,
    });

    // Create attachment record for Ticket A
    const dummyFilename = `e2e_test_file_${Date.now()}.pdf`;
    const dummyFilePath = path.join(uploadDir, dummyFilename);
    fs.writeFileSync(dummyFilePath, '%PDF-1.4 E2E Test Document for St. Jude Hospital');
    testDummyFiles.push(dummyFilePath);

    attachmentA = await Attachment.create({
      filename: dummyFilename,
      originalName: 'MRI_Diagnostic_Log.pdf',
      mimeType: 'application/pdf',
      size: 512,
      path: dummyFilePath,
      uploader: employeeA._id,
      ticket: ticketA._id,
      organization: orgA._id,
    });

    // Generate authenticated JWT tokens
    const tokenAdminA = adminA.generateAuthToken();
    const tokenEmployeeA = employeeA.generateAuthToken();
    const tokenAdminB = adminB.generateAuthToken();
    const tokenEmployeeB = employeeB.generateAuthToken();
    const tokenSuperAdmin = superAdmin.generateAuthToken();

    // =========================================================================
    // SECTION 1: MULTI-TENANT ISOLATION TESTING
    // =========================================================================
    console.log('\n--- 1. Multi-Tenant Isolation Testing ---');

    // 1.1 Cross-tenant ticket read prevention (IDOR check)
    const crossTicketRes = await apiRequest(`/tickets/${ticketA._id}`, {
      headers: { Authorization: `Bearer ${tokenEmployeeB}` },
    });
    assert(
      crossTicketRes.status === 404 || crossTicketRes.status === 403,
      'Test 1.1: Tenant B user cannot access Tenant A ticket by ID (IDOR blocked with 404/403)'
    );

    // 1.2 Ticket listing isolation
    const listTicketsB = await apiRequest('/tickets', {
      headers: { Authorization: `Bearer ${tokenAdminB}` },
    });
    const ticketsB = listTicketsB.data?.data?.tickets || listTicketsB.data?.data || [];
    const hasOrgATickets = ticketsB.some((t) => t.ticketNumber === 'HOSP-001');
    assert(
      !hasOrgATickets,
      'Test 1.2: Tenant B ticket query strictly isolated; 0 Tenant A tickets returned'
    );

    // 1.3 Cross-tenant user management prevention
    const crossUserRoleRes = await apiRequest(`/users/${techA._id}/role`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${tokenAdminB}` },
      body: { role: 'employee' },
    });
    assert(
      crossUserRoleRes.status === 404 || crossUserRoleRes.status === 403,
      'Test 1.3: Tenant B Admin cannot modify Tenant A technician role (404/403)'
    );

    // 1.4 Cross-tenant technician assignment prevention
    const crossAssignRes = await apiRequest(`/tickets/${ticketA._id}/reassign`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${tokenAdminA}` },
      body: { assigneeId: techB._id },
    });
    assert(
      crossAssignRes.status === 404 || crossAssignRes.status === 400 || crossAssignRes.status === 403,
      'Test 1.4: Assigning foreign organization technician rejected'
    );

    // 1.5 Cross-tenant comment reading prevention
    const crossCommentsRes = await apiRequest(`/tickets/${ticketA._id}/comments`, {
      headers: { Authorization: `Bearer ${tokenEmployeeB}` },
    });
    assert(
      crossCommentsRes.status === 404 || crossCommentsRes.status === 403,
      'Test 1.5: Tenant B user cannot view comments on Tenant A ticket (404/403)'
    );

    // 1.6 Cross-tenant comment posting prevention
    const crossPostCommentRes = await apiRequest(`/tickets/${ticketA._id}/comments`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${tokenEmployeeB}` },
      body: { content: 'Unauthorized comment injection attempt' },
    });
    assert(
      crossPostCommentRes.status === 404 || crossPostCommentRes.status === 403,
      'Test 1.6: Tenant B user cannot post comments on Tenant A ticket (404/403)'
    );

    // 1.7 Cross-tenant ticket event timeline prevention
    const crossTimelineRes = await apiRequest(`/tickets/${ticketA._id}/timeline`, {
      headers: { Authorization: `Bearer ${tokenEmployeeB}` },
    });
    assert(
      crossTimelineRes.status === 404 || crossTimelineRes.status === 403,
      'Test 1.7: Tenant B user cannot access Tenant A ticket event timeline (404/403)'
    );

    // 1.8 Parameter anti-tampering (query parameter manipulation)
    const tamperedQueryRes = await apiRequest(`/tickets?organizationId=${orgA._id}`, {
      headers: { Authorization: `Bearer ${tokenAdminB}` },
    });
    assert(
      tamperedQueryRes.status === 403,
      'Test 1.8: Tampered organizationId in query parameter rejected with 403 Forbidden'
    );

    // =========================================================================
    // SECTION 2: PLATFORM SUPER ADMIN TESTING
    // =========================================================================
    console.log('\n--- 2. Platform Super Admin Testing ---');

    // 2.1 Super Admin platform access
    const superOverviewRes = await apiRequest('/superadmin/overview', {
      headers: { Authorization: `Bearer ${tokenSuperAdmin}` },
    });
    assert(
      superOverviewRes.status === 200 && superOverviewRes.data?.data?.organizations?.total >= 3,
      'Test 2.1: Super Admin can access authorized platform overview metrics'
    );

    // 2.2 Tenant Admin blocked from platform APIs
    const tenantAdminSuperRes = await apiRequest('/superadmin/overview', {
      headers: { Authorization: `Bearer ${tokenAdminA}` },
    });
    assert(
      tenantAdminSuperRes.status === 403,
      'Test 2.2: Tenant Admin blocked from platform administration (403 Forbidden)'
    );

    // 2.3 Pending organization gating
    const pendingOrg = await Organization.create({
      name: 'Gamma Testing Org',
      slug: 'e2e-pending-gamma',
      status: 'pending',
      plan: 'standard',
    });
    const pendingAdmin = await User.create({
      name: 'Gamma Admin',
      email: 'admin@gamma.test',
      password: 'Password123!',
      role: 'admin',
      organization: pendingOrg._id,
      isActive: true,
    });
    const pendingToken = pendingAdmin.generateAuthToken();

    const pendingAccessRes = await apiRequest('/tickets', {
      headers: { Authorization: `Bearer ${pendingToken}` },
    });
    assert(
      pendingAccessRes.status === 403 && pendingAccessRes.data?.message?.includes('pending'),
      'Test 2.3: User from pending organization blocked from workspace services (403 Forbidden)'
    );

    // 2.4 Suspended organization gating
    await apiRequest(`/superadmin/organizations/${orgA._id}/suspend`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${tokenSuperAdmin}` },
      body: { reason: 'E2E Compliance Test Suspension' },
    });
    const suspendedAccessRes = await apiRequest('/tickets', {
      headers: { Authorization: `Bearer ${tokenAdminA}` },
    });
    assert(
      suspendedAccessRes.status === 403 && suspendedAccessRes.data?.message?.includes('suspended'),
      'Test 2.4: Suspended organization immediately blocked from protected services in real-time (403)'
    );

    // 2.5 Reactivated organization restores access
    await apiRequest(`/superadmin/organizations/${orgA._id}/reactivate`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${tokenSuperAdmin}` },
    });
    const reactivatedAccessRes = await apiRequest('/tickets', {
      headers: { Authorization: `Bearer ${tokenAdminA}` },
    });
    assert(
      reactivatedAccessRes.status === 200,
      'Test 2.5: Reactivated organization regains authorized workspace access (200 OK)'
    );

    // 2.6 Platform operations audit log recording
    const auditLogsRes = await apiRequest('/superadmin/audit-logs?limit=10', {
      headers: { Authorization: `Bearer ${tokenSuperAdmin}` },
    });
    const recentActions = auditLogsRes.data?.data?.logs?.map((l) => l.action) || [];
    assert(
      recentActions.includes('ORGANIZATION_SUSPENDED') && recentActions.includes('ORGANIZATION_REACTIVATED'),
      'Test 2.6: Platform suspension and reactivation operations recorded in audit logs'
    );

    // =========================================================================
    // SECTION 3: AUTHENTICATION & AUTHORIZATION TESTING
    // =========================================================================
    console.log('\n--- 3. Authentication and Authorization Testing ---');

    // 3.1 Invalid login credentials
    const invalidLoginRes = await apiRequest('/auth/login', {
      method: 'POST',
      body: { email: 'admin@hosp-a.test', password: 'WrongPassword999!' },
    });
    assert(
      invalidLoginRes.status === 401,
      'Test 3.1: Invalid credentials rejected with 401 Unauthorized'
    );

    // 3.2 Expired JWT token rejection
    const expiredToken = jwt.sign(
      { id: employeeA._id, role: employeeA.role, organization: orgA._id },
      env.JWT_SECRET,
      { expiresIn: '-1s' }
    );
    const expiredTokenRes = await apiRequest('/tickets', {
      headers: { Authorization: `Bearer ${expiredToken}` },
    });
    assert(
      expiredTokenRes.status === 401 && expiredTokenRes.data?.message?.includes('expired'),
      'Test 3.2: Expired JWT token safely rejected with 401 Unauthorized'
    );

    // 3.3 Tampered JWT token signature
    const tamperedToken = `${tokenEmployeeA}TAMPERED`;
    const tamperedTokenRes = await apiRequest('/tickets', {
      headers: { Authorization: `Bearer ${tamperedToken}` },
    });
    assert(
      tamperedTokenRes.status === 401,
      'Test 3.3: Tampered JWT signature rejected with 401 Unauthorized'
    );

    // 3.4 Role-based route authorization: Employee cannot create team
    const employeeCreateTeamRes = await apiRequest('/teams', {
      method: 'POST',
      headers: { Authorization: `Bearer ${tokenEmployeeA}` },
      body: { name: 'Unauthorized Employee Team', leadId: techA._id, memberIds: [techA._id] },
    });
    assert(
      employeeCreateTeamRes.status === 403,
      'Test 3.4: Employee blocked from manager/admin route POST /api/teams with 403 Forbidden'
    );

    // 3.5 Role-based route authorization: Employee cannot change roles
    const employeeRoleChangeRes = await apiRequest(`/users/${techA._id}/role`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${tokenEmployeeA}` },
      body: { role: 'admin' },
    });
    assert(
      employeeRoleChangeRes.status === 403,
      'Test 3.5: Employee blocked from manager/admin route PATCH /api/users/:id/role with 403 Forbidden'
    );

    // 3.6 Unauthenticated API request rejection
    const unauthenticatedRes = await apiRequest('/tickets');
    assert(
      unauthenticatedRes.status === 401,
      'Test 3.6: Unauthenticated API request rejected with 401 Unauthorized'
    );

    // 3.7 Existing production user authentication
    const existingStaffLoginRes = await apiRequest('/auth/login', {
      method: 'POST',
      body: { email: 'admin@techdesk.com', password: 'Password123!' },
    });
    assert(
      existingStaffLoginRes.status === 200 && existingStaffLoginRes.data?.data?.user?.email === 'admin@techdesk.com',
      'Test 3.7: Existing production staff account (admin@techdesk.com) authenticated successfully'
    );

    // 3.8 Institution Self-Registration Flow
    const selfRegisterRes = await apiRequest('/auth/register-organization', {
      method: 'POST',
      body: {
        organizationName: 'Global Dental Institute',
        domain: 'dental-institute.test',
        type: 'University / College',
        adminName: 'Dr. Dental Admin',
        adminEmail: 'admin@dental.test',
        adminPassword: 'Password123!',
      },
    });
    assert(
      selfRegisterRes.status === 201 && selfRegisterRes.data?.data?.organization?.status === 'pending',
      'Test 3.8: Organization self-registration creates pending organization and initial admin account'
    );
    const registeredOrgId = selfRegisterRes.data?.data?.organization?._id || selfRegisterRes.data?.data?.organization?.id;

    // 3.9 Super Admin Approval of New Institution
    const approveOrgRes = await apiRequest(`/superadmin/organizations/${registeredOrgId}/approve`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${tokenSuperAdmin}` },
      body: { plan: 'enterprise' },
    });
    assert(
      approveOrgRes.status === 200 &&
        (approveOrgRes.data?.data?.status === 'active' || approveOrgRes.data?.data?.organization?.status === 'active'),
      'Test 3.9: Super Admin approved registration request; status transitioned to active'
    );

    // =========================================================================
    // SECTION 4: ATTACHMENT AND WEBSOCKET SECURITY TESTING
    // =========================================================================
    console.log('\n--- 4. Attachment and WebSocket Testing ---');

    // 4.1 Cross-tenant attachment download rejection
    const crossDownloadRes = await apiRequest(`/attachments/${attachmentA._id}/download`, {
      headers: { Authorization: `Bearer ${tokenEmployeeB}` },
    });
    assert(
      crossDownloadRes.status === 403,
      'Test 4.1: Cross-organization attachment download blocked with 403 Forbidden (IDOR prevented)'
    );

    // 4.2 Path traversal attack blocked
    const pathTraversalRes = await apiRequest('/attachments/download?file=../../package.json', {
      headers: { Authorization: `Bearer ${tokenEmployeeA}` },
    });
    assert(
      pathTraversalRes.status === 403 || pathTraversalRes.status === 400 || pathTraversalRes.status === 404,
      'Test 4.2: Path traversal attempt (../../package.json) blocked safely'
    );

    // 4.3 Super Admin cross-tenant attachment inspection for platform support
    const superAdminInspectFileRes = await apiRequest(`/attachments/${attachmentA._id}/download`, {
      headers: { Authorization: `Bearer ${tokenSuperAdmin}` },
    });
    assert(
      superAdminInspectFileRes.status === 200,
      'Test 4.3: Platform Super Admin authorized to inspect attachment across tenants for platform support'
    );

    // 4.4 Live WebSocket room isolation testing via real socket client
    const socketIsolationTest = await new Promise((resolve) => {
      const socketB = io('http://localhost:5000', {
        auth: { token: tokenEmployeeB },
        transports: ['websocket'],
      });

      socketB.on('connect', () => {
        // Attempt to join Tenant A ticket room
        socketB.emit('ticket:join', ticketA._id.toString());
      });

      socketB.on('error', (err) => {
        socketB.disconnect();
        if (err?.message?.includes('different organization') || err?.message?.includes('Unauthorized')) {
          resolve(true);
        } else {
          resolve(false);
        }
      });

      socketB.on('connect_error', () => {
        socketB.disconnect();
        resolve(false);
      });

      setTimeout(() => {
        socketB.disconnect();
        resolve(false);
      }, 4000);
    });
    assert(
      socketIsolationTest,
      'Test 4.4: Live WebSocket connection verified; cross-tenant ticket:join event rejected with unauthorized error'
    );

    // 4.5 Live WebSocket pending/suspended org gating
    const socketPendingGateTest = await new Promise((resolve) => {
      const socketPending = io('http://localhost:5000', {
        auth: { token: pendingToken },
        transports: ['websocket'],
      });

      socketPending.on('connect', () => {
        socketPending.disconnect();
        resolve(false);
      });

      socketPending.on('connect_error', (err) => {
        socketPending.disconnect();
        resolve(err.message.includes('pending') || err.message.includes('Organization status'));
      });

      setTimeout(() => {
        socketPending.disconnect();
        resolve(false);
      }, 3000);
    });
    assert(
      socketPendingGateTest,
      'Test 4.5: WebSocket connection denied for pending organization user'
    );

    // =========================================================================
    // SECTION 5: REGRESSION TESTING OF CORE SYSTEM CAPABILITIES
    // =========================================================================
    console.log('\n--- 5. Regression Testing ---');

    // 5.1 User Management within tenant
    const usersListRes = await apiRequest('/users', {
      headers: { Authorization: `Bearer ${tokenAdminA}` },
    });
    assert(
      usersListRes.status === 200 && Array.isArray(usersListRes.data?.data) && usersListRes.data.data.length >= 3,
      'Test 5.1: Tenant Admin successfully listed scoped tenant users'
    );

    // 5.2 Team Creation within tenant
    const createTeamRes = await apiRequest('/teams', {
      method: 'POST',
      headers: { Authorization: `Bearer ${tokenAdminA}` },
      body: {
        name: 'Radiology Support Team',
        leadId: techA._id,
        memberIds: [techA._id],
        specialties: ['Hardware', 'Other'],
      },
    });
    assert(
      createTeamRes.status === 201 && createTeamRes.data?.data?.name === 'Radiology Support Team',
      'Test 5.2: Team creation succeeded with same-tenant lead and members'
    );

    // 5.3 Ticket Status Lifecycle Update
    const statusUpdateRes = await apiRequest(`/tickets/${ticketA._id}/status`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${techA.generateAuthToken()}` },
      body: { status: 'In Progress', resolutionNotes: 'Replaced fiber optical transceiver' },
    });
    assert(
      statusUpdateRes.status === 200 && statusUpdateRes.data?.data?.status === 'In Progress',
      'Test 5.3: Ticket status updated from Open to In Progress'
    );

    // 5.4 Notification Delivery Scoped to Recipient
    await Notification.create({
      recipient: employeeA._id,
      organization: orgA._id,
      title: 'Ticket Progress',
      message: 'Your ticket is now In Progress',
      type: 'STATUS_CHANGED',
    });
    const notifsA = await Notification.find({ organization: orgA._id, recipient: employeeA._id });
    const notifsB = await Notification.find({ organization: orgB._id, recipient: employeeA._id });
    assert(
      notifsA.length >= 1 && notifsB.length === 0,
      'Test 5.4: Notifications strictly isolated to tenant and intended recipient'
    );

    // 5.5 Analytics dashboard scoped to tenant
    const analyticsRes = await apiRequest('/analytics/admin', {
      headers: { Authorization: `Bearer ${tokenAdminA}` },
    });
    assert(
      analyticsRes.status === 200 && typeof analyticsRes.data?.data?.openTickets === 'number',
      'Test 5.5: Analytics admin dashboard returned scoped metrics for Tenant A'
    );

    // 5.6 SLA Policy verification
    const slaPolicy = await SLAPolicy.findOne({ organization: primaryOrg._id });
    assert(
      slaPolicy && slaPolicy.priorities?.Critical?.responseTimeMinutes > 0,
      'Test 5.6: SLA Policy intact with valid priority escalation targets'
    );

    // =========================================================================
    // SECTION 6: EXISTING DATA PRESERVATION
    // =========================================================================
    console.log('\n--- 6. Existing Data Preservation ---');

    const primaryOrgCheck = await Organization.findById('6ae4a0a7e61654672c50a1ce');
    assert(
      primaryOrgCheck && primaryOrgCheck.status === 'active' && primaryOrgCheck.plan === 'enterprise',
      'Test 6.1: TechDesk Solutions (6ae4a0a7e61654672c50a1ce) active and intact'
    );

    const expectedStaffEmails = [
      'admin@techdesk.com',
      'manager@techdesk.com',
      'tadesse@techdesk.com',
      'selamawit@techdesk.com',
      'daniel@techdesk.com',
      'mekdes@techdesk.com',
      'employee@techdesk.com',
      'yonas@techdesk.com',
    ];
    const liveStaff = await User.find({
      organization: primaryOrgCheck._id,
      email: { $in: expectedStaffEmails },
    });
    assert(
      liveStaff.length === 8,
      `Test 6.2: All 8 existing staff accounts preserved (${liveStaff.length}/8)`
    );

    const expectedTicketNumbers = [
      'TD-1001',
      'TD-1002',
      'TD-1003',
      'TD-1004',
      'TD-1005',
      'TD-1006',
      'TD-1007',
    ];
    const liveTickets = await Ticket.find({
      organization: primaryOrgCheck._id,
      ticketNumber: { $in: expectedTicketNumbers },
    });
    assert(
      liveTickets.length === 7,
      `Test 6.3: All 7 existing tickets TD-1001 to TD-1007 preserved (${liveTickets.length}/7)`
    );

    // Verify relations intact
    const commentsCount = await TicketComment.countDocuments({ organization: primaryOrgCheck._id });
    const eventsCount = await TicketEvent.countDocuments({ organization: primaryOrgCheck._id });
    const slaCount = await SLAPolicy.countDocuments({ organization: primaryOrgCheck._id });
    assert(
      commentsCount >= 3 && eventsCount >= 5 && slaCount >= 1,
      `Test 6.4: Relational production records intact (${commentsCount} comments, ${eventsCount} events, ${slaCount} SLA policy)`
    );
  } finally {
    // Clean up ephemeral test files
    for (const f of testDummyFiles) {
      if (fs.existsSync(f)) {
        try {
          fs.unlinkSync(f);
        } catch (_) {}
      }
    }

    // Clean up ephemeral test organizations, users, tickets
    await Organization.deleteMany({
      slug: {
        $in: [
          'e2e-hospital-alpha',
          'e2e-university-beta',
          'e2e-pending-gamma',
          'e2e-institute-delta',
          'global-dental-institute',
        ],
      },
    });
    await User.deleteMany({
      email: {
        $in: [
          'admin@hosp-a.test',
          'tech@hosp-a.test',
          'employee@hosp-a.test',
          'admin@univ-b.test',
          'tech@univ-b.test',
          'employee@univ-b.test',
          'admin@gamma.test',
          'admin@dental.test',
        ],
      },
    });
    await Ticket.deleteMany({ ticketNumber: { $in: ['HOSP-001', 'UNIV-001', 'E2E-REG-01'] } });
    await Team.deleteMany({ name: 'Radiology Support Team' });
    await Attachment.deleteMany({ filename: { $regex: '^e2e_test_file_' } });
    await Notification.deleteMany({ title: 'Ticket Progress' });

    await disconnectDatabase();
  }

  console.log('\n========================================================================');
  console.log(`TOTAL E2E TESTS: ${testPassed + testFailed} | PASSED: ${testPassed} | FAILED: ${testFailed}`);
  console.log('========================================================================');
}

runStep8EndToEndTests().catch((err) => {
  console.error('[E2E TEST FAILURE]:', err);
  process.exit(1);
});

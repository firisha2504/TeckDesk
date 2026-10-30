import mongoose from 'mongoose';
import { connectDatabase, disconnectDatabase } from '../src/config/database.js';
import { User } from '../src/models/User.js';
import { Organization } from '../src/models/Organization.js';
import { Ticket } from '../src/models/Ticket.js';
import { Team } from '../src/models/Team.js';
import { SLAPolicy } from '../src/models/SLAPolicy.js';
import { AuditLog } from '../src/models/AuditLog.js';
import { superadminService } from '../src/services/superadmin.service.js';
import { superadminController } from '../src/controllers/superadmin.controller.js';
import { authService } from '../src/services/auth.service.js';
import { authenticate } from '../src/middleware/authenticate.js';
import { authorize } from '../src/middleware/authorize.js';

async function runStep6Tests() {
  console.log('=== STEP 6: PLATFORM SUPER ADMIN & TENANT OPERATIONS TEST SUITE ===\n');
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

  // Cleanup any lingering artifacts from previous runs
  await Organization.deleteMany({ slug: { $in: ['test-org-alpha', 'test-org-beta', 'test-org-gamma'] } });
  await User.deleteMany({ email: { $in: ['admin@alpha.test', 'admin@beta.test', 'admin@gamma.test', 'employee@alpha.test'] } });
  await Ticket.deleteMany({ ticketNumber: { $in: ['ALPHA-001', 'BETA-001'] } });

  // Load Primary Data
  const primaryOrg = await Organization.findOne({ slug: 'techdesk-solutions' });
  const superAdmin = await User.findOne({ role: 'superadmin' });
  const orgAdmin = await User.findOne({ email: 'admin@techdesk.com' });
  const technician = await User.findOne({ email: 'tadesse@techdesk.com' });
  const employee = await User.findOne({ email: 'employee@techdesk.com' });

  assert(primaryOrg && superAdmin && orgAdmin && technician && employee, 'Verified primary organization and staff test accounts');

  const superAdminReq = {
    user: superAdmin,
    organizationId: null,
    ip: '127.0.0.1',
    headers: { 'user-agent': 'Step6TestRunner/1.0' },
  };

  try {
    // -------------------------------------------------------------
    // TEST 1: Platform Super Admin can access authorized platform APIs
    // -------------------------------------------------------------
    const overview = await superadminService.getPlatformOverview();
    assert(
      overview &&
        overview.organizations &&
        typeof overview.organizations.total === 'number' &&
        typeof overview.organizations.active === 'number' &&
        overview.users &&
        overview.tickets,
      'Test 1.1: Platform Super Admin retrieved platform overview metrics'
    );

    const orgList = await superadminService.listOrganizations({ page: 1, limit: 10 });
    assert(
      orgList && Array.isArray(orgList.organizations) && orgList.total >= 1,
      'Test 1.2: Platform Super Admin listed organizations with pagination and metrics'
    );

    const orgDetails = await superadminService.getOrganizationDetails(primaryOrg._id);
    assert(
      orgDetails &&
        orgDetails.organization.slug === 'techdesk-solutions' &&
        orgDetails.stats.users.total >= 8 &&
        orgDetails.stats.tickets.total >= 7 &&
        orgDetails.admins.length >= 1,
      'Test 1.3: Platform Super Admin viewed organization details with user/ticket breakdowns'
    );

    const orgStats = await superadminService.getOrganizationStats(primaryOrg._id);
    assert(
      orgStats &&
        typeof orgStats.metrics.tickets.resolutionRatePercent === 'number' &&
        typeof orgStats.metrics.tickets.slaCompliancePercent === 'number',
      'Test 1.4: Platform Super Admin viewed scoped organization statistics'
    );

    const auditLogs = await superadminService.getGlobalAuditLogs({ page: 1, limit: 10 });
    assert(
      auditLogs && Array.isArray(auditLogs.logs),
      'Test 1.5: Platform Super Admin retrieved global audit logs'
    );

    // -------------------------------------------------------------
    // TEST 2: Organization Admin cannot access platform APIs (403 Forbidden)
    // -------------------------------------------------------------
    let orgAdminBlocked = false;
    const authSuperAdminMiddleware = authorize('superadmin');
    await authSuperAdminMiddleware(
      { user: orgAdmin, organizationId: orgAdmin.organization },
      {},
      (err) => {
        if (err && err.statusCode === 403) {
          orgAdminBlocked = true;
        }
      }
    );
    assert(orgAdminBlocked, 'Test 2: Organization Admin blocked from platform APIs with 403 Forbidden');

    // -------------------------------------------------------------
    // TEST 3: Technician and Employee cannot access platform APIs (403 Forbidden)
    // -------------------------------------------------------------
    let technicianBlocked = false;
    await authSuperAdminMiddleware(
      { user: technician, organizationId: technician.organization },
      {},
      (err) => {
        if (err && err.statusCode === 403) technicianBlocked = true;
      }
    );

    let employeeBlocked = false;
    await authSuperAdminMiddleware(
      { user: employee, organizationId: employee.organization },
      {},
      (err) => {
        if (err && err.statusCode === 403) employeeBlocked = true;
      }
    );
    assert(
      technicianBlocked && employeeBlocked,
      'Test 3: Technician and Employee blocked from platform APIs with 403 Forbidden'
    );

    // -------------------------------------------------------------
    // TEST 4: Pending organizations cannot use protected workspace services
    // -------------------------------------------------------------
    const pendingOrg = await Organization.create({
      name: 'Test Org Alpha',
      slug: 'test-org-alpha',
      domain: 'alpha.test',
      status: 'pending',
      plan: 'standard',
    });

    const pendingAdmin = await User.create({
      name: 'Alpha Admin',
      email: 'admin@alpha.test',
      password: 'Password123!',
      role: 'admin',
      organization: pendingOrg._id,
      isActive: true,
    });

    // Check login rejection for pending organization
    let pendingLoginBlocked = false;
    try {
      await authService.login({ email: 'admin@alpha.test', password: 'Password123!' }, {});
    } catch (err) {
      if (err.statusCode === 403 && err.message.toLowerCase().includes('pending')) {
        pendingLoginBlocked = true;
      }
    }
    assert(pendingLoginBlocked, 'Test 4.1: User from pending organization rejected at login (403 Forbidden)');

    // Check authenticate middleware rejection with token
    const pendingToken = pendingAdmin.generateAuthToken();
    let pendingAuthBlocked = false;
    const reqPending = {
      headers: { authorization: `Bearer ${pendingToken}` },
      cookies: {},
    };
    await authenticate(reqPending, {}, (err) => {
      if (err && err.statusCode === 403 && err.message.toLowerCase().includes('pending')) {
        pendingAuthBlocked = true;
      }
    });
    assert(pendingAuthBlocked, 'Test 4.2: User from pending organization rejected by authenticate middleware (403 Forbidden)');

    // -------------------------------------------------------------
    // TEST 5: Approving pending organization allows workspace access
    // -------------------------------------------------------------
    const approvedOrg = await superadminService.approveOrganization(pendingOrg._id, superAdminReq);
    assert(approvedOrg.status === 'active', 'Test 5.1: Super Admin approved pending organization');

    let approvedAuthPassed = false;
    await authenticate(reqPending, {}, (err) => {
      if (!err && reqPending.user && reqPending.organizationId.toString() === pendingOrg._id.toString()) {
        approvedAuthPassed = true;
      }
    });
    assert(approvedAuthPassed, 'Test 5.2: Approved organization user now successfully passes authentication');

    // -------------------------------------------------------------
    // TEST 6: Suspending organization immediately revokes workspace access
    // -------------------------------------------------------------
    const suspendedOrg = await superadminService.suspendOrganization(
      pendingOrg._id,
      { reason: 'Security Policy Violation' },
      superAdminReq
    );
    assert(suspendedOrg.status === 'suspended', 'Test 6.1: Super Admin suspended organization');

    let suspendedAuthBlocked = false;
    await authenticate(reqPending, {}, (err) => {
      if (err && err.statusCode === 403 && err.message.toLowerCase().includes('suspended')) {
        suspendedAuthBlocked = true;
      }
    });
    assert(suspendedAuthBlocked, 'Test 6.2: Suspended organization user immediately blocked from protected services (403)');

    let suspendedLoginBlocked = false;
    try {
      await authService.login({ email: 'admin@alpha.test', password: 'Password123!' }, {});
    } catch (err) {
      if (err.statusCode === 403 && err.message.toLowerCase().includes('suspended')) {
        suspendedLoginBlocked = false || true;
      }
    }
    assert(suspendedLoginBlocked, 'Test 6.3: Suspended organization user blocked from logging in (403)');

    // -------------------------------------------------------------
    // TEST 7: Reactivating organization restores workspace access
    // -------------------------------------------------------------
    const reactivatedOrg = await superadminService.reactivateOrganization(pendingOrg._id, superAdminReq);
    assert(reactivatedOrg.status === 'active', 'Test 7.1: Super Admin reactivated organization');

    let reactivatedAuthPassed = false;
    await authenticate(reqPending, {}, (err) => {
      if (!err && reqPending.user) {
        reactivatedAuthPassed = true;
      }
    });
    assert(reactivatedAuthPassed, 'Test 7.2: Reactivated organization user can access workspace again (200 OK)');

    // -------------------------------------------------------------
    // TEST 8: Organization records remain intact after suspension and reactivation
    // -------------------------------------------------------------
    const checkUser = await User.findOne({ email: 'admin@alpha.test' });
    const checkOrg = await Organization.findById(pendingOrg._id);
    assert(
      checkUser && checkOrg && checkUser.organization.toString() === pendingOrg._id.toString(),
      'Test 8: Organization and user records remain completely intact after suspension and reactivation'
    );

    // -------------------------------------------------------------
    // TEST 9: Updating organization information
    // -------------------------------------------------------------
    const updatedOrg = await superadminService.updateOrganization(
      pendingOrg._id,
      {
        name: 'Test Org Alpha Renamed',
        domain: 'alpha-updated.test',
        plan: 'enterprise',
        settings: { allowRegistration: false, defaultTicketPriority: 'High' },
      },
      superAdminReq
    );
    assert(
      updatedOrg.name === 'Test Org Alpha Renamed' &&
        updatedOrg.domain === 'alpha-updated.test' &&
        updatedOrg.plan === 'enterprise' &&
        updatedOrg.settings.defaultTicketPriority === 'High',
      'Test 9: Platform Super Admin successfully updated organization details and plan'
    );

    // -------------------------------------------------------------
    // TEST 10: Rejecting organization registration preserves record and blocks access
    // -------------------------------------------------------------
    const testOrgGamma = await Organization.create({
      name: 'Test Org Gamma',
      slug: 'test-org-gamma',
      status: 'pending',
      plan: 'standard',
    });
    const rejectedOrg = await superadminService.rejectOrganization(
      testOrgGamma._id,
      { reason: 'Incomplete business registration documentation' },
      superAdminReq
    );
    assert(
      rejectedOrg.status === 'rejected',
      'Test 10.1: Super Admin rejected pending organization'
    );

    const checkGamma = await Organization.findById(testOrgGamma._id);
    assert(checkGamma !== null, 'Test 10.2: Rejected organization record preserved in database without deletion');

    // -------------------------------------------------------------
    // TEST 11: Scoped organization statistics isolation
    // -------------------------------------------------------------
    const orgBeta = await Organization.create({
      name: 'Test Org Beta',
      slug: 'test-org-beta',
      status: 'active',
      plan: 'standard',
    });
    const userBeta = await User.create({
      name: 'Beta User',
      email: 'admin@beta.test',
      password: 'Password123!',
      role: 'admin',
      organization: orgBeta._id,
      isActive: true,
    });
    const ticketBeta = await Ticket.create({
      ticketNumber: 'BETA-001',
      title: 'Beta network issue',
      description: 'Network down at beta branch',
      priority: 'High',
      status: 'Open',
      creator: userBeta._id,
      organization: orgBeta._id,
    });

    const betaStats = await superadminService.getOrganizationStats(orgBeta._id);
    assert(
      betaStats.metrics.users.total === 1 && betaStats.metrics.tickets.total === 1,
      'Test 11.1: Org Beta statistics reflect exactly 1 user and 1 ticket'
    );

    const primaryStats = await superadminService.getOrganizationStats(primaryOrg._id);
    assert(
      primaryStats.metrics.tickets.total >= 7 &&
        primaryStats.metrics.tickets.total !== betaStats.metrics.tickets.total,
      'Test 11.2: TechDesk Solutions statistics remain strictly scoped to primary tenant'
    );

    // -------------------------------------------------------------
    // TEST 12: Audit logging records platform operations
    // -------------------------------------------------------------
    const approvedLog = await AuditLog.findOne({
      resourceId: pendingOrg._id.toString(),
      action: 'ORGANIZATION_APPROVED',
    });
    const suspendedLog = await AuditLog.findOne({
      resourceId: pendingOrg._id.toString(),
      action: 'ORGANIZATION_SUSPENDED',
    });
    const reactivatedLog = await AuditLog.findOne({
      resourceId: pendingOrg._id.toString(),
      action: 'ORGANIZATION_REACTIVATED',
    });
    const updatedLog = await AuditLog.findOne({
      resourceId: pendingOrg._id.toString(),
      action: 'ORGANIZATION_UPDATED',
    });
    const rejectedLog = await AuditLog.findOne({
      resourceId: testOrgGamma._id.toString(),
      action: 'ORGANIZATION_REJECTED',
    });

    assert(
      approvedLog && suspendedLog && reactivatedLog && updatedLog && rejectedLog,
      'Test 12: Audit logs recorded all platform lifecycle actions with actor and details'
    );

    // Verify no passwords or tokens were recorded in audit logs
    const logDetailsStr = JSON.stringify([
      approvedLog.details,
      suspendedLog.details,
      reactivatedLog.details,
      updatedLog.details,
      rejectedLog.details,
    ]);
    assert(
      !logDetailsStr.includes('Password123!') && !logDetailsStr.includes('Bearer'),
      'Test 12.1: Audit log entries do not leak passwords or auth tokens'
    );

    // -------------------------------------------------------------
    // TEST 13: Existing TechDesk Solutions data preservation
    // -------------------------------------------------------------
    const primaryOrgCheck = await Organization.findById('6ae4a0a7e61654672c50a1ce');
    assert(
      primaryOrgCheck && primaryOrgCheck.status === 'active',
      'Test 13.1: Primary organization TechDesk Solutions (6ae4a0a7e61654672c50a1ce) active and intact'
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
    const staffAccounts = await User.find({
      organization: primaryOrgCheck._id,
      email: { $in: expectedStaffEmails },
    });
    assert(
      staffAccounts.length === 8,
      `Test 13.2: All 8 existing staff accounts preserved (${staffAccounts.length}/8)`
    );

    const expectedTickets = [
      'TD-1001',
      'TD-1002',
      'TD-1003',
      'TD-1004',
      'TD-1005',
      'TD-1006',
      'TD-1007',
    ];
    const existingTickets = await Ticket.find({
      organization: primaryOrgCheck._id,
      ticketNumber: { $in: expectedTickets },
    });
    assert(
      existingTickets.length === 7,
      `Test 13.3: All 7 existing tickets preserved (${existingTickets.length}/7)`
    );
  } finally {
    // Clean up test organizations and test users created during this test
    await Organization.deleteMany({ slug: { $in: ['test-org-alpha', 'test-org-beta', 'test-org-gamma'] } });
    await User.deleteMany({ email: { $in: ['admin@alpha.test', 'admin@beta.test', 'admin@gamma.test', 'employee@alpha.test'] } });
    await Ticket.deleteMany({ ticketNumber: { $in: ['ALPHA-001', 'BETA-001'] } });
    await AuditLog.deleteMany({
      action: {
        $in: [
          'ORGANIZATION_APPROVED',
          'ORGANIZATION_REJECTED',
          'ORGANIZATION_SUSPENDED',
          'ORGANIZATION_REACTIVATED',
          'ORGANIZATION_UPDATED',
        ],
      },
    });
  }

  console.log('\n======================================================');
  console.log(`TOTAL TESTS RUN: ${testPassed + testFailed} | PASSED: ${testPassed} | FAILED: ${testFailed}`);
  console.log('======================================================');

  await disconnectDatabase();
}

runStep6Tests().catch((err) => {
  console.error('[ERROR IN TEST SUITE]:', err);
  process.exit(1);
});

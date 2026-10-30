import mongoose from 'mongoose';
import { connectDatabase, disconnectDatabase } from '../src/config/database.js';
import { User } from '../src/models/User.js';
import { Organization } from '../src/models/Organization.js';
import { Ticket } from '../src/models/Ticket.js';
import { Team } from '../src/models/Team.js';
import { authService } from '../src/services/auth.service.js';
import { superadminService } from '../src/services/superadmin.service.js';
import { authorize } from '../src/middleware/authorize.js';

async function runStep4Tests() {
  console.log('=== STEP 4: MULTI-TENANT AUTH & REGISTRATION TEST SUITE ===\n');
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

  // Verify primary organization
  const primaryOrg = await Organization.findOne({ slug: 'techdesk-solutions' });
  assert(primaryOrg && primaryOrg.status === 'active', 'TechDesk Solutions is active');

  // -------------------------------------------------------------
  // Test 1: Existing TechDesk Solutions user login
  // -------------------------------------------------------------
  const adminLogin = await authService.login({
    email: 'admin@techdesk.com',
    password: 'Password123!',
  });
  assert(
    adminLogin.token && adminLogin.user.role === 'admin' && adminLogin.user.organization.slug === 'techdesk-solutions',
    'Existing TechDesk Solutions Admin logged in successfully with valid tenant JWT'
  );

  // -------------------------------------------------------------
  // Test 2: Platform Super Admin login & Overview permissions
  // -------------------------------------------------------------
  const superAdminLogin = await authService.login({
    email: 'superadmin@techdesk.com',
    password: 'SuperAdmin@2026!',
  });
  assert(
    superAdminLogin.token && superAdminLogin.user.role === 'superadmin' && superAdminLogin.user.organization === null,
    'Platform Super Admin logged in with role "superadmin" and organization null'
  );

  const overview = await superadminService.getPlatformOverview();
  assert(
    overview.organizations.total >= 1 && overview.users.total >= 8 && overview.tickets.total === 7,
    `Super Admin retrieved platform overview (Orgs: ${overview.organizations.total}, Users: ${overview.users.total}, Tickets: ${overview.tickets.total})`
  );

  // -------------------------------------------------------------
  // Test 3: Organization Admin blocked from Super Admin route
  // -------------------------------------------------------------
  let orgAdminBlocked = false;
  const superAdminGuard = authorize('superadmin');
  superAdminGuard({ user: adminLogin.user, organizationId: primaryOrg._id.toString() }, {}, (err) => {
    if (err && err.statusCode === 403) orgAdminBlocked = true;
  });
  assert(orgAdminBlocked, 'Organization Admin strictly blocked from Super Admin routes (403 Forbidden)');

  // -------------------------------------------------------------
  // Test 4: New Organization Registration (Pending Status)
  // -------------------------------------------------------------
  const newOrgData = {
    organizationName: 'Global Health University',
    adminName: 'Dr. Gregory House',
    adminEmail: 'house@ghu-test.edu',
    adminPassword: 'Password@2026!',
    domain: 'ghu-test.edu',
  };

  const regResult = await authService.registerOrganization(newOrgData);
  assert(
    regResult.organization && regResult.organization.status === 'pending' && regResult.organization.slug === 'global-health-university',
    'New organization registered with status: "pending"'
  );
  assert(
    regResult.user && regResult.user.role === 'admin',
    'Primary Organization Admin user created for new organization'
  );

  // -------------------------------------------------------------
  // Test 5: Duplicate Organization Registration Prevention
  // -------------------------------------------------------------
  let dupOrgBlocked = false;
  try {
    await authService.registerOrganization(newOrgData);
  } catch (err) {
    if (err.statusCode === 409 && err.message.includes('already exists')) {
      dupOrgBlocked = true;
    }
  }
  assert(dupOrgBlocked, 'Duplicate organization registration rejected with 409 Conflict');

  // -------------------------------------------------------------
  // Test 6: Duplicate Admin Email Prevention
  // -------------------------------------------------------------
  let dupEmailBlocked = false;
  try {
    await authService.registerOrganization({
      organizationName: 'Another Unique School',
      adminName: 'Clone User',
      adminEmail: 'house@ghu-test.edu', // duplicate email
      adminPassword: 'Password@2026!',
    });
  } catch (err) {
    if (err.statusCode === 409 && err.message.includes('email address already exists')) {
      dupEmailBlocked = true;
    }
  }
  assert(dupEmailBlocked, 'Registration with duplicate email rejected with 409 Conflict');

  // -------------------------------------------------------------
  // Test 7: Login for Pending Organization User is Blocked
  // -------------------------------------------------------------
  let pendingLoginBlocked = false;
  try {
    await authService.login({
      email: 'house@ghu-test.edu',
      password: 'Password@2026!',
    });
  } catch (err) {
    if (err.statusCode === 403 && err.message.includes('pending review')) {
      pendingLoginBlocked = true;
    }
  }
  assert(pendingLoginBlocked, 'Pending organization user login blocked with 403 Forbidden');

  // -------------------------------------------------------------
  // Test 8: Employee Registration under Pending Organization is Blocked
  // -------------------------------------------------------------
  let pendingEmployeeBlocked = false;
  try {
    await authService.registerEmployee({
      name: 'Nurse John',
      email: 'john@ghu-test.edu',
      password: 'Password@2026!',
      organizationSlug: 'global-health-university',
    });
  } catch (err) {
    if (err.statusCode === 403 && err.message.includes('Account status is \'pending\'')) {
      pendingEmployeeBlocked = true;
    }
  }
  assert(pendingEmployeeBlocked, 'Employee registration under pending organization rejected with 403 Forbidden');

  // -------------------------------------------------------------
  // Test 9: Organization Approval by Platform Super Admin
  // -------------------------------------------------------------
  const approvedOrg = await superadminService.approveOrganization(regResult.organization._id, {
    user: superAdminLogin.user,
  });
  assert(approvedOrg.status === 'active', 'Platform Super Admin approved organization (status updated to "active")');

  // -------------------------------------------------------------
  // Test 10: Login for Approved Organization User
  // -------------------------------------------------------------
  const approvedLogin = await authService.login({
    email: 'house@ghu-test.edu',
    password: 'Password@2026!',
  });
  assert(
    approvedLogin.token && approvedLogin.user.organization.status === 'active',
    'Organization Admin logged in successfully after Super Admin approval'
  );

  // -------------------------------------------------------------
  // Test 11: Employee Registration under Approved Organization
  // -------------------------------------------------------------
  const empReg = await authService.registerEmployee({
    name: 'Nurse John',
    email: 'john@ghu-test.edu',
    password: 'Password@2026!',
    organizationSlug: 'global-health-university',
  });
  assert(
    empReg.token && empReg.user.role === 'employee' && empReg.user.organization.slug === 'global-health-university',
    'Employee successfully registered under approved organization with role "employee"'
  );

  // -------------------------------------------------------------
  // Test 12: Organization Rejection Flow
  // -------------------------------------------------------------
  const spamOrg = await authService.registerOrganization({
    organizationName: 'Suspicious Marketing Co',
    adminName: 'Spam Actor',
    adminEmail: 'spam@unverified.test',
    adminPassword: 'Password@2026!',
  });

  const rejectedOrg = await superadminService.rejectOrganization(
    spamOrg.organization._id,
    { reason: 'Unverified business entity' },
    { user: superAdminLogin.user }
  );
  assert(rejectedOrg.status === 'rejected', 'Super Admin rejected suspicious organization (status updated to "rejected")');

  let rejectedLoginBlocked = false;
  try {
    await authService.login({
      email: 'spam@unverified.test',
      password: 'Password@2026!',
    });
  } catch (err) {
    if (err.statusCode === 403 && err.message.includes('rejected')) {
      rejectedLoginBlocked = true;
    }
  }
  assert(rejectedLoginBlocked, 'Rejected organization login blocked with 403 Forbidden');

  // -------------------------------------------------------------
  // Clean up test organizations and users
  // -------------------------------------------------------------
  await User.deleteMany({ email: { $in: ['house@ghu-test.edu', 'john@ghu-test.edu', 'spam@unverified.test'] } });
  await Organization.deleteMany({ slug: { $in: ['global-health-university', 'suspicious-marketing-co'] } });
  console.log('[CLEANUP] Ephemeral test organizations and accounts cleaned up');

  // -------------------------------------------------------------
  // Final System Integrity Verification
  // -------------------------------------------------------------
  const finalStaffCount = await User.countDocuments({ organization: primaryOrg._id });
  const finalTicketCount = await Ticket.countDocuments({ organization: primaryOrg._id });

  assert(finalStaffCount === 8, `Primary organization staff count: ${finalStaffCount}/8`);
  assert(finalTicketCount === 7, `Primary organization ticket count: ${finalTicketCount}/7`);

  console.log(`\n======================================================`);
  console.log(`TOTAL TESTS RUN: ${testPassed + testFailed} | PASSED: ${testPassed} | FAILED: ${testFailed}`);
  console.log(`======================================================`);

  await disconnectDatabase();
}

runStep4Tests().catch((err) => {
  console.error('Test suite failed:', err);
  process.exit(1);
});

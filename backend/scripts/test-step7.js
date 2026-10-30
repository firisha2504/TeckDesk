import { connectDatabase, disconnectDatabase } from '../src/config/database.js';
import { User } from '../src/models/User.js';
import { Organization } from '../src/models/Organization.js';
import { Ticket } from '../src/models/Ticket.js';

const API_BASE = 'http://localhost:5000/api';

async function request(url, options = {}) {
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  };
  const body = options.body ? JSON.stringify(options.body) : undefined;
  const res = await fetch(url, { ...options, headers, body });
  const data = await res.json().catch(() => null);
  return { status: res.status, data };
}

async function runStep7IntegrationTests() {
  console.log('=== STEP 7: FRONTEND INTEGRATION & PLATFORM API TEST SUITE ===\n');

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

  // Cleanup test institutions from previous runs
  await connectDatabase();
  await Organization.deleteMany({ slug: { $in: ['apex-institute-of-technology', 'st-jude-hospital'] } });
  await User.deleteMany({ email: { $in: ['dean@apex-tech.edu', 'director@stjude.org'] } });
  await disconnectDatabase();

  try {
    // -------------------------------------------------------------
    // TEST 1: Super Admin Login & Authentication
    // -------------------------------------------------------------
    const superAdminLoginRes = await request(`${API_BASE}/auth/login`, {
      method: 'POST',
      body: {
        email: 'superadmin@techdesk.com',
        password: 'SuperAdmin@2026!',
      },
    });
    assert(
      superAdminLoginRes.status === 200 && superAdminLoginRes.data?.data?.token,
      'Test 1.1: Super Admin logged in successfully and received JWT token'
    );
    const superAdminToken = superAdminLoginRes.data.data.token;
    const superAdminUser = superAdminLoginRes.data.data.user;
    assert(
      superAdminUser.role === 'superadmin' && superAdminUser.organization === null,
      'Test 1.2: Super Admin user object verified (role: superadmin, org: null)'
    );

    const superAdminHeaders = {
      Authorization: `Bearer ${superAdminToken}`,
    };

    // -------------------------------------------------------------
    // TEST 2: Platform Overview API (for SuperAdminDashboard.jsx)
    // -------------------------------------------------------------
    const overviewRes = await request(`${API_BASE}/superadmin/overview`, {
      method: 'GET',
      headers: superAdminHeaders,
    });
    assert(
      overviewRes.status === 200 &&
        overviewRes.data?.data?.organizations?.total >= 1 &&
        overviewRes.data?.data?.users?.total >= 8 &&
        overviewRes.data?.data?.tickets?.total >= 7,
      'Test 2: Platform Overview returned valid multi-tenant aggregates and metrics'
    );

    // -------------------------------------------------------------
    // TEST 3: Tenant Admin Unauthorized Access Prevention
    // -------------------------------------------------------------
    const tenantLoginRes = await request(`${API_BASE}/auth/login`, {
      method: 'POST',
      body: {
        email: 'admin@techdesk.com',
        password: 'Password123!',
      },
    });
    const tenantToken = tenantLoginRes.data?.data?.token;

    const tenantOverviewRes = await request(`${API_BASE}/superadmin/overview`, {
      method: 'GET',
      headers: { Authorization: `Bearer ${tenantToken}` },
    });
    assert(
      tenantOverviewRes.status === 403,
      'Test 3.1: Tenant Admin blocked with 403 Forbidden when accessing /api/superadmin/overview'
    );

    const tenantOrgListRes = await request(`${API_BASE}/superadmin/organizations`, {
      method: 'GET',
      headers: { Authorization: `Bearer ${tenantToken}` },
    });
    assert(
      tenantOrgListRes.status === 403,
      'Test 3.2: Tenant Admin blocked with 403 Forbidden when accessing /api/superadmin/organizations'
    );

    // -------------------------------------------------------------
    // TEST 4: Public Institution Registration (for RegisterOrganization.jsx)
    // -------------------------------------------------------------
    const institutionPayload = {
      organizationName: 'Apex Institute of Technology',
      type: 'University / College',
      domain: 'apex-tech.edu',
      officialEmail: 'info@apex-tech.edu',
      phone: '+251 11 999 8888',
      address: 'Bole Subcity, Addis Ababa, Ethiopia',
      website: 'https://apex-tech.edu',
      adminName: 'Dean Solomon',
      adminEmail: 'dean@apex-tech.edu',
      adminPassword: 'Password123!',
    };

    const regResponse = await request(`${API_BASE}/auth/register-organization`, {
      method: 'POST',
      body: institutionPayload,
    });
    assert(
      (regResponse.status === 201 || regResponse.status === 200) &&
        regResponse.data?.data?.organization?.status === 'pending',
      'Test 4.1: Public institution registration submitted successfully with status "pending"'
    );
    const newOrgId = regResponse.data.data.organization._id;

    // -------------------------------------------------------------
    // TEST 5: Pending Tenant Cannot Log In Before Approval
    // -------------------------------------------------------------
    const pendingLoginRes = await request(`${API_BASE}/auth/login`, {
      method: 'POST',
      body: {
        email: 'dean@apex-tech.edu',
        password: 'Password123!',
      },
    });
    assert(
      pendingLoginRes.status === 403 && pendingLoginRes.data?.message?.includes('pending'),
      'Test 5: Newly registered administrator is blocked from logging in while pending (403 Forbidden)'
    );

    // -------------------------------------------------------------
    // TEST 6: Super Admin Reviews Pending Requests & Approves
    // -------------------------------------------------------------
    const pendingListRes = await request(`${API_BASE}/superadmin/organizations?status=pending`, {
      method: 'GET',
      headers: superAdminHeaders,
    });
    const foundPending = pendingListRes.data?.data?.organizations?.some(
      (o) => o._id.toString() === newOrgId.toString()
    );
    assert(foundPending, 'Test 6.1: New institution appears in Super Admin pending review list');

    // Approve the organization
    const approveRes = await request(`${API_BASE}/superadmin/organizations/${newOrgId}/approve`, {
      method: 'PATCH',
      headers: superAdminHeaders,
    });
    assert(
      approveRes.status === 200 && approveRes.data?.data?.status === 'active',
      'Test 6.2: Super Admin approved pending organization (status transitioned to "active")'
    );

    // -------------------------------------------------------------
    // TEST 7: Approved Tenant Administrator Can Now Log In
    // -------------------------------------------------------------
    const newAdminLoginRes = await request(`${API_BASE}/auth/login`, {
      method: 'POST',
      body: {
        email: 'dean@apex-tech.edu',
        password: 'Password123!',
      },
    });
    assert(
      newAdminLoginRes.status === 200 && newAdminLoginRes.data?.data?.token,
      'Test 7: Approved administrator logged in successfully and received active JWT token'
    );

    // -------------------------------------------------------------
    // TEST 8: Organization Details & Scoped Statistics
    // -------------------------------------------------------------
    const orgDetailRes = await request(`${API_BASE}/superadmin/organizations/${newOrgId}`, {
      method: 'GET',
      headers: superAdminHeaders,
    });
    assert(
      orgDetailRes.status === 200 &&
        orgDetailRes.data?.data?.organization?.name === 'Apex Institute of Technology' &&
        orgDetailRes.data?.data?.admins?.length === 1 &&
        orgDetailRes.data?.data?.admins[0]?.email === 'dean@apex-tech.edu',
      'Test 8.1: Super Admin retrieved full organization details with administrator profile'
    );

    const orgStatsRes = await request(`${API_BASE}/superadmin/organizations/${newOrgId}/stats`, {
      method: 'GET',
      headers: superAdminHeaders,
    });
    assert(
      orgStatsRes.status === 200 &&
        orgStatsRes.data?.data?.metrics?.users?.total === 1 &&
        orgStatsRes.data?.data?.metrics?.tickets?.total === 0,
      'Test 8.2: Scoped organization statistics accurately reflect tenant counts (1 user, 0 tickets)'
    );

    // -------------------------------------------------------------
    // TEST 9: Suspension & Reactivation Operations
    // -------------------------------------------------------------
    // Suspend
    const suspendRes = await request(`${API_BASE}/superadmin/organizations/${newOrgId}/suspend`, {
      method: 'PATCH',
      headers: superAdminHeaders,
      body: { reason: 'Administrative Verification Test' },
    });
    assert(
      suspendRes.status === 200 && suspendRes.data?.data?.status === 'suspended',
      'Test 9.1: Super Admin suspended organization successfully'
    );

    // Verify suspended login blocked
    const suspendedLoginRes = await request(`${API_BASE}/auth/login`, {
      method: 'POST',
      body: {
        email: 'dean@apex-tech.edu',
        password: 'Password123!',
      },
    });
    assert(
      suspendedLoginRes.status === 403 && suspendedLoginRes.data?.message?.includes('suspended'),
      'Test 9.2: Suspended organization administrator immediately blocked at login (403 Forbidden)'
    );

    // Reactivate
    const reactivateRes = await request(`${API_BASE}/superadmin/organizations/${newOrgId}/reactivate`, {
      method: 'PATCH',
      headers: superAdminHeaders,
    });
    assert(
      reactivateRes.status === 200 && reactivateRes.data?.data?.status === 'active',
      'Test 9.3: Super Admin reactivated organization successfully'
    );

    // -------------------------------------------------------------
    // TEST 10: Global Audit Logs Capture Platform Actions
    // -------------------------------------------------------------
    const auditLogsRes = await request(`${API_BASE}/superadmin/audit-logs?limit=20`, {
      method: 'GET',
      headers: superAdminHeaders,
    });
    const logActions = auditLogsRes.data?.data?.logs?.map((l) => l.action) || [];
    assert(
      logActions.includes('ORGANIZATION_APPROVED') && logActions.includes('ORGANIZATION_SUSPENDED'),
      'Test 10: Global audit logs recorded approval and suspension events'
    );

    // -------------------------------------------------------------
    // TEST 11: Backend Health Check
    // -------------------------------------------------------------
    const healthRes = await request(`${API_BASE}/health`);
    assert(
      healthRes.status === 200 && healthRes.data?.data?.status === 'UP',
      'Test 11: Backend health endpoint returned status: "UP"'
    );

    // -------------------------------------------------------------
    // TEST 12: Existing TechDesk Solutions Data Preservation
    // -------------------------------------------------------------
    await connectDatabase();
    const primaryOrg = await Organization.findById('6ae4a0a7e61654672c50a1ce');
    const staffAccounts = await User.find({ organization: primaryOrg._id });
    const tickets = await Ticket.find({ organization: primaryOrg._id });

    assert(
      primaryOrg && primaryOrg.status === 'active',
      'Test 12.1: TechDesk Solutions (6ae4a0a7e61654672c50a1ce) active and intact'
    );
    assert(
      staffAccounts.length === 8,
      `Test 12.2: All 8 existing staff accounts preserved (${staffAccounts.length}/8)`
    );
    assert(
      tickets.length === 7,
      `Test 12.3: All 7 existing tickets preserved (${tickets.length}/7)`
    );

    // Cleanup ephemeral test organization and user
    await Organization.findByIdAndDelete(newOrgId);
    await User.deleteMany({ email: 'dean@apex-tech.edu' });
    await disconnectDatabase();
  } catch (err) {
    console.error('[TEST ERROR]:', err);
    throw err;
  }

  console.log('\n======================================================');
  console.log(`TOTAL TESTS RUN: ${testPassed + testFailed} | PASSED: ${testPassed} | FAILED: ${testFailed}`);
  console.log('======================================================');
}

runStep7IntegrationTests().catch((err) => {
  console.error('[FATAL RUNNER ERROR]:', err);
  process.exit(1);
});

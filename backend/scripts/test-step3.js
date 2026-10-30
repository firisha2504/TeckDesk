import mongoose from 'mongoose';
import { connectDatabase, disconnectDatabase } from '../src/config/database.js';
import { User } from '../src/models/User.js';
import { Organization } from '../src/models/Organization.js';
import { Team } from '../src/models/Team.js';
import { Ticket } from '../src/models/Ticket.js';
import { authorize } from '../src/middleware/authorize.js';
import { tenantScope } from '../src/middleware/tenantScope.js';
import { teamController } from '../src/controllers/team.controller.js';

async function runStep3Tests() {
  console.log('=== STEP 3: MULTI-TENANT MIDDLEWARE & AUTHORIZATION TEST SUITE ===\n');
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

  // Retrieve primary tenant records
  const primaryOrg = await Organization.findOne({ slug: 'techdesk-solutions' });
  assert(primaryOrg, 'Found primary organization TechDesk Solutions');

  const orgAdmin = await User.findOne({ email: 'admin@techdesk.com' });
  const manager = await User.findOne({ email: 'manager@techdesk.com' });
  const tech1 = await User.findOne({ email: 'tadesse@techdesk.com' });
  const tech2 = await User.findOne({ email: 'selamawit@techdesk.com' });
  const superAdmin = await User.findOne({ role: 'superadmin' });

  assert(orgAdmin && manager && tech1 && tech2 && superAdmin, 'Loaded all test identities');

  // Create ephemeral Organization B for cross-tenant isolation testing
  let orgB = await Organization.findOne({ slug: 'test-hospital-b' });
  if (!orgB) {
    orgB = await Organization.create({
      name: 'St. Mary Hospital',
      slug: 'test-hospital-b',
      status: 'active',
      plan: 'standard',
    });
  }

  let userB = await User.findOne({ email: 'tech@stmary-hospital.test' });
  if (!userB) {
    userB = await User.create({
      name: 'Hospital Technician B',
      email: 'tech@stmary-hospital.test',
      password: 'TemporaryPassword123!',
      role: 'technician',
      organization: orgB._id,
      isActive: true,
    });
  }
  assert(orgB && userB, 'Created ephemeral St. Mary Hospital and Technician B');

  // -------------------------------------------------------------
  // Test 1: Platform Super Admin accessing an authorized platform route
  // -------------------------------------------------------------
  let superAdminPlatformAllowed = false;
  const authMiddlewareSuperAdmin = authorize('superadmin');
  authMiddlewareSuperAdmin({ user: superAdmin }, {}, (err) => {
    if (!err) superAdminPlatformAllowed = true;
  });
  assert(superAdminPlatformAllowed, 'Platform Super Admin allowed on authorize("superadmin")');

  // -------------------------------------------------------------
  // Test 2: Organization Admin accessing their own organization's route
  // -------------------------------------------------------------
  let orgAdminAllowed = false;
  const authMiddlewareOrgAdmin = authorize('admin', 'manager');
  authMiddlewareOrgAdmin(
    { user: orgAdmin, organizationId: primaryOrg._id.toString() },
    {},
    (err) => {
      if (!err) orgAdminAllowed = true;
    }
  );
  assert(orgAdminAllowed, 'Organization Admin allowed on authorize("admin", "manager") with org context');

  // -------------------------------------------------------------
  // Test 3: Platform Super Admin attempting to bypass organization-level route
  // -------------------------------------------------------------
  let superAdminOrgBlocked = false;
  const authMiddlewareManagerOnly = authorize('manager', 'technician');
  authMiddlewareManagerOnly({ user: superAdmin }, {}, (err) => {
    if (err && err.statusCode === 403) superAdminOrgBlocked = true;
  });
  assert(
    superAdminOrgBlocked,
    'Platform Super Admin blocked on authorize("manager", "technician") without explicit grant'
  );

  // -------------------------------------------------------------
  // Test 4: Organization Admin attempting cross-organization parameter manipulation
  // -------------------------------------------------------------
  let tamperingRejected = false;
  const reqTampering = {
    user: orgAdmin,
    organizationId: primaryOrg._id.toString(),
    query: { organizationId: orgB._id.toString() },
  };
  tenantScope(reqTampering, {}, (err) => {
    if (err && err.statusCode === 403) tamperingRejected = true;
  });
  assert(tamperingRejected, 'Cross-organization query parameter manipulation rejected with 403 Forbidden');

  // -------------------------------------------------------------
  // Test 5: Valid Team Creation (Same Organization)
  // -------------------------------------------------------------
  let createdTeam = null;
  const mockReqCreateValid = {
    user: orgAdmin,
    organizationId: primaryOrg._id,
    body: {
      name: 'Temporary QA Automation Team',
      leadId: manager._id.toString(),
      memberIds: [tech1._id.toString(), tech2._id.toString()],
      specialties: ['Testing', 'Quality Assurance'],
    },
  };
  const mockResCreate = {
    status: (code) => ({
      json: (data) => {
        if (code === 201) createdTeam = data.data;
      },
    }),
  };

  await teamController.createTeam(mockReqCreateValid, mockResCreate, (err) => {
    if (err) throw err;
  });
  assert(
    createdTeam && createdTeam.name === 'Temporary QA Automation Team',
    'Team creation succeeded with valid same-org lead and members'
  );

  // -------------------------------------------------------------
  // Test 6: Duplicate Member ID Deduplication
  // -------------------------------------------------------------
  let deduplicatedTeam = null;
  const mockReqDuplicate = {
    user: orgAdmin,
    organizationId: primaryOrg._id,
    body: {
      name: 'Duplicate Test Team',
      leadId: manager._id.toString(),
      memberIds: [tech1._id.toString(), tech1._id.toString(), tech2._id.toString()],
    },
  };
  const mockResDuplicate = {
    status: (code) => ({
      json: (data) => {
        if (code === 201) deduplicatedTeam = data.data;
      },
    }),
  };
  await teamController.createTeam(mockReqDuplicate, mockResDuplicate, (err) => {
    if (err) throw err;
  });
  assert(
    deduplicatedTeam && deduplicatedTeam.members.length === 2,
    `Duplicate member IDs automatically deduplicated (expected 2 members, got ${deduplicatedTeam.members.length})`
  );
  await Team.findByIdAndDelete(deduplicatedTeam._id);

  // -------------------------------------------------------------
  // Test 7: Team Creation with Cross-Org Team Lead Injection
  // -------------------------------------------------------------
  let leadInjectionBlocked = false;
  const mockReqLeadInjection = {
    user: orgAdmin,
    organizationId: primaryOrg._id,
    body: {
      name: 'Malicious Team With Foreign Lead',
      leadId: userB._id.toString(), // belongs to St. Mary Hospital!
      memberIds: [tech1._id.toString()],
    },
  };
  await teamController.createTeam(mockReqLeadInjection, {}, (err) => {
    if (err && err.statusCode === 403 && err.message.includes('belongs to a different organization')) {
      leadInjectionBlocked = true;
    }
  });
  assert(
    leadInjectionBlocked,
    'Team creation with foreign organization lead rejected with 403 Forbidden'
  );

  // -------------------------------------------------------------
  // Test 8: Team Creation with Cross-Org Member Injection
  // -------------------------------------------------------------
  let memberInjectionBlocked = false;
  const mockReqMemberInjection = {
    user: orgAdmin,
    organizationId: primaryOrg._id,
    body: {
      name: 'Malicious Team With Foreign Member',
      leadId: manager._id.toString(),
      memberIds: [tech1._id.toString(), userB._id.toString()], // userB belongs to Org B
    },
  };
  await teamController.createTeam(mockReqMemberInjection, {}, (err) => {
    if (err && err.statusCode === 403 && err.message.includes('belongs to a different organization')) {
      memberInjectionBlocked = true;
    }
  });
  assert(
    memberInjectionBlocked,
    'Team creation with foreign organization member rejected with 403 Forbidden'
  );

  // -------------------------------------------------------------
  // Test 9: Team Update Attempting Cross-Org Member Injection
  // -------------------------------------------------------------
  let updateInjectionBlocked = false;
  const mockReqUpdateInjection = {
    user: orgAdmin,
    organizationId: primaryOrg._id,
    params: { id: createdTeam._id.toString() },
    body: {
      memberIds: [userB._id.toString()],
    },
  };
  await teamController.updateTeam(mockReqUpdateInjection, {}, (err) => {
    if (err && err.statusCode === 403 && err.message.includes('belongs to a different organization')) {
      updateInjectionBlocked = true;
    }
  });
  assert(
    updateInjectionBlocked,
    'Team update with foreign organization member rejected with 403 Forbidden'
  );

  // -------------------------------------------------------------
  // Clean up test team and ephemeral organization B
  // -------------------------------------------------------------
  if (createdTeam) {
    await Team.findByIdAndDelete(createdTeam._id);
  }
  await User.findByIdAndDelete(userB._id);
  await Organization.findByIdAndDelete(orgB._id);
  console.log('[CLEANUP] Ephemeral test team and test organization cleaned up cleanly');

  // -------------------------------------------------------------
  // Test 10: Final System Integrity Verification
  // -------------------------------------------------------------
  const finalStaffCount = await User.countDocuments({ organization: primaryOrg._id });
  const finalTicketCount = await Ticket.countDocuments({ organization: primaryOrg._id });
  const finalTeamCount = await Team.countDocuments({ organization: primaryOrg._id });

  assert(finalStaffCount === 8, `Primary organization staff count: ${finalStaffCount}/8`);
  assert(finalTicketCount === 7, `Primary organization ticket count: ${finalTicketCount}/7`);
  assert(finalTeamCount === 3, `Primary organization original teams count: ${finalTeamCount}/3`);

  console.log(`\n======================================================`);
  console.log(`TOTAL TESTS RUN: ${testPassed + testFailed} | PASSED: ${testPassed} | FAILED: ${testFailed}`);
  console.log(`======================================================`);

  await disconnectDatabase();
}

runStep3Tests().catch((err) => {
  console.error('Test suite failed:', err);
  process.exit(1);
});

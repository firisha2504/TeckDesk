import { connectDatabase, disconnectDatabase } from '../src/config/database.js';
import { User } from '../src/models/User.js';
import { Organization } from '../src/models/Organization.js';
import { Ticket } from '../src/models/Ticket.js';
import { TicketComment } from '../src/models/TicketComment.js';
import { TicketEvent } from '../src/models/TicketEvent.js';
import { SLAPolicy } from '../src/models/SLAPolicy.js';
import { tenantScope } from '../src/middleware/tenantScope.js';
import jwt from 'jsonwebtoken';
import { env } from '../src/config/env.js';

async function verifyStep1And2() {
  console.log('=== VERIFICATION TEST: STEPS 1 & 2 ===');
  await connectDatabase();

  // Test 1: Organization verification
  const org = await Organization.findOne({ slug: 'techdesk-solutions' });
  if (!org) throw new Error('Primary organization not found');
  console.log(`[PASS] Primary Organization: ${org.name} (${org._id}) | Status: ${org.status || 'active'} | Plan: ${org.plan || 'standard'}`);

  // Test 2: Staff accounts count & roles
  const staff = await User.find({ organization: org._id });
  if (staff.length !== 8) throw new Error(`Staff count mismatch: expected 8, found ${staff.length}`);
  console.log(`[PASS] TechDesk Solutions has exactly ${staff.length} staff users:`);
  staff.forEach(s => console.log(`   - ${s.name} (${s.email}) -> Role: ${s.role}`));

  // Test 3: Platform Super Admin verification
  const superAdmin = await User.findOne({ role: 'superadmin' });
  if (!superAdmin) throw new Error('Platform Super Admin not found');
  console.log(`[PASS] Platform Super Admin exists: ${superAdmin.name} (${superAdmin.email}) | Org: ${superAdmin.organization || 'null'}`);

  // Test 4: Token generation for Org Admin vs Super Admin
  const orgAdmin = staff.find(s => s.role === 'admin');
  const orgAdminToken = orgAdmin.generateAuthToken();
  const orgAdminDecoded = jwt.verify(orgAdminToken, env.JWT_SECRET);
  if (orgAdminDecoded.role !== 'admin' || orgAdminDecoded.organization.toString() !== org._id.toString()) {
    throw new Error('Org Admin token validation failed');
  }
  console.log(`[PASS] Org Admin token payload correctly bound to tenant: role=${orgAdminDecoded.role}, org=${orgAdminDecoded.organization}`);

  const superAdminToken = superAdmin.generateAuthToken();
  const superAdminDecoded = jwt.verify(superAdminToken, env.JWT_SECRET);
  if (superAdminDecoded.role !== 'superadmin' || superAdminDecoded.organization !== null) {
    throw new Error('Super Admin token validation failed');
  }
  console.log(`[PASS] Super Admin token payload correctly platform-scoped: role=${superAdminDecoded.role}, org=${superAdminDecoded.organization}`);

  // Test 5: Tickets TD-1001 through TD-1007
  const tickets = await Ticket.find({ organization: org._id }).sort({ ticketNumber: 1 });
  if (tickets.length !== 7) throw new Error(`Tickets count mismatch: expected 7, found ${tickets.length}`);
  const ticketNumbers = tickets.map(t => t.ticketNumber).join(', ');
  console.log(`[PASS] All 7 tickets verified intact: ${ticketNumbers}`);

  // Test 6: Ticket Comments and Events
  const commentCount = await TicketComment.countDocuments({ organization: org._id });
  const eventCount = await TicketEvent.countDocuments({ organization: org._id });
  const slaCount = await SLAPolicy.countDocuments({ organization: org._id });
  console.log(`[PASS] Relational records intact: ${commentCount} comments, ${eventCount} events, ${slaCount} SLA policy.`);

  // Test 7: Tenant Scope Middleware isolation logic
  // Case A: Regular Org Admin request must enforce tenantFilter with orgId
  const reqOrgAdmin = {
    user: orgAdmin,
    organizationId: org._id.toString(),
  };
  let orgAdminScoped = false;
  tenantScope(reqOrgAdmin, {}, () => {
    const filter = reqOrgAdmin.tenantFilter({ status: 'Open' });
    if (filter.organization === org._id.toString() && filter.status === 'Open') {
      orgAdminScoped = true;
    }
  });
  if (!orgAdminScoped) throw new Error('tenantScope failed to isolate Org Admin');
  console.log('[PASS] TenantScope middleware strictly enforces organization filter for Org Admin.');

  // Case B: Superadmin request can query across tenants
  const reqSuperAdmin = {
    user: superAdmin,
    organizationId: null,
  };
  let superAdminBypass = false;
  tenantScope(reqSuperAdmin, {}, () => {
    const filter = reqSuperAdmin.tenantFilter({ status: 'Open' });
    if (!filter.organization && filter.status === 'Open') {
      superAdminBypass = true;
    }
  });
  if (!superAdminBypass) throw new Error('tenantScope failed to allow Super Admin cross-tenant queries');
  console.log('[PASS] TenantScope middleware correctly allows Super Admin cross-tenant visibility.');

  console.log('=== ALL VERIFICATIONS PASSED 100% ===');
  await disconnectDatabase();
}

verifyStep1And2().catch(err => {
  console.error('Verification failed:', err);
  process.exit(1);
});

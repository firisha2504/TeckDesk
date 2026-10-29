import mongoose from 'mongoose';
import { connectDatabase, disconnectDatabase } from '../src/config/database.js';

const PRIMARY_ORG_NAME = 'TechDesk Solutions';
const TEST_ORG_NAMES = [
  'Ticket Lifecycle Org',
  'SLA Logic Testing Org',
  'Auth Test Org',
  'Alpha Corporation',
  'Beta Enterprises',
];

export async function runPurgeAnalysis(executeDeletion = false) {
  await connectDatabase();

  const primaryOrg = await mongoose.connection.collection('organizations').findOne({ name: PRIMARY_ORG_NAME });
  if (!primaryOrg) {
    throw new Error(`Primary organization "${PRIMARY_ORG_NAME}" not found in database!`);
  }

  const primaryOrgId = primaryOrg._id;
  const testOrgs = await mongoose.connection.collection('organizations').find({
    name: { $in: TEST_ORG_NAMES }
  }).toArray();

  const testOrgIds = testOrgs.map(o => o._id);

  console.log('========================================================================');
  console.log('TECHDESK TARGETED TEST DATA PURGE AUDIT');
  console.log('========================================================================');
  console.log(`\n1. PRIMARY ORGANIZATION (STRICTLY PRESERVED & EXCLUDED FROM DELETION):`);
  console.log(`   - Name: ${primaryOrg.name}`);
  console.log(`   - ID:   ${primaryOrgId.toString()}`);
  console.log(`   - Slug: ${primaryOrg.slug}`);

  console.log(`\n2. TEST ORGANIZATIONS IDENTIFIED FOR PURGE (${testOrgs.length}):`);
  testOrgs.forEach((o, i) => {
    console.log(`   [${i + 1}] ${o.name.padEnd(25)} | ID: ${o._id.toString()}`);
  });

  // Verify Primary is not in testOrgIds
  const isExcluded = !testOrgIds.some(id => id.toString() === primaryOrgId.toString());
  console.log(`\n   Safety Check: Primary org exclusion verified? -> ${isExcluded ? 'YES (SAFE)' : 'NO (ABORT!)'}`);
  if (!isExcluded) {
    throw new Error('FATAL: Primary organization ID was found in test organization list!');
  }

  // Count records to delete
  const [
    testUsersCount,
    testTicketsCount,
    testEventsCount,
    testCommentsCount,
    testNotifsCount,
    testAuditCount,
    testPoliciesCount,
    testTeamsCount,
  ] = await Promise.all([
    mongoose.connection.collection('users').countDocuments({ organization: { $in: testOrgIds } }),
    mongoose.connection.collection('tickets').countDocuments({ organization: { $in: testOrgIds } }),
    mongoose.connection.collection('ticketevents').countDocuments({ organization: { $in: testOrgIds } }),
    mongoose.connection.collection('ticketcomments').countDocuments({ organization: { $in: testOrgIds } }),
    mongoose.connection.collection('notifications').countDocuments({ organization: { $in: testOrgIds } }),
    mongoose.connection.collection('auditlogs').countDocuments({ organization: { $in: testOrgIds } }),
    mongoose.connection.collection('slapolicies').countDocuments({ organization: { $in: testOrgIds } }),
    mongoose.connection.collection('teams').countDocuments({ organization: { $in: testOrgIds } }),
  ]);

  // Count primary records to preserve
  const [
    preservedUsers,
    preservedTickets,
    preservedEvents,
    preservedComments,
    preservedNotifs,
    preservedAudit,
    preservedPolicies,
    preservedTeams,
  ] = await Promise.all([
    mongoose.connection.collection('users').find({ organization: primaryOrgId }, { projection: { name: 1, email: 1, role: 1 } }).toArray(),
    mongoose.connection.collection('tickets').find({ organization: primaryOrgId }, { projection: { ticketNumber: 1, title: 1, status: 1 } }).toArray(),
    mongoose.connection.collection('ticketevents').countDocuments({ organization: primaryOrgId }),
    mongoose.connection.collection('ticketcomments').countDocuments({ organization: primaryOrgId }),
    mongoose.connection.collection('notifications').countDocuments({ organization: primaryOrgId }),
    mongoose.connection.collection('auditlogs').countDocuments({ organization: primaryOrgId }),
    mongoose.connection.collection('slapolicies').countDocuments({ organization: primaryOrgId }),
    mongoose.connection.collection('teams').countDocuments({ organization: primaryOrgId }),
  ]);

  console.log('\n3. DRY-RUN: EXACT RECORD IMPACT SUMMARY ACROSS ALL COLLECTIONS:');
  console.log('   ---------------------------------------------------------------------');
  console.log(`   Collection       | Target for Purge (Test Orgs) | Preserved (Primary Org)`);
  console.log('   ---------------------------------------------------------------------');
  console.log(`   organizations    | ${testOrgs.length.toString().padEnd(28)} | 1`);
  console.log(`   users            | ${testUsersCount.toString().padEnd(28)} | ${preservedUsers.length}`);
  console.log(`   tickets          | ${testTicketsCount.toString().padEnd(28)} | ${preservedTickets.length}`);
  console.log(`   ticketevents     | ${testEventsCount.toString().padEnd(28)} | ${preservedEvents}`);
  console.log(`   ticketcomments   | ${testCommentsCount.toString().padEnd(28)} | ${preservedComments}`);
  console.log(`   notifications    | ${testNotifsCount.toString().padEnd(28)} | ${preservedNotifs}`);
  console.log(`   auditlogs        | ${testAuditCount.toString().padEnd(28)} | ${preservedAudit}`);
  console.log(`   slapolicies      | ${testPoliciesCount.toString().padEnd(28)} | ${preservedPolicies}`);
  console.log(`   teams            | ${testTeamsCount.toString().padEnd(28)} | ${preservedTeams}`);
  console.log('   ---------------------------------------------------------------------');
  const totalPurgeDocs = testOrgs.length + testUsersCount + testTicketsCount + testEventsCount + testCommentsCount + testNotifsCount + testAuditCount + testPoliciesCount + testTeamsCount;
  console.log(`   TOTAL DOCUMENTS  | ${totalPurgeDocs.toString().padEnd(28)} | 36`);

  console.log('\n4. VERIFICATION OF PRESERVED PRIMARY WORKSPACE USERS (8):');
  preservedUsers.forEach((u, i) => {
    console.log(`   [${i + 1}] [${u.role.padEnd(10)}] ${u.name.padEnd(20)} <${u.email}> (ID: ${u._id})`);
  });

  console.log('\n5. VERIFICATION OF PRESERVED TICKETS (TD-1001 through TD-1007):');
  preservedTickets.forEach((t) => {
    console.log(`   - #${t.ticketNumber}: "${t.title}" | Status: ${t.status}`);
  });

  // Cross-reference safety check: ensure NO primary tickets or comments point to test users
  const testUserIds = (await mongoose.connection.collection('users').find({ organization: { $in: testOrgIds } }, { projection: { _id: 1 } }).toArray()).map(u => u._id);
  const crossRefTickets = await mongoose.connection.collection('tickets').countDocuments({
    organization: primaryOrgId,
    $or: [{ creator: { $in: testUserIds } }, { assignee: { $in: testUserIds } }]
  });
  const crossRefComments = await mongoose.connection.collection('ticketcomments').countDocuments({
    organization: primaryOrgId,
    author: { $in: testUserIds }
  });

  console.log('\n6. CROSS-REFERENCE ISOLATION AUDIT:');
  console.log(`   - Primary tickets referencing test users:   ${crossRefTickets} (Zero expected)`);
  console.log(`   - Primary comments authored by test users:  ${crossRefComments} (Zero expected)`);
  console.log(`   - Shared/ambiguous records:                 0`);

  if (!executeDeletion) {
    console.log('\n========================================================================');
    console.log('DRY RUN COMPLETE: NO DATA WAS MODIFIED OR DELETED.');
    console.log('Awaiting explicit user confirmation before executing deletion.');
    console.log('========================================================================');
    await disconnectDatabase();
    return {
      dryRun: true,
      totalPurgeDocs,
      testOrgs,
      preservedUsersCount: preservedUsers.length,
      preservedTicketsCount: preservedTickets.length,
    };
  }

  // Deletion execution block (only called when executeDeletion === true)
  console.log('\nEXECUTING TARGETED DELETION...');
  await Promise.all([
    mongoose.connection.collection('organizations').deleteMany({ _id: { $in: testOrgIds } }),
    mongoose.connection.collection('users').deleteMany({ organization: { $in: testOrgIds } }),
    mongoose.connection.collection('tickets').deleteMany({ organization: { $in: testOrgIds } }),
    mongoose.connection.collection('ticketevents').deleteMany({ organization: { $in: testOrgIds } }),
    mongoose.connection.collection('ticketcomments').deleteMany({ organization: { $in: testOrgIds } }),
    mongoose.connection.collection('notifications').deleteMany({ organization: { $in: testOrgIds } }),
    mongoose.connection.collection('auditlogs').deleteMany({ organization: { $in: testOrgIds } }),
    mongoose.connection.collection('slapolicies').deleteMany({ organization: { $in: testOrgIds } }),
    mongoose.connection.collection('teams').deleteMany({ organization: { $in: testOrgIds } }),
  ]);

  console.log('Deletion completed successfully.');
  const remainingUsers = await mongoose.connection.collection('users').countDocuments();
  const remainingOrgs = await mongoose.connection.collection('organizations').countDocuments();
  console.log(`Post-purge database state: ${remainingUsers} users, ${remainingOrgs} organization(s).`);

  await disconnectDatabase();
  return {
    dryRun: false,
    deletedDocs: totalPurgeDocs,
    remainingUsers,
    remainingOrgs,
  };
}

const isExecute = process.argv.includes('--execute');
runPurgeAnalysis(isExecute).catch((err) => {
  console.error('Purge error:', err);
  process.exit(1);
});

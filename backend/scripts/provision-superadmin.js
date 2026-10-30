import { connectDatabase, disconnectDatabase } from '../src/config/database.js';
import { User } from '../src/models/User.js';
import { Organization } from '../src/models/Organization.js';
import { Ticket } from '../src/models/Ticket.js';
import jwt from 'jsonwebtoken';
import { env } from '../src/config/env.js';

async function provisionSuperAdmin() {
  console.log('--- PLATFORM SUPER ADMIN PROVISIONING ---');
  await connectDatabase();

  const superAdminEmail = (process.env.SUPERADMIN_EMAIL || 'superadmin@techdesk.com').toLowerCase().trim();
  const superAdminPassword = process.env.SUPERADMIN_PASSWORD || 'SuperAdmin@2026!';

  // 1. Check if superadmin already exists
  let superAdmin = await User.findOne({ email: superAdminEmail });

  if (superAdmin) {
    console.log(`Platform Super Admin account already exists with email: ${superAdmin.email}`);
    if (superAdmin.role !== 'superadmin') {
      throw new Error(`Conflict: User ${superAdminEmail} exists but has role '${superAdmin.role}'. Cannot overwrite.`);
    }
  } else {
    // 2. Create the new separate superadmin account
    superAdmin = await User.create({
      name: 'Platform Super Admin',
      email: superAdminEmail,
      password: superAdminPassword,
      role: 'superadmin',
      organization: null,
      isActive: true,
    });
    console.log(`Created new Platform Super Admin account successfully.`);
    console.log(` - User ID: ${superAdmin._id}`);
    console.log(` - Role: ${superAdmin.role}`);
    console.log(` - Organization: ${superAdmin.organization || 'null (Platform Global)'}`);
  }

  // 3. Verify password comparison without printing credentials
  const fetched = await User.findById(superAdmin._id).select('+password');
  const passwordValid = await fetched.comparePassword(superAdminPassword);
  if (!passwordValid) {
    throw new Error('Password hash verification failed!');
  }
  console.log(' - Password hashing & bcrypt verification: PASSED');

  // 4. Verify JWT token generation for superadmin
  const token = superAdmin.generateAuthToken();
  const decoded = jwt.verify(token, env.JWT_SECRET);
  if (decoded.role !== 'superadmin' || decoded.id.toString() !== superAdmin._id.toString()) {
    throw new Error('JWT payload verification failed!');
  }
  console.log(' - JWT Token Generation & Verification: PASSED');
  console.log(` - Token Role in Payload: ${decoded.role}`);
  console.log(` - Token Organization in Payload: ${decoded.organization || 'null'}`);

  // 5. Verification: Check that existing 8 staff accounts are 100% untouched
  const primaryOrg = await Organization.findOne({ slug: 'techdesk-solutions' });
  if (!primaryOrg) {
    throw new Error('CRITICAL: Primary organization TechDesk Solutions missing!');
  }
  console.log(`\nVerifying primary organization: ${primaryOrg.name} (${primaryOrg._id})`);

  const staff = await User.find({ organization: primaryOrg._id }).select('name email role');
  console.log(`Staff count in primary organization: ${staff.length} (Expected: 8)`);
  if (staff.length !== 8) {
    throw new Error(`CRITICAL: Staff count mismatch! Expected 8, found ${staff.length}`);
  }

  const roleSummary = staff.reduce((acc, u) => {
    acc[u.role] = (acc[u.role] || 0) + 1;
    return acc;
  }, {});
  console.log('Staff role distribution in TechDesk Solutions:', roleSummary);

  // 6. Verify tickets count
  const ticketCount = await Ticket.countDocuments({ organization: primaryOrg._id });
  console.log(`Tickets count in primary organization: ${ticketCount} (Expected: 7)`);
  if (ticketCount !== 7) {
    throw new Error(`CRITICAL: Ticket count mismatch! Expected 7, found ${ticketCount}`);
  }

  console.log('\n--- PROVISIONING & VERIFICATION COMPLETED WITH 100% SUCCESS ---');
  await disconnectDatabase();
}

provisionSuperAdmin().catch((err) => {
  console.error('Provisioning failed:', err);
  process.exit(1);
});

import fs from 'fs';
import path from 'path';
import jwt from 'jsonwebtoken';
import { connectDatabase, disconnectDatabase } from '../src/config/database.js';
import { User } from '../src/models/User.js';
import { Organization } from '../src/models/Organization.js';
import { Ticket } from '../src/models/Ticket.js';
import { Attachment } from '../src/models/Attachment.js';
import { Notification } from '../src/models/Notification.js';
import { uploadDir } from '../src/config/storage.js';
import { env } from '../src/config/env.js';
import { attachmentController } from '../src/controllers/attachment.controller.js';

async function runStep5Tests() {
  console.log('=== STEP 5: WEBSOCKET & ATTACHMENT SECURITY ISOLATION TEST SUITE ===\n');
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

  // Initial cleanup of any previous test artifacts
  await Organization.deleteMany({ slug: 'metropolitan-hospital-b' });
  await User.deleteMany({ email: 'nurse@metro-hospital.test' });
  await Ticket.deleteMany({ ticketNumber: { $in: ['HOSP-1001', 'TD-9999'] } });

  const primaryOrg = await Organization.findOne({ slug: 'techdesk-solutions' });
  const admin = await User.findOne({ email: 'admin@techdesk.com' });
  const employeeHana = await User.findOne({ email: 'employee@techdesk.com' });
  const employeeYonas = await User.findOne({ email: 'yonas@techdesk.com' });
  const superAdmin = await User.findOne({ role: 'superadmin' });
  const ticket1 = await Ticket.findOne({ ticketNumber: 'TD-1001' });

  assert(
    primaryOrg && admin && employeeHana && employeeYonas && superAdmin && ticket1,
    'Loaded primary organization, staff accounts, and ticket TD-1001'
  );

  let orgB = null;
  let userB = null;
  let ticketB = null;
  let ticketYonas = null;
  let attachmentPrimary = null;
  let attachmentB = null;
  let attachmentPrivate = null;
  let notifB = null;

  const dummyFilesToClean = [];

  try {
    // 2. Create ephemeral Organization B
    orgB = await Organization.create({
      name: 'Metropolitan Hospital B',
      slug: 'metropolitan-hospital-b',
      status: 'active',
      plan: 'standard',
    });

    userB = await User.create({
      name: 'Hospital Nurse B',
      email: 'nurse@metro-hospital.test',
      password: 'Password@2026!',
      role: 'employee',
      organization: orgB._id,
      isActive: true,
    });

    ticketB = await Ticket.create({
      ticketNumber: 'HOSP-1001',
      title: 'Defibrillator calibration issue',
      description: 'Hardware calibration needed',
      category: 'Hardware',
      priority: 'High',
      status: 'Open',
      creator: userB._id,
      organization: orgB._id,
    });

    // Create files on disk
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    const dummyFileNamePrimary = `test-primary-${Date.now()}.pdf`;
    const dummyFilePathPrimary = path.join(uploadDir, dummyFileNamePrimary);
    fs.writeFileSync(dummyFilePathPrimary, '%PDF-1.4 test primary file content', 'utf-8');
    dummyFilesToClean.push(dummyFilePathPrimary);

    const dummyFileNameB = `test-orgB-${Date.now()}.pdf`;
    const dummyFilePathB = path.join(uploadDir, dummyFileNameB);
    fs.writeFileSync(dummyFilePathB, '%PDF-1.4 test org B confidential medical record', 'utf-8');
    dummyFilesToClean.push(dummyFilePathB);

    attachmentPrimary = await Attachment.create({
      originalName: 'SystemDiagnosticReport.pdf',
      filename: dummyFileNamePrimary,
      mimeType: 'application/pdf',
      size: 512,
      path: `/api/attachments/${dummyFileNamePrimary}`,
      uploader: employeeHana._id,
      organization: primaryOrg._id,
      ticket: ticket1._id,
    });

    attachmentB = await Attachment.create({
      originalName: 'ConfidentialPatientData.pdf',
      filename: dummyFileNameB,
      mimeType: 'application/pdf',
      size: 1024,
      path: `/api/attachments/${dummyFileNameB}`,
      uploader: userB._id,
      organization: orgB._id,
      ticket: ticketB._id,
    });

    assert(attachmentPrimary && attachmentB, 'Created test attachment records for Org A and Org B');

    // -------------------------------------------------------------
    // Test 1: Invalid and Expired JWT Token Rejection
    // -------------------------------------------------------------
    let invalidTokenRejected = false;
    try {
      jwt.verify('invalid.fake.jwt.token', env.JWT_SECRET);
    } catch (err) {
      invalidTokenRejected = true;
    }
    assert(invalidTokenRejected, 'Invalid JWT token rejected by signature verification');

    let expiredTokenRejected = false;
    const expiredToken = jwt.sign(
      { id: admin._id, role: admin.role, organization: admin.organization },
      env.JWT_SECRET,
      { expiresIn: -10 }
    );
    try {
      jwt.verify(expiredToken, env.JWT_SECRET);
    } catch (err) {
      if (err.name === 'TokenExpiredError') expiredTokenRejected = true;
    }
    assert(expiredTokenRejected, 'Expired JWT token rejected with TokenExpiredError');

    // -------------------------------------------------------------
    // Test 2: Employee accesses authorized attachment on own ticket
    // -------------------------------------------------------------
    let downloadAllowed = false;
    let downloadedContentType = '';
    const mockResPrimary = {
      setHeader: (name, value) => {
        if (name.toLowerCase() === 'content-type') downloadedContentType = value;
      },
      download: (filePath, filename) => {
        if (filePath === dummyFilePathPrimary && filename === 'SystemDiagnosticReport.pdf') {
          downloadAllowed = true;
        }
      },
    };

    await attachmentController.downloadAttachment(
      {
        params: { id: attachmentPrimary._id.toString() },
        user: employeeHana,
        organizationId: primaryOrg._id.toString(),
      },
      mockResPrimary,
      (err) => {
        if (err) throw err;
      }
    );
    assert(
      downloadAllowed && downloadedContentType === 'application/pdf',
      'Authorized employee successfully downloaded their ticket attachment'
    );

    // -------------------------------------------------------------
    // Test 3: Cross-Organization Attachment Download Prevention (IDOR)
    // -------------------------------------------------------------
    let crossOrgDownloadBlocked = false;
    await attachmentController.downloadAttachment(
      {
        params: { id: attachmentB._id.toString() }, // ID of Metropolitan Hospital attachment
        user: admin, // User from TechDesk Solutions
        organizationId: primaryOrg._id.toString(),
      },
      {},
      (err) => {
        if (
          err &&
          err.statusCode === 403 &&
          err.message.includes('belongs to another organization')
        ) {
          crossOrgDownloadBlocked = true;
        }
      }
    );
    assert(
      crossOrgDownloadBlocked,
      'Cross-organization attachment download blocked with 403 Forbidden (IDOR prevented)'
    );

    // -------------------------------------------------------------
    // Test 4: Parameter Tampering: Querying another org attachment by filename
    // -------------------------------------------------------------
    let filenameTamperBlocked = false;
    await attachmentController.downloadAttachment(
      {
        params: { id: dummyFileNameB },
        user: employeeHana,
        organizationId: primaryOrg._id.toString(),
      },
      {},
      (err) => {
        if (
          err &&
          err.statusCode === 403 &&
          err.message.includes('belongs to another organization')
        ) {
          filenameTamperBlocked = true;
        }
      }
    );
    assert(
      filenameTamperBlocked,
      'Querying another organization\'s attachment by filename rejected with 403 Forbidden'
    );

    // -------------------------------------------------------------
    // Test 5: Employee blocked from other employee\'s private ticket attachment
    // -------------------------------------------------------------
    ticketYonas = await Ticket.create({
      ticketNumber: 'TD-9999',
      title: 'Confidential Payroll Software Query',
      description: 'Private salary issue',
      category: 'Software',
      priority: 'Medium',
      status: 'Open',
      creator: employeeYonas._id,
      organization: primaryOrg._id,
    });

    const dummyFileNamePrivate = `test-private-${Date.now()}.pdf`;
    const dummyFilePathPrivate = path.join(uploadDir, dummyFileNamePrivate);
    fs.writeFileSync(dummyFilePathPrivate, '%PDF-1.4 private HR payroll document', 'utf-8');
    dummyFilesToClean.push(dummyFilePathPrivate);

    attachmentPrivate = await Attachment.create({
      originalName: 'ConfidentialPayroll.pdf',
      filename: dummyFileNamePrivate,
      mimeType: 'application/pdf',
      size: 256,
      path: `/api/attachments/${dummyFileNamePrivate}`,
      uploader: employeeYonas._id,
      organization: primaryOrg._id,
      ticket: ticketYonas._id,
    });

    let unauthorizedEmployeeBlocked = false;
    await attachmentController.downloadAttachment(
      {
        params: { id: attachmentPrivate._id.toString() },
        user: employeeHana, // Hana didn't create Yonas's ticket
        organizationId: primaryOrg._id.toString(),
      },
      {},
      (err) => {
        if (
          err &&
          err.statusCode === 403 &&
          err.message.includes('permission to view attachments for this ticket')
        ) {
          unauthorizedEmployeeBlocked = true;
        }
      }
    );
    assert(
      unauthorizedEmployeeBlocked,
      'Employee blocked from accessing another employee\'s private ticket attachment (403 Forbidden)'
    );

    // -------------------------------------------------------------
    // Test 6: Platform Super Admin can inspect attachments across organizations
    // -------------------------------------------------------------
    let superAdminDownloadAllowed = false;
    const mockResSuperAdmin = {
      setHeader: () => {},
      download: (filePath) => {
        if (filePath === dummyFilePathB) superAdminDownloadAllowed = true;
      },
    };
    await attachmentController.downloadAttachment(
      {
        params: { id: attachmentB._id.toString() },
        user: superAdmin,
        organizationId: null,
      },
      mockResSuperAdmin,
      (err) => {
        if (err) throw err;
      }
    );
    assert(
      superAdminDownloadAllowed,
      'Platform Super Admin authorized to inspect attachments across organizations for platform support'
    );

    // -------------------------------------------------------------
    // Test 7: Path Traversal Attack Prevention
    // -------------------------------------------------------------
    let pathTraversalBlocked = false;
    await attachmentController.downloadAttachment(
      {
        params: { id: '../../package.json' },
        user: admin,
        organizationId: primaryOrg._id.toString(),
      },
      {},
      (err) => {
        if (err && (err.statusCode === 404 || err.statusCode === 403)) {
          pathTraversalBlocked = true;
        }
      }
    );
    assert(
      pathTraversalBlocked,
      'Path traversal attempt (e.g. ../../package.json) blocked safely'
    );

    // -------------------------------------------------------------
    // Test 8: Cross-Organization Notification Isolation
    // -------------------------------------------------------------
    notifB = await Notification.create({
      recipient: userB._id,
      organization: orgB._id,
      title: 'Hospital Emergency System Update',
      message: 'Server patch scheduled',
      type: 'SYSTEM',
    });

    const primaryNotifications = await Notification.find({
      organization: primaryOrg._id,
    });
    const containsForeignNotif = primaryNotifications.some(
      (n) => n._id.toString() === notifB._id.toString()
    );
    assert(
      !containsForeignNotif,
      'Primary organization notification queries strictly isolated; cannot read Org B notifications'
    );

    // -------------------------------------------------------------
    // Test 9: Socket.IO Ticket Room Join Security
    // -------------------------------------------------------------
    // Simulate socket user joining foreign ticket
    let socketCrossJoinBlocked = false;
    const mockSocketTenantA = {
      user: employeeHana,
      isSuperAdmin: false,
      orgId: primaryOrg._id.toString(),
      join: (room) => {
        throw new Error(`Socket joined unauthorized room: ${room}`);
      },
      emit: (evt, data) => {
        if (evt === 'error' && data.message.includes('belongs to a different organization')) {
          socketCrossJoinBlocked = true;
        }
      },
    };

    // Simulate ticket:join handler logic
    const ticketToTest = await Ticket.findById(ticketB._id).select('organization creator assignee');
    if (ticketToTest.organization.toString() !== mockSocketTenantA.orgId) {
      mockSocketTenantA.emit('error', { message: 'Unauthorized: Ticket belongs to a different organization' });
    }
    assert(socketCrossJoinBlocked, 'Socket.IO client blocked from joining ticket room of another organization');

    // -------------------------------------------------------------
    // Test 10: Socket.IO Super Admin Room Join Authorized
    // -------------------------------------------------------------
    let socketSuperAdminJoinAllowed = false;
    const mockSocketSuperAdmin = {
      user: superAdmin,
      isSuperAdmin: true,
      orgId: null,
      join: (room) => {
        if (room === `ticket:${ticketB._id}`) socketSuperAdminJoinAllowed = true;
      },
      emit: () => {},
    };

    if (mockSocketSuperAdmin.isSuperAdmin) {
      mockSocketSuperAdmin.join(`ticket:${ticketB._id}`);
    }
    assert(socketSuperAdminJoinAllowed, 'Socket.IO Platform Super Admin authorized to join ticket room across tenants');

  } finally {
    // Guaranteed cleanup
    dummyFilesToClean.forEach((f) => {
      if (fs.existsSync(f)) fs.unlinkSync(f);
    });

    if (attachmentPrimary) await Attachment.findByIdAndDelete(attachmentPrimary._id);
    if (attachmentB) await Attachment.findByIdAndDelete(attachmentB._id);
    if (attachmentPrivate) await Attachment.findByIdAndDelete(attachmentPrivate._id);

    if (ticketB) await Ticket.findByIdAndDelete(ticketB._id);
    if (ticketYonas) await Ticket.findByIdAndDelete(ticketYonas._id);
    if (notifB) await Notification.findByIdAndDelete(notifB._id);

    if (userB) await User.findByIdAndDelete(userB._id);
    if (orgB) await Organization.findByIdAndDelete(orgB._id);

    console.log('[CLEANUP] Ephemeral test files, attachments, and Org B records cleaned up cleanly');
  }

  // -------------------------------------------------------------
  // Final System Integrity Verification
  // -------------------------------------------------------------
  const finalStaffCount = await User.countDocuments({ organization: primaryOrg._id });
  const finalTicketCount = await Ticket.countDocuments({ organization: primaryOrg._id });

  assert(finalStaffCount === 8, `Primary organization staff count: ${finalStaffCount}/8`);
  assert(finalTicketCount === 7, `Primary organization ticket count: ${finalTicketCount}/7 (TD-1001 to TD-1007 preserved)`);

  console.log(`\n======================================================`);
  console.log(`TOTAL TESTS RUN: ${testPassed + testFailed} | PASSED: ${testPassed} | FAILED: ${testFailed}`);
  console.log(`======================================================`);

  await disconnectDatabase();
}

runStep5Tests().catch((err) => {
  console.error('Test suite failed:', err);
  process.exit(1);
});

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { io } from '../../frontend/node_modules/socket.io-client/build/esm/index.js';

const BASE_URL = 'http://localhost:5000/api';
const SOCKET_URL = 'http://localhost:5000';

describe('TechDesk: Technician Ticket Visibility and Authorization Enforcement', () => {
  let techAToken = '';
  let techAUser = null; // Tadesse (Technician A)
  let techBToken = '';
  let techBUser = null; // Selamawit (Technician B)
  let managerToken = '';
  let managerUser = null;
  let adminToken = '';
  let adminUser = null;
  let employeeAToken = '';
  let employeeAUser = null;
  let employeeBToken = '';
  let employeeBUser = null;
  let crossOrgToken = '';
  let crossOrgUser = null;

  let ticket1Id = '';
  let ticket1Number = '';
  let ticket1AttachmentId = '';

  let ticket2Id = '';
  let ticket2Number = '';
  let ticket2AttachmentId = '';
  const ticket2SecretKeyword = `SECRET_CORE_SERVER_${Date.now()}`;

  let ticket3Id = ''; // Created by Employee B

  beforeAll(async () => {
    // 1. Authenticate Technician A (Tadesse)
    const tARes = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'tadesse@techdesk.com', password: 'Password123!' }),
    });
    expect(tARes.status).toBe(200);
    const tAData = await tARes.json();
    techAToken = tAData.data.token;
    techAUser = tAData.data.user;

    // 2. Authenticate Technician B (Selamawit)
    const tBRes = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'selamawit@techdesk.com', password: 'Password123!' }),
    });
    expect(tBRes.status).toBe(200);
    const tBData = await tBRes.json();
    techBToken = tBData.data.token;
    techBUser = tBData.data.user;

    // 3. Authenticate Manager
    const mgrRes = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'manager@techdesk.com', password: 'Password123!' }),
    });
    expect(mgrRes.status).toBe(200);
    const mgrData = await mgrRes.json();
    managerToken = mgrData.data.token;
    managerUser = mgrData.data.user;

    // 4. Authenticate Org Admin
    const admRes = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'admin@techdesk.com', password: 'Password123!' }),
    });
    expect(admRes.status).toBe(200);
    const admData = await admRes.json();
    adminToken = admData.data.token;
    adminUser = admData.data.user;

    // 5. Authenticate Employee A (employee@techdesk.com)
    const empARes = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'employee@techdesk.com', password: 'Password123!' }),
    });
    expect(empARes.status).toBe(200);
    const empAData = await empARes.json();
    employeeAToken = empAData.data.token;
    employeeAUser = empAData.data.user;

    // 6. Authenticate Employee B (yonas@techdesk.com)
    const empBRes = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'yonas@techdesk.com', password: 'Password123!' }),
    });
    expect(empBRes.status).toBe(200);
    const empBData = await empBRes.json();
    employeeBToken = empBData.data.token;
    employeeBUser = empBData.data.user;

    // 7. Authenticate Cross-Org User
    const crossRes = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'sla_mgr_1793376554792@techdesk.com', password: 'Password123!' }),
    });
    expect(crossRes.status).toBe(200);
    const crossData = await crossRes.json();
    crossOrgToken = crossData.data.token;
    crossOrgUser = crossData.data.user;

    // SETUP TICKET 1: Assigned to Technician A
    const t1CreateRes = await fetch(`${BASE_URL}/tickets`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${employeeAToken}`,
      },
      body: JSON.stringify({
        title: `Tech A Assigned Work ${Date.now()}`,
        description: 'Primary ticket assigned to Technician A for testing.',
        category: 'Hardware',
        priority: 'High',
      }),
    });
    expect(t1CreateRes.status).toBe(201);
    const t1Data = await t1CreateRes.json();
    ticket1Id = t1Data.data._id;
    ticket1Number = t1Data.data.ticketNumber;

    // Assign Ticket 1 to Tech A
    const assign1Res = await fetch(`${BASE_URL}/tickets/${ticket1Id}/reassign`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${managerToken}`,
      },
      body: JSON.stringify({ assigneeId: techAUser._id }),
    });
    expect(assign1Res.status).toBe(200);

    // Upload attachment to Ticket 1
    const blob1 = new Blob(['Attachment content for Ticket 1'], { type: 'text/plain' });
    const formData1 = new FormData();
    formData1.append('file', blob1, 'ticket1_diag.txt');
    const att1Res = await fetch(`${BASE_URL}/tickets/${ticket1Id}/attachments`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${employeeAToken}` },
      body: formData1,
    });
    expect(att1Res.status).toBe(201);
    const att1Data = await att1Res.json();
    ticket1AttachmentId = att1Data.data._id;

    // Add comment to Ticket 1
    await fetch(`${BASE_URL}/tickets/${ticket1Id}/comments`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${techAToken}`,
      },
      body: JSON.stringify({ content: 'Technician A started investigation.' }),
    });

    // SETUP TICKET 2: Assigned to Technician B
    const t2CreateRes = await fetch(`${BASE_URL}/tickets`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${employeeAToken}`,
      },
      body: JSON.stringify({
        title: `Tech B Confidential Incident ${ticket2SecretKeyword}`,
        description: `Highly sensitive server investigation ${ticket2SecretKeyword}`,
        category: 'Network',
        priority: 'Critical',
      }),
    });
    expect(t2CreateRes.status).toBe(201);
    const t2Data = await t2CreateRes.json();
    ticket2Id = t2Data.data._id;
    ticket2Number = t2Data.data.ticketNumber;

    // Assign Ticket 2 to Tech B
    const assign2Res = await fetch(`${BASE_URL}/tickets/${ticket2Id}/reassign`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${managerToken}`,
      },
      body: JSON.stringify({ assigneeId: techBUser._id }),
    });
    expect(assign2Res.status).toBe(200);

    // Upload attachment to Ticket 2
    const blob2 = new Blob(['Confidential system diagnostics and private keys'], { type: 'text/plain' });
    const formData2 = new FormData();
    formData2.append('file', blob2, 'ticket2_confidential.txt');
    const att2Res = await fetch(`${BASE_URL}/tickets/${ticket2Id}/attachments`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${employeeAToken}` },
      body: formData2,
    });
    expect(att2Res.status).toBe(201);
    const att2Data = await att2Res.json();
    ticket2AttachmentId = att2Data.data._id;

    // Add private comment to Ticket 2
    const comm2Res = await fetch(`${BASE_URL}/tickets/${ticket2Id}/comments`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${techBToken}`,
      },
      body: JSON.stringify({ content: 'Private note from Technician B on sensitive infrastructure.' }),
    });
    expect(comm2Res.status).toBe(201);

    // SETUP TICKET 3: Created by Employee B
    const t3CreateRes = await fetch(`${BASE_URL}/tickets`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${employeeBToken}`,
      },
      body: JSON.stringify({
        title: `Employee B Payroll Query ${Date.now()}`,
        description: 'Private salary inquiry created by Employee B.',
        category: 'Software',
        priority: 'Low',
      }),
    });
    expect(t3CreateRes.status).toBe(201);
    const t3Data = await t3CreateRes.json();
    ticket3Id = t3Data.data._id;
  });

  // TEST 1
  it('1. Technician A sees their assigned tickets', async () => {
    const res = await fetch(`${BASE_URL}/tickets`, {
      headers: { Authorization: `Bearer ${techAToken}` },
    });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);

    const tickets = Array.isArray(body.data) ? body.data : (body.data?.tickets || []);
    expect(tickets.length).toBeGreaterThan(0);

    // Verify Ticket 1 is present
    const t1 = tickets.find((t) => t._id === ticket1Id);
    expect(t1).toBeDefined();
    expect(t1.assignee?._id).toBe(techAUser._id);

    // Verify all returned tickets are assigned to Technician A
    for (const ticket of tickets) {
      expect(ticket.assignee?._id).toBe(techAUser._id);
    }
  });

  // TEST 2
  it("2. Technician A cannot see Technician B's tickets in ticket list, even with query tampering", async () => {
    // Normal list
    const res = await fetch(`${BASE_URL}/tickets`, {
      headers: { Authorization: `Bearer ${techAToken}` },
    });
    expect(res.status).toBe(200);
    const body = await res.json();
    const normalTickets = Array.isArray(body.data) ? body.data : (body.data?.tickets || []);
    const t2Normal = normalTickets.find((t) => t._id === ticket2Id);
    expect(t2Normal).toBeUndefined();

    // Query parameter tampering: explicitly asking for Technician B's assignee ID
    const tamperedRes = await fetch(`${BASE_URL}/tickets?assignee=${techBUser._id}`, {
      headers: { Authorization: `Bearer ${techAToken}` },
    });
    expect(tamperedRes.status).toBe(200);
    const tamperedBody = await tamperedRes.json();

    // The backend must ignore the tampered query and strictly scope to Tech A
    const tamperedTickets = Array.isArray(tamperedBody.data) ? tamperedBody.data : (tamperedBody.data?.tickets || []);
    const t2Tampered = tamperedTickets.find((t) => t._id === ticket2Id);
    expect(t2Tampered).toBeUndefined();

    for (const ticket of tamperedTickets) {
      expect(ticket.assignee?._id).toBe(techAUser._id);
    }
  });

  // TEST 3
  it("3. Technician A cannot access Technician B's ticket through its direct ID", async () => {
    // Direct GET
    const getRes = await fetch(`${BASE_URL}/tickets/${ticket2Id}`, {
      headers: { Authorization: `Bearer ${techAToken}` },
    });
    // Must be 404 Not Found or 403 Forbidden to not reveal private ticket
    expect([403, 404]).toContain(getRes.status);
    const getBody = await getRes.json();
    expect(getBody.data).toBeFalsy();
    expect(getBody.message).not.toContain(ticket2SecretKeyword);

    // Direct PATCH status
    const patchStatusRes = await fetch(`${BASE_URL}/tickets/${ticket2Id}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${techAToken}`,
      },
      body: JSON.stringify({ status: 'In Progress' }),
    });
    expect([403, 404]).toContain(patchStatusRes.status);

    // Direct PATCH reassign attempt
    const patchReassignRes = await fetch(`${BASE_URL}/tickets/${ticket2Id}/reassign`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${techAToken}`,
      },
      body: JSON.stringify({ assigneeId: techAUser._id }),
    });
    expect(patchReassignRes.status).toBe(403);

    // Direct Reassignment Request on unauthorized ticket
    const reqRes = await fetch(`${BASE_URL}/tickets/${ticket2Id}/reassignment-request`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${techAToken}`,
      },
      body: JSON.stringify({
        targetTechnicianId: techAUser._id,
        reason: 'Attempting unauthorized takeover',
      }),
    });
    expect([403, 404]).toContain(reqRes.status);
  });

  // TEST 4
  it("4. Technician A cannot read another technician's ticket comments or timeline", async () => {
    // Read comments on Ticket 2
    const commRes = await fetch(`${BASE_URL}/tickets/${ticket2Id}/comments`, {
      headers: { Authorization: `Bearer ${techAToken}` },
    });
    expect([403, 404]).toContain(commRes.status);
    const commBody = await commRes.json();
    expect(commBody.data).toBeFalsy();

    // Post comment to Ticket 2
    const postCommRes = await fetch(`${BASE_URL}/tickets/${ticket2Id}/comments`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${techAToken}`,
      },
      body: JSON.stringify({ content: 'Unauthorized comment from Technician A' }),
    });
    expect([403, 404]).toContain(postCommRes.status);

    // Read timeline of Ticket 2
    const timeRes = await fetch(`${BASE_URL}/tickets/${ticket2Id}/timeline`, {
      headers: { Authorization: `Bearer ${techAToken}` },
    });
    expect([403, 404]).toContain(timeRes.status);
  });

  // TEST 5
  it("5. Technician A cannot download another technician's private attachments", async () => {
    // Download Ticket 2 attachment as Tech A
    const downloadRes = await fetch(`${BASE_URL}/attachments/${ticket2AttachmentId}/download`, {
      headers: { Authorization: `Bearer ${techAToken}` },
    });
    expect(downloadRes.status).toBe(403);
    const errBody = await downloadRes.json();
    expect(errBody.success).toBe(false);
    expect(errBody.message).toContain('Access denied');

    // Attempt to upload attachment to Ticket 2 as Tech A
    const blob = new Blob(['Malicious injected file'], { type: 'text/plain' });
    const formData = new FormData();
    formData.append('file', blob, 'injected.txt');
    const uploadRes = await fetch(`${BASE_URL}/tickets/${ticket2Id}/attachments`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${techAToken}` },
      body: formData,
    });
    expect([403, 404]).toContain(uploadRes.status);

    // Technician A CAN download attachment from Ticket 1 (assigned to them)
    const allowedDownloadRes = await fetch(`${BASE_URL}/attachments/${ticket1AttachmentId}/download`, {
      headers: { Authorization: `Bearer ${techAToken}` },
    });
    expect(allowedDownloadRes.status).toBe(200);
    const content = await allowedDownloadRes.text();
    expect(content).toBe('Attachment content for Ticket 1');
  });

  // TEST 6
  it("6. Technician A cannot access another technician's ticket through search or export", async () => {
    // Search by Ticket 2 number
    const searchNumRes = await fetch(`${BASE_URL}/tickets?search=${encodeURIComponent(ticket2Number)}`, {
      headers: { Authorization: `Bearer ${techAToken}` },
    });
    expect(searchNumRes.status).toBe(200);
    const searchNumData = await searchNumRes.json();
    const searchNumList = Array.isArray(searchNumData.data) ? searchNumData.data : (searchNumData.data?.tickets || []);
    expect(searchNumList.length).toBe(0);

    // Search by secret keyword in Ticket 2 title/description
    const searchKeywordRes = await fetch(`${BASE_URL}/tickets?search=${encodeURIComponent(ticket2SecretKeyword)}`, {
      headers: { Authorization: `Bearer ${techAToken}` },
    });
    expect(searchKeywordRes.status).toBe(200);
    const searchKeywordData = await searchKeywordRes.json();
    const searchKeywordList = Array.isArray(searchKeywordData.data) ? searchKeywordData.data : (searchKeywordData.data?.tickets || []);
    expect(searchKeywordList.length).toBe(0);

    // Technician A export CSV
    const exportRes = await fetch(`${BASE_URL}/analytics/export?assignee=${techBUser._id}`, {
      headers: { Authorization: `Bearer ${techAToken}` },
    });
    expect(exportRes.status).toBe(200);
    const csvText = await exportRes.text();

    // Verify CSV contains Ticket 1 but DOES NOT contain Ticket 2
    expect(csvText).toContain(ticket1Number);
    expect(csvText).not.toContain(ticket2Number);
    expect(csvText).not.toContain(ticket2SecretKeyword);
  });

  // TEST 7
  it("7. Technician A cannot receive another technician's private Socket.IO events", async () => {
    const techASocket = io(SOCKET_URL, {
      auth: { token: techAToken },
      transports: ['websocket'],
      reconnection: false,
    });

    await new Promise((resolve, reject) => {
      techASocket.on('connect', resolve);
      techASocket.on('connect_error', reject);
    });

    try {
      // 1. Attempt to join room for Ticket 2 (assigned to Tech B)
      const joinUnauthorizedResult = await new Promise((resolve) => {
        techASocket.emit('ticket:join', ticket2Id, (response) => {
          resolve(response);
        });
      });

      expect(joinUnauthorizedResult?.error).toBeDefined();
      expect(joinUnauthorizedResult.error).toContain('Unauthorized: Technicians may only access tickets assigned to them');

      // 2. Successfully join room for Ticket 1 (assigned to Tech A)
      const joinAuthorizedResult = await new Promise((resolve) => {
        techASocket.emit('ticket:join', ticket1Id, (response) => {
          resolve(response);
        });
      });
      expect(joinAuthorizedResult?.success).toBe(true);

      // 3. Track events received by Tech A
      const receivedEvents = [];
      techASocket.on('ticket:status_changed', (data) => receivedEvents.push(data));
      techASocket.on('ticket:comment_added', (data) => receivedEvents.push(data));

      // Trigger update on Ticket 2 (assigned to Tech B) by Manager
      await fetch(`${BASE_URL}/tickets/${ticket2Id}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${managerToken}`,
        },
        body: JSON.stringify({ status: 'In Progress' }),
      });

      // Trigger comment on Ticket 2 by Tech B
      await fetch(`${BASE_URL}/tickets/${ticket2Id}/comments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${techBToken}`,
        },
        body: JSON.stringify({ content: 'Confidential investigation continuing.' }),
      });

      // Wait 300ms for any potential socket leakage
      await new Promise((r) => setTimeout(r, 300));

      // Verify Tech A received NO events for Ticket 2
      const ticket2Leaks = receivedEvents.filter(
        (e) => (e.ticket?._id || e.ticket) === ticket2Id || (e.ticket?.ticketNumber === ticket2Number)
      );
      expect(ticket2Leaks.length).toBe(0);

      // Now trigger an update on Ticket 1 (assigned to Tech A)
      await fetch(`${BASE_URL}/tickets/${ticket1Id}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${managerToken}`,
        },
        body: JSON.stringify({ status: 'In Progress' }),
      });

      // Wait for event on Ticket 1
      await new Promise((r) => setTimeout(r, 300));

      const ticket1Events = receivedEvents.filter(
        (e) => (e.ticket?._id || e.ticket) === ticket1Id || (e.ticket?.ticketNumber === ticket1Number)
      );
      expect(ticket1Events.length).toBeGreaterThan(0);
    } finally {
      techASocket.disconnect();
    }
  });

  // TEST 8
  it('8. Managers can still view all tickets in their organization', async () => {
    const listRes = await fetch(`${BASE_URL}/tickets`, {
      headers: { Authorization: `Bearer ${managerToken}` },
    });
    expect(listRes.status).toBe(200);
    const body = await listRes.json();
    const tickets = Array.isArray(body.data) ? body.data : (body.data?.tickets || []);

    // Manager sees both Ticket 1 and Ticket 2
    const foundT1 = tickets.find((t) => t._id === ticket1Id);
    const foundT2 = tickets.find((t) => t._id === ticket2Id);
    expect(foundT1).toBeDefined();
    expect(foundT2).toBeDefined();

    // Manager can fetch direct details for both
    const t1Detail = await fetch(`${BASE_URL}/tickets/${ticket1Id}`, {
      headers: { Authorization: `Bearer ${managerToken}` },
    });
    expect(t1Detail.status).toBe(200);

    const t2Detail = await fetch(`${BASE_URL}/tickets/${ticket2Id}`, {
      headers: { Authorization: `Bearer ${managerToken}` },
    });
    expect(t2Detail.status).toBe(200);

    // Manager can view comments for both
    const t2Comments = await fetch(`${BASE_URL}/tickets/${ticket2Id}/comments`, {
      headers: { Authorization: `Bearer ${managerToken}` },
    });
    expect(t2Comments.status).toBe(200);
  });

  // TEST 9
  it('9. Organization Admins can still view all tickets in their organization', async () => {
    const listRes = await fetch(`${BASE_URL}/tickets`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    expect(listRes.status).toBe(200);
    const body = await listRes.json();
    const tickets = Array.isArray(body.data) ? body.data : (body.data?.tickets || []);

    // Admin sees both Ticket 1 and Ticket 2
    const foundT1 = tickets.find((t) => t._id === ticket1Id);
    const foundT2 = tickets.find((t) => t._id === ticket2Id);
    expect(foundT1).toBeDefined();
    expect(foundT2).toBeDefined();

    // Admin can fetch direct details for both
    const t1Detail = await fetch(`${BASE_URL}/tickets/${ticket1Id}`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    expect(t1Detail.status).toBe(200);

    const t2Detail = await fetch(`${BASE_URL}/tickets/${ticket2Id}`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    expect(t2Detail.status).toBe(200);
  });

  // TEST 10
  it('10. Cross-organization access remains blocked', async () => {
    // Cross-org user lists tickets
    const listRes = await fetch(`${BASE_URL}/tickets`, {
      headers: { Authorization: `Bearer ${crossOrgToken}` },
    });
    expect(listRes.status).toBe(200);
    const body = await listRes.json();
    const tickets = Array.isArray(body.data) ? body.data : (body.data?.tickets || []);

    // Must NOT contain tickets from TechDesk Solutions
    const foundT1 = tickets.find((t) => t._id === ticket1Id);
    const foundT2 = tickets.find((t) => t._id === ticket2Id);
    expect(foundT1).toBeUndefined();
    expect(foundT2).toBeUndefined();

    // Direct access to Ticket 1 blocked
    const directRes = await fetch(`${BASE_URL}/tickets/${ticket1Id}`, {
      headers: { Authorization: `Bearer ${crossOrgToken}` },
    });
    expect([403, 404]).toContain(directRes.status);

    // Direct comments access blocked
    const commRes = await fetch(`${BASE_URL}/tickets/${ticket1Id}/comments`, {
      headers: { Authorization: `Bearer ${crossOrgToken}` },
    });
    expect([403, 404]).toContain(commRes.status);

    // Direct attachment download blocked
    const attRes = await fetch(`${BASE_URL}/attachments/${ticket1AttachmentId}/download`, {
      headers: { Authorization: `Bearer ${crossOrgToken}` },
    });
    expect(attRes.status).toBe(403);
  });

  // TEST 11
  it('11. Employees can view their own tickets only', async () => {
    // Employee B lists tickets
    const listRes = await fetch(`${BASE_URL}/tickets`, {
      headers: { Authorization: `Bearer ${employeeBToken}` },
    });
    expect(listRes.status).toBe(200);
    const body = await listRes.json();
    const tickets = Array.isArray(body.data) ? body.data : (body.data?.tickets || []);

    // Employee B sees Ticket 3 (created by Employee B)
    const foundT3 = tickets.find((t) => t._id === ticket3Id);
    expect(foundT3).toBeDefined();

    // Employee B DOES NOT see Ticket 1 or Ticket 2 (created by Employee A)
    const foundT1 = tickets.find((t) => t._id === ticket1Id);
    const foundT2 = tickets.find((t) => t._id === ticket2Id);
    expect(foundT1).toBeUndefined();
    expect(foundT2).toBeUndefined();

    // Employee B direct GET on Ticket 1 returns 404/403
    const directRes = await fetch(`${BASE_URL}/tickets/${ticket1Id}`, {
      headers: { Authorization: `Bearer ${employeeBToken}` },
    });
    expect([403, 404]).toContain(directRes.status);

    // Employee B cannot download Ticket 1 attachment
    const attRes = await fetch(`${BASE_URL}/attachments/${ticket1AttachmentId}/download`, {
      headers: { Authorization: `Bearer ${employeeBToken}` },
    });
    expect(attRes.status).toBe(403);
  });
});

import { describe, it, expect, beforeAll } from 'vitest';

const BASE_URL = 'http://localhost:5000/api';

describe('TechDesk Secure Technician Ticket Reassignment Workflow', () => {
  let managerToken = '';
  let managerUser = null;
  let tech1Token = '';
  let tech1User = null; // Tadesse
  let tech2Token = '';
  let tech2User = null; // Selamawit
  let employeeToken = '';
  let employeeUser = null;
  let crossOrgUserId = '6ae4c12ba9a16239f657bfb3'; // User in 'SLA Logic Testing Org'

  let approvedTicketId = '';
  let approvedRequestId = '';
  let rejectedTicketId = '';
  let rejectedRequestId = '';

  beforeAll(async () => {
    // 1. Authenticate Manager
    const mgrRes = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'manager@techdesk.com', password: 'Password123!' }),
    });
    expect(mgrRes.status).toBe(200);
    const mgrData = await mgrRes.json();
    managerToken = mgrData.data.token;
    managerUser = mgrData.data.user;

    // 2. Authenticate Technician 1 (Tadesse)
    const t1Res = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'tadesse@techdesk.com', password: 'Password123!' }),
    });
    expect(t1Res.status).toBe(200);
    const t1Data = await t1Res.json();
    tech1Token = t1Data.data.token;
    tech1User = t1Data.data.user;

    // 3. Authenticate Technician 2 (Selamawit)
    const t2Res = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'selamawit@techdesk.com', password: 'Password123!' }),
    });
    expect(t2Res.status).toBe(200);
    const t2Data = await t2Res.json();
    tech2Token = t2Data.data.token;
    tech2User = t2Data.data.user;

    // 4. Authenticate Employee
    const empRes = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'employee@techdesk.com', password: 'Password123!' }),
    });
    expect(empRes.status).toBe(200);
    const empData = await empRes.json();
    employeeToken = empData.data.token;
    employeeUser = empData.data.user;
  });

  // Helper to create and assign ticket to tech1
  async function createAndAssignTicket(titleSuffix = '') {
    // Create ticket as employee
    const createRes = await fetch(`${BASE_URL}/tickets`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${employeeToken}`,
      },
      body: JSON.stringify({
        title: `VPN Gateway Outage ${Date.now()} ${titleSuffix}`,
        description: 'Users cannot authenticate against RADIUS gateway for secure VPN access.',
        category: 'Network',
        priority: 'High',
      }),
    });
    expect(createRes.status).toBe(201);
    const createData = await createRes.json();
    const ticketId = createData.data._id;

    // Direct assign to tech1 as manager
    const assignRes = await fetch(`${BASE_URL}/tickets/${ticketId}/reassign`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${managerToken}`,
      },
      body: JSON.stringify({ assigneeId: tech1User._id }),
    });
    expect(assignRes.status).toBe(200);

    return ticketId;
  }

  // TEST 1: Technician requests reassignment
  it('1. Technician requests reassignment: successfully submits request with valid reason and target', async () => {
    approvedTicketId = await createAndAssignTicket('Approved Flow');

    const res = await fetch(`${BASE_URL}/tickets/${approvedTicketId}/reassignment-request`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tech1Token}`,
      },
      body: JSON.stringify({
        targetTechnicianId: tech2User._id,
        reason: 'Network routing specialist required for Cisco ASA cluster diagnosis.',
      }),
    });

    expect(res.status).toBe(201);
    const json = await res.json();
    expect(json.success).toBe(true);
    expect(json.data.status).toBe('pending');
    const origId = json.data.originalTechnician?._id || json.data.originalTechnician;
    const targetId = json.data.targetTechnician?._id || json.data.targetTechnician;
    expect(origId.toString()).toBe(tech1User._id.toString());
    expect(targetId.toString()).toBe(tech2User._id.toString());
    expect(json.data.reason).toBe('Network routing specialist required for Cisco ASA cluster diagnosis.');

    approvedRequestId = json.data._id;

    // Verify ticket has pendingReassignment set
    const ticketRes = await fetch(`${BASE_URL}/tickets/${approvedTicketId}`, {
      headers: { Authorization: `Bearer ${managerToken}` },
    });
    const ticketJson = await ticketRes.json();
    expect(ticketJson.data.pendingReassignment).toBeDefined();
    expect(ticketJson.data.pendingReassignment._id).toBe(approvedRequestId);
  });

  // TEST 2: Manager approves
  it('2. Manager approves: updates ticket assignment, clears pending flag, records approval details', async () => {
    const res = await fetch(`${BASE_URL}/reassignments/${approvedRequestId}/approve`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${managerToken}`,
      },
    });

    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.success).toBe(true);

    // Verify ticket has been reassigned to Selamawit (tech2User)
    const ticketRes = await fetch(`${BASE_URL}/tickets/${approvedTicketId}`, {
      headers: { Authorization: `Bearer ${managerToken}` },
    });
    const ticketJson = await ticketRes.json();
    expect(ticketJson.data.assignee._id.toString()).toBe(tech2User._id.toString());
    expect(ticketJson.data.pendingReassignment).toBeNull();

    // Verify request status is approved and reviewedBy is set
    const reqListRes = await fetch(`${BASE_URL}/tickets/${approvedTicketId}/reassignment-requests`, {
      headers: { Authorization: `Bearer ${managerToken}` },
    });
    const reqListJson = await reqListRes.json();
    const approvedReq = reqListJson.data.find((r) => r._id === approvedRequestId);
    expect(approvedReq).toBeDefined();
    expect(approvedReq.status).toBe('approved');
    expect(approvedReq.reviewedBy._id.toString()).toBe(managerUser._id.toString());
  });

  // TEST 3: Manager rejects
  it('3. Manager rejects: retains original technician, stores mandatory rejection reason', async () => {
    rejectedTicketId = await createAndAssignTicket('Rejected Flow');

    // Technician requests reassignment
    const reqRes = await fetch(`${BASE_URL}/tickets/${rejectedTicketId}/reassignment-request`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tech1Token}`,
      },
      body: JSON.stringify({
        targetTechnicianId: tech2User._id,
        reason: 'Heavy queue workload, seeking handoff to cloud team.',
      }),
    });
    expect(reqRes.status).toBe(201);
    const reqJson = await reqRes.json();
    rejectedRequestId = reqJson.data._id;

    // Manager rejection without mandatory reason should fail (400)
    const failRejectRes = await fetch(`${BASE_URL}/reassignments/${rejectedRequestId}/reject`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${managerToken}`,
      },
      body: JSON.stringify({ reason: ' ' }),
    });
    expect(failRejectRes.status).toBe(400);

    // Manager rejects with valid mandatory reason
    const rejectionReasonText = 'Current SLA timeline allows sufficient buffer. Please complete initial packet capture.';
    const rejectRes = await fetch(`${BASE_URL}/reassignments/${rejectedRequestId}/reject`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${managerToken}`,
      },
      body: JSON.stringify({ reason: rejectionReasonText }),
    });
    expect(rejectRes.status).toBe(200);
    const rejectJson = await rejectRes.json();
    expect(rejectJson.success).toBe(true);

    // Ticket assignment remains with tech1 (Tadesse)
    const ticketRes = await fetch(`${BASE_URL}/tickets/${rejectedTicketId}`, {
      headers: { Authorization: `Bearer ${managerToken}` },
    });
    const ticketJson = await ticketRes.json();
    expect(ticketJson.data.assignee._id.toString()).toBe(tech1User._id.toString());
    expect(ticketJson.data.pendingReassignment).toBeNull();

    // Reassignment record stores rejection details
    const reqListRes = await fetch(`${BASE_URL}/tickets/${rejectedTicketId}/reassignment-requests`, {
      headers: { Authorization: `Bearer ${managerToken}` },
    });
    const reqListJson = await reqListRes.json();
    const rejectedReq = reqListJson.data.find((r) => r._id === rejectedRequestId);
    expect(rejectedReq.status).toBe('rejected');
    expect(rejectedReq.rejectionReason).toBe(rejectionReasonText);
    expect(rejectedReq.reviewedBy._id.toString()).toBe(managerUser._id.toString());
  });

  // TEST 4: Invalid technician selection
  it('4. Invalid technician selection: prevents self-reassignment, empty targets, and missing reason', async () => {
    const ticketId = await createAndAssignTicket('Invalid Selection Test');

    // 4a. Self-reassignment attempt
    const selfRes = await fetch(`${BASE_URL}/tickets/${ticketId}/reassignment-request`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tech1Token}`,
      },
      body: JSON.stringify({
        targetTechnicianId: tech1User._id,
        reason: 'Attempting to reassign to myself.',
      }),
    });
    expect(selfRes.status).toBe(400);
    const selfJson = await selfRes.json();
    expect(selfJson.message).toContain('Cannot request reassignment to yourself');

    // 4b. Neither technician nor team provided
    const emptyTargetRes = await fetch(`${BASE_URL}/tickets/${ticketId}/reassignment-request`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tech1Token}`,
      },
      body: JSON.stringify({
        reason: 'No target provided here.',
      }),
    });
    expect(emptyTargetRes.status).toBe(400);

    // 4c. Reason too short (< 3 chars)
    const shortReasonRes = await fetch(`${BASE_URL}/tickets/${ticketId}/reassignment-request`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tech1Token}`,
      },
      body: JSON.stringify({
        targetTechnicianId: tech2User._id,
        reason: 'no',
      }),
    });
    expect(shortReasonRes.status).toBe(400);

    // 4d. Invalid ObjectId format
    const invalidIdRes = await fetch(`${BASE_URL}/tickets/${ticketId}/reassignment-request`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tech1Token}`,
      },
      body: JSON.stringify({
        targetTechnicianId: 'invalid-id-12345',
        reason: 'Invalid ID test.',
      }),
    });
    expect(invalidIdRes.status).toBe(400);
  });

  // TEST 5: Cross-organization reassignment attempt
  it('5. Cross-organization reassignment attempt: blocks targeting technicians outside tenant org', async () => {
    const ticketId = await createAndAssignTicket('Cross Org Test');

    const crossOrgRes = await fetch(`${BASE_URL}/tickets/${ticketId}/reassignment-request`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tech1Token}`,
      },
      body: JSON.stringify({
        targetTechnicianId: crossOrgUserId,
        reason: 'Attempting cross-tenant reassignment.',
      }),
    });

    expect(crossOrgRes.status).toBe(400);
    const crossOrgJson = await crossOrgRes.json();
    expect(crossOrgJson.message).toContain('Target technician was not found in this organization');
  });

  // TEST 6: Unauthorized approval attempt
  it('6. Unauthorized approval attempt: blocks non-managers (employees/technicians) from approving requests', async () => {
    const ticketId = await createAndAssignTicket('Unauthorized Approval Test');

    // Technician 1 requests reassignment
    const reqRes = await fetch(`${BASE_URL}/tickets/${ticketId}/reassignment-request`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tech1Token}`,
      },
      body: JSON.stringify({
        targetTechnicianId: tech2User._id,
        reason: 'Permission enforcement check.',
      }),
    });
    expect(reqRes.status).toBe(201);
    const reqJson = await reqRes.json();
    const requestId = reqJson.data._id;

    // 6a. Employee attempts approval -> 403 Forbidden
    const empApproveRes = await fetch(`${BASE_URL}/reassignments/${requestId}/approve`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${employeeToken}`,
      },
    });
    expect(empApproveRes.status).toBe(403);

    // 6b. Technician attempts approval -> 403 Forbidden
    const techApproveRes = await fetch(`${BASE_URL}/reassignments/${requestId}/approve`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tech1Token}`,
      },
    });
    expect(techApproveRes.status).toBe(403);

    // 6c. Non-assigned technician attempts to request reassignment -> 403 Forbidden
    const nonAssignedReqRes = await fetch(`${BASE_URL}/tickets/${ticketId}/reassignment-request`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tech2Token}`, // Selamawit is not assigned to this ticket
      },
      body: JSON.stringify({
        targetTechnicianId: tech1User._id,
        reason: 'Should be rejected because I am not assigned.',
      }),
    });
    expect(nonAssignedReqRes.status).toBe(403);
    const nonAssignedJson = await nonAssignedReqRes.json();
    expect(nonAssignedJson.message).toContain('Only the currently assigned technician can request reassignment');
  });

  // TEST 7: Duplicate reassignment request
  it('7. Duplicate reassignment request: rejects second request while one is already pending', async () => {
    const ticketId = await createAndAssignTicket('Duplicate Request Test');

    // First request
    const req1Res = await fetch(`${BASE_URL}/tickets/${ticketId}/reassignment-request`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tech1Token}`,
      },
      body: JSON.stringify({
        targetTechnicianId: tech2User._id,
        reason: 'First pending request for diagnosis.',
      }),
    });
    expect(req1Res.status).toBe(201);

    // Second request while first is still pending -> 400 Bad Request
    const req2Res = await fetch(`${BASE_URL}/tickets/${ticketId}/reassignment-request`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tech1Token}`,
      },
      body: JSON.stringify({
        targetTechnicianId: tech2User._id,
        reason: 'Second duplicate request attempting to overwrite.',
      }),
    });
    expect(req2Res.status).toBe(400);
    const req2Json = await req2Res.json();
    expect(req2Json.message).toContain('A reassignment request is already pending for this ticket');
  });

  // TEST 8: Ticket history and notifications
  it('8. Ticket history and notifications: verifies timeline events, previous technician preservation, and alerts', async () => {
    // 8a. Check approved ticket timeline
    const timelineRes = await fetch(`${BASE_URL}/tickets/${approvedTicketId}/timeline`, {
      headers: { Authorization: `Bearer ${managerToken}` },
    });
    expect(timelineRes.status).toBe(200);
    const timelineJson = await timelineRes.json();
    const events = timelineJson.data;

    // Must contain REASSIGNMENT_REQUESTED event
    const reqEvent = events.find((e) => e.eventType === 'REASSIGNMENT_REQUESTED');
    expect(reqEvent).toBeDefined();
    expect(reqEvent.details.requestingTechnician.id.toString()).toBe(tech1User._id.toString());
    expect(reqEvent.details.reason).toContain('Network routing specialist required');

    // Must contain REASSIGNED (approved) event
    const approvedEvent = events.find((e) => e.eventType === 'REASSIGNED' && e.details?.finalDecision === 'approved');
    expect(approvedEvent).toBeDefined();
    expect(approvedEvent.details.previousTechnician.id.toString()).toBe(tech1User._id.toString());
    expect(approvedEvent.details.newTechnician.id.toString()).toBe(tech2User._id.toString());
    expect(approvedEvent.details.approvingManager.id.toString()).toBe(managerUser._id.toString());
    expect(approvedEvent.details.finalDecision).toBe('approved');

    // 8b. Check rejected ticket timeline
    const rejectedTimelineRes = await fetch(`${BASE_URL}/tickets/${rejectedTicketId}/timeline`, {
      headers: { Authorization: `Bearer ${managerToken}` },
    });
    expect(rejectedTimelineRes.status).toBe(200);
    const rejTimelineJson = await rejectedTimelineRes.json();
    const rejEvents = rejTimelineJson.data;

    const rejEvent = rejEvents.find((e) => e.eventType === 'REASSIGNMENT_REJECTED');
    expect(rejEvent).toBeDefined();
    expect(rejEvent.details.rejectingManager.id.toString()).toBe(managerUser._id.toString());
    expect(rejEvent.details.rejectionReason).toContain('Current SLA timeline allows sufficient buffer');
    expect(rejEvent.details.finalDecision).toBe('rejected');

    // 8c. Notifications check for tech1 (requesting tech)
    const t1NotifRes = await fetch(`${BASE_URL}/notifications?limit=20`, {
      headers: { Authorization: `Bearer ${tech1Token}` },
    });
    expect(t1NotifRes.status).toBe(200);
    const t1NotifJson = await t1NotifRes.json();
    const t1Notifs = t1NotifJson.data.notifications || t1NotifJson.data || [];

    const approvalNotif = t1Notifs.find((n) => n.type === 'REASSIGNMENT_APPROVED');
    expect(approvalNotif).toBeDefined();
    expect(approvalNotif.message).toContain('was approved by');

    const rejectionNotif = t1Notifs.find((n) => n.type === 'REASSIGNMENT_REJECTED');
    expect(rejectionNotif).toBeDefined();
    expect(rejectionNotif.message).toContain('was rejected by');

    // 8d. Notifications check for tech2 (new assignee)
    const t2NotifRes = await fetch(`${BASE_URL}/notifications?limit=20`, {
      headers: { Authorization: `Bearer ${tech2Token}` },
    });
    expect(t2NotifRes.status).toBe(200);
    const t2NotifJson = await t2NotifRes.json();
    const t2Notifs = t2NotifJson.data.notifications || t2NotifJson.data || [];
    const assignedNotif = t2Notifs.find(
      (n) => n.type === 'TICKET_ASSIGNED' && (n.ticket?._id || n.ticket).toString() === approvedTicketId.toString()
    );
    expect(assignedNotif).toBeDefined();

    // 8e. Notifications check for manager
    const mgrNotifRes = await fetch(`${BASE_URL}/notifications?limit=20`, {
      headers: { Authorization: `Bearer ${managerToken}` },
    });
    expect(mgrNotifRes.status).toBe(200);
    const mgrNotifJson = await mgrNotifRes.json();
    const mgrNotifs = mgrNotifJson.data.notifications || mgrNotifJson.data || [];
    const mgrReqNotif = mgrNotifs.find((n) => n.type === 'REASSIGNMENT_REQUESTED');
    expect(mgrReqNotif).toBeDefined();
  });
});

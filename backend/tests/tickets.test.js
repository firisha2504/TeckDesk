import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import app from '../src/app.js';
import { connectDatabase, disconnectDatabase } from '../src/config/database.js';
import { Organization } from '../src/models/Organization.js';
import { User } from '../src/models/User.js';
import { Ticket } from '../src/models/Ticket.js';

describe('Ticket Lifecycle API Tests', () => {
  let org = null;
  let employeeUser = null;
  let technicianUser = null;
  let employeeToken = '';
  let technicianToken = '';
  let createdTicketId = '';

  beforeAll(async () => {
    await connectDatabase();

    org = await Organization.create({
      name: 'Ticket Lifecycle Org',
      slug: `ticket-lifecycle-${Date.now()}`,
      status: 'active',
      plan: 'standard',
    });

    employeeUser = await User.create({
      name: 'Employee Tester',
      email: `emp_test_${Date.now()}@techdesk.com`,
      password: 'Password123!',
      role: 'employee',
      organization: org._id,
      isActive: true,
    });
    employeeToken = employeeUser.generateAuthToken();

    technicianUser = await User.create({
      name: 'Tech Specialist',
      email: `tech_test_${Date.now()}@techdesk.com`,
      password: 'Password123!',
      role: 'technician',
      organization: org._id,
      isActive: true,
    });
    technicianToken = technicianUser.generateAuthToken();
  });

  afterAll(async () => {
    if (org) {
      await User.deleteMany({ organization: org._id });
      await Ticket.deleteMany({ organization: org._id });
      await Organization.deleteOne({ _id: org._id });
    }
    await disconnectDatabase();
  });

  it('should create a ticket with sequential reference number (TD-XXXX)', async () => {
    const res = await request(app)
      .post('/api/tickets')
      .set('Authorization', `Bearer ${employeeToken}`)
      .send({
        title: 'Printer paper jam error',
        category: 'Hardware',
        priority: 'High',
        description: '3rd floor laser printer has a persistent jam warning.',
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.ticketNumber).toMatch(/^TD-\d+$/);
    expect(res.body.data.status).toMatch(/Open|Assigned/);
    expect(res.body.data.sla.resolutionDeadline).toBeDefined();

    createdTicketId = res.body.data._id;
  });

  it('should transition status from Assigned/Open to In Progress', async () => {
    const res = await request(app)
      .patch(`/api/tickets/${createdTicketId}/status`)
      .set('Authorization', `Bearer ${technicianToken}`)
      .send({
        status: 'In Progress',
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.status).toBe('In Progress');
  });

  it('should reject invalid status transition directly from In Progress to Open', async () => {
    const res = await request(app)
      .patch(`/api/tickets/${createdTicketId}/status`)
      .set('Authorization', `Bearer ${technicianToken}`)
      .send({
        status: 'Open',
      });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it('should successfully add a comment to the ticket', async () => {
    const res = await request(app)
      .post(`/api/tickets/${createdTicketId}/comments`)
      .set('Authorization', `Bearer ${employeeToken}`)
      .send({
        content: 'I verified the tray is completely clear of paper.',
        isInternal: false,
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.content).toBe('I verified the tray is completely clear of paper.');
  });
});

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import app from '../src/app.js';
import { connectDatabase, disconnectDatabase } from '../src/config/database.js';

describe('Ticket Lifecycle API Tests', () => {
  let employeeToken = '';
  let technicianToken = '';
  let createdTicketId = '';

  beforeAll(async () => {
    await connectDatabase();

    // Register test employee
    const empRes = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'Employee Tester',
        email: `emp_test_${Date.now()}@techdesk.com`,
        password: 'Password123!',
        role: 'employee',
        organizationName: 'Ticket Lifecycle Org',
      });
    employeeToken = empRes.body.data.token;

    // Register test technician
    const techRes = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'Tech Specialist',
        email: `tech_test_${Date.now()}@techdesk.com`,
        password: 'Password123!',
        role: 'technician',
        organizationName: 'Ticket Lifecycle Org',
      });
    technicianToken = techRes.body.data.token;
  });

  afterAll(async () => {
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

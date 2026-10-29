import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import app from '../src/app.js';
import { connectDatabase, disconnectDatabase } from '../src/config/database.js';

describe('Permissions & Tenant Isolation API Tests', () => {
  let orgAToken = '';
  let orgBToken = '';
  let orgATicketId = '';

  beforeAll(async () => {
    await connectDatabase();

    // Org A user
    const userARes = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'Org A User',
        email: `orga_${Date.now()}@alpha.com`,
        password: 'Password123!',
        role: 'employee',
        organizationName: 'Alpha Corporation',
      });
    orgAToken = userARes.body.data.token;

    // Org B user
    const userBRes = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'Org B User',
        email: `orgb_${Date.now()}@beta.com`,
        password: 'Password123!',
        role: 'employee',
        organizationName: 'Beta Enterprises',
      });
    orgBToken = userBRes.body.data.token;

    // Create ticket in Org A
    const ticketRes = await request(app)
      .post('/api/tickets')
      .set('Authorization', `Bearer ${orgAToken}`)
      .send({
        title: 'Confidential Internal Server Access',
        category: 'Security',
        priority: 'Critical',
        description: 'Server credentials and access token issue for Org A only.',
      });
    orgATicketId = ticketRes.body.data._id;
  });

  afterAll(async () => {
    await disconnectDatabase();
  });

  it('should prevent cross-organization ticket access (Org B cannot view Org A ticket)', async () => {
    const res = await request(app)
      .get(`/api/tickets/${orgATicketId}`)
      .set('Authorization', `Bearer ${orgBToken}`);

    // Must be 404 (or 403) so Org B cannot even know Org A ticket exists
    expect([403, 404]).toContain(res.status);
    expect(res.body.success).toBe(false);
  });

  it('should prevent standard employee from modifying organization settings', async () => {
    const res = await request(app)
      .patch('/api/organizations/settings')
      .set('Authorization', `Bearer ${orgAToken}`)
      .send({
        name: 'Malicious Org Rename',
      });

    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
  });

  it('should prevent employee from updating SLA policy', async () => {
    const res = await request(app)
      .patch('/api/sla')
      .set('Authorization', `Bearer ${orgAToken}`)
      .send({
        escalationEmail: 'hacker@outside.com',
      });

    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
  });
});

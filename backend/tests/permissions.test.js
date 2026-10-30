import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import app from '../src/app.js';
import { connectDatabase, disconnectDatabase } from '../src/config/database.js';
import { Organization } from '../src/models/Organization.js';
import { User } from '../src/models/User.js';
import { Ticket } from '../src/models/Ticket.js';

describe('Permissions & Tenant Isolation API Tests', () => {
  let orgA = null;
  let orgB = null;
  let userA = null;
  let userB = null;
  let orgAToken = '';
  let orgBToken = '';
  let orgATicketId = '';

  beforeAll(async () => {
    await connectDatabase();

    orgA = await Organization.create({
      name: 'Alpha Corporation',
      slug: `alpha-${Date.now()}`,
      status: 'active',
    });
    userA = await User.create({
      name: 'Org A User',
      email: `orga_${Date.now()}@alpha.com`,
      password: 'Password123!',
      role: 'employee',
      organization: orgA._id,
      isActive: true,
    });
    orgAToken = userA.generateAuthToken();

    orgB = await Organization.create({
      name: 'Beta Enterprises',
      slug: `beta-${Date.now()}`,
      status: 'active',
    });
    userB = await User.create({
      name: 'Org B User',
      email: `orgb_${Date.now()}@beta.com`,
      password: 'Password123!',
      role: 'employee',
      organization: orgB._id,
      isActive: true,
    });
    orgBToken = userB.generateAuthToken();

    // Create ticket in Org A
    const ticket = await Ticket.create({
      ticketNumber: `ALPHA-${Date.now()}`,
      title: 'Confidential Internal Server Access',
      category: 'Security',
      priority: 'Critical',
      description: 'Server credentials and access token issue for Org A only.',
      creator: userA._id,
      organization: orgA._id,
      status: 'Open',
    });
    orgATicketId = ticket._id.toString();
  });

  afterAll(async () => {
    const orgIds = [orgA?._id, orgB?._id].filter(Boolean);
    if (orgIds.length > 0) {
      await User.deleteMany({ organization: { $in: orgIds } });
      await Ticket.deleteMany({ organization: { $in: orgIds } });
      await Organization.deleteMany({ _id: { $in: orgIds } });
    }
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

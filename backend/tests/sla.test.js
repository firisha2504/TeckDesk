import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import app from '../src/app.js';
import { connectDatabase, disconnectDatabase } from '../src/config/database.js';
import { slaService } from '../src/services/sla.service.js';
import { assignmentService } from '../src/services/assignment.service.js';
import { Organization } from '../src/models/Organization.js';
import { User } from '../src/models/User.js';

describe('SLA & Auto-Assignment Logic Tests', () => {
  let organization = null;
  let managerToken = '';

  beforeAll(async () => {
    await connectDatabase();

    const regRes = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'SLA Manager',
        email: `sla_mgr_${Date.now()}@techdesk.com`,
        password: 'Password123!',
        role: 'manager',
        organizationName: 'SLA Logic Testing Org',
      });
    managerToken = regRes.body.data.token;
    organization = regRes.body.data.user.organization;
  });

  afterAll(async () => {
    const orgId = organization?._id || organization;
    if (orgId) {
      await User.deleteMany({ organization: orgId });
      await Organization.deleteOne({ _id: orgId });
    }
    await disconnectDatabase();
  });

  it('should calculate much stricter response and resolution deadlines for Critical priority vs Low', async () => {
    const orgId = organization._id || organization;
    const criticalDeadlines = await slaService.calculateDeadlines('Critical', orgId);
    const lowDeadlines = await slaService.calculateDeadlines('Low', orgId);

    expect(criticalDeadlines.responseTimeMinutes).toBeLessThan(lowDeadlines.responseTimeMinutes);
    expect(criticalDeadlines.resolutionTimeMinutes).toBeLessThan(lowDeadlines.resolutionTimeMinutes);
    expect(criticalDeadlines.responseDeadline.getTime()).toBeLessThan(lowDeadlines.responseDeadline.getTime());
  });

  it('should allow manager to trigger manual SLA breach monitoring scan', async () => {
    const res = await request(app)
      .post('/api/sla/check')
      .set('Authorization', `Bearer ${managerToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.breachCount).toBeDefined();
  });
});

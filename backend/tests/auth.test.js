import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import app from '../src/app.js';
import { connectDatabase, disconnectDatabase } from '../src/config/database.js';
import { User } from '../src/models/User.js';
import { Organization } from '../src/models/Organization.js';

describe('Authentication API Tests', () => {
  let testOrg = null;
  const testUser = {
    name: 'Test Auth User',
    email: `test_auth_${Date.now()}@techdesk.com`,
    password: 'Password123!',
    role: 'employee',
  };

  beforeAll(async () => {
    await connectDatabase();
    testOrg = await Organization.create({
      name: 'Auth Test Org',
      slug: `auth-test-org-${Date.now()}`,
      status: 'active',
      settings: { allowRegistration: true },
    });
    testUser.organizationSlug = testOrg.slug;
  });

  afterAll(async () => {
    if (testOrg) {
      await User.deleteMany({ organization: testOrg._id });
      await Organization.deleteOne({ _id: testOrg._id });
    }
    await disconnectDatabase();
  });

  it('should successfully register a new user and return a JWT cookie', async () => {
    const res = await request(app)
      .post('/api/auth/register-employee')
      .send(testUser);

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.user.email).toBe(testUser.email.toLowerCase());
    expect(res.body.data.token).toBeDefined();

    // Check Set-Cookie
    const cookies = res.headers['set-cookie'];
    expect(cookies).toBeDefined();
    expect(cookies[0]).toMatch(/token=/);
  });

  it('should reject registration with invalid email', async () => {
    const res = await request(app)
      .post('/api/auth/register-employee')
      .send({
        ...testUser,
        email: 'invalid-email-format',
      });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it('should login an existing user with correct credentials', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({
        email: testUser.email,
        password: testUser.password,
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.token).toBeDefined();
    expect(res.body.data.user.email).toBe(testUser.email.toLowerCase());
  });

  it('should reject login with wrong password', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({
        email: testUser.email,
        password: 'WrongPassword!',
      });

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  it('should get current user profile using Bearer token', async () => {
    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({
        email: testUser.email,
        password: testUser.password,
      });

    const token = loginRes.body.data.token;

    const res = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.email).toBe(testUser.email.toLowerCase());
  });
});

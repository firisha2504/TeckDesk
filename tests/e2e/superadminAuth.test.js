import { describe, it, expect } from 'vitest';
import jwt from '../../backend/node_modules/jsonwebtoken/index.js';

const BASE_URL = 'http://localhost:5000/api';
const JWT_SECRET = 'techdesk_super_secret_jwt_key_2026_production_grade';

describe('TechDesk Super Admin Authentication & Authorization Verification', () => {
  let superAdminToken = '';
  let employeeToken = '';
  let orgAdminToken = '';
  let testOrgId = '';

  // 1. Super Admin login
  it('1. should successfully login as Super Admin and receive a valid JWT token', async () => {
    const res = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'superadmin@techdesk.com',
        password: 'SuperAdmin@2026!',
      }),
    });

    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.success).toBe(true);
    expect(json.data.user.role).toBe('superadmin');
    expect(json.data.user.organization).toBeNull();
    expect(json.data.token).toBeDefined();
    expect(typeof json.data.token).toBe('string');

    superAdminToken = json.data.token;
  });

  // 2. Super Admin dashboard access
  it('2. should access Super Admin overview dashboard with valid Bearer token', async () => {
    const res = await fetch(`${BASE_URL}/superadmin/overview`, {
      headers: {
        Authorization: `Bearer ${superAdminToken}`,
      },
    });

    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.success).toBe(true);
    expect(json.data.organizations).toBeDefined();
    expect(json.data.users).toBeDefined();
    expect(json.data.tickets).toBeDefined();
  });

  // 3. Organization listing
  it('3. should list all organizations with pagination and metadata', async () => {
    const res = await fetch(`${BASE_URL}/superadmin/organizations?page=1&limit=10`, {
      headers: {
        Authorization: `Bearer ${superAdminToken}`,
      },
    });

    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.success).toBe(true);
    expect(Array.isArray(json.data.organizations)).toBe(true);
    expect(json.data.organizations.length).toBeGreaterThan(0);

    // Save one org ID for testing lifecycle transitions
    testOrgId = json.data.organizations[0]._id;
  });

  // 4. Organization approval
  it('4. should approve an organization registration when requested by Super Admin', async () => {
    const res = await fetch(`${BASE_URL}/superadmin/organizations/${testOrgId}/approve`, {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${superAdminToken}`,
      },
    });

    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.success).toBe(true);
    expect(json.data.status).toBe('active');
  });

  // 5. Organization suspension and reactivation
  it('5. should suspend and subsequently reactivate an organization', async () => {
    // 5a. Suspend
    const suspendRes = await fetch(`${BASE_URL}/superadmin/organizations/${testOrgId}/suspend`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${superAdminToken}`,
      },
      body: JSON.stringify({ reason: 'Compliance security audit hold' }),
    });

    expect(suspendRes.status).toBe(200);
    const suspendJson = await suspendRes.json();
    expect(suspendJson.success).toBe(true);
    expect(suspendJson.data.status).toBe('suspended');

    // 5b. Reactivate
    const reactivateRes = await fetch(
      `${BASE_URL}/superadmin/organizations/${testOrgId}/reactivate`,
      {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${superAdminToken}`,
        },
      }
    );

    expect(reactivateRes.status).toBe(200);
    const reactivateJson = await reactivateRes.json();
    expect(reactivateJson.success).toBe(true);
    expect(reactivateJson.data.status).toBe('active');
  });

  // 6. Platform audit logs
  it('6. should retrieve platform-wide audit logs with actor and organization details', async () => {
    const res = await fetch(`${BASE_URL}/superadmin/audit-logs?limit=10`, {
      headers: {
        Authorization: `Bearer ${superAdminToken}`,
      },
    });

    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.success).toBe(true);
    expect(Array.isArray(json.data.logs)).toBe(true);
  });

  // 7. Page refresh while logged in
  it('7. should restore authentication session on page refresh via /auth/me', async () => {
    const res = await fetch(`${BASE_URL}/auth/me`, {
      headers: {
        Authorization: `Bearer ${superAdminToken}`,
      },
    });

    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.success).toBe(true);
    expect(json.data.email).toBe('superadmin@techdesk.com');
    expect(json.data.role).toBe('superadmin');
  });

  // 8. Expired token behavior
  it('8. should reject expired JWT tokens with HTTP 401 Unauthorized', async () => {
    const expiredToken = jwt.sign(
      { id: '6ae4a7dc82fbfd19d6fe122a', role: 'superadmin' },
      JWT_SECRET,
      { expiresIn: -10 }
    );

    const res = await fetch(`${BASE_URL}/superadmin/overview`, {
      headers: {
        Authorization: `Bearer ${expiredToken}`,
      },
    });

    expect(res.status).toBe(401);
    const json = await res.json();
    expect(json.message).toContain('Session expired');
  });

  // 8b. Missing token behavior
  it('8b. should reject requests without token with HTTP 401 Unauthorized', async () => {
    const res = await fetch(`${BASE_URL}/superadmin/overview`);
    expect(res.status).toBe(401);
    const json = await res.json();
    expect(json.message).toContain('Authentication token missing');
  });

  // 8c. Stale cookie coexistence: explicit Authorization Bearer takes precedence
  it('8c. should prioritize valid Authorization Bearer header even if browser sends a stale cookie', async () => {
    const res = await fetch(`${BASE_URL}/superadmin/overview`, {
      headers: {
        Authorization: `Bearer ${superAdminToken}`,
        Cookie: 'token=expired-or-invalid-cookie-token',
      },
    });

    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.success).toBe(true);
  });

  // 9. Unauthorized employee attempting Super Admin access
  it('9. should reject employee attempting Super Admin access with HTTP 403 Forbidden', async () => {
    const loginRes = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'employee@techdesk.com',
        password: 'Password123!',
      }),
    });
    const loginJson = await loginRes.json();
    employeeToken = loginJson.data.token;

    const res = await fetch(`${BASE_URL}/superadmin/overview`, {
      headers: {
        Authorization: `Bearer ${employeeToken}`,
      },
    });

    expect(res.status).toBe(403);
    const json = await res.json();
    expect(json.message).toContain('Access denied');
  });

  // 10. Organization Admin attempting Super Admin access
  it('10. should reject Organization Admin attempting Super Admin access with HTTP 403 Forbidden', async () => {
    const loginRes = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'admin@techdesk.com',
        password: 'Password123!',
      }),
    });
    const loginJson = await loginRes.json();
    orgAdminToken = loginJson.data.token;

    const res = await fetch(`${BASE_URL}/superadmin/overview`, {
      headers: {
        Authorization: `Bearer ${orgAdminToken}`,
      },
    });

    expect(res.status).toBe(403);
    const json = await res.json();
    expect(json.message).toContain('Access denied');
  });
});

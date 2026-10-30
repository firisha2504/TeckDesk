import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import request from 'supertest';
import crypto from 'crypto';
import app from '../src/app.js';
import { connectDatabase, disconnectDatabase } from '../src/config/database.js';
import { User } from '../src/models/User.js';
import { AuditLog } from '../src/models/AuditLog.js';
import { Organization } from '../src/models/Organization.js';
import { emailService } from '../src/services/email.service.js';

describe('Password Reset Security & SMTP Tests', () => {
  let testUser = null;
  let testOrg = null;
  let lastCapturedToken = null;

  beforeAll(async () => {
    await connectDatabase();

    testOrg = await Organization.create({
      name: 'Security Test Org',
      slug: `security-test-org-${Date.now()}`,
      status: 'active',
    });

    testUser = await User.create({
      name: 'Security Tester',
      email: `reset_test_${Date.now()}@techdesk.com`,
      password: 'InitialPassword123!',
      role: 'employee',
      organization: testOrg._id,
      isActive: true,
    });
  });

  afterAll(async () => {
    if (testOrg) {
      await User.deleteMany({ organization: testOrg._id });
      await Organization.deleteOne({ _id: testOrg._id });
      await AuditLog.deleteMany({ organization: testOrg._id });
    }
    await disconnectDatabase();
  });

  it('should return identical generic response whether user exists or not, and NEVER expose resetToken in response', async () => {
    const sendEmailSpy = vi.spyOn(emailService, 'sendPasswordResetEmail').mockImplementation(async (params) => {
      lastCapturedToken = params.resetToken;
      return { sent: true, messageId: 'mock-msg-123' };
    });

    // 1. Request for existing user
    const resExisting = await request(app)
      .post('/api/auth/forgot-password')
      .send({ email: testUser.email });

    expect(resExisting.status).toBe(200);
    expect(resExisting.body.success).toBe(true);
    expect(resExisting.body.message).toBe(
      'If an account exists with this email, password reset instructions have been sent.'
    );
    // CRITICAL: resetToken must NOT be present in response
    expect(resExisting.body.data).toBeNull();
    expect(resExisting.body.resetToken).toBeUndefined();
    expect(JSON.stringify(resExisting.body)).not.toContain(lastCapturedToken);

    // Verify spy captured raw token and email was dispatched
    expect(sendEmailSpy).toHaveBeenCalledTimes(1);
    expect(sendEmailSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        to: testUser.email,
        resetToken: expect.any(String),
      })
    );

    // 2. Request for non-existent user
    const resNonExistent = await request(app)
      .post('/api/auth/forgot-password')
      .send({ email: 'nonexistent-user-xyz@techdesk.com' });

    expect(resNonExistent.status).toBe(200);
    expect(resNonExistent.body.success).toBe(true);
    // Responses must be completely identical to prevent user enumeration
    expect(resNonExistent.body.message).toBe(resExisting.body.message);
    expect(resNonExistent.body.data).toBeNull();

    sendEmailSpy.mockRestore();
  });

  it('should store ONLY hashed reset token in database and have future expiration', async () => {
    const dbUser = await User.findById(testUser._id).select('+resetPasswordToken +resetPasswordExpires');
    expect(dbUser.resetPasswordToken).toBeDefined();
    expect(dbUser.resetPasswordExpires).toBeDefined();

    // Stored token must NOT equal the raw token
    expect(dbUser.resetPasswordToken).not.toBe(lastCapturedToken);

    // Stored token must match SHA-256 hash of the raw token
    const expectedHash = crypto.createHash('sha256').update(lastCapturedToken).digest('hex');
    expect(dbUser.resetPasswordToken).toBe(expectedHash);

    // Expiration must be in the future (within ~1 hour)
    expect(dbUser.resetPasswordExpires.getTime()).toBeGreaterThan(Date.now());
    expect(dbUser.resetPasswordExpires.getTime()).toBeLessThanOrEqual(Date.now() + 60 * 60 * 1000 + 5000);
  });

  it('should NEVER write reset token or token-bearing URL to audit logs', async () => {
    const logs = await AuditLog.find({
      organization: testOrg._id,
      action: 'PASSWORD_RESET_REQUESTED',
    });

    expect(logs.length).toBeGreaterThan(0);
    for (const log of logs) {
      const logString = JSON.stringify(log.toObject());
      expect(logString).not.toContain(lastCapturedToken);
      expect(logString).not.toContain('reset-password?token=');
      expect(log.details?.resetToken).toBeUndefined();
    }
  });

  it('should reject unauthorized / tampered password reset tokens', async () => {
    const fakeToken = crypto.randomBytes(32).toString('hex');
    const res = await request(app)
      .post('/api/auth/reset-password')
      .send({
        token: fakeToken,
        password: 'NewSecurePassword123!',
      });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toMatch(/invalid or has expired/i);
  });

  it('should reject password reset when token has expired', async () => {
    // Generate fresh token
    let expiredRawToken = null;
    const sendSpy = vi.spyOn(emailService, 'sendPasswordResetEmail').mockImplementation(async (params) => {
      expiredRawToken = params.resetToken;
      return { sent: true };
    });

    await request(app)
      .post('/api/auth/forgot-password')
      .send({ email: testUser.email });

    sendSpy.mockRestore();

    // Expire the token in the database
    await User.findByIdAndUpdate(testUser._id, {
      resetPasswordExpires: new Date(Date.now() - 10000), // 10 seconds ago
    });

    const res = await request(app)
      .post('/api/auth/reset-password')
      .send({
        token: expiredRawToken,
        password: 'NewExpiredPassword123!',
      });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toMatch(/invalid or has expired/i);
  });

  it('should successfully reset password with valid token, and enforce single-use (reject reuse)', async () => {
    // 1. Request new token
    let validToken = null;
    const sendSpy = vi.spyOn(emailService, 'sendPasswordResetEmail').mockImplementation(async (params) => {
      validToken = params.resetToken;
      return { sent: true };
    });

    await request(app)
      .post('/api/auth/forgot-password')
      .send({ email: testUser.email });

    sendSpy.mockRestore();
    expect(validToken).toBeTruthy();

    const newPassword = 'BrandNewPassword2026!';

    // 2. First reset attempt (must succeed)
    const resFirst = await request(app)
      .post('/api/auth/reset-password')
      .send({
        token: validToken,
        password: newPassword,
      });

    expect(resFirst.status).toBe(200);
    expect(resFirst.body.success).toBe(true);
    expect(resFirst.body.message).toMatch(/password has been reset successfully/i);

    // Verify token fields cleared in DB
    const updatedUser = await User.findById(testUser._id).select('+password +resetPasswordToken +resetPasswordExpires');
    expect(updatedUser.resetPasswordToken).toBeUndefined();
    expect(updatedUser.resetPasswordExpires).toBeUndefined();

    // Verify user can now log in with the new password
    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({
        email: testUser.email,
        password: newPassword,
      });

    expect(loginRes.status).toBe(200);
    expect(loginRes.body.success).toBe(true);

    // 3. Second reset attempt with SAME token (MUST FAIL - single-use enforcement)
    const resReused = await request(app)
      .post('/api/auth/reset-password')
      .send({
        token: validToken,
        password: 'AttemptToReuseToken999!',
      });

    expect(resReused.status).toBe(400);
    expect(resReused.body.success).toBe(false);
    expect(resReused.body.message).toMatch(/invalid or has expired/i);
  });

  it('should fail safely without crashing or exposing tokens if SMTP is unconfigured', async () => {
    // Test with SMTP unconfigured (default in test environment)
    const result = await emailService.sendPasswordResetEmail({
      to: 'unconfigured_test@techdesk.com',
      name: 'Unconfigured User',
      resetToken: 'secret_test_token_never_log_me',
    });

    expect(result.sent).toBe(false);
    expect(result.reason).toBe('SMTP_NOT_CONFIGURED');
  });
});

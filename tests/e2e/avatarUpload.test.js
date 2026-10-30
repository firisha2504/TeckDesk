import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import path from 'path';
import fs from 'fs';
import { env } from '../../backend/src/config/env.js';
import { avatarDir, uploadDir } from '../../backend/src/config/storage.js';

describe('TechDesk Profile Image Upload & Security Tests', () => {
  let jwt;
  let adminToken;
  let employeeToken;
  const adminId = '6ae4a0a8e61654672c50a1db';
  const employeeId = '6ae4a0a9e61654672c50a1f0';

  // Temporary test files
  const testValidPng = path.resolve('test-valid-avatar.png');
  const testValidJpg = path.resolve('test-valid-avatar.jpg');
  const testValidWebp = path.resolve('test-valid-avatar.webp');
  const testInvalidPdf = path.resolve('test-invalid-document.pdf');
  const testOversizedFile = path.resolve('test-oversized-image.png');

  beforeAll(async () => {
    jwt = (await import('../../backend/node_modules/jsonwebtoken/index.js')).default;

    adminToken = jwt.sign(
      { id: adminId, role: 'admin' },
      env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    employeeToken = jwt.sign(
      { id: employeeId, role: 'employee' },
      env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    // Create a 1x1 valid PNG binary
    const pngHeader = Buffer.from([
      0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a,
      0x00, 0x00, 0x00, 0x0d, 0x49, 0x48, 0x44, 0x52,
      0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01,
      0x08, 0x06, 0x00, 0x00, 0x00, 0x1f, 0x15, 0xc4,
      0x89, 0x00, 0x00, 0x00, 0x0a, 0x49, 0x44, 0x41,
      0x54, 0x78, 0x9c, 0x63, 0x00, 0x01, 0x00, 0x00,
      0x05, 0x00, 0x01, 0x0d, 0x0a, 0x2d, 0xb4, 0x00,
      0x00, 0x00, 0x00, 0x49, 0x45, 0x4e, 0x44, 0xae,
      0x42, 0x60, 0x82,
    ]);
    fs.writeFileSync(testValidPng, pngHeader);

    // Create dummy JPEG & WebP files
    fs.writeFileSync(testValidJpg, Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46]));
    fs.writeFileSync(testValidWebp, Buffer.from('RIFF....WEBPVP8 '));

    // Create dummy PDF
    fs.writeFileSync(testInvalidPdf, Buffer.from('%PDF-1.4 simulated document'));

    // Create 5.5 MB oversized image (> 5 MB limit)
    const largeBuffer = Buffer.alloc(5.5 * 1024 * 1024, 0x41);
    fs.writeFileSync(testOversizedFile, largeBuffer);
  });

  afterAll(() => {
    // Clean up local temp files
    [testValidPng, testValidJpg, testValidWebp, testInvalidPdf, testOversizedFile].forEach((f) => {
      if (fs.existsSync(f)) {
        try {
          fs.unlinkSync(f);
        } catch {}
      }
    });
  });

  it('1. Upload a valid image (.png) and verify immediate persistence', async () => {
    const fileData = fs.readFileSync(testValidPng);
    const blob = new Blob([fileData], { type: 'image/png' });
    const formData = new FormData();
    formData.append('avatar', blob, 'avatar-test.png');

    const res = await fetch('http://localhost:5000/api/users/avatar', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${adminToken}`,
      },
      body: formData,
    });

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.data.avatarUrl).toMatch(/^\/uploads\/avatars\/avatar-6ae4a0a8e61654672c50a1db-\d+-[a-f0-9]+\.png$/);
    expect(body.data.user.avatar).toBe(body.data.avatarUrl);

    // Verify file actually exists in avatars/ directory
    const savedFilename = path.basename(body.data.avatarUrl);
    const savedFilePath = path.resolve(avatarDir, savedFilename);
    expect(fs.existsSync(savedFilePath)).toBe(true);
  });

  it('2. Upload an unsupported file (.pdf) and verify rejection with 400 Bad Request', async () => {
    const fileData = fs.readFileSync(testInvalidPdf);
    const blob = new Blob([fileData], { type: 'application/pdf' });
    const formData = new FormData();
    formData.append('avatar', blob, 'document.pdf');

    const res = await fetch('http://localhost:5000/api/users/avatar', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${adminToken}`,
      },
      body: formData,
    });

    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.success).toBe(false);
    expect(body.message).toMatch(/not permitted|unsupported/i);
  });

  it('3. Upload a file larger than 5 MB and verify rejection with 400 Bad Request', async () => {
    const fileData = fs.readFileSync(testOversizedFile);
    const blob = new Blob([fileData], { type: 'image/png' });
    const formData = new FormData();
    formData.append('avatar', blob, 'oversized.png');

    const res = await fetch('http://localhost:5000/api/users/avatar', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${adminToken}`,
      },
      body: formData,
    });

    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.success).toBe(false);
    expect(body.message).toMatch(/5 MB/i);
  });

  it('4. Replace an existing profile picture and verify old custom image is safely removed', async () => {
    // First, upload image A
    const fileDataA = fs.readFileSync(testValidJpg);
    const blobA = new Blob([fileDataA], { type: 'image/jpeg' });
    const formDataA = new FormData();
    formDataA.append('avatar', blobA, 'photo-A.jpg');

    const resA = await fetch('http://localhost:5000/api/users/avatar', {
      method: 'POST',
      headers: { Authorization: `Bearer ${adminToken}` },
      body: formDataA,
    });
    const bodyA = await resA.json();
    const fileAPath = path.resolve(avatarDir, path.basename(bodyA.data.avatarUrl));
    expect(fs.existsSync(fileAPath)).toBe(true);

    // Second, upload image B (replacing A)
    const fileDataB = fs.readFileSync(testValidWebp);
    const blobB = new Blob([fileDataB], { type: 'image/webp' });
    const formDataB = new FormData();
    formDataB.append('avatar', blobB, 'photo-B.webp');

    const resB = await fetch('http://localhost:5000/api/users/avatar', {
      method: 'POST',
      headers: { Authorization: `Bearer ${adminToken}` },
      body: formDataB,
    });
    const bodyB = await resB.json();
    expect(bodyB.status).toBe(undefined);
    expect(resB.status).toBe(200);

    const fileBPath = path.resolve(avatarDir, path.basename(bodyB.data.avatarUrl));
    expect(fs.existsSync(fileBPath)).toBe(true);

    // Old file A must have been deleted safely
    expect(fs.existsSync(fileAPath)).toBe(false);
  });

  it('5. Verify the avatar remains after page refresh by fetching /api/auth/me', async () => {
    const res = await fetch('http://localhost:5000/api/auth/me', {
      headers: { Authorization: `Bearer ${adminToken}` },
    });

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.data.avatar).toMatch(/^\/uploads\/avatars\/avatar-6ae4a0a8e61654672c50a1db-/);
  });

  it('6. Verify user ID is derived strictly from JWT and cannot be spoofed to modify another user', async () => {
    const fileData = fs.readFileSync(testValidPng);
    const blob = new Blob([fileData], { type: 'image/png' });
    const formData = new FormData();
    formData.append('avatar', blob, 'spoof-attempt.png');
    // Maliciously attempt to supply adminId in body/query while authenticated as employee
    formData.append('userId', adminId);

    const res = await fetch(`http://localhost:5000/api/users/avatar?userId=${adminId}`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${employeeToken}` },
      body: formData,
    });

    expect(res.status).toBe(200);
    const body = await res.json();
    // Must update employeeId, NEVER adminId
    expect(body.data.user._id).toBe(employeeId);
    expect(body.data.avatarUrl).toContain(employeeId);
    expect(body.data.avatarUrl).not.toContain(adminId);
  });

  it('7. Verify uploaded avatar is accessible via /uploads/avatars/:filename', async () => {
    // Fetch the admin's current avatar
    const userRes = await fetch('http://localhost:5000/api/auth/me', {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const userBody = await userRes.json();
    const avatarUrl = userBody.data.avatar;

    const imgRes = await fetch(`http://localhost:5000${avatarUrl}`);
    expect(imgRes.status).toBe(200);
    expect(imgRes.headers.get('content-type')).toMatch(/image\/(webp|jpeg|png)/);
  });

  it('8. Verify path traversal attempt is blocked and private attachments cannot be accessed via avatar routes', async () => {
    // Attempt path traversal back into uploads/ directory
    const traversalRes = await fetch('http://localhost:5000/api/users/avatar/..%2F..%2Fpackage.json');
    expect(traversalRes.status).toBe(404); // path.basename strips directory traversal and file is not found in avatars/
  });
});

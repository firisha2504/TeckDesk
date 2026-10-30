import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { downloadFile } from '../../frontend/src/utils/downloadFile.js';

describe('TechDesk Export Functionality & URL.createObjectURL Validation', () => {
  let createdUrl = null;
  let revokedUrl = null;
  let appendedElement = null;
  let clickTriggered = false;
  let mockLink = null;

  beforeEach(() => {
    clickTriggered = false;
    createdUrl = null;
    revokedUrl = null;
    appendedElement = null;

    mockLink = {
      href: '',
      download: '',
      click: vi.fn(() => {
        clickTriggered = true;
      }),
      remove: vi.fn(),
    };

    const mockDocument = {
      createElement: vi.fn((tagName) => {
        if (tagName === 'a') return mockLink;
        return {};
      }),
      body: {
        appendChild: vi.fn((node) => {
          appendedElement = node;
          return node;
        }),
        removeChild: vi.fn(),
      },
    };

    const mockUrlClass = {
      createObjectURL: vi.fn((blob) => {
        if (!(blob instanceof Blob)) {
          throw new TypeError("Failed to execute 'createObjectURL' on 'URL': Overload resolution failed.");
        }
        createdUrl = 'blob:http://localhost:5173/mock-uuid-1234';
        return createdUrl;
      }),
      revokeObjectURL: vi.fn((url) => {
        revokedUrl = url;
      }),
    };

    vi.stubGlobal('document', mockDocument);
    vi.stubGlobal('window', {
      URL: mockUrlClass,
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it('Requirement 2: reproduces the root cause if createObjectURL is called with a raw String', () => {
    const rawCsvString = 'Ticket Number,Title\nTD-1001,Test';
    // Passing a raw string to URL.createObjectURL must fail with TypeError
    expect(() => {
      window.URL.createObjectURL(rawCsvString);
    }).toThrow("Failed to execute 'createObjectURL' on 'URL': Overload resolution failed.");
  });

  it('Requirement 3: downloadFile properly wraps string data into a Blob and executes download', () => {
    const rawCsvString = 'Ticket Number,Title\nTD-1001,Test';
    downloadFile(rawCsvString, 'test-report.csv', 'text/csv;charset=utf-8;');

    expect(window.URL.createObjectURL).toHaveBeenCalledTimes(1);
    expect(clickTriggered).toBe(true);
    expect(appendedElement).not.toBeNull();
    expect(appendedElement.download).toBe('test-report.csv');
    expect(appendedElement.href).toBe('blob:http://localhost:5173/mock-uuid-1234');
    expect(window.URL.revokeObjectURL).toHaveBeenCalledWith('blob:http://localhost:5173/mock-uuid-1234');
  });

  it('Requirement 3: downloadFile works seamlessly when data is already a valid Blob', () => {
    const blob = new Blob(['Ticket Number,Title\nTD-1001,Test'], { type: 'text/csv' });
    downloadFile(blob, 'report-blob.csv');

    expect(window.URL.createObjectURL).toHaveBeenCalledTimes(1);
    expect(clickTriggered).toBe(true);
    expect(appendedElement.download).toBe('report-blob.csv');
    expect(window.URL.revokeObjectURL).toHaveBeenCalledWith('blob:http://localhost:5173/mock-uuid-1234');
  });

  it('Requirement 3: rejects empty or null data with a clear, meaningful error', () => {
    expect(() => downloadFile(null)).toThrow('The exported file is empty or invalid.');
    expect(() => downloadFile(undefined)).toThrow('The exported file is empty or invalid.');
    expect(() => downloadFile('')).toThrow('The exported file is empty or invalid.');
    expect(() => downloadFile(new Blob([]))).toThrow('The exported file is empty or invalid.');
  });

  it('Requirement 3: safely handles JSON error objects instead of creating corrupt files', () => {
    const errorObj = { success: false, message: 'Organization access revoked' };
    expect(() => downloadFile(errorObj)).toThrow('Organization access revoked');
  });

  it('Requirement 3: always revokes object URL in finally block even if an exception occurs during click', () => {
    mockLink.click = vi.fn(() => {
      throw new Error('Simulated DOM click error');
    });

    const csvData = 'Header1,Header2\nValue1,Value2';
    expect(() => {
      downloadFile(csvData, 'error-test.csv');
    }).toThrow('Simulated DOM click error');

    // Revocation must still occur
    expect(window.URL.revokeObjectURL).toHaveBeenCalledWith('blob:http://localhost:5173/mock-uuid-1234');
  });

  describe('Live Backend API Export Integration', () => {
    let jwt;
    let jwtSecret;

    beforeEach(async () => {
      jwt = (await import('../../backend/node_modules/jsonwebtoken/index.js')).default;
      const { env } = await import('../../backend/src/config/env.js');
      jwtSecret = env.JWT_SECRET;
    });

    it('Requirement 5: successfully exports live database records for authorized admin', async () => {
      const adminToken = jwt.sign(
        { id: '6ae4a0a8e61654672c50a1db', role: 'admin' },
        jwtSecret,
        { expiresIn: '1h' }
      );

      const res = await fetch('http://localhost:5000/api/analytics/export', {
        headers: {
          Authorization: `Bearer ${adminToken}`,
        },
      });

      expect(res.status).toBe(200);
      expect(res.headers.get('content-type')).toContain('text/csv');

      const csvContent = await res.text();
      expect(csvContent).toContain('Ticket Number,Title,Category,Priority,Status');
      // Matches actual database records
      expect(csvContent).toContain('TD-1001');
      expect(csvContent).toContain('TD-1007');

      // Verify downloadFile consumes this live response without throwing
      expect(() => {
        downloadFile(csvContent, 'live-export.csv');
      }).not.toThrow();

      expect(window.URL.createObjectURL).toHaveBeenCalled();
      expect(window.URL.revokeObjectURL).toHaveBeenCalled();
      expect(clickTriggered).toBe(true);
    });

    it('Requirement 5: correctly filters live records by status query parameter', async () => {
      const adminToken = jwt.sign(
        { id: '6ae4a0a8e61654672c50a1db', role: 'admin' },
        jwtSecret,
        { expiresIn: '1h' }
      );

      const res = await fetch('http://localhost:5000/api/analytics/export?status=Open', {
        headers: {
          Authorization: `Bearer ${adminToken}`,
        },
      });

      expect(res.status).toBe(200);
      const csvContent = await res.text();
      const lines = csvContent.trim().split('\n');

      // First line is header
      expect(lines[0]).toContain('Ticket Number');
      // All data rows must have status 'Open'
      for (let i = 1; i < lines.length; i++) {
        expect(lines[i]).toContain('Open');
      }
    });

    it('Requirement 5: denies unauthorized employee with clear 403 Forbidden error message', async () => {
      const employeeToken = jwt.sign(
        { id: '6ae4a0a9e61654672c50a1f0', role: 'employee' },
        jwtSecret,
        { expiresIn: '1h' }
      );

      const res = await fetch('http://localhost:5000/api/analytics/export', {
        headers: {
          Authorization: `Bearer ${employeeToken}`,
        },
      });

      expect(res.status).toBe(403);
      const errorJson = await res.json();
      expect(errorJson.success).toBe(false);
      expect(errorJson.message).toContain("Access denied. Role 'employee' is not authorized");
    });
  });
});


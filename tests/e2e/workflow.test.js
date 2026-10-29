// End-to-end user workflow verification test suite for TechDesk
import { describe, it, expect } from 'vitest';

describe('TechDesk E2E System Health & Workflow Verification', () => {
  it('should verify backend service is reachable on port 5000', async () => {
    const res = await fetch('http://localhost:5000/api/health');
    expect(res.ok).toBe(true);
    const data = await res.json();
    expect(data.data.status).toBe('UP');
  });

  it('should verify frontend service is serving on port 5173', async () => {
    const res = await fetch('http://localhost:5173');
    expect(res.ok).toBe(true);
    const html = await res.text();
    expect(html).toContain('TechDesk');
  });
});

import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';

describe('TechDesk Landing Page Audit & Verification', () => {
  const homeFile = path.resolve('frontend/src/pages/public/Home.jsx');
  const featuresFile = path.resolve('frontend/src/pages/public/Features.jsx');
  const aboutFile = path.resolve('frontend/src/pages/public/About.jsx');

  const homeContent = fs.readFileSync(homeFile, 'utf-8');
  const featuresContent = fs.readFileSync(featuresFile, 'utf-8');
  const aboutContent = fs.readFileSync(aboutFile, 'utf-8');

  it('Requirement 2: removes all misleading demo information and invented statistics', () => {
    const misleadingSnippets = [
      '99.8%',
      '4.2x',
      '4 Tier Access',
      'TD-1042',
      'TD-1041',
      'Selamawit (Cloud Sec)',
      'Tadesse (Hardware)',
      '99.4%',
      '28 Tickets',
      'Live Socket Connected',
    ];

    for (const snippet of misleadingSnippets) {
      expect(homeContent).not.toContain(snippet);
    }
  });

  it('Requirement 3: showcases genuine platform capabilities', () => {
    expect(homeContent).toContain('IT Support & Incident Management');
    expect(homeContent).toContain('Centralized Ticket Tracking');
    expect(homeContent).toContain('Team & Technician Management');
    expect(homeContent).toContain('SLA Monitoring & Escalation');
    expect(homeContent).toContain('Real-Time Notifications');
    expect(homeContent).toContain('Five Role-Based Access Levels');
    expect(homeContent).toContain('Multi-Tenant Data Isolation');
  });

  it('Requirement 3 & 5: presents the five authentic platform roles', () => {
    // Verified across Home, Features, and About
    const combined = homeContent + featuresContent + aboutContent;
    expect(combined).toContain('Super Admin');
    expect(combined).toContain('Organization Admin');
    expect(combined).toContain('Manager');
    expect(combined).toContain('Technician');
    expect(combined).toContain('Employee');
  });

  it('Requirement 5: ticket preview is explicitly labeled as a sample interface preview without private data', () => {
    expect(homeContent).toContain('Interface Preview');
    expect(homeContent).toContain('Network Infrastructure');
    expect(homeContent).toContain('CRITICAL SLA TARGET');
    expect(homeContent).toContain('Assigned: Infrastructure Support Lead');
    expect(homeContent).toContain('Workstation Hardware');
    expect(homeContent).toContain('HIGH PRIORITY');
    expect(homeContent).toContain('Assigned: Hardware Specialist Team');
  });

  it('Requirement 6: deceptive Live Socket Connected indicator is completely removed', () => {
    expect(homeContent).not.toContain('Live Socket Connected');
  });

  it('Requirement 7: design aesthetics (dark navy, cyan/blue gradients) are preserved', () => {
    expect(homeContent).toContain('from-cyan-400 to-blue-600');
    expect(homeContent).toContain('from-cyan-500 to-blue-600');
    expect(homeContent).toContain('dark:bg-navy-950');
    expect(homeContent).toContain('dark:border-navy-800');
    expect(homeContent).toContain('Register Organization');
  });
});

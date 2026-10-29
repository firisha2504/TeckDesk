import React from 'react';
import { Shield, Lock, FileText, Database, UserCheck, AlertTriangle } from 'lucide-react';

export const Privacy = () => {
  return (
    <div className="py-12 md:py-20 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
      {/* Header */}
      <div className="space-y-4">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 text-xs font-semibold">
          <Shield className="w-3.5 h-3.5" />
          <span>Security & Governance</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight">
          Privacy Policy
        </h1>
        <p className="text-xs text-slate-400">
          Last Updated: October 2026 &bull; Technical Architecture Compliance
        </p>
      </div>

      {/* Legal Review Disclaimer */}
      <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-800 dark:text-amber-300 text-xs flex items-start gap-3">
        <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5 text-amber-500" />
        <p className="leading-relaxed">
          <strong>Notice:</strong> This document outlines the technical data architecture and privacy controls implemented in the TechDesk platform. Organization-specific legal terms and jurisdictional compliance (e.g. GDPR, HIPAA, SOC 2) must be reviewed by legal counsel prior to enterprise production deployment.
        </p>
      </div>

      {/* Policy Sections */}
      <div className="space-y-10 text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
        {/* Section 1 */}
        <section className="space-y-3">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <UserCheck className="w-4 h-4 text-cyan-500" /> 1. Account Information
          </h2>
          <p>
            When an account is provisioned in TechDesk, we collect basic corporate profile data including user full names, work email addresses, assigned departments, and cryptographic password hashes. Passwords are never stored in plain text; they are hashed with salted bcrypt (cost factor 10) on the server before storage in the database.
          </p>
        </section>

        {/* Section 2 */}
        <section className="space-y-3">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <FileText className="w-4 h-4 text-cyan-500" /> 2. Ticket Data & Diagnostic Records
          </h2>
          <p>
            Incident records, titles, descriptions, priority tags, and public comments are stored to track service fulfillment and enforce Service Level Agreements (SLAs). Internal diagnostic notes submitted by technicians are visible strictly to authorized support personnel and are never exposed to employee accounts.
          </p>
        </section>

        {/* Section 3 */}
        <section className="space-y-3">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Database className="w-4 h-4 text-cyan-500" /> 3. Uploaded Attachments & Logs
          </h2>
          <p>
            Attachments uploaded to support tickets (e.g., error screenshots, log files) are validated for allowed MIME types and file size limits. Attachments are scoped to the originating organization and ticket, and access is restricted to authenticated parties with appropriate role-based permissions.
          </p>
        </section>

        {/* Section 4 */}
        <section className="space-y-3">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Lock className="w-4 h-4 text-cyan-500" /> 4. Access Permissions & Role-Based Scoping
          </h2>
          <p>
            TechDesk operates on strict Role-Based Access Control (RBAC):
          </p>
          <ul className="list-disc pl-5 space-y-1.5 text-xs">
            <li><strong>Employees:</strong> May only create, view, and comment on tickets they have authored.</li>
            <li><strong>Technicians:</strong> Access incidents assigned to them or their team specialties.</li>
            <li><strong>Managers:</strong> Access department-wide queues, SLA compliance analytics, and team workloads.</li>
            <li><strong>Administrators:</strong> Configure tenant settings, user roles, categories, and review audit trails.</li>
          </ul>
        </section>

        {/* Section 5 */}
        <section className="space-y-3">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Shield className="w-4 h-4 text-cyan-500" /> 5. Data Security & Anti-Leak Architecture
          </h2>
          <p>
            TechDesk enforces multi-tenant database scoping, secure HTTP-only session cookies with CSRF/SameSite flags, Helmet security headers, rate limiting on sensitive authentication routes, and zero-exposure password resets. Reset tokens are single-use, expire in 1 hour, and are saved only as SHA-256 hashes—never logged to audit trails or returned in API responses.
          </p>
        </section>

        {/* Section 6 */}
        <section className="space-y-3">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Clock className="w-4 h-4 text-cyan-500" /> 6. Data Retention & System Audit Trail
          </h2>
          <p>
            Closed incidents and associated audit logs are retained in accordance with the tenant organization's data retention policies. Audit logs capture the acting user, resource type, action identifier, and timestamp for security compliance, while strictly suppressing credential data.
          </p>
        </section>

        {/* Section 7 */}
        <section className="space-y-3">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <UserCheck className="w-4 h-4 text-cyan-500" /> 7. User Rights & Inquiries
          </h2>
          <p>
            Users may request corrections to their profile information or review their authored ticket history through their user profile. Data removal or export requests should be directed to your organization's designated TechDesk Administrator.
          </p>
        </section>
      </div>
    </div>
  );
};

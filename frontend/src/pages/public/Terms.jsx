import React from 'react';
import { FileCheck, Shield, CheckCircle, AlertTriangle, Scale, Server } from 'lucide-react';

export const Terms = () => {
  return (
    <div className="py-12 md:py-20 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
      {/* Header */}
      <div className="space-y-4">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 text-xs font-semibold">
          <Scale className="w-3.5 h-3.5" />
          <span>Legal Agreement</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight">
          Terms and Conditions
        </h1>
        <p className="text-xs text-slate-400">
          Last Updated: October 2026 &bull; Enterprise Platform Terms
        </p>
      </div>

      {/* Production Legal Disclaimer */}
      <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-800 dark:text-amber-300 text-xs flex items-start gap-3">
        <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5 text-amber-500" />
        <p className="leading-relaxed">
          <strong>Review Notice:</strong> These Terms and Conditions govern the platform usage guidelines, ticket resolution workflows, and operational boundaries of TechDesk. Prior to production enterprise onboarding, terms must be customized and formally reviewed by authorized organizational legal counsel.
        </p>
      </div>

      {/* Terms Sections */}
      <div className="space-y-10 text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
        {/* Section 1 */}
        <section className="space-y-3">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-cyan-500" /> 1. Acceptable Use Policy
          </h2>
          <p>
            TechDesk is designed exclusively for authorized corporate incident management, hardware/software triage, and internal IT service delivery. Users agree not to misuse the ticketing system, upload malicious or copyrighted files, attempt unauthorized privilege escalation, or interfere with background SLA monitoring services.
          </p>
        </section>

        {/* Section 2 */}
        <section className="space-y-3">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Shield className="w-4 h-4 text-cyan-500" /> 2. User Responsibilities & Account Security
          </h2>
          <p>
            Users are responsible for safeguarding their login credentials and session tokens. Password fields are strictly masked in client interfaces. Sharing account credentials between employees or attempting to impersonate system administrators is strictly prohibited and subject to immediate administrative deactivation.
          </p>
        </section>

        {/* Section 3 */}
        <section className="space-y-3">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <FileCheck className="w-4 h-4 text-cyan-500" /> 3. Ticket Handling & SLA Disclaimers
          </h2>
          <p>
            While TechDesk provides automated SLA tracking and priority-based notifications (Critical: 15m response / 2h resolution targets), actual resolution times are subject to hardware availability, vendor dependency, and technician capacity. Automated breach warnings serve operational coordination purposes and do not constitute an independent legal warranty.
          </p>
        </section>

        {/* Section 4 */}
        <section className="space-y-3">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Server className="w-4 h-4 text-cyan-500" /> 4. Service Availability & Maintenance
          </h2>
          <p>
            TechDesk is engineered for high availability with real-time Socket.IO synchronization, persistent BullMQ Redis queues, and Docker containerization. Periodic maintenance, background queue upgrades, and scheduled database backups may be conducted with advance notice from system administrators.
          </p>
        </section>

        {/* Section 5 */}
        <section className="space-y-3">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Scale className="w-4 h-4 text-cyan-500" /> 5. Policy Updates & Modifications
          </h2>
          <p>
            The system operators reserve the right to update these terms to reflect new platform capabilities, regulatory security updates, or workflow enhancements. Notice of significant policy updates will be provided through system notifications or corporate administrative announcements.
          </p>
        </section>
      </div>
    </div>
  );
};

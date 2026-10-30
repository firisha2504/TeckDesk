import React from 'react';
import { Link } from 'react-router-dom';
import {
  Shield,
  Target,
  Users,
  Wrench,
  Briefcase,
  UserCheck,
  CheckCircle2,
  Lock,
  ArrowRight,
  Headphones,
  Zap,
  Clock,
  ShieldCheck
} from 'lucide-react';

export const About = () => {
  const roles = [
    {
      title: 'Platform Super Administrators',
      icon: Shield,
      color: 'text-amber-500 bg-amber-500/10',
      description:
        'Oversee multi-tenant infrastructure, review and approve new institutional registrations, manage tenant lifecycles, and monitor platform-wide security audit trails.',
    },
    {
      title: 'Organization Administrators',
      icon: ShieldCheck,
      color: 'text-rose-500 bg-rose-500/10',
      description:
        'Govern organization-wide policies, configure priority response thresholds, manage user provisioning, enforce tenant isolation, and audit every system interaction through immutable security logs.',
    },
    {
      title: 'IT & Department Managers',
      icon: Briefcase,
      color: 'text-purple-500 bg-purple-500/10',
      description:
        'Oversee team capacity in real time, monitor SLA breach risks before they occur, manage team rosters, and generate compliance reports with automated CSV exports for executive review.',
    },
    {
      title: 'Support Technicians',
      icon: Wrench,
      color: 'text-cyan-500 bg-cyan-500/10',
      description:
        'Work from a structured queue sorted by urgency and SLA deadline. Utilize private diagnostic notes for internal troubleshooting, access detailed incident specifications, and manage workloads.',
    },
    {
      title: 'Employees & End-Users',
      icon: Users,
      color: 'text-blue-500 bg-blue-500/10',
      description:
        'Submit technical issues in seconds without navigating confusing email chains. Receive live progress alerts, reply directly to technician notes, and know exactly when their problem will be resolved.',
    },
  ];

  return (
    <div className="py-12 md:py-20 space-y-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      {/* Hero */}
      <div className="text-center max-w-3xl mx-auto space-y-4">
        <span className="text-xs font-bold uppercase tracking-wider text-cyan-500">
          Our Mission & Vision
        </span>
        <h1 className="text-4xl sm:text-5xl font-extrabold text-slate-900 dark:text-white tracking-tight">
          Transforming IT Support from Chaos into Clarity
        </h1>
        <p className="text-base sm:text-lg text-slate-600 dark:text-slate-300 leading-relaxed">
          TechDesk was built with a single objective: to replace slow, opaque, email-based IT support with an intelligent, automated, and accountable incident management system.
        </p>
      </div>

      {/* The Problem We Solve */}
      <div className="rounded-3xl border border-slate-200 dark:border-navy-800 bg-white dark:bg-navy-900/60 p-8 sm:p-12 shadow-lg space-y-8">
        <div className="max-w-2xl space-y-3">
          <span className="text-xs font-bold uppercase tracking-wider text-cyan-500">The Problem</span>
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white">
            Why Traditional IT Service Delivery Breaks Down
          </h2>
          <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
            In many organizations, IT requests become buried in shared inboxes, Slack direct messages, and spreadsheets. Technicians are interrupted constantly, urgent outages compete with password resets, and managers have zero visibility into true SLA compliance until it is too late.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4 border-t border-slate-100 dark:border-navy-800">
          <div className="space-y-2">
            <h4 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Clock className="w-4 h-4 text-rose-500" /> Missed SLA Deadlines
            </h4>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              Without automated countdowns and proactive escalation triggers, high-severity issues sit unresolved.
            </p>
          </div>
          <div className="space-y-2">
            <h4 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Zap className="w-4 h-4 text-amber-500" /> Uneven Technician Load
            </h4>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              Senior engineers get overwhelmed while junior technicians lack matched tickets suited to their specialties.
            </p>
          </div>
          <div className="space-y-2">
            <h4 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Shield className="w-4 h-4 text-cyan-500" /> Lack of Accountability
            </h4>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              No audit trail exists to verify who made changes, when an incident was acknowledged, or why it was closed.
            </p>
          </div>
        </div>
      </div>

      {/* Role Benefits */}
      <div className="space-y-8">
        <div className="text-center max-w-2xl mx-auto space-y-2">
          <span className="text-xs font-bold uppercase tracking-wider text-cyan-500">Tailored Experience</span>
          <h2 className="text-3xl font-extrabold text-slate-900 dark:text-white">
            Empowering Every Role in the Organization
          </h2>
          <p className="text-sm text-slate-600 dark:text-slate-400">
            Four specialized interfaces designed specifically for how each team member works.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {roles.map((role, idx) => {
            const Icon = role.icon;
            return (
              <div
                key={idx}
                className="p-8 rounded-3xl border border-slate-200 dark:border-navy-800 bg-white dark:bg-navy-900/60 shadow-md space-y-4"
              >
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${role.color}`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white">{role.title}</h3>
                </div>
                <p className="text-sm leading-relaxed text-slate-600 dark:text-slate-400">
                  {role.description}
                </p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Security & Reliability Section */}
      <div className="rounded-3xl bg-slate-100/80 dark:bg-navy-900/40 border border-slate-200 dark:border-navy-800 p-8 sm:p-12">
        <div className="max-w-3xl mx-auto text-center space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 text-cyan-500 mx-auto flex items-center justify-center">
            <Lock className="w-6 h-6" />
          </div>
          <h3 className="text-2xl font-bold text-slate-900 dark:text-white">
            Security & Compliance at the Core
          </h3>
          <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
            TechDesk is engineered with defense-in-depth principles: salted bcrypt password hashing, HTTP-only secure cookie authentication, single-use SHA-256 password resets, multi-tenant database isolation, and immutable audit logs that record all system interactions without exposing sensitive user tokens or credentials.
          </p>
          <div className="pt-4 flex flex-wrap items-center justify-center gap-3 text-xs text-slate-500 dark:text-slate-400 font-medium">
            <span className="px-3 py-1 rounded-full bg-white dark:bg-navy-800 border border-slate-200 dark:border-navy-700">
              Zero-Leak Token Architecture
            </span>
            <span className="px-3 py-1 rounded-full bg-white dark:bg-navy-800 border border-slate-200 dark:border-navy-700">
              Anti-Enumeration Responses
            </span>
            <span className="px-3 py-1 rounded-full bg-white dark:bg-navy-800 border border-slate-200 dark:border-navy-700">
              Persistent BullMQ & Redis Backing
            </span>
          </div>
        </div>
      </div>

      {/* CTA */}
      <div className="text-center space-y-4">
        <h3 className="text-2xl font-bold text-slate-900 dark:text-white">Ready to explore TechDesk?</h3>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Try our role-specific interactive dashboards today.
        </p>
        <Link
          to="/login"
          className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-navy-950 font-bold text-sm shadow-md transition-all hover:scale-105"
        >
          <span>Sign In to Experience</span>
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    </div>
  );
};

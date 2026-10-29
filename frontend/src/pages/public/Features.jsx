import React from 'react';
import { Link } from 'react-router-dom';
import {
  FileText,
  UserCheck,
  AlertTriangle,
  MessageSquare,
  Clock,
  Bell,
  BarChart,
  Shield,
  ArrowRight,
  CheckCircle,
  Cpu,
  Layers,
  Lock,
  Zap
} from 'lucide-react';

export const Features = () => {
  const deepDiveFeatures = [
    {
      id: 'ticket-management',
      icon: FileText,
      badge: 'Core Engine',
      title: 'Ticket Creation & Deterministic Tracking',
      description:
        'Every incident begins with an intuitive submission flow where employees provide categorized diagnostics, priority declarations, and attachments. Tickets receive human-readable identifiers (e.g. TD-1001) and follow a deterministic state machine: Open → Assigned → In Progress → Pending User → Resolved → Closed.',
      bullets: [
        'Deterministic state transitions prevent invalid lifecycle jumps.',
        'Human-readable ticket numbering with global sequence uniqueness.',
        'Rich multi-file attachments supporting diagnostics, screenshots, and logs.',
      ],
    },
    {
      id: 'smart-assignment',
      icon: UserCheck,
      badge: 'Automated Routing',
      title: 'Skill-Based & Workload-Aware Technician Assignment',
      description:
        'Eliminate manual assignment delays. TechDesk inspects ticket categories, matches them against technician specialties (Hardware, Cloud, Networking, Security), and assigns the incident to the qualified technician with the lowest active workload.',
      bullets: [
        'Team specialty matching for focused incident resolution.',
        'Live workload balancing prevents technician burnout.',
        'Manual override and reassignment queue available for Managers.',
      ],
    },
    {
      id: 'priorities-status',
      icon: AlertTriangle,
      badge: 'Triage Control',
      title: 'Granular Priorities & Service Statuses',
      description:
        'From minor software glitches to mission-critical infrastructure outages, incidents are categorized across Critical, High, Medium, and Low priorities with clear visual indicators and SLA timers that automatically adapt.',
      bullets: [
        'Color-coded priority badges with high-contrast accessibility.',
        'Dynamic deadline adjustments based on organizational SLA rules.',
        'Real-time status updates broadcast across stakeholder interfaces.',
      ],
    },
    {
      id: 'collaboration',
      icon: MessageSquare,
      badge: 'Real-Time Communication',
      title: 'Internal Notes, Public Comments & Attachments',
      description:
        'Technicians can collaborate using internal diagnostic notes hidden from end-users, while maintaining public conversation threads for user updates. File uploads are sanitized and accessible directly from the ticket timeline.',
      bullets: [
        'Dual-stream messaging: public customer updates vs. private internal notes.',
        'Drag-and-drop secure file attachment uploads up to 10MB.',
        'Real-time typing feedback and instant message broadcasting.',
      ],
    },
    {
      id: 'sla-engine',
      icon: Clock,
      badge: 'Guaranteed Delivery',
      title: 'Configurable SLA Deadlines & Auto-Escalation',
      description:
        'Enforce Service Level Agreements deterministically. Critical tickets require response within 15 minutes and resolution within 2 hours. A background monitor continuously scans active tickets and auto-escalates breaching incidents.',
      bullets: [
        'Configurable response and resolution targets per priority.',
        'Automated background breach detection running every 60 seconds.',
        'Automatic escalation notifications to department managers.',
      ],
    },
    {
      id: 'real-time-notifications',
      icon: Bell,
      badge: 'Instant Sync',
      title: 'Socket.IO Real-Time Notification Center',
      description:
        'Never miss an urgent ticket assignment or customer reply. In-app notification bells update instantly with unread counters, audio cues, and direct navigation links to the relevant incident.',
      bullets: [
        'Room-scoped WebSocket connections ensuring tenant isolation.',
        'Mark individual or all notifications as read in one click.',
        'Instant desktop badge updates without requiring page refreshes.',
      ],
    },
    {
      id: 'analytics-reports',
      icon: BarChart,
      badge: 'Executive Visibility',
      title: 'Executive Analytics & Performance Reporting',
      description:
        'Harness MongoDB aggregation pipelines for real-time visibility into department ticket volumes, priority distributions, average resolution times, and individual technician resolution throughput.',
      bullets: [
        'Interactive Recharts donut charts and resolution velocity line graphs.',
        'SLA compliance rate percentages and breach audit metrics.',
        'Authorized CSV export for stakeholder compliance audits.',
      ],
    },
    {
      id: 'security-audit',
      icon: Shield,
      badge: 'Enterprise Security',
      title: 'Immutable Audit Logging & 4-Tier Access Control',
      description:
        'Enterprise security at every layer: HTTP-only session cookies, bcrypt password hashing, single-use SHA-256 password resets, multi-tenant organization scoping, and tamper-proof audit trails for all system actions.',
      bullets: [
        'Strict Role-Based Access Control (Employee, Technician, Manager, Admin).',
        'Immutable audit trail recording actor, action, timestamp, and IP.',
        'Zero token exposure in audit logs, API responses, or client messages.',
      ],
    },
  ];

  return (
    <div className="py-12 md:py-20 space-y-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="text-center max-w-3xl mx-auto space-y-4">
        <span className="text-xs font-bold uppercase tracking-wider text-cyan-500">
          Feature Architecture
        </span>
        <h1 className="text-4xl sm:text-5xl font-extrabold text-slate-900 dark:text-white tracking-tight">
          Enterprise Features Built for Scalable IT Operations
        </h1>
        <p className="text-base sm:text-lg text-slate-600 dark:text-slate-300">
          Explore the tools and automation engineered into TechDesk to streamline incident management, enforce accountability, and speed up resolution times.
        </p>
      </div>

      {/* Feature Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {deepDiveFeatures.map((feat) => {
          const Icon = feat.icon;
          return (
            <div
              key={feat.id}
              className="rounded-3xl border border-slate-200 dark:border-navy-800 bg-white dark:bg-navy-900/60 p-8 shadow-md hover:shadow-xl transition-all space-y-5"
            >
              <div className="flex items-center justify-between">
                <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 dark:bg-cyan-500/20 text-cyan-600 dark:text-cyan-400 flex items-center justify-center">
                  <Icon className="w-6 h-6" />
                </div>
                <span className="text-[11px] font-bold uppercase tracking-wider px-3 py-1 rounded-full bg-slate-100 dark:bg-navy-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-navy-700">
                  {feat.badge}
                </span>
              </div>

              <div>
                <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                  {feat.title}
                </h3>
                <p className="text-sm text-slate-600 dark:text-slate-400 mt-2 leading-relaxed">
                  {feat.description}
                </p>
              </div>

              <div className="pt-2 border-t border-slate-100 dark:border-navy-800 space-y-2">
                {feat.bullets.map((bullet, idx) => (
                  <div key={idx} className="flex items-start gap-2.5 text-xs text-slate-700 dark:text-slate-300">
                    <CheckCircle className="w-4 h-4 text-cyan-500 shrink-0 mt-0.5" />
                    <span>{bullet}</span>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* Bottom CTA */}
      <div className="rounded-3xl bg-gradient-to-r from-navy-900 to-blue-950 p-8 sm:p-12 text-center text-white space-y-6 shadow-2xl">
        <h3 className="text-2xl sm:text-3xl font-extrabold">
          Experience TechDesk in Action
        </h3>
        <p className="text-sm text-slate-300 max-w-xl mx-auto">
          Sign in using our pre-configured role accounts or create a new organization to see how TechDesk transforms support delivery.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link
            to="/login"
            className="w-full sm:w-auto px-7 py-3 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-navy-950 font-bold text-sm shadow-lg transition-transform hover:scale-105"
          >
            Sign In with Demo Accounts
          </Link>
          <Link
            to="/register"
            className="w-full sm:w-auto px-7 py-3 rounded-xl border border-white/20 hover:bg-white/10 text-white font-semibold text-sm transition-colors"
          >
            Create Support Account
          </Link>
        </div>
      </div>
    </div>
  );
};

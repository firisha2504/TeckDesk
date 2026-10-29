import React from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  Headphones,
  CheckCircle2,
  Clock,
  ShieldCheck,
  Zap,
  BarChart3,
  Bell,
  Users,
  Layers,
  Sparkles,
  LifeBuoy,
  ChevronRight,
  FileText
} from 'lucide-react';

export const Home = () => {
  const featureList = [
    {
      icon: Layers,
      title: 'Ticket Management',
      description: 'Centralize incidents and service requests with deterministic status lifecycles, rich attachments, and internal triage notes.',
      color: 'from-blue-500 to-indigo-600',
    },
    {
      icon: Zap,
      title: 'Smart Assignment',
      description: 'Intelligent routing automatically assigns tickets based on technician skill match, team specialties, and active workloads.',
      color: 'from-cyan-400 to-blue-500',
    },
    {
      icon: Clock,
      title: 'SLA Tracking & Escalation',
      description: 'Automated deadline timers by priority with background escalations, preventing critical incidents from slipping through the cracks.',
      color: 'from-amber-400 to-orange-500',
    },
    {
      icon: Bell,
      title: 'Real-Time Notifications',
      description: 'Instant Socket.IO push updates for assignment alerts, status transitions, and stakeholder conversation replies.',
      color: 'from-emerald-400 to-teal-500',
    },
    {
      icon: BarChart3,
      title: 'Executive Analytics',
      description: 'Interactive Recharts dashboards tracking ticket trends, mean time to resolution (MTTR), SLA compliance, and team performance.',
      color: 'from-purple-500 to-pink-500',
    },
    {
      icon: ShieldCheck,
      title: 'Audit Logs & RBAC',
      description: 'Granular multi-tenant isolation, role-based access for 4 distinct user tiers, and an immutable system audit trail.',
      color: 'from-rose-500 to-red-600',
    },
  ];

  const steps = [
    {
      number: '01',
      title: 'Submit a Ticket',
      description: 'Employees report issues in seconds with attachments, severity levels, and category tagging.',
      icon: FileText,
    },
    {
      number: '02',
      title: 'Resolve the Issue',
      description: 'Qualified technicians receive auto-routed incidents, collaborate in real time, and document diagnostics.',
      icon: LifeBuoy,
    },
    {
      number: '03',
      title: 'Track Performance',
      description: 'Managers monitor SLA compliance, resolution velocity, and team workload through live metrics.',
      icon: BarChart3,
    },
  ];

  const benefits = [
    {
      title: 'Faster Resolution Times',
      description: 'Eliminate manual triage bottlenecks with automated routing and priority-based SLA queues that keep technicians focused.',
    },
    {
      title: 'Complete Accountability',
      description: 'Every status transition, internal note, and assignment is tracked in an immutable, auditable event timeline.',
    },
    {
      title: 'End-to-End Visibility',
      description: 'Employees view real-time ticket progress while managers and executives access unified cross-department metrics.',
    },
  ];

  return (
    <div className="space-y-24 py-12 md:py-20 overflow-hidden">
      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
          {/* Hero Left Content */}
          <div className="lg:col-span-7 space-y-8 text-center lg:text-left">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-600 dark:text-cyan-400 text-xs font-semibold">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Next-Gen Enterprise Incident Management</span>
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-slate-900 dark:text-white leading-[1.15]">
              IT Support, <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-600">Simplified.</span>
            </h1>

            <p className="text-lg sm:text-xl text-slate-600 dark:text-slate-300 leading-relaxed max-w-2xl mx-auto lg:mx-0">
              TechDesk helps modern organizations manage support tickets, resolve critical incidents faster, automate SLA compliance, and deliver exceptional IT service experiences.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4">
              <Link
                to="/register"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-2xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-bold text-base shadow-xl shadow-cyan-500/25 transition-all hover:scale-[1.02]"
              >
                <span>Get Started</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                to="/features"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-2xl bg-slate-100 hover:bg-slate-200 dark:bg-navy-900 dark:hover:bg-navy-800 text-slate-800 dark:text-slate-200 font-semibold text-base border border-slate-300 dark:border-navy-750 transition-colors"
              >
                <span>Explore Features</span>
                <ChevronRight className="w-4 h-4 text-slate-400" />
              </Link>
            </div>

            {/* Quick Proof Points */}
            <div className="pt-6 border-t border-slate-200 dark:border-navy-800/80 grid grid-cols-3 gap-4 text-center lg:text-left">
              <div>
                <p className="text-2xl font-extrabold text-slate-900 dark:text-white">99.8%</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">SLA Met Target</p>
              </div>
              <div>
                <p className="text-2xl font-extrabold text-cyan-500">4.2x</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">Faster Resolution</p>
              </div>
              <div>
                <p className="text-2xl font-extrabold text-slate-900 dark:text-white">Role-Based</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">4 Tier Access</p>
              </div>
            </div>
          </div>

          {/* Hero Right: Product Preview UI Mockup */}
          <div className="lg:col-span-5 relative">
            <div className="absolute -inset-4 bg-gradient-to-r from-cyan-500/20 to-blue-600/20 rounded-3xl blur-2xl pointer-events-none" />
            <div className="relative rounded-3xl border border-slate-200 dark:border-navy-800 bg-white dark:bg-navy-900 shadow-2xl p-6 overflow-hidden">
              {/* Mockup Header */}
              <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-navy-800">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-rose-500" />
                  <div className="w-3 h-3 rounded-full bg-amber-500" />
                  <div className="w-3 h-3 rounded-full bg-emerald-500" />
                  <span className="ml-2 text-xs font-mono text-slate-400">app.techdesk.internal</span>
                </div>
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                  Live Socket Connected
                </span>
              </div>

              {/* Mockup Live Ticket Stream */}
              <div className="mt-4 space-y-3">
                <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-navy-950/70 border border-slate-200/70 dark:border-navy-800">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono font-bold text-cyan-600 dark:text-cyan-400">TD-1042</span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-rose-500/10 text-rose-500 border border-rose-500/20">
                      CRITICAL SLA (14m remaining)
                    </span>
                  </div>
                  <p className="text-sm font-semibold text-slate-900 dark:text-slate-100 mt-1">
                    VPN Gateway authentication timeout
                  </p>
                  <div className="flex items-center justify-between mt-2 text-[11px] text-slate-500 dark:text-slate-400">
                    <span>Assigned to: Selamawit (Cloud Sec)</span>
                    <span className="text-amber-500 font-medium">In Progress</span>
                  </div>
                </div>

                <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-navy-950/70 border border-slate-200/70 dark:border-navy-800">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono font-bold text-cyan-600 dark:text-cyan-400">TD-1041</span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-500/10 text-blue-500 border border-blue-500/20">
                      HIGH
                    </span>
                  </div>
                  <p className="text-sm font-semibold text-slate-900 dark:text-slate-100 mt-1">
                    Development workstation kernel panic
                  </p>
                  <div className="flex items-center justify-between mt-2 text-[11px] text-slate-500 dark:text-slate-400">
                    <span>Assigned to: Tadesse (Hardware)</span>
                    <span className="text-cyan-500 font-medium">Auto-Routed</span>
                  </div>
                </div>

                {/* Simulated Stats Strip */}
                <div className="grid grid-cols-2 gap-2 pt-2">
                  <div className="p-2.5 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-center">
                    <p className="text-[10px] font-semibold text-cyan-600 dark:text-cyan-400">SLA COMPLIANCE</p>
                    <p className="text-lg font-bold text-slate-900 dark:text-white">99.4%</p>
                  </div>
                  <div className="p-2.5 rounded-xl bg-purple-500/10 border border-purple-500/20 text-center">
                    <p className="text-[10px] font-semibold text-purple-600 dark:text-purple-400">RESOLVED TODAY</p>
                    <p className="text-lg font-bold text-slate-900 dark:text-white">28 Tickets</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Feature Cards Grid */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
          <h2 className="text-xs font-bold uppercase tracking-wider text-cyan-500">Core Capabilities</h2>
          <h3 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white">
            Everything Required for Modern IT Service Delivery
          </h3>
          <p className="text-base text-slate-600 dark:text-slate-400">
            A comprehensive suite of enterprise incident management tools designed for high-velocity technology teams.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {featureList.map((feat, index) => {
            const Icon = feat.icon;
            return (
              <div
                key={index}
                className="group relative rounded-3xl border border-slate-200 dark:border-navy-800 bg-white dark:bg-navy-900/60 p-8 shadow-lg hover:shadow-2xl transition-all duration-300 hover:-translate-y-1"
              >
                <div className={`w-12 h-12 rounded-2xl bg-gradient-to-tr ${feat.color} flex items-center justify-center text-white mb-6 shadow-md`}>
                  <Icon className="w-6 h-6" />
                </div>
                <h4 className="text-lg font-bold text-slate-900 dark:text-white mb-2">
                  {feat.title}
                </h4>
                <p className="text-sm leading-relaxed text-slate-600 dark:text-slate-400">
                  {feat.description}
                </p>
              </div>
            );
          })}
        </div>
      </section>

      {/* How It Works Section */}
      <section className="bg-slate-100/70 dark:bg-navy-900/40 py-20 border-y border-slate-200 dark:border-navy-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
            <h2 className="text-xs font-bold uppercase tracking-wider text-cyan-500">Process & Workflow</h2>
            <h3 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white">
              How TechDesk Works
            </h3>
            <p className="text-base text-slate-600 dark:text-slate-400">
              From issue reporting to verified resolution in three seamless, automated stages.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
            {steps.map((step, index) => {
              const StepIcon = step.icon;
              return (
                <div
                  key={index}
                  className="rounded-3xl border border-slate-200 dark:border-navy-800 bg-white dark:bg-navy-900 p-8 relative space-y-4"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-2xl font-black text-cyan-500/80 font-mono">
                      {step.number}
                    </span>
                    <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-navy-800 flex items-center justify-center text-slate-700 dark:text-slate-300">
                      <StepIcon className="w-5 h-5" />
                    </div>
                  </div>
                  <h4 className="text-lg font-bold text-slate-900 dark:text-white">
                    {step.title}
                  </h4>
                  <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                    {step.description}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="rounded-3xl bg-gradient-to-br from-navy-900 via-navy-850 to-blue-950 text-white p-8 sm:p-12 lg:p-16 relative overflow-hidden shadow-2xl">
          <div className="absolute top-0 right-0 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-6">
              <span className="text-xs font-bold uppercase tracking-wider text-cyan-400">
                Measurable Impact
              </span>
              <h3 className="text-3xl sm:text-4xl font-extrabold tracking-tight leading-tight">
                Designed to Eliminate IT Friction and Empower Teams
              </h3>
              <p className="text-slate-300 text-base leading-relaxed">
                By pairing skill-based routing with enforceable SLA policies and real-time Socket.IO collaboration, TechDesk reduces operational chaos and delivers total transparency.
              </p>
              <div className="pt-2">
                <Link
                  to="/about"
                  className="inline-flex items-center gap-2 text-sm font-semibold text-cyan-400 hover:text-cyan-300"
                >
                  <span>Learn more about our methodology</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>

            <div className="space-y-4">
              {benefits.map((benefit, i) => (
                <div key={i} className="flex gap-4 p-5 rounded-2xl bg-navy-800/60 border border-navy-700/60 backdrop-blur-sm">
                  <CheckCircle2 className="w-6 h-6 text-cyan-400 shrink-0 mt-0.5" />
                  <div>
                    <h5 className="text-sm font-bold text-white mb-1">{benefit.title}</h5>
                    <p className="text-xs text-slate-300 leading-relaxed">{benefit.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Bottom Call to Action Section */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-6">
        <h3 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white">
          Ready to Modernize Your IT Support?
        </h3>
        <p className="text-base text-slate-600 dark:text-slate-400 max-w-xl mx-auto">
          Join thousands of organizations transforming their incident resolution with automated SLA tracking and intelligent auto-routing.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2">
          <Link
            to="/register"
            className="w-full sm:w-auto px-8 py-3.5 rounded-2xl bg-cyan-500 hover:bg-cyan-400 text-navy-950 font-bold text-base shadow-xl shadow-cyan-500/20 transition-all hover:scale-[1.02]"
          >
            Get Started Now
          </Link>
          <Link
            to="/login"
            className="w-full sm:w-auto px-8 py-3.5 rounded-2xl bg-white dark:bg-navy-900 text-slate-800 dark:text-slate-200 font-semibold text-base border border-slate-300 dark:border-navy-700 hover:bg-slate-50 dark:hover:bg-navy-850 transition-colors"
          >
            Access Demo Accounts
          </Link>
        </div>
      </section>
    </div>
  );
};

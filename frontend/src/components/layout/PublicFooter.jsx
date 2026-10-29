import React from 'react';
import { Link } from 'react-router-dom';
import { Headphones, Shield, Activity, Heart } from 'lucide-react';

export const PublicFooter = () => {
  return (
    <footer className="border-t border-slate-200 dark:border-navy-800 bg-slate-50 dark:bg-navy-950 text-slate-600 dark:text-slate-400 text-sm transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 lg:gap-12">
          {/* Brand Info */}
          <div className="md:col-span-1 space-y-4">
            <Link to="/" className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-cyan-400 to-blue-600 flex items-center justify-center text-white shadow-md shadow-cyan-500/20">
                <Headphones className="w-4 h-4" />
              </div>
              <span className="text-lg font-bold tracking-tight text-slate-900 dark:text-slate-100">
                Tech<span className="text-cyan-400">Desk</span>
              </span>
            </Link>
            <p className="text-xs leading-relaxed text-slate-500 dark:text-slate-400">
              Smart IT Support and Incident Management System designed to accelerate ticket resolution, automate SLA enforcement, and empower IT teams.
            </p>
            <div className="flex items-center gap-2 text-xs text-emerald-600 dark:text-emerald-400 font-medium">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>All Systems Operational</span>
            </div>
          </div>

          {/* Navigation Links */}
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-900 dark:text-slate-200 mb-4">
              Product & Capabilities
            </h4>
            <ul className="space-y-2.5 text-xs">
              <li>
                <Link to="/features" className="hover:text-cyan-500 transition-colors">
                  Overview of Features
                </Link>
              </li>
              <li>
                <Link to="/features" className="hover:text-cyan-500 transition-colors">
                  Smart Skill-Based Routing
                </Link>
              </li>
              <li>
                <Link to="/features" className="hover:text-cyan-500 transition-colors">
                  Automated SLA Engine
                </Link>
              </li>
              <li>
                <Link to="/features" className="hover:text-cyan-500 transition-colors">
                  Real-Time Socket Collaboration
                </Link>
              </li>
              <li>
                <Link to="/features" className="hover:text-cyan-500 transition-colors">
                  Executive Analytics & Reports
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-900 dark:text-slate-200 mb-4">
              Company & Help
            </h4>
            <ul className="space-y-2.5 text-xs">
              <li>
                <Link to="/about" className="hover:text-cyan-500 transition-colors">
                  About TechDesk
                </Link>
              </li>
              <li>
                <Link to="/contact" className="hover:text-cyan-500 transition-colors">
                  Contact Support
                </Link>
              </li>
              <li>
                <Link to="/login" className="hover:text-cyan-500 transition-colors">
                  Sign In to Portal
                </Link>
              </li>
              <li>
                <Link to="/register" className="hover:text-cyan-500 transition-colors">
                  Create Support Account
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-900 dark:text-slate-200 mb-4">
              Legal & Trust
            </h4>
            <ul className="space-y-2.5 text-xs">
              <li>
                <Link to="/privacy" className="hover:text-cyan-500 transition-colors">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link to="/terms" className="hover:text-cyan-500 transition-colors">
                  Terms and Conditions
                </Link>
              </li>
              <li>
                <span className="text-slate-400 dark:text-slate-500 text-[11px] block mt-2">
                  Role-Based Access Control • Single-Use Token Security • Immutable Audit Trail
                </span>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-12 pt-8 border-t border-slate-200 dark:border-navy-800 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-400">
          <p>&copy; {new Date().getFullYear()} TechDesk Enterprise. All rights reserved.</p>
          <div className="flex items-center gap-4">
            <Link to="/privacy" className="hover:underline">Privacy</Link>
            <span>&bull;</span>
            <Link to="/terms" className="hover:underline">Terms</Link>
            <span>&bull;</span>
            <Link to="/contact" className="hover:underline">Contact</Link>
          </div>
        </div>
      </div>
    </footer>
  );
};

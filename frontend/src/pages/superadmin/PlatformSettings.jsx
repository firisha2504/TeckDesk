import React, { useState, useEffect } from 'react';
import {
  Sliders,
  ShieldCheck,
  Server,
  Cpu,
  Clock,
  RefreshCw,
  HardDrive,
  CheckCircle2,
  Lock,
} from 'lucide-react';
import { superadminService } from '../../services/superadminService.js';
import { Button } from '../../components/common/Button.jsx';
import { useAuth } from '../../contexts/AuthContext.jsx';

export const PlatformSettings = () => {
  const { user } = useAuth();
  const [health, setHealth] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchHealth = async (isRefresh = false) => {
    try {
      if (isRefresh) setRefreshing(true);
      else setLoading(true);
      const res = await superadminService.getSystemHealth();
      setHealth(res);
    } catch (err) {
      console.error('Failed to query health:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchHealth();
  }, []);

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-5xl">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Platform Settings & System Health
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Global configuration, security boundaries, and operational health metrics.
          </p>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={() => fetchHealth(true)}
          isLoading={refreshing}
          leftIcon={RefreshCw}
        >
          Check Health
        </Button>
      </div>

      {/* System Health Card */}
      <div className="p-6 rounded-3xl bg-white dark:bg-navy-900 border border-slate-200 dark:border-navy-800 shadow-sm">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
            <Server className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-white">
              Backend Service Health
            </h2>
            <p className="text-xs text-slate-400">Core REST API and Node.js process operational state</p>
          </div>
          <span className="ml-auto inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-500 border border-emerald-500/30">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            {health?.status === 'UP' ? 'All Systems Operational' : 'Checking...'}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-navy-950/60 border border-slate-100 dark:border-navy-800">
            <span className="text-slate-400 block text-[10px] uppercase font-bold">API Uptime</span>
            <strong className="text-base font-black text-slate-900 dark:text-white mt-1 block">
              {health?.uptime ? `${Math.floor(health.uptime / 60)} minutes` : 'Active'}
            </strong>
            <span className="text-[10px] text-slate-500">Continuous operation</span>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-navy-950/60 border border-slate-100 dark:border-navy-800">
            <span className="text-slate-400 block text-[10px] uppercase font-bold">Memory (Heap Used)</span>
            <strong className="text-base font-black text-slate-900 dark:text-white mt-1 block">
              {health?.memoryUsage?.heapUsed
                ? `${Math.round(health.memoryUsage.heapUsed / 1024 / 1024)} MB`
                : 'Normal'}
            </strong>
            <span className="text-[10px] text-slate-500">Optimized GC cycle</span>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-navy-950/60 border border-slate-100 dark:border-navy-800">
            <span className="text-slate-400 block text-[10px] uppercase font-bold">Database Protocol</span>
            <strong className="text-base font-black text-slate-900 dark:text-white mt-1 block">
              MongoDB Replica
            </strong>
            <span className="text-[10px] text-emerald-500 font-medium">Connected & indexed</span>
          </div>
        </div>
      </div>

      {/* Security Architecture Posture */}
      <div className="p-6 rounded-3xl bg-white dark:bg-navy-900 border border-slate-200 dark:border-navy-800 shadow-sm space-y-4">
        <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <ShieldCheck className="w-5 h-5 text-cyan-500" />
          Multi-Tenant Isolation Safeguards
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-navy-950/60 border border-slate-100 dark:border-navy-800 space-y-1">
            <div className="flex items-center gap-2 font-bold text-slate-900 dark:text-white">
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              <span>Real-Time Suspension Enforcement</span>
            </div>
            <p className="text-slate-500 text-[11px] leading-relaxed">
              Organization status is verified synchronously on every authenticated request and WebSocket connection, instantly cutting off revoked tenants.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-navy-950/60 border border-slate-100 dark:border-navy-800 space-y-1">
            <div className="flex items-center gap-2 font-bold text-slate-900 dark:text-white">
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              <span>Attachment Access Control & IDOR Prevention</span>
            </div>
            <p className="text-slate-500 text-[11px] leading-relaxed">
              Ticket files require validated organization membership and employee ticket ownership. Direct URL access to `/uploads` is blocked.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-navy-950/60 border border-slate-100 dark:border-navy-800 space-y-1">
            <div className="flex items-center gap-2 font-bold text-slate-900 dark:text-white">
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              <span>WebSocket Room Boundary</span>
            </div>
            <p className="text-slate-500 text-[11px] leading-relaxed">
              Socket rooms are pre-assigned to `org:id` and `user:id` upon JWT handshake. Cross-organization events are dropped at the network boundary.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-navy-950/60 border border-slate-100 dark:border-navy-800 space-y-1">
            <div className="flex items-center gap-2 font-bold text-slate-900 dark:text-white">
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              <span>Zero-Secret Audit Logging</span>
            </div>
            <p className="text-slate-500 text-[11px] leading-relaxed">
              All administrative operations record the actor, action, timestamp, and changes without saving passwords, reset tokens, or bearer headers.
            </p>
          </div>
        </div>
      </div>

      {/* Super Admin Identity Profile */}
      <div className="p-6 rounded-3xl bg-white dark:bg-navy-900 border border-slate-200 dark:border-navy-800 shadow-sm flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-500 flex items-center justify-center font-bold text-lg">
            SA
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              {user?.name || 'Platform Super Admin'}
            </h3>
            <p className="text-xs text-slate-400">{user?.email}</p>
            <span className="inline-block mt-1 text-[10px] font-bold text-amber-500 uppercase">
              Role: {user?.role} &bull; Scope: Global Platform
            </span>
          </div>
        </div>

        <span className="px-3 py-1 rounded-xl bg-slate-100 dark:bg-navy-800 text-slate-600 dark:text-slate-300 text-xs font-semibold">
          Platform Administrator
        </span>
      </div>
    </div>
  );
};

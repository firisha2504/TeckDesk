import React, { useState, useEffect } from 'react';
import { Clock, ShieldAlert, CheckCircle2, Save, RefreshCw } from 'lucide-react';
import { api } from '../../services/apiClient.js';
import { PageHeader } from '../../components/layout/PageHeader.jsx';
import { Button } from '../../components/common/Button.jsx';
import { Input } from '../../components/common/Input.jsx';
import { LoadingSkeleton } from '../../components/common/LoadingSkeleton.jsx';

export const SLAManagement = () => {
  const [policy, setPolicy] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [message, setMessage] = useState('');

  // Form states
  const [priorities, setPriorities] = useState({
    Critical: { responseTimeMinutes: 15, resolutionTimeMinutes: 120 },
    High: { responseTimeMinutes: 60, resolutionTimeMinutes: 480 },
    Medium: { responseTimeMinutes: 240, resolutionTimeMinutes: 1440 },
    Low: { responseTimeMinutes: 480, resolutionTimeMinutes: 2880 },
  });
  const [escalationEmail, setEscalationEmail] = useState('');

  async function loadPolicy() {
    try {
      setLoading(true);
      const data = await api.get('/sla');
      if (data) {
        setPolicy(data);
        if (data.priorities) setPriorities(data.priorities);
        if (data.escalationEmail) setEscalationEmail(data.escalationEmail);
      }
    } catch (err) {
      console.error('Failed to load SLA policy:', err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadPolicy();
  }, []);

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMessage('');
    try {
      await api.patch('/sla', {
        priorities,
        escalationEmail,
      });
      setMessage('SLA Policy updated successfully.');
      setTimeout(() => setMessage(''), 3000);
    } catch (err) {
      alert('Failed to update SLA: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleTriggerScan = async () => {
    setScanning(true);
    try {
      const res = await api.post('/sla/check');
      alert(`SLA Monitor Scan: ${res?.message || 'Completed'}`);
    } catch (err) {
      alert('Scan error: ' + err.message);
    } finally {
      setScanning(false);
    }
  };

  if (loading) {
    return <LoadingSkeleton type="card" count={2} />;
  }

  return (
    <div className="max-w-4xl space-y-6">
      <PageHeader
        title="SLA Policies & Enforcement"
        description="Configure target first response times, resolution deadlines, and automatic incident escalation rules."
        actions={
          <Button
            variant="outline"
            size="sm"
            leftIcon={RefreshCw}
            isLoading={scanning}
            onClick={handleTriggerScan}
          >
            Scan Breaches Now
          </Button>
        }
      />

      {message && (
        <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{message}</span>
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {Object.entries(priorities).map(([priorityKey, config]) => (
            <div
              key={priorityKey}
              className="p-5 rounded-2xl border border-slate-200 dark:border-navy-800 bg-white dark:bg-navy-900 shadow-sm space-y-4"
            >
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-navy-800 pb-2.5">
                <span className="font-bold text-sm text-slate-900 dark:text-slate-100 flex items-center gap-2">
                  <Clock className="w-4 h-4 text-cyan-500" />
                  {priorityKey} Priority
                </span>
                <span
                  className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                    priorityKey === 'Critical'
                      ? 'bg-rose-500/10 text-rose-500'
                      : priorityKey === 'High'
                      ? 'bg-amber-500/10 text-amber-500'
                      : priorityKey === 'Medium'
                      ? 'bg-blue-500/10 text-blue-500'
                      : 'bg-slate-500/10 text-slate-400'
                  }`}
                >
                  {priorityKey}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <Input
                  label="Response Target (min)"
                  type="number"
                  min="1"
                  value={config.responseTimeMinutes}
                  onChange={(e) =>
                    setPriorities({
                      ...priorities,
                      [priorityKey]: {
                        ...config,
                        responseTimeMinutes: parseInt(e.target.value, 10) || 0,
                      },
                    })
                  }
                />

                <Input
                  label="Resolution Target (min)"
                  type="number"
                  min="1"
                  value={config.resolutionTimeMinutes}
                  onChange={(e) =>
                    setPriorities({
                      ...priorities,
                      [priorityKey]: {
                        ...config,
                        resolutionTimeMinutes: parseInt(e.target.value, 10) || 0,
                      },
                    })
                  }
                />
              </div>

              <p className="text-[11px] text-slate-400">
                Resolution target: {(config.resolutionTimeMinutes / 60).toFixed(1)} hours
              </p>
            </div>
          ))}
        </div>

        {/* Escalation Email Card */}
        <div className="p-5 rounded-2xl border border-slate-200 dark:border-navy-800 bg-white dark:bg-navy-900 shadow-sm space-y-3">
          <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-rose-500" />
            Automatic Incident Escalation Target
          </h4>
          <p className="text-xs text-slate-400">
            When a critical ticket approaches breach or is manually escalated, notification alerts will also be sent to this email.
          </p>
          <Input
            label="Escalation Email"
            type="email"
            value={escalationEmail}
            onChange={(e) => setEscalationEmail(e.target.value)}
            placeholder="escalations@yourdomain.com"
          />
        </div>

        <div className="flex justify-end">
          <Button
            type="submit"
            variant="primary"
            size="md"
            isLoading={saving}
            leftIcon={Save}
          >
            Save SLA Configuration
          </Button>
        </div>
      </form>
    </div>
  );
};

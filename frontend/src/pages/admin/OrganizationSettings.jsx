import React, { useState, useEffect } from 'react';
import { Building, Globe, Clock, CheckCircle2, Save, Shield } from 'lucide-react';
import { api } from '../../services/apiClient.js';
import { PageHeader } from '../../components/layout/PageHeader.jsx';
import { Button } from '../../components/common/Button.jsx';
import { Input } from '../../components/common/Input.jsx';
import { LoadingSkeleton } from '../../components/common/LoadingSkeleton.jsx';

export const OrganizationSettings = () => {
  const [org, setOrg] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  const [name, setName] = useState('');
  const [domain, setDomain] = useState('');
  const [allowRegistration, setAllowRegistration] = useState(true);
  const [defaultPriority, setDefaultPriority] = useState('Medium');
  const [startTime, setStartTime] = useState('08:00');
  const [endTime, setEndTime] = useState('18:00');

  useEffect(() => {
    async function loadOrg() {
      try {
        setLoading(true);
        const data = await api.get('/organizations/settings');
        if (data) {
          setOrg(data);
          setName(data.name || '');
          setDomain(data.domain || '');
          setAllowRegistration(data.settings?.allowRegistration ?? true);
          setDefaultPriority(data.settings?.defaultTicketPriority || 'Medium');
          setStartTime(data.settings?.businessHours?.start || '08:00');
          setEndTime(data.settings?.businessHours?.end || '18:00');
        }
      } catch (err) {
        console.error('Failed to load organization settings:', err);
      } finally {
        setLoading(false);
      }
    }
    loadOrg();
  }, []);

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMessage('');
    try {
      await api.patch('/organizations/settings', {
        name,
        domain,
        settings: {
          allowRegistration,
          defaultTicketPriority: defaultPriority,
          businessHours: {
            start: startTime,
            end: endTime,
            timeZone: 'UTC',
          },
        },
      });
      setMessage('Organization settings successfully updated.');
      setTimeout(() => setMessage(''), 3000);
    } catch (err) {
      alert('Save error: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <LoadingSkeleton type="card" count={2} />;
  }

  return (
    <div className="max-w-3xl space-y-6">
      <PageHeader
        title="Organization Settings"
        description="Manage enterprise branding, domain restrictions, and support desk business hours."
      />

      {message && (
        <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{message}</span>
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-6">
        <div className="p-6 rounded-2xl border border-slate-200 dark:border-navy-800 bg-white dark:bg-navy-900 shadow-sm space-y-4">
          <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <Building className="w-4 h-4 text-cyan-500" />
            General Information
          </h3>

          <Input
            label="Organization Display Name"
            type="text"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
          />

          <Input
            label="Authorized Domain (e.g. company.com)"
            type="text"
            value={domain}
            onChange={(e) => setDomain(e.target.value)}
            leftIcon={Globe}
          />

          <div className="pt-2">
            <label className="flex items-center gap-2 text-xs font-medium text-slate-700 dark:text-slate-300 cursor-pointer">
              <input
                type="checkbox"
                checked={allowRegistration}
                onChange={(e) => setAllowRegistration(e.target.checked)}
                className="rounded text-cyan-500 focus:ring-cyan-500"
              />
              Allow self-registration for employees with corporate email
            </label>
          </div>
        </div>

        <div className="p-6 rounded-2xl border border-slate-200 dark:border-navy-800 bg-white dark:bg-navy-900 shadow-sm space-y-4">
          <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <Clock className="w-4 h-4 text-blue-500" />
            Support Business Hours & SLA Baseline
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Business Day Start"
              type="time"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
            />

            <Input
              label="Business Day End"
              type="time"
              value={endTime}
              onChange={(e) => setEndTime(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
              Default Incident Priority
            </label>
            <select
              value={defaultPriority}
              onChange={(e) => setDefaultPriority(e.target.value)}
              className="w-full rounded-lg text-sm bg-white dark:bg-navy-950 border border-slate-300 dark:border-navy-750 text-slate-900 dark:text-slate-100 p-2.5 focus:outline-none focus:ring-2 focus:ring-cyan-500"
            >
              <option value="Low">Low</option>
              <option value="Medium">Medium</option>
              <option value="High">High</option>
              <option value="Critical">Critical</option>
            </select>
          </div>
        </div>

        <div className="flex justify-end">
          <Button
            type="submit"
            variant="primary"
            size="md"
            isLoading={saving}
            leftIcon={Save}
          >
            Save Settings
          </Button>
        </div>
      </form>
    </div>
  );
};

import React, { useState } from 'react';
import { User, Mail, Lock, CheckCircle2, Save, Sparkles } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext.jsx';
import { PageHeader } from '../../components/layout/PageHeader.jsx';
import { Input } from '../../components/common/Input.jsx';
import { Button } from '../../components/common/Button.jsx';

export const ProfileSettings = () => {
  const { user, updateProfile } = useAuth();

  const [name, setName] = useState(user?.name || '');
  const [avatar, setAvatar] = useState(user?.avatar || '');
  const [skills, setSkills] = useState(user?.skills?.join(', ') || '');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');
    setError('');

    try {
      const skillsArray = skills
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);

      const payload = {
        name,
        avatar,
        skills: skillsArray,
      };

      if (newPassword) {
        payload.currentPassword = currentPassword;
        payload.newPassword = newPassword;
      }

      await updateProfile(payload);
      setMessage('Profile settings successfully updated.');
      setCurrentPassword('');
      setNewPassword('');
    } catch (err) {
      setError(err.message || 'Failed to update profile.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <PageHeader
        title="Profile Settings"
        description="Update your personal support profile, avatar picture, skills, and security credentials."
      />

      {message && (
        <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{message}</span>
        </div>
      )}

      {error && (
        <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-500 text-xs">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="p-6 rounded-3xl border border-slate-200 dark:border-navy-800 bg-white dark:bg-navy-900 shadow-sm space-y-4">
          <div className="flex items-center gap-4 mb-4">
            {avatar ? (
              <img src={avatar} alt={name} className="w-16 h-16 rounded-full object-cover ring-2 ring-blue-500/30" />
            ) : (
              <div className="w-16 h-16 rounded-full bg-blue-600 text-white font-bold flex items-center justify-center text-xl">
                {name?.charAt(0) || 'U'}
              </div>
            )}
            <div>
              <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100">{user?.name}</h4>
              <p className="text-xs text-slate-400 capitalize">{user?.role} • {user?.organization?.name || 'TechDesk'}</p>
            </div>
          </div>

          <Input
            label="Full Name"
            type="text"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            leftIcon={User}
          />

          <Input
            label="Email Address"
            type="email"
            disabled
            value={user?.email || ''}
            helperText="Email cannot be changed directly."
            leftIcon={Mail}
          />

          <Input
            label="Avatar Image URL"
            type="url"
            value={avatar}
            onChange={(e) => setAvatar(e.target.value)}
            placeholder="https://..."
          />

          {['technician', 'manager'].includes(user?.role) && (
            <Input
              label="Technical Skills (comma-separated)"
              type="text"
              value={skills}
              onChange={(e) => setSkills(e.target.value)}
              placeholder="e.g. Hardware, Network, Software, Security"
              helperText="Used by the AI auto-assignment engine to route relevant tickets to you."
            />
          )}
        </div>

        {/* Change Password */}
        <div className="p-6 rounded-3xl border border-slate-200 dark:border-navy-800 bg-white dark:bg-navy-900 shadow-sm space-y-4">
          <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <Lock className="w-4 h-4 text-cyan-500" />
            Change Password
          </h4>

          <Input
            label="Current Password"
            type="password"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            placeholder="••••••••••••"
          />

          <Input
            label="New Password"
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            placeholder="••••••••••••"
          />
        </div>

        <div className="flex justify-end">
          <Button
            type="submit"
            variant="primary"
            size="md"
            isLoading={loading}
            leftIcon={Save}
          >
            Save Changes
          </Button>
        </div>
      </form>
    </div>
  );
};

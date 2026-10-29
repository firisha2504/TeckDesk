import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Mail, Headphones, AlertCircle, CheckCircle, ArrowLeft, KeyRound } from 'lucide-react';
import { authService } from '../../services/authService.js';
import { Input } from '../../components/common/Input.jsx';
import { Button } from '../../components/common/Button.jsx';

export const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await authService.forgotPassword(email);
      setSuccess(
        res?.message ||
          'If an account exists with this email address, password reset instructions have been sent to your inbox.'
      );
    } catch (err) {
      setError(err.message || 'Failed to request password reset.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-slate-50 dark:bg-navy-950 transition-colors">
      <div className="w-full max-w-md rounded-3xl border border-slate-200 dark:border-navy-800 bg-white dark:bg-navy-900 shadow-2xl p-8">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-400 to-blue-600 flex items-center justify-center text-white shadow-lg shadow-cyan-500/30">
            <Headphones className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
              Tech<span className="text-cyan-400">Desk</span>
            </span>
            <p className="text-xs text-slate-400">Account Recovery</p>
          </div>
        </div>

        <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 mb-1">
          Recover Password
        </h3>
        <p className="text-xs text-slate-500 dark:text-slate-400 mb-6">
          Enter your registered work email and we'll dispatch secure password reset instructions.
        </p>

        {error && (
          <div className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-500 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="mb-4 p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs space-y-2">
            <div className="flex items-center gap-2 font-semibold">
              <CheckCircle className="w-4 h-4 shrink-0" />
              <span>{success}</span>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Please check your inbox (and spam folder) for the password reset link. The link is valid for 1 hour.
            </p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Email address"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="e.g. employee@techdesk.com"
            leftIcon={Mail}
          />

          <Button type="submit" variant="primary" fullWidth isLoading={loading} rightIcon={KeyRound}>
            Send Reset Instructions
          </Button>
        </form>

        <div className="mt-6 text-center">
          <Link
            to="/login"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-blue-500 dark:text-slate-400 dark:hover:text-cyan-400"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Back to Sign In
          </Link>
        </div>
      </div>
    </div>
  );
};

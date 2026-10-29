import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock, Headphones, AlertCircle, ArrowRight, ArrowLeft, Shield, Clock, Briefcase } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext.jsx';
import { Input } from '../../components/common/Input.jsx';
import { Button } from '../../components/common/Button.jsx';

export const Login = () => {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await login({ email, password });
      navigate('/dashboard');
    } catch (err) {
      setError(err.message || 'Failed to sign in. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-center items-center p-4 sm:p-6 bg-slate-50 dark:bg-navy-950 transition-colors">
      {/* Top Navigation - Back to Home */}
      <div className="w-full max-w-4xl mb-3 flex items-center justify-between">
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-cyan-500 dark:hover:text-cyan-400 transition-colors px-3 py-1.5 rounded-xl hover:bg-slate-200/50 dark:hover:bg-navy-900/60"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Home</span>
        </Link>
      </div>

      <div className="w-full max-w-4xl grid grid-cols-1 md:grid-cols-2 rounded-3xl border border-slate-200 dark:border-navy-800 bg-white dark:bg-navy-900 shadow-2xl overflow-hidden">
        {/* Left Brand Panel matching reference design */}
        <div className="relative p-8 md:p-12 bg-gradient-to-br from-navy-900 via-navy-850 to-blue-950 text-white flex flex-col justify-between overflow-hidden">
          {/* Subtle glowing accents */}
          <div className="absolute -top-24 -left-24 w-64 h-64 rounded-full bg-cyan-500/20 blur-3xl pointer-events-none" />
          <div className="absolute -bottom-24 -right-24 w-64 h-64 rounded-full bg-blue-600/20 blur-3xl pointer-events-none" />

          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-8">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-400 to-blue-600 flex items-center justify-center text-white shadow-lg shadow-cyan-500/30">
                <Headphones className="w-6 h-6" />
              </div>
              <span className="text-xl font-bold tracking-tight">
                Tech<span className="text-cyan-400">Desk</span>
              </span>
            </div>

            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight leading-tight mb-4">
              Smart IT Support and Incident Management System
            </h2>
            <p className="text-sm text-slate-300 leading-relaxed mb-6">
              Get your technical issues resolved faster with automated SLA enforcement, real-time ticket collaboration, and intelligent skill-based routing.
            </p>
          </div>

          <div className="relative z-10 pt-6 border-t border-slate-700/50 space-y-3">
            <div className="flex items-center gap-2.5 text-xs text-slate-300">
              <Shield className="w-4 h-4 text-cyan-400 shrink-0" />
              <span>Enterprise-grade role-based access control</span>
            </div>
            <div className="flex items-center gap-2.5 text-xs text-slate-300">
              <Clock className="w-4 h-4 text-blue-400 shrink-0" />
              <span>Automated SLA tracking & proactive escalation</span>
            </div>
            <div className="flex items-center gap-2.5 text-xs text-slate-300">
              <Briefcase className="w-4 h-4 text-purple-400 shrink-0" />
              <span>Intelligent skill-based technician triage</span>
            </div>
          </div>
        </div>

        {/* Right Form Panel */}
        <div className="p-8 sm:p-12 flex flex-col justify-center">
          <div className="mb-6">
            <h3 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-slate-100">
              Welcome Back
            </h3>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
              Sign in to access your IT workspace and tickets
            </p>
          </div>

          {error && (
            <div className="mb-5 p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Email address"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@company.com"
              leftIcon={Mail}
            />

            <Input
              label="Password"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••••••"
              leftIcon={Lock}
            />

            <div className="flex items-center justify-between text-xs">
              <label className="flex items-center gap-2 text-slate-600 dark:text-slate-400 cursor-pointer">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="rounded border-slate-300 dark:border-navy-700 text-cyan-500 focus:ring-cyan-500"
                />
                Remember me
              </label>

              <Link
                to="/forgot-password"
                className="font-medium text-blue-600 dark:text-cyan-400 hover:underline"
              >
                Forgot password?
              </Link>
            </div>

            <Button
              type="submit"
              variant="primary"
              size="lg"
              fullWidth
              isLoading={loading}
              rightIcon={ArrowRight}
              className="mt-2"
            >
              Sign In
            </Button>
          </form>

          <p className="mt-8 text-center text-xs text-slate-500 dark:text-slate-400">
            Don't have an account?{' '}
            <Link
              to="/register"
              className="font-semibold text-blue-600 dark:text-cyan-400 hover:underline"
            >
              Create one
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

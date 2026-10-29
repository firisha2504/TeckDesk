import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock, User, Building, Headphones, AlertCircle, ArrowRight, ArrowLeft } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext.jsx';
import { Input } from '../../components/common/Input.jsx';
import { Button } from '../../components/common/Button.jsx';

export const Register = () => {
  const { register } = useAuth();
  const navigate = useNavigate();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [organizationName, setOrganizationName] = useState('');
  const [role, setRole] = useState('employee');
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (password.length < 6) {
      return setError('Password must be at least 6 characters long.');
    }

    if (password !== confirmPassword) {
      return setError('Passwords do not match. Please verify both password fields.');
    }

    if (!agreeTerms) {
      return setError('You must accept the Terms and Conditions to create an account.');
    }

    setLoading(true);

    try {
      await register({ name, email, password, organizationName, role });
      navigate('/dashboard');
    } catch (err) {
      setError(err.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-center items-center p-4 sm:p-6 bg-slate-50 dark:bg-navy-950 transition-colors">
      {/* Top Navigation - Back to Home */}
      <div className="w-full max-w-lg mb-3 flex items-center justify-between">
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-cyan-500 dark:hover:text-cyan-400 transition-colors px-3 py-1.5 rounded-xl hover:bg-slate-200/50 dark:hover:bg-navy-900/60"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Home</span>
        </Link>
      </div>

      <div className="w-full max-w-lg rounded-3xl border border-slate-200 dark:border-navy-800 bg-white dark:bg-navy-900 shadow-2xl p-8 sm:p-10">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-400 to-blue-600 flex items-center justify-center text-white shadow-lg shadow-cyan-500/30">
            <Headphones className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
              Tech<span className="text-cyan-400">Desk</span>
            </span>
            <p className="text-xs text-slate-400">Create your support account</p>
          </div>
        </div>

        {error && (
          <div className="mb-5 p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Full Name"
            type="text"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Jane Doe"
            leftIcon={User}
          />

          <Input
            label="Work Email Address"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="name@company.com"
            leftIcon={Mail}
          />

          <Input
            label="Password (min 6 characters)"
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••••••"
            leftIcon={Lock}
          />

          <Input
            label="Confirm Password"
            type="password"
            required
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="••••••••••••"
            leftIcon={Lock}
          />

          <Input
            label="Organization Name"
            type="text"
            required
            value={organizationName}
            onChange={(e) => setOrganizationName(e.target.value)}
            placeholder="e.g. Acme Corporation"
            leftIcon={Building}
          />

          <div>
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
              Account Role
            </label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="w-full rounded-lg text-sm bg-white dark:bg-navy-900 border border-slate-300 dark:border-navy-700 text-slate-900 dark:text-slate-100 p-2.5 focus:outline-none focus:ring-2 focus:ring-cyan-500"
            >
              <option value="employee">Employee (Submit & track tickets)</option>
              <option value="technician">Technician (Resolve assigned incidents)</option>
            </select>
            <p className="mt-1 text-[11px] text-slate-400">
              Manager and Administrator roles require elevated invitation or administrator provisioning.
            </p>
          </div>

          <div className="flex items-start gap-2 pt-1 text-xs text-slate-600 dark:text-slate-400">
            <input
              type="checkbox"
              id="agreeTerms"
              checked={agreeTerms}
              onChange={(e) => setAgreeTerms(e.target.checked)}
              required
              className="mt-0.5 rounded border-slate-300 dark:border-navy-700 text-cyan-500 focus:ring-cyan-500"
            />
            <label htmlFor="agreeTerms" className="cursor-pointer">
              I agree to the{' '}
              <Link to="/terms" className="text-cyan-600 dark:text-cyan-400 hover:underline">
                Terms and Conditions
              </Link>{' '}
              and{' '}
              <Link to="/privacy" className="text-cyan-600 dark:text-cyan-400 hover:underline">
                Privacy Policy
              </Link>
              .
            </label>
          </div>

          <Button
            type="submit"
            variant="primary"
            size="lg"
            fullWidth
            isLoading={loading}
            rightIcon={ArrowRight}
            className="mt-4"
          >
            Create Account
          </Button>
        </form>

        <p className="mt-6 text-center text-xs text-slate-500 dark:text-slate-400">
          Already have an account?{' '}
          <Link
            to="/login"
            className="font-semibold text-blue-600 dark:text-cyan-400 hover:underline"
          >
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
};

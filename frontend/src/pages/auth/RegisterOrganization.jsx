import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Building2,
  Mail,
  Lock,
  User,
  Phone,
  MapPin,
  Globe,
  Headphones,
  AlertCircle,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  Clock,
  ShieldCheck,
} from 'lucide-react';
import { authService } from '../../services/authService.js';
import { Input } from '../../components/common/Input.jsx';
import { Button } from '../../components/common/Button.jsx';

export const RegisterOrganization = () => {
  const navigate = useNavigate();

  // Form State
  const [formData, setFormData] = useState({
    organizationName: '',
    type: 'Enterprise',
    domain: '',
    officialEmail: '',
    phone: '',
    address: '',
    website: '',
    adminName: '',
    adminEmail: '',
    adminPassword: '',
    confirmPassword: '',
  });

  const [agreeTerms, setAgreeTerms] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [submittedSuccess, setSubmittedSuccess] = useState(false);
  const [registeredOrgData, setRegisteredOrgData] = useState(null);

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Form Validations
    if (!formData.organizationName.trim()) {
      return setError('Organization or Institution name is required.');
    }

    if (!formData.adminName.trim()) {
      return setError('Primary administrator name is required.');
    }

    if (!formData.adminEmail.trim()) {
      return setError('Primary administrator email is required.');
    }

    if (formData.adminPassword.length < 6) {
      return setError('Administrator password must be at least 6 characters long.');
    }

    if (formData.adminPassword !== formData.confirmPassword) {
      return setError('Passwords do not match. Please ensure both passwords match.');
    }

    if (!agreeTerms) {
      return setError('You must agree to the Terms of Service and Privacy Policy to register.');
    }

    setLoading(true);

    try {
      const payload = {
        organizationName: formData.organizationName.trim(),
        type: formData.type,
        domain: formData.domain ? formData.domain.trim().toLowerCase() : '',
        officialEmail: formData.officialEmail ? formData.officialEmail.trim().toLowerCase() : '',
        phone: formData.phone.trim(),
        address: formData.address.trim(),
        website: formData.website.trim(),
        adminName: formData.adminName.trim(),
        adminEmail: formData.adminEmail.trim().toLowerCase(),
        adminPassword: formData.adminPassword,
      };

      const response = await authService.registerOrganization(payload);
      setRegisteredOrgData(response);
      setSubmittedSuccess(true);
    } catch (err) {
      setError(err.message || 'Registration failed. Please review your details and try again.');
    } finally {
      setLoading(false);
    }
  };

  // Success Confirmation Screen
  if (submittedSuccess) {
    return (
      <div className="min-h-screen flex flex-col justify-center items-center p-4 sm:p-6 bg-slate-50 dark:bg-navy-950 transition-colors">
        <div className="w-full max-w-lg bg-white dark:bg-navy-900 border border-slate-200 dark:border-navy-800 rounded-3xl p-8 sm:p-10 shadow-xl shadow-slate-200/50 dark:shadow-none text-center">
          <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-500 flex items-center justify-center mx-auto mb-6">
            <Clock className="w-8 h-8 animate-pulse" />
          </div>

          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 mb-3">
            Registration Submitted &bull; Pending Approval
          </span>

          <h2 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight mb-3">
            Welcome to TechDesk!
          </h2>

          <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed mb-6">
            The registration request for <strong className="text-slate-900 dark:text-white">{formData.organizationName}</strong> has been securely submitted and is awaiting review by the Platform Super Admin.
          </p>

          <div className="bg-slate-50 dark:bg-navy-950/80 border border-slate-200 dark:border-navy-800 rounded-2xl p-4 text-left text-xs space-y-2 mb-8">
            <div className="flex justify-between py-1 border-b border-slate-200/60 dark:border-navy-800/80">
              <span className="text-slate-500">Institution:</span>
              <span className="font-semibold text-slate-900 dark:text-slate-100">{formData.organizationName}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-200/60 dark:border-navy-800/80">
              <span className="text-slate-500">Type:</span>
              <span className="font-semibold text-slate-900 dark:text-slate-100">{formData.type}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-200/60 dark:border-navy-800/80">
              <span className="text-slate-500">Primary Administrator:</span>
              <span className="font-semibold text-slate-900 dark:text-slate-100">{formData.adminName} ({formData.adminEmail})</span>
            </div>
            <div className="flex justify-between py-1">
              <span className="text-slate-500">Review Status:</span>
              <span className="font-bold text-amber-500 uppercase tracking-wide">Pending Super Admin Review</span>
            </div>
          </div>

          <div className="space-y-3">
            <Button
              variant="primary"
              size="lg"
              fullWidth
              onClick={() => navigate('/login')}
              rightIcon={ArrowRight}
            >
              Go to Sign In
            </Button>
            <Link
              to="/"
              className="inline-block text-xs font-semibold text-slate-500 hover:text-cyan-500 dark:hover:text-cyan-400 transition-colors"
            >
              Return to Homepage
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col justify-center items-center p-4 sm:p-6 bg-slate-50 dark:bg-navy-950 transition-colors py-10">
      {/* Top Navigation */}
      <div className="w-full max-w-2xl mb-4 flex items-center justify-between">
        <Link
          to="/login"
          className="inline-flex items-center gap-2 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-cyan-500 dark:hover:text-cyan-400 transition-colors px-3 py-1.5 rounded-xl hover:bg-slate-200/50 dark:hover:bg-navy-900/60"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Sign In</span>
        </Link>
        <span className="text-xs text-slate-400">Step 1 of 2: Registration</span>
      </div>

      <div className="w-full max-w-2xl bg-white dark:bg-navy-900 border border-slate-200 dark:border-navy-800 rounded-3xl p-6 sm:p-10 shadow-xl shadow-slate-200/50 dark:shadow-none transition-all">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-gradient-to-tr from-cyan-500 to-blue-600 text-white shadow-lg shadow-cyan-500/30 mb-4">
            <Building2 className="w-6 h-6" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Register Your Institution
          </h1>
          <p className="mt-2 text-sm text-slate-600 dark:text-slate-400 max-w-md mx-auto">
            Establish a dedicated IT service management tenant for your university, hospital, enterprise, or agency.
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 text-xs sm:text-sm flex items-start gap-3">
            <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Section 1: Institution Details */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-cyan-600 dark:text-cyan-400 mb-3 flex items-center gap-2">
              <Building2 className="w-4 h-4" />
              1. Organization & Institution Information
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <Input
                  label="Organization / Institution Name"
                  required
                  value={formData.organizationName}
                  onChange={(e) => handleChange('organizationName', e.target.value)}
                  placeholder="e.g. Addis Ababa University or St. Mary Hospital"
                  leftIcon={Building2}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Organization Type
                </label>
                <select
                  value={formData.type}
                  onChange={(e) => handleChange('type', e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-navy-700 bg-white dark:bg-navy-950 text-slate-900 dark:text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-all"
                >
                  <option value="University / College">University / Higher Education</option>
                  <option value="Hospital / Healthcare">Hospital / Healthcare</option>
                  <option value="Enterprise">Enterprise / Corporation</option>
                  <option value="Government Agency">Government Agency / Public Sector</option>
                  <option value="Financial Institution">Bank / Financial Institution</option>
                  <option value="Non-Profit / NGO">Non-Profit / NGO</option>
                  <option value="Technology">Technology / SaaS Provider</option>
                  <option value="Other">Other Organization</option>
                </select>
              </div>

              <div>
                <Input
                  label="Official Domain / Subdomain"
                  value={formData.domain}
                  onChange={(e) => handleChange('domain', e.target.value)}
                  placeholder="e.g. aau.edu.et or metro-health.org"
                  leftIcon={Globe}
                />
              </div>

              <div>
                <Input
                  label="Official Contact Email"
                  type="email"
                  value={formData.officialEmail}
                  onChange={(e) => handleChange('officialEmail', e.target.value)}
                  placeholder="e.g. contact@institution.org"
                  leftIcon={Mail}
                />
              </div>

              <div>
                <Input
                  label="Official Phone Number"
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => handleChange('phone', e.target.value)}
                  placeholder="e.g. +251 11 123 4567"
                  leftIcon={Phone}
                />
              </div>

              <div className="sm:col-span-2">
                <Input
                  label="Physical Address / Headquarters"
                  value={formData.address}
                  onChange={(e) => handleChange('address', e.target.value)}
                  placeholder="e.g. King George VI Street, Addis Ababa, Ethiopia"
                  leftIcon={MapPin}
                />
              </div>
            </div>
          </div>

          <div className="border-t border-slate-100 dark:border-navy-800 pt-6">
            <h3 className="text-xs font-bold uppercase tracking-wider text-cyan-600 dark:text-cyan-400 mb-3 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4" />
              2. Primary Organization Administrator Account
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <Input
                  label="Administrator Full Name"
                  required
                  value={formData.adminName}
                  onChange={(e) => handleChange('adminName', e.target.value)}
                  placeholder="e.g. Dr. Abebe Tadesse"
                  leftIcon={User}
                />
              </div>

              <div className="sm:col-span-2">
                <Input
                  label="Administrator Email (Used to sign in)"
                  type="email"
                  required
                  value={formData.adminEmail}
                  onChange={(e) => handleChange('adminEmail', e.target.value)}
                  placeholder="e.g. admin@institution.org"
                  leftIcon={Mail}
                />
              </div>

              <div>
                <Input
                  label="Create Password"
                  type="password"
                  required
                  value={formData.adminPassword}
                  onChange={(e) => handleChange('adminPassword', e.target.value)}
                  placeholder="Minimum 6 characters"
                  leftIcon={Lock}
                />
              </div>

              <div>
                <Input
                  label="Confirm Password"
                  type="password"
                  required
                  value={formData.confirmPassword}
                  onChange={(e) => handleChange('confirmPassword', e.target.value)}
                  placeholder="Confirm password"
                  leftIcon={Lock}
                />
              </div>
            </div>
          </div>

          {/* Terms Agreement */}
          <div className="pt-2">
            <label className="flex items-start gap-3 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={agreeTerms}
                onChange={(e) => setAgreeTerms(e.target.checked)}
                className="mt-1 w-4 h-4 rounded border-slate-300 dark:border-navy-700 text-cyan-500 focus:ring-cyan-500 dark:bg-navy-950"
              />
              <span className="text-xs text-slate-600 dark:text-slate-400 leading-normal">
                I agree to the{' '}
                <Link to="/terms" className="text-cyan-600 dark:text-cyan-400 hover:underline">
                  Terms of Service
                </Link>{' '}
                and understand that our organization registration requires verification and approval by the Platform Super Admin before services are provisioned.
              </span>
            </label>
          </div>

          <Button
            type="submit"
            variant="primary"
            size="lg"
            fullWidth
            isLoading={loading}
            rightIcon={ArrowRight}
            className="py-3.5"
          >
            Submit Organization Registration
          </Button>
        </form>

        <div className="mt-8 pt-6 border-t border-slate-100 dark:border-navy-800 text-center">
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Already have an active organization account?{' '}
            <Link
              to="/login"
              className="font-semibold text-cyan-600 dark:text-cyan-400 hover:underline"
            >
              Sign In Here
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

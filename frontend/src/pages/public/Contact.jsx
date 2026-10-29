import React, { useState } from 'react';
import { Mail, User, MessageSquare, Send, CheckCircle2, AlertCircle, Headphones, Info } from 'lucide-react';
import { Input } from '../../components/common/Input.jsx';
import { Button } from '../../components/common/Button.jsx';
import { Link } from 'react-router-dom';

export const Contact = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');

    // Client-side validation
    if (!name.trim() || !email.trim() || !subject.trim() || !message.trim()) {
      return setError('Please fill in all required fields.');
    }

    if (!email.includes('@') || !email.includes('.')) {
      return setError('Please enter a valid work email address.');
    }

    if (message.trim().length < 10) {
      return setError('Message must be at least 10 characters long.');
    }

    setLoading(true);

    // Documented frontend-only state demonstration:
    // TechDesk handles technical support requests via authenticated tickets.
    // This general contact inquiry form simulates client validation and receipt.
    setTimeout(() => {
      setLoading(false);
      setSubmitted(true);
    }, 700);
  };

  const handleReset = () => {
    setName('');
    setEmail('');
    setSubject('');
    setMessage('');
    setSubmitted(false);
    setError('');
  };

  return (
    <div className="py-12 md:py-20 space-y-12 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="text-center space-y-3">
        <span className="text-xs font-bold uppercase tracking-wider text-cyan-500">
          Get in Touch
        </span>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight">
          Contact TechDesk IT Support
        </h1>
        <p className="text-sm sm:text-base text-slate-600 dark:text-slate-400 max-w-lg mx-auto">
          Have questions about deploying TechDesk in your organization or need general technical assistance? Reach out below.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Info Column */}
        <div className="md:col-span-1 space-y-6">
          <div className="p-6 rounded-3xl border border-slate-200 dark:border-navy-800 bg-white dark:bg-navy-900/60 shadow-md space-y-4">
            <div className="w-10 h-10 rounded-xl bg-cyan-500/10 text-cyan-500 flex items-center justify-center">
              <Headphones className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              Registered Users
            </h3>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              For real-time incident resolution with automated SLA tracking, please sign in to your employee or technician account to submit a ticket.
            </p>
            <Link
              to="/login"
              className="inline-block text-xs font-semibold text-cyan-500 hover:text-cyan-400 hover:underline"
            >
              Sign In to Ticket Portal &rarr;
            </Link>
          </div>

          <div className="p-5 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-700 dark:text-amber-400 text-xs space-y-2">
            <div className="flex items-center gap-1.5 font-bold">
              <Info className="w-4 h-4 shrink-0" />
              <span>Inquiry Notice</span>
            </div>
            <p className="leading-relaxed">
              Public contact inquiries are processed for general inquiries. Actual SLA-enforced tickets require a registered organization user account.
            </p>
          </div>
        </div>

        {/* Form Column */}
        <div className="md:col-span-2">
          <div className="p-8 rounded-3xl border border-slate-200 dark:border-navy-800 bg-white dark:bg-navy-900 shadow-xl">
            {submitted ? (
              <div className="text-center py-8 space-y-4">
                <div className="w-14 h-14 rounded-full bg-emerald-500/10 text-emerald-500 mx-auto flex items-center justify-center">
                  <CheckCircle2 className="w-8 h-8" />
                </div>
                <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                  Inquiry Received
                </h3>
                <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 max-w-md mx-auto leading-relaxed">
                  Thank you, <strong>{name}</strong>. Your inquiry has been acknowledged in the local frontend state demonstration. For active technical incidents, please submit a ticket via your support dashboard.
                </p>
                <div className="pt-2">
                  <button
                    onClick={handleReset}
                    className="px-5 py-2.5 rounded-xl text-xs font-semibold bg-slate-100 hover:bg-slate-200 dark:bg-navy-800 dark:hover:bg-navy-750 text-slate-700 dark:text-slate-200 transition-colors"
                  >
                    Send Another Message
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                {error && (
                  <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-500 text-xs flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{error}</span>
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Input
                    label="Your Name"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Hana Bekele"
                    leftIcon={User}
                  />
                  <Input
                    label="Work Email"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="e.g. hana@company.com"
                    leftIcon={Mail}
                  />
                </div>

                <Input
                  label="Subject"
                  required
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="e.g. Inquiry regarding SLA configuration"
                  leftIcon={MessageSquare}
                />

                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                    Message Details <span className="text-rose-500">*</span>
                  </label>
                  <textarea
                    rows={4}
                    required
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Please describe your question or support topic..."
                    className="w-full rounded-xl text-sm bg-white dark:bg-navy-900 border border-slate-300 dark:border-navy-700 text-slate-900 dark:text-slate-100 p-3 focus:outline-none focus:ring-2 focus:ring-cyan-500 transition-colors"
                  />
                  <span className="text-[11px] text-slate-400">Minimum 10 characters.</span>
                </div>

                <Button
                  type="submit"
                  variant="primary"
                  size="lg"
                  fullWidth
                  isLoading={loading}
                  rightIcon={Send}
                  className="mt-2"
                >
                  Submit Inquiry
                </Button>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

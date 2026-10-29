import React from 'react';
import { useNavigate } from 'react-router-dom';
import { FileQuestion, Home } from 'lucide-react';
import { Button } from '../components/common/Button.jsx';

export const NotFound = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-slate-50 dark:bg-navy-950 text-center">
      <div className="max-w-md p-8 rounded-3xl border border-slate-200 dark:border-navy-800 bg-white dark:bg-navy-900 shadow-xl space-y-4">
        <div className="w-16 h-16 rounded-2xl bg-cyan-500/10 text-cyan-500 mx-auto flex items-center justify-center">
          <FileQuestion className="w-8 h-8" />
        </div>
        <h1 className="text-3xl font-extrabold text-slate-900 dark:text-slate-100">404</h1>
        <h2 className="text-lg font-bold text-slate-800 dark:text-slate-200">Page Not Found</h2>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          The support view or resource you are looking for does not exist or has been moved.
        </p>
        <div className="pt-2">
          <Button variant="primary" leftIcon={Home} onClick={() => navigate('/dashboard')}>
            Return to Dashboard
          </Button>
        </div>
      </div>
    </div>
  );
};

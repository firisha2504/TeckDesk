import React from 'react';
import { Sun, Moon, Check, Sparkles } from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext.jsx';
import { PageHeader } from '../../components/layout/PageHeader.jsx';

export const AppearanceSettings = () => {
  const { theme, toggleTheme } = useTheme();

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <PageHeader
        title="Appearance & Interface"
        description="Customize your TechDesk workspace aesthetic between our high-contrast Dark Navy and Crisp Light themes."
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        {/* Dark Navy Theme Card */}
        <div
          onClick={() => {
            if (theme !== 'dark') toggleTheme();
          }}
          className={`p-5 rounded-3xl border-2 cursor-pointer transition-all ${
            theme === 'dark'
              ? 'border-cyan-500 bg-navy-900 shadow-xl shadow-cyan-500/10'
              : 'border-slate-200 dark:border-navy-800 bg-slate-100 hover:border-slate-300'
          }`}
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Moon className="w-5 h-5 text-cyan-400" />
              <span className="font-bold text-sm text-slate-900 dark:text-slate-100">
                Dark Navy (Default)
              </span>
            </div>
            {theme === 'dark' && (
              <span className="p-1 rounded-full bg-cyan-500 text-white">
                <Check className="w-3.5 h-3.5" />
              </span>
            )}
          </div>

          {/* Visual Mini Mockup */}
          <div className="p-3 rounded-2xl bg-navy-950 border border-navy-800 space-y-2">
            <div className="h-3 w-1/3 bg-cyan-500 rounded" />
            <div className="h-2 w-full bg-navy-800 rounded" />
            <div className="h-2 w-2/3 bg-navy-800 rounded" />
            <div className="grid grid-cols-3 gap-1.5 pt-1">
              <div className="h-6 bg-navy-900 rounded border border-navy-750" />
              <div className="h-6 bg-navy-900 rounded border border-navy-750" />
              <div className="h-6 bg-navy-900 rounded border border-navy-750" />
            </div>
          </div>
        </div>

        {/* Crisp Light Theme Card */}
        <div
          onClick={() => {
            if (theme !== 'light') toggleTheme();
          }}
          className={`p-5 rounded-3xl border-2 cursor-pointer transition-all ${
            theme === 'light'
              ? 'border-blue-600 bg-white shadow-xl shadow-blue-500/10'
              : 'border-slate-200 dark:border-navy-800 bg-navy-900 hover:border-slate-700'
          }`}
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Sun className="w-5 h-5 text-amber-500" />
              <span className="font-bold text-sm text-slate-900 dark:text-slate-100">
                Crisp Light
              </span>
            </div>
            {theme === 'light' && (
              <span className="p-1 rounded-full bg-blue-600 text-white">
                <Check className="w-3.5 h-3.5" />
              </span>
            )}
          </div>

          {/* Visual Mini Mockup */}
          <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
            <div className="h-3 w-1/3 bg-blue-600 rounded" />
            <div className="h-2 w-full bg-slate-200 rounded" />
            <div className="h-2 w-2/3 bg-slate-200 rounded" />
            <div className="grid grid-cols-3 gap-1.5 pt-1">
              <div className="h-6 bg-white rounded border border-slate-200" />
              <div className="h-6 bg-white rounded border border-slate-200" />
              <div className="h-6 bg-white rounded border border-slate-200" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

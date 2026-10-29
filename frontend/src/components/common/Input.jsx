import React, { forwardRef } from 'react';

export const Input = forwardRef(
  (
    {
      label,
      error,
      helperText,
      leftIcon: LeftIcon,
      rightIcon: RightIcon,
      className = '',
      id,
      type = 'text',
      ...props
    },
    ref
  ) => {
    const inputId = id || props.name || Math.random().toString(36).substring(2, 9);

    return (
      <div className="w-full">
        {label && (
          <label
            htmlFor={inputId}
            className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5"
          >
            {label}
          </label>
        )}
        <div className="relative rounded-lg shadow-sm">
          {LeftIcon && (
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
              <LeftIcon className="w-4 h-4" />
            </div>
          )}
          <input
            id={inputId}
            ref={ref}
            type={type}
            className={`
              block w-full rounded-lg text-sm transition-all duration-200
              bg-white dark:bg-navy-900 border text-slate-900 dark:text-slate-100 placeholder-slate-400
              focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500
              disabled:opacity-60 disabled:cursor-not-allowed
              ${LeftIcon ? 'pl-9' : 'pl-3.5'}
              ${RightIcon ? 'pr-9' : 'pr-3.5'}
              py-2
              ${
                error
                  ? 'border-rose-500 focus:ring-rose-500 focus:border-rose-500'
                  : 'border-slate-300 dark:border-navy-700 hover:border-slate-400 dark:hover:border-navy-600'
              }
              ${className}
            `}
            {...props}
          />
          {RightIcon && (
            <div className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400">
              {RightIcon}
            </div>
          )}
        </div>
        {error ? (
          <p className="mt-1 text-xs text-rose-500 dark:text-rose-400">{error}</p>
        ) : helperText ? (
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{helperText}</p>
        ) : null}
      </div>
    );
  }
);

Input.displayName = 'Input';

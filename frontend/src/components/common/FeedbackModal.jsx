import React, { useEffect, useRef } from 'react';
import {
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  Info,
  X
} from 'lucide-react';
import { Button } from './Button.jsx';

/**
 * Professional, accessible feedback modal replacing native browser alert() popups.
 * Fully styled for TechDesk dark navy aesthetic with Lucide iconography and status badges.
 */
export const FeedbackModal = ({
  isOpen,
  onClose,
  type = 'info',
  title = 'Notification',
  message = '',
  status,
  buttonText = 'Got it',
  maxWidth = 'max-w-md',
}) => {
  const closeButtonRef = useRef(null);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onClose?.();
      }
    };

    if (isOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
      // Automatically focus primary action button for immediate keyboard interaction
      setTimeout(() => {
        closeButtonRef.current?.focus();
      }, 50);
    }

    return () => {
      document.body.style.overflow = 'unset';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const typeConfig = {
    success: {
      icon: CheckCircle2,
      iconColor: 'text-emerald-500 dark:text-emerald-400',
      iconBg: 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500',
      badgeBg: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20',
      buttonVariant: 'success',
    },
    error: {
      icon: AlertCircle,
      iconColor: 'text-rose-500 dark:text-rose-400',
      iconBg: 'bg-rose-500/10 border-rose-500/20 text-rose-500',
      badgeBg: 'bg-rose-500/10 text-rose-500 border-rose-500/20',
      buttonVariant: 'danger',
    },
    warning: {
      icon: AlertTriangle,
      iconColor: 'text-amber-500 dark:text-amber-400',
      iconBg: 'bg-amber-500/10 border-amber-500/20 text-amber-500',
      badgeBg: 'bg-amber-500/10 text-amber-500 border-amber-500/20',
      buttonVariant: 'primary',
    },
    info: {
      icon: Info,
      iconColor: 'text-cyan-500 dark:text-cyan-400',
      iconBg: 'bg-cyan-500/10 border-cyan-500/20 text-cyan-500',
      badgeBg: 'bg-cyan-500/10 text-cyan-500 border-cyan-500/20',
      buttonVariant: 'primary',
    },
  };

  const currentTheme = typeConfig[type] || typeConfig.info;
  const IconComponent = currentTheme.icon;

  return (
    <div
      className="fixed inset-0 z-50 overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-labelledby="feedback-modal-title"
      aria-describedby="feedback-modal-message"
    >
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-900/70 dark:bg-navy-950/85 backdrop-blur-sm transition-opacity animate-in fade-in duration-200"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Dialog Positioning */}
      <div className="flex min-h-full items-center justify-center p-4 text-center sm:p-0">
        <div
          className={`relative transform overflow-hidden rounded-2xl sm:rounded-3xl bg-white dark:bg-navy-900 text-left shadow-2xl transition-all w-full ${maxWidth} border border-slate-200 dark:border-navy-750 p-6 z-10 animate-in zoom-in-95 duration-200`}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Close Icon in corner */}
          <button
            type="button"
            onClick={onClose}
            aria-label="Close dialog"
            className="absolute top-5 right-5 rounded-lg p-1 text-slate-400 hover:text-slate-500 hover:bg-slate-100 dark:hover:bg-navy-800 transition-colors focus:outline-none focus:ring-2 focus:ring-cyan-500"
          >
            <X className="w-4 h-4" />
          </button>

          {/* Modal Header & Icon */}
          <div className="flex items-start gap-4">
            <div
              className={`p-3 rounded-2xl border shrink-0 ${currentTheme.iconBg}`}
              aria-hidden="true"
            >
              <IconComponent className="w-6 h-6" />
            </div>

            <div className="space-y-1 pr-6 flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h3
                  id="feedback-modal-title"
                  className="text-base sm:text-lg font-bold text-slate-900 dark:text-slate-100 leading-snug"
                >
                  {title}
                </h3>
                {status && (
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full border uppercase tracking-wider ${currentTheme.badgeBg}`}
                  >
                    {status}
                  </span>
                )}
              </div>

              <div
                id="feedback-modal-message"
                className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 pt-1 leading-relaxed break-words"
              >
                {message}
              </div>
            </div>
          </div>

          {/* Action Footer */}
          <div className="mt-6 pt-4 border-t border-slate-100 dark:border-navy-800 flex items-center justify-end">
            <Button
              ref={closeButtonRef}
              type="button"
              variant={currentTheme.buttonVariant}
              size="sm"
              onClick={onClose}
              className="w-full sm:w-auto min-w-[100px]"
            >
              {buttonText}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

// Specialized Named Components
export const SuccessModal = (props) => <FeedbackModal type="success" {...props} />;
export const ErrorModal = (props) => <FeedbackModal type="error" {...props} />;
export const WarningModal = (props) => <FeedbackModal type="warning" {...props} />;
export const InfoModal = (props) => <FeedbackModal type="info" {...props} />;

export { ConfirmModal, ConfirmDialog } from './ConfirmModal.jsx';
export default FeedbackModal;

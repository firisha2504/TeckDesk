import React, { useEffect, useRef } from 'react';
import { AlertTriangle, AlertCircle, Info, Trash2, X } from 'lucide-react';
import { Button } from './Button.jsx';

/**
 * Reusable, accessible ConfirmModal component supporting destructive and standard confirmations.
 * Adheres strictly to TechDesk's dark navy design and accessibility best practices (ARIA, focus management, Escape key).
 */
export const ConfirmModal = ({
  isOpen,
  onClose,
  onConfirm,
  title = 'Confirm Action',
  message = 'Are you sure you want to proceed? This action cannot be undone.',
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  type = 'danger',
  isLoading = false,
  maxWidth = 'max-w-md',
}) => {
  const confirmButtonRef = useRef(null);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && !isLoading) {
        onClose?.();
      }
    };

    if (isOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
      setTimeout(() => {
        confirmButtonRef.current?.focus();
      }, 50);
    }

    return () => {
      document.body.style.overflow = 'unset';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose, isLoading]);

  if (!isOpen) return null;

  const typeConfig = {
    danger: {
      icon: Trash2,
      iconColor: 'text-rose-500 dark:text-rose-400',
      iconBg: 'bg-rose-500/10 border-rose-500/20 text-rose-500',
      confirmVariant: 'danger',
    },
    warning: {
      icon: AlertTriangle,
      iconColor: 'text-amber-500 dark:text-amber-400',
      iconBg: 'bg-amber-500/10 border-amber-500/20 text-amber-500',
      confirmVariant: 'warning',
    },
    info: {
      icon: Info,
      iconColor: 'text-blue-500 dark:text-blue-400',
      iconBg: 'bg-blue-500/10 border-blue-500/20 text-blue-500',
      confirmVariant: 'primary',
    },
  };

  const currentConfig = typeConfig[type] || typeConfig.danger;
  const IconComponent = currentConfig.icon;

  const handleConfirm = async () => {
    if (isLoading) return;
    await onConfirm?.();
  };

  return (
    <div
      className="fixed inset-0 z-50 overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-modal-title"
      aria-describedby="confirm-modal-message"
    >
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-900/70 dark:bg-navy-950/85 backdrop-blur-sm transition-opacity animate-in fade-in duration-200"
        onClick={() => !isLoading && onClose?.()}
        aria-hidden="true"
      />

      {/* Dialog Positioning */}
      <div className="flex min-h-full items-center justify-center p-4 text-center sm:p-0">
        <div
          className={`relative transform overflow-hidden rounded-2xl sm:rounded-3xl bg-white dark:bg-navy-900 text-left shadow-2xl transition-all w-full ${maxWidth} border border-slate-200 dark:border-navy-750 p-6 z-10 animate-in zoom-in-95 duration-200`}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Close button in corner */}
          <button
            type="button"
            onClick={() => !isLoading && onClose?.()}
            disabled={isLoading}
            aria-label="Close dialog"
            className="absolute top-5 right-5 rounded-lg p-1 text-slate-400 hover:text-slate-500 hover:bg-slate-100 dark:hover:bg-navy-800 transition-colors focus:outline-none focus:ring-2 focus:ring-cyan-500 disabled:opacity-50"
          >
            <X className="w-4 h-4" />
          </button>

          {/* Modal Header & Icon */}
          <div className="flex items-start gap-4">
            <div
              className={`p-3 rounded-2xl border shrink-0 ${currentConfig.iconBg}`}
              aria-hidden="true"
            >
              <IconComponent className="w-6 h-6" />
            </div>

            <div className="space-y-1 pr-6 flex-1 min-w-0">
              <h3
                id="confirm-modal-title"
                className="text-base sm:text-lg font-bold text-slate-900 dark:text-slate-100 leading-snug"
              >
                {title}
              </h3>
              <div
                id="confirm-modal-message"
                className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 pt-1 leading-relaxed break-words"
              >
                {message}
              </div>
            </div>
          </div>

          {/* Action Footer */}
          <div className="mt-6 pt-4 border-t border-slate-100 dark:border-navy-800 flex items-center justify-end gap-3">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={onClose}
              disabled={isLoading}
              className="min-w-[80px]"
            >
              {cancelLabel}
            </Button>
            <Button
              ref={confirmButtonRef}
              type="button"
              variant={currentConfig.confirmVariant === 'warning' ? 'primary' : currentConfig.confirmVariant}
              size="sm"
              isLoading={isLoading}
              onClick={handleConfirm}
              className={`min-w-[100px] ${type === 'warning' ? 'bg-amber-600 hover:bg-amber-500 text-white border-amber-600' : ''}`}
            >
              {confirmLabel}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export const ConfirmDialog = ConfirmModal;
export default ConfirmModal;

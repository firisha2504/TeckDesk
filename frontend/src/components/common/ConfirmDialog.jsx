import React from 'react';
import { AlertTriangle, AlertCircle, Info } from 'lucide-react';
import { Modal } from './Modal.jsx';
import { Button } from './Button.jsx';

export const ConfirmDialog = ({
  isOpen,
  onClose,
  onConfirm,
  title = 'Confirm Action',
  message = 'Are you sure you want to proceed? This action cannot be undone.',
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  type = 'danger',
  isLoading = false,
}) => {
  const icons = {
    danger: <AlertTriangle className="w-6 h-6 text-rose-500" />,
    warning: <AlertCircle className="w-6 h-6 text-amber-500" />,
    info: <Info className="w-6 h-6 text-blue-500" />,
  };

  const bgIcons = {
    danger: 'bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900',
    warning: 'bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900',
    info: 'bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900',
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} maxWidth="max-w-md">
      <div className="flex items-start gap-4 mb-5">
        <div className={`p-3 rounded-xl shrink-0 ${bgIcons[type] || bgIcons.danger}`}>
          {icons[type] || icons.danger}
        </div>
        <div className="text-sm text-slate-600 dark:text-slate-300 pt-1 leading-relaxed">
          {message}
        </div>
      </div>

      <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-navy-800">
        <Button variant="secondary" size="sm" onClick={onClose} disabled={isLoading}>
          {cancelLabel}
        </Button>
        <Button
          variant={type === 'danger' ? 'danger' : 'primary'}
          size="sm"
          isLoading={isLoading}
          onClick={async () => {
            await onConfirm?.();
            onClose();
          }}
        >
          {confirmLabel}
        </Button>
      </div>
    </Modal>
  );
};

import React, { useState } from 'react';
import { XCircle, AlertTriangle } from 'lucide-react';
import { Modal } from '../common/Modal.jsx';
import { Button } from '../common/Button.jsx';
import { ticketService } from '../../services/ticketService.js';
import { useModal } from '../../contexts/ModalContext.jsx';

export const RejectReassignmentModal = ({
  isOpen,
  onClose,
  request,
  requestId,
  ticketNumber,
  onSuccess,
  showError: customShowError,
  showSuccess: customShowSuccess,
}) => {
  const { showSuccess: modalShowSuccess, showError: modalShowError } = useModal();
  const showSuccess = customShowSuccess || modalShowSuccess;
  const showError = customShowError || modalShowError;
  const targetId = request?._id || requestId || request;

  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    if (!reason.trim() || reason.trim().length < 3) {
      setErrorMsg('A rejection reason is mandatory (minimum 3 characters).');
      return;
    }

    if (!targetId) {
      setErrorMsg('Missing request identifier.');
      return;
    }

    try {
      setLoading(true);
      const res = await ticketService.rejectReassignment(targetId, reason.trim());
      onSuccess?.(res);
      setReason('');
      onClose();
      showSuccess?.({
        title: 'Request Rejected',
        message: 'The reassignment request has been rejected. The current assignment remains in place.',
        status: 'Completed',
        buttonText: 'Got it',
      });
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Failed to reject request.';
      setErrorMsg(msg);
      showError?.({
        title: 'Rejection Failed',
        message: msg,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Reject Reassignment Request"
    >
      <form onSubmit={handleSubmit} className="space-y-4 text-xs">
        <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400 space-y-1">
          <p className="font-semibold flex items-center gap-1.5 text-xs">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>Retain Current Specialist Assignment</span>
          </p>
          <p className="text-[11px] leading-relaxed">
            Rejecting this request will keep the ticket assigned to{' '}
            <strong>{request?.originalTechnician?.name || 'the current technician'}</strong>.
            The technician will be notified immediately with your stated reason.
          </p>
        </div>

        {request?.reason && (
          <div className="p-3 rounded-xl bg-slate-50 dark:bg-navy-950 border border-slate-200 dark:border-navy-800">
            <span className="text-[10px] text-slate-400 uppercase font-semibold block mb-1">
              Technician's Stated Reason
            </span>
            <p className="text-slate-700 dark:text-slate-300 italic">"{request.reason}"</p>
          </div>
        )}

        {errorMsg && (
          <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 text-xs">
            {errorMsg}
          </div>
        )}

        <div>
          <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1.5">
            Mandatory Rejection Reason *
          </label>
          <textarea
            required
            rows={3}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="e.g. Current workload capacity allows completion, or target specialist is reserved for Priority 1 outages..."
            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-navy-750 bg-white dark:bg-navy-950 text-slate-900 dark:text-slate-100 placeholder-slate-400 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-rose-500"
          />
        </div>

        <div className="flex items-center justify-end gap-2.5 pt-2">
          <Button type="button" variant="outline" size="sm" onClick={onClose}>
            Cancel
          </Button>
          <Button
            type="submit"
            variant="danger"
            size="sm"
            isLoading={loading}
            leftIcon={XCircle}
          >
            Confirm Rejection
          </Button>
        </div>
      </form>
    </Modal>
  );
};

import React, { createContext, useContext, useState, useCallback, useRef } from 'react';
import { FeedbackModal } from '../components/common/FeedbackModal.jsx';
import { ConfirmModal } from '../components/common/ConfirmModal.jsx';

const ModalContext = createContext(null);

export const ModalProvider = ({ children }) => {
  // Feedback Modal State (Success, Error, Warning, Info)
  const [feedbackState, setFeedbackState] = useState({
    isOpen: false,
    type: 'info',
    title: '',
    message: '',
    status: '',
    buttonText: 'Got it',
  });
  const feedbackResolverRef = useRef(null);

  // Confirmation Modal State
  const [confirmState, setConfirmState] = useState({
    isOpen: false,
    title: 'Confirm Action',
    message: 'Are you sure you want to proceed?',
    confirmLabel: 'Confirm',
    cancelLabel: 'Cancel',
    type: 'danger',
    isLoading: false,
  });
  const confirmResolverRef = useRef(null);

  /**
   * Display a feedback modal (success, error, warning, info).
   * Resolves when the user closes the modal.
   */
  const showFeedback = useCallback(({
    type = 'info',
    title = 'Notice',
    message = '',
    status = '',
    buttonText = 'Got it',
  } = {}) => {
    return new Promise((resolve) => {
      feedbackResolverRef.current = resolve;
      setFeedbackState({
        isOpen: true,
        type,
        title,
        message,
        status,
        buttonText,
      });
    });
  }, []);

  const handleCloseFeedback = useCallback(() => {
    setFeedbackState((prev) => ({ ...prev, isOpen: false }));
    if (feedbackResolverRef.current) {
      feedbackResolverRef.current(true);
      feedbackResolverRef.current = null;
    }
  }, []);

  const showSuccess = useCallback((options) => {
    const opts = typeof options === 'string'
      ? { title: 'Success', message: options }
      : { title: 'Success', ...options };
    return showFeedback({ type: 'success', ...opts });
  }, [showFeedback]);

  const showError = useCallback((options) => {
    const opts = typeof options === 'string'
      ? { title: 'Error', message: options }
      : { title: 'Error', ...options };
    return showFeedback({ type: 'error', ...opts });
  }, [showFeedback]);

  const showWarning = useCallback((options) => {
    const opts = typeof options === 'string'
      ? { title: 'Warning', message: options }
      : { title: 'Warning', ...options };
    return showFeedback({ type: 'warning', ...opts });
  }, [showFeedback]);

  const showInfo = useCallback((options) => {
    const opts = typeof options === 'string'
      ? { title: 'Information', message: options }
      : { title: 'Information', ...options };
    return showFeedback({ type: 'info', ...opts });
  }, [showFeedback]);

  /**
   * Display a confirmation dialog.
   * Resolves to `true` if the user clicks Confirm, or `false` if closed/cancelled.
   */
  const showConfirm = useCallback(({
    title = 'Confirm Action',
    message = 'Are you sure you want to proceed? This action cannot be undone.',
    confirmLabel = 'Confirm',
    cancelLabel = 'Cancel',
    type = 'danger',
  } = {}) => {
    return new Promise((resolve) => {
      confirmResolverRef.current = resolve;
      setConfirmState({
        isOpen: true,
        title,
        message,
        confirmLabel,
        cancelLabel,
        type,
        isLoading: false,
      });
    });
  }, []);

  const handleConfirmAction = useCallback(async () => {
    setConfirmState((prev) => ({ ...prev, isOpen: false }));
    if (confirmResolverRef.current) {
      confirmResolverRef.current(true);
      confirmResolverRef.current = null;
    }
  }, []);

  const handleCloseConfirm = useCallback(() => {
    setConfirmState((prev) => ({ ...prev, isOpen: false }));
    if (confirmResolverRef.current) {
      confirmResolverRef.current(false);
      confirmResolverRef.current = null;
    }
  }, []);

  const value = {
    showFeedback,
    showSuccess,
    showError,
    showWarning,
    showInfo,
    showConfirm,
  };

  return (
    <ModalContext.Provider value={value}>
      {children}

      {/* Global Feedback Modal */}
      <FeedbackModal
        isOpen={feedbackState.isOpen}
        onClose={handleCloseFeedback}
        type={feedbackState.type}
        title={feedbackState.title}
        message={feedbackState.message}
        status={feedbackState.status}
        buttonText={feedbackState.buttonText}
      />

      {/* Global Confirmation Modal */}
      <ConfirmModal
        isOpen={confirmState.isOpen}
        onClose={handleCloseConfirm}
        onConfirm={handleConfirmAction}
        title={confirmState.title}
        message={confirmState.message}
        confirmLabel={confirmState.confirmLabel}
        cancelLabel={confirmState.cancelLabel}
        type={confirmState.type}
        isLoading={confirmState.isLoading}
      />
    </ModalContext.Provider>
  );
};

export const useModal = () => {
  const context = useContext(ModalContext);
  if (!context) {
    throw new Error('useModal must be used within a ModalProvider');
  }
  return context;
};

export default ModalContext;

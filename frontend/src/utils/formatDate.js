export function formatDate(dateInput, formatType = 'datetime') {
  if (!dateInput) return '—';
  const date = new Date(dateInput);
  if (isNaN(date.getTime())) return '—';

  if (formatType === 'date') {
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  }

  if (formatType === 'time') {
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function formatRelativeTime(dateInput) {
  if (!dateInput) return '—';
  const date = new Date(dateInput);
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffInSeconds < 60) return 'Just now';
  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) return `${diffInHours}h ago`;
  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 30) return `${diffInDays}d ago`;
  const diffInMonths = Math.floor(diffInDays / 30);
  return `${diffInMonths}mo ago`;
}

export function formatSlaRemaining(deadlineInput) {
  if (!deadlineInput) return { label: 'No SLA', isBreached: false, isWarning: false };
  const deadline = new Date(deadlineInput);
  const now = new Date();
  const diffMs = deadline.getTime() - now.getTime();

  if (diffMs <= 0) {
    const overdueMinutes = Math.abs(Math.floor(diffMs / (1000 * 60)));
    const overdueHours = Math.floor(overdueMinutes / 60);
    return {
      label: overdueHours > 0 ? `${overdueHours}h overdue` : `${overdueMinutes}m overdue`,
      isBreached: true,
      isWarning: true,
    };
  }

  const remainingMinutes = Math.floor(diffMs / (1000 * 60));
  const remainingHours = Math.floor(remainingMinutes / 60);

  if (remainingHours > 24) {
    const days = Math.floor(remainingHours / 24);
    return { label: `${days}d left`, isBreached: false, isWarning: false };
  }

  if (remainingHours > 0) {
    return {
      label: `${remainingHours}h ${remainingMinutes % 60}m left`,
      isBreached: false,
      isWarning: remainingHours < 1,
    };
  }

  return {
    label: `${remainingMinutes}m left`,
    isBreached: false,
    isWarning: true,
  };
}

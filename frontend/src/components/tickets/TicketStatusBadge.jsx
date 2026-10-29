import React from 'react';
import { STATUSES, PRIORITIES } from '../../utils/constants.js';

export const TicketStatusBadge = ({ status, className = '' }) => {
  const config = STATUSES[status] || STATUSES.Open;

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold select-none ${config.bg} ${className}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${config.dot}`} />
      {config.label}
    </span>
  );
};

export const TicketPriorityBadge = ({ priority, className = '' }) => {
  const config = PRIORITIES[priority] || PRIORITIES.Medium;

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium select-none ${config.bg} ${className}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${config.dot}`} />
      {config.label}
    </span>
  );
};

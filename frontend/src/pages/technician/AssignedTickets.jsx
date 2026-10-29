import React from 'react';
import { TicketList } from '../tickets/TicketList.jsx';

export const AssignedTickets = () => {
  return <TicketList onlyMyAssigned={true} title="My Assigned Incidents" />;
};

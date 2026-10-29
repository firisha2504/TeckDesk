import React from 'react';
import { TicketList } from '../tickets/TicketList.jsx';

export const MyTickets = () => {
  return <TicketList onlyMyTickets={true} title="My Submitted Tickets" />;
};

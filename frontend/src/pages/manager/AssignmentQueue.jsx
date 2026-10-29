import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { UserCheck, Sparkles } from 'lucide-react';
import { ticketService } from '../../services/ticketService.js';
import { PageHeader } from '../../components/layout/PageHeader.jsx';
import { TicketTable } from '../../components/tickets/TicketTable.jsx';
import { Button } from '../../components/common/Button.jsx';
import { LoadingSkeleton } from '../../components/common/LoadingSkeleton.jsx';

export const AssignmentQueue = () => {
  const [unassignedTickets, setUnassignedTickets] = useState([]);
  const [loading, setLoading] = useState(true);

  async function loadQueue() {
    try {
      setLoading(true);
      const res = await ticketService.listTickets({ assignee: 'unassigned' });
      setUnassignedTickets(res || []);
    } catch (err) {
      console.error('Failed to load queue:', err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadQueue();
  }, []);

  if (loading) {
    return <LoadingSkeleton type="table" count={5} />;
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Unassigned Incident Queue"
        description="Review tickets currently waiting for specialist triage and manual or automated allocation."
      />

      <TicketTable
        tickets={unassignedTickets}
        emptyTitle="Queue is Empty"
        emptyDescription="All incoming tickets have been intelligently assigned to specialists."
      />
    </div>
  );
};

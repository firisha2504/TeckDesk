import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { PlusCircle, Download, RefreshCw } from 'lucide-react';
import { ticketService } from '../../services/ticketService.js';
import { analyticsService } from '../../services/analyticsService.js';
import { PageHeader } from '../../components/layout/PageHeader.jsx';
import { TicketFilters } from '../../components/tickets/TicketFilters.jsx';
import { TicketTable } from '../../components/tickets/TicketTable.jsx';
import { Pagination } from '../../components/common/Pagination.jsx';
import { Button } from '../../components/common/Button.jsx';
import { useSocket } from '../../hooks/useSocket.js';
import { useAuth } from '../../contexts/AuthContext.jsx';
import { canExportReports } from '../../utils/permissions.js';

export const TicketList = ({ onlyMyTickets = false, onlyMyAssigned = false, title = 'All Tickets' }) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const [tickets, setTickets] = useState([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);

  // Filter state
  const [status, setStatus] = useState(searchParams.get('status') || '');
  const [priority, setPriority] = useState(searchParams.get('priority') || '');
  const [category, setCategory] = useState(searchParams.get('category') || '');
  const [overdue, setOverdue] = useState(searchParams.get('overdue') === 'true');
  const [search, setSearch] = useState(searchParams.get('search') || '');
  const [page, setPage] = useState(parseInt(searchParams.get('page') || '1', 10));

  const fetchTickets = useCallback(async () => {
    try {
      setLoading(true);
      const params = {
        page,
        limit: 15,
        status,
        priority,
        category,
        overdue: overdue ? 'true' : '',
        search,
      };

      if (onlyMyTickets || user?.role === 'employee') {
        params.creator = user?._id;
      }
      if (onlyMyAssigned) {
        params.onlyMyAssigned = 'true';
      }

      const res = await ticketService.listTickets(params);
      setTickets(res || []);
      // When res is unwrapped array, total is in res.meta or length
      setTotal(res?.length || 0);
      setTotalPages(Math.max(1, Math.ceil((res?.length || 0) / 15)));
    } catch (err) {
      console.error('Failed to fetch tickets:', err);
    } finally {
      setLoading(false);
    }
  }, [page, status, priority, category, overdue, search, onlyMyTickets, onlyMyAssigned, user]);

  useEffect(() => {
    fetchTickets();
  }, [fetchTickets]);

  // Real-time updates: refresh list when tickets are updated
  useSocket({
    'ticket:created': () => fetchTickets(),
    'ticket:status_changed': () => fetchTickets(),
    'ticket:assigned': () => fetchTickets(),
  });

  const handleExport = async () => {
    try {
      await analyticsService.exportCSV({ status, priority, category });
    } catch (err) {
      alert('Export failed: ' + err.message);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title={title}
        description="Filter, search, inspect SLAs, and collaborate on support incidents in real time."
        actions={
          <div className="flex items-center gap-2.5">
            {canExportReports(user) && (
              <Button
                variant="outline"
                size="sm"
                leftIcon={Download}
                onClick={handleExport}
              >
                Export CSV
              </Button>
            )}
            <Button
              variant="primary"
              size="sm"
              leftIcon={PlusCircle}
              onClick={() => navigate('/tickets/create')}
            >
              New Ticket
            </Button>
          </div>
        }
      />

      {/* Filter Tabs and Controls */}
      <TicketFilters
        status={status}
        onStatusChange={(val) => {
          setStatus(val);
          setPage(1);
        }}
        priority={priority}
        onPriorityChange={(val) => {
          setPriority(val);
          setPage(1);
        }}
        category={category}
        onCategoryChange={(val) => {
          setCategory(val);
          setPage(1);
        }}
        overdue={overdue}
        onOverdueToggle={(val) => {
          setOverdue(val);
          setPage(1);
        }}
      />

      {/* Main Table */}
      <TicketTable tickets={tickets} loading={loading} />

      {/* Pagination */}
      <Pagination
        currentPage={page}
        totalPages={totalPages}
        totalItems={total}
        pageSize={15}
        onPageChange={setPage}
      />
    </div>
  );
};

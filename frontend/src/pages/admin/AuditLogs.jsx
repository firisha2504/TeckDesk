import React, { useState, useEffect } from 'react';
import { ShieldCheck, Search, Filter } from 'lucide-react';
import { api } from '../../services/apiClient.js';
import { PageHeader } from '../../components/layout/PageHeader.jsx';
import { DataTable } from '../../components/common/DataTable.jsx';
import { Pagination } from '../../components/common/Pagination.jsx';
import { formatDate } from '../../utils/formatDate.js';

export const AuditLogs = () => {
  const [logs, setLogs] = useState([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);

  async function loadLogs() {
    try {
      setLoading(true);
      const res = await api.get(`/organizations/audit-logs?page=${page}&limit=20`);
      setLogs(res || []);
      setTotal(res?.length || 0);
      setTotalPages(Math.max(1, Math.ceil((res?.length || 0) / 20)));
    } catch (err) {
      console.error('Failed to load audit logs:', err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadLogs();
  }, [page]);

  const columns = [
    {
      key: 'action',
      header: 'Event Action',
      render: (log) => (
        <span className="font-mono text-xs font-bold text-slate-800 dark:text-slate-200">
          {log.action}
        </span>
      ),
    },
    {
      key: 'actor',
      header: 'Actor',
      render: (log) => (
        <div className="text-xs">
          <span className="font-semibold text-slate-900 dark:text-slate-100 block">
            {log.actor?.name || 'System'}
          </span>
          <span className="text-[10px] text-slate-400">{log.actor?.email || 'automated-task'}</span>
        </div>
      ),
    },
    {
      key: 'resource',
      header: 'Resource',
      render: (log) => (
        <span className="text-xs font-medium text-slate-600 dark:text-slate-300">
          {log.resource} {log.resourceId ? `(#${log.resourceId.slice(-6)})` : ''}
        </span>
      ),
    },
    {
      key: 'ipAddress',
      header: 'IP Address',
      render: (log) => (
        <span className="text-xs font-mono text-slate-400">{log.ipAddress || '127.0.0.1'}</span>
      ),
    },
    {
      key: 'createdAt',
      header: 'Timestamp',
      render: (log) => (
        <span className="text-xs text-slate-400">{formatDate(log.createdAt)}</span>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Enterprise Audit Trail"
        description="Immutable compliance logs of every user authentication, status change, and administrative policy update."
      />

      <DataTable columns={columns} data={logs} loading={loading} />

      <Pagination
        currentPage={page}
        totalPages={totalPages}
        totalItems={total}
        pageSize={20}
        onPageChange={setPage}
      />
    </div>
  );
};

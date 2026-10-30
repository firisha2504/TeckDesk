import React, { useState, useEffect, useCallback } from 'react';
import {
  FileText,
  Search,
  Filter,
  RefreshCw,
  Eye,
  Activity,
  ShieldCheck,
  Calendar,
} from 'lucide-react';
import { superadminService } from '../../services/superadminService.js';
import { Button } from '../../components/common/Button.jsx';
import { Modal } from '../../components/common/Modal.jsx';
import { Pagination } from '../../components/common/Pagination.jsx';
import { LoadingSkeleton } from '../../components/common/LoadingSkeleton.jsx';
import { EmptyState } from '../../components/common/EmptyState.jsx';

export const GlobalAuditLogs = () => {
  const [logs, setLogs] = useState([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Filters
  const [actionFilter, setActionFilter] = useState('');
  const [resourceFilter, setResourceFilter] = useState('');

  // Selected Log for inspection modal
  const [selectedLog, setSelectedLog] = useState(null);

  const fetchLogs = useCallback(async (isRefresh = false) => {
    try {
      if (isRefresh) setRefreshing(true);
      else setLoading(true);

      const params = {
        page,
        limit: 25,
        action: actionFilter || undefined,
        resource: resourceFilter || undefined,
      };

      const res = await superadminService.getAuditLogs(params);
      setLogs(res?.logs || []);
      setTotal(res?.total || 0);
      setTotalPages(res?.totalPages || 1);
    } catch (err) {
      console.error('Failed to load global audit logs:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [page, actionFilter, resourceFilter]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  const getActionBadge = (action) => {
    if (action.includes('APPROVED') || action.includes('REACTIVATED')) {
      return 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20';
    }
    if (action.includes('SUSPENDED') || action.includes('REJECTED')) {
      return 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20';
    }
    if (action.includes('REGISTERED') || action.includes('CREATED')) {
      return 'bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border border-cyan-500/20';
    }
    return 'bg-slate-100 dark:bg-navy-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-navy-700';
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              Global Platform Audit Trail
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20">
              Compliance Stream
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Complete, immutable log of administrative actions, tenant lifecycle transitions, and security operations.
          </p>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={() => fetchLogs(true)}
          isLoading={refreshing}
          leftIcon={RefreshCw}
        >
          Refresh Logs
        </Button>
      </div>

      {/* Filter Bar */}
      <div className="p-4 rounded-2xl bg-white dark:bg-navy-900 border border-slate-200 dark:border-navy-800 shadow-sm flex flex-wrap items-center gap-3">
        <select
          value={actionFilter}
          onChange={(e) => {
            setActionFilter(e.target.value);
            setPage(1);
          }}
          className="px-3.5 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 dark:border-navy-700 bg-slate-50 dark:bg-navy-950 text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-cyan-500"
        >
          <option value="">All Actions</option>
          <option value="ORGANIZATION_APPROVED">ORGANIZATION_APPROVED</option>
          <option value="ORGANIZATION_REJECTED">ORGANIZATION_REJECTED</option>
          <option value="ORGANIZATION_SUSPENDED">ORGANIZATION_SUSPENDED</option>
          <option value="ORGANIZATION_REACTIVATED">ORGANIZATION_REACTIVATED</option>
          <option value="ORGANIZATION_UPDATED">ORGANIZATION_UPDATED</option>
          <option value="ORGANIZATION_REGISTERED">ORGANIZATION_REGISTERED</option>
          <option value="USER_LOGGED_IN">USER_LOGGED_IN</option>
        </select>

        <select
          value={resourceFilter}
          onChange={(e) => {
            setResourceFilter(e.target.value);
            setPage(1);
          }}
          className="px-3.5 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 dark:border-navy-700 bg-slate-50 dark:bg-navy-950 text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-cyan-500"
        >
          <option value="">All Resources</option>
          <option value="Organization">Organization</option>
          <option value="User">User</option>
          <option value="Ticket">Ticket</option>
          <option value="Team">Team</option>
          <option value="Attachment">Attachment</option>
        </select>

        {(actionFilter || resourceFilter) && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setActionFilter('');
              setResourceFilter('');
              setPage(1);
            }}
          >
            Clear Filters
          </Button>
        )}
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-navy-900 border border-slate-200 dark:border-navy-800 rounded-3xl shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-8">
            <LoadingSkeleton type="table" count={8} />
          </div>
        ) : logs.length > 0 ? (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 dark:bg-navy-850 text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-100 dark:border-navy-800">
                  <tr>
                    <th className="py-3 px-5">Timestamp</th>
                    <th className="py-3 px-4">Action</th>
                    <th className="py-3 px-4">Actor</th>
                    <th className="py-3 px-4">Organization</th>
                    <th className="py-3 px-4">Resource</th>
                    <th className="py-3 px-4">IP Address</th>
                    <th className="py-3 px-5 text-right">Details</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-navy-800 text-slate-700 dark:text-slate-300">
                  {logs.map((log) => (
                    <tr
                      key={log._id}
                      className="hover:bg-slate-50/60 dark:hover:bg-navy-800/40 transition-colors"
                    >
                      <td className="py-3 px-5 text-slate-500 whitespace-nowrap">
                        {new Date(log.createdAt).toLocaleString()}
                      </td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-0.5 rounded-full font-bold text-[10px] ${getActionBadge(log.action)}`}>
                          {log.action}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-semibold text-slate-900 dark:text-white">
                          {log.actor?.name || log.actor?.email || 'System'}
                        </div>
                        <div className="text-[10px] text-slate-400">
                          {log.actor?.role || 'Service'}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        {log.organization?.name ? (
                          <span className="font-medium text-slate-900 dark:text-slate-100">
                            {log.organization.name}
                          </span>
                        ) : (
                          <span className="text-slate-400 italic">Platform-wide</span>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <span className="font-medium text-slate-700 dark:text-slate-300">
                          {log.resource}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-slate-400 font-mono text-[11px]">
                        {log.ipAddress || '—'}
                      </td>
                      <td className="py-3 px-5 text-right">
                        <button
                          onClick={() => setSelectedLog(log)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-cyan-500 hover:bg-slate-100 dark:hover:bg-navy-800"
                          title="Inspect Details"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {totalPages > 1 && (
              <div className="p-4 border-t border-slate-100 dark:border-navy-800">
                <Pagination
                  currentPage={page}
                  totalPages={totalPages}
                  onPageChange={setPage}
                />
              </div>
            )}
          </>
        ) : (
          <EmptyState
            title="No audit logs found"
            description="No audit events matched your filter criteria."
          />
        )}
      </div>

      {/* Inspect Log Details Modal */}
      <Modal
        isOpen={!!selectedLog}
        onClose={() => setSelectedLog(null)}
        title="Audit Event Details"
      >
        {selectedLog && (
          <div className="space-y-4 text-xs">
            <div className="grid grid-cols-2 gap-3 p-3 rounded-2xl bg-slate-50 dark:bg-navy-950">
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Action</span>
                <span className="font-bold text-slate-900 dark:text-white">{selectedLog.action}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Timestamp</span>
                <span className="text-slate-700 dark:text-slate-300">{new Date(selectedLog.createdAt).toLocaleString()}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Actor</span>
                <span className="text-slate-700 dark:text-slate-300">
                  {selectedLog.actor?.name} ({selectedLog.actor?.email})
                </span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Organization</span>
                <span className="text-slate-700 dark:text-slate-300">
                  {selectedLog.organization?.name || 'Platform Wide'}
                </span>
              </div>
            </div>

            <div>
              <span className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                Event Payload & Metadata
              </span>
              <pre className="p-3.5 rounded-xl bg-slate-900 text-cyan-400 font-mono text-[11px] overflow-x-auto max-h-60">
                {JSON.stringify(selectedLog.details || {}, null, 2)}
              </pre>
            </div>

            <div className="pt-2 flex justify-end">
              <Button variant="outline" size="sm" onClick={() => setSelectedLog(null)}>
                Close
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

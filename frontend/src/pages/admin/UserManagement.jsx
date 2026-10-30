import React, { useState, useEffect } from 'react';
import { Users, Search, Edit2, Shield, CheckCircle, XCircle } from 'lucide-react';
import { api } from '../../services/apiClient.js';
import { PageHeader } from '../../components/layout/PageHeader.jsx';
import { DataTable } from '../../components/common/DataTable.jsx';
import { Modal } from '../../components/common/Modal.jsx';
import { Button } from '../../components/common/Button.jsx';
import { SearchBar } from '../../components/common/SearchBar.jsx';
import { useModal } from '../../contexts/ModalContext.jsx';
import { ROLES } from '../../utils/constants.js';

export const UserManagement = () => {
  const { showConfirm, showSuccess, showError } = useModal();
  const [users, setUsers] = useState([]);
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');

  // Edit user modal
  const [selectedUser, setSelectedUser] = useState(null);
  const [editRole, setEditRole] = useState('employee');
  const [editTeam, setEditTeam] = useState('');
  const [editActive, setEditActive] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  async function loadUsers() {
    try {
      setLoading(true);
      const [usersData, teamsData] = await Promise.all([
        api.get(`/users?search=${encodeURIComponent(search)}&role=${roleFilter}`),
        api.get('/teams'),
      ]);
      setUsers(usersData || []);
      setTeams(teamsData || []);
    } catch (err) {
      console.error('Failed to load users:', err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadUsers();
  }, [search, roleFilter]);

  const handleEditClick = (u) => {
    setSelectedUser(u);
    setEditRole(u.role);
    setEditTeam(u.team?._id || u.team || '');
    setEditActive(u.isActive);
  };

  const handleSaveUser = async (e) => {
    e.preventDefault();
    if (!selectedUser) return;

    if (selectedUser.isActive && !editActive) {
      const confirmed = await showConfirm({
        title: `Deactivate User: ${selectedUser.name}`,
        message: `Are you sure you want to deactivate "${selectedUser.name}"? They will no longer be permitted to log in to TechDesk.`,
        confirmLabel: 'Deactivate User',
        type: 'danger',
      });
      if (!confirmed) return;
    }

    setSubmitting(true);
    try {
      await api.patch(`/users/${selectedUser._id}/role`, {
        role: editRole,
        teamId: editTeam || null,
        isActive: editActive,
      });
      const userName = selectedUser.name;
      setSelectedUser(null);
      await loadUsers();
      showSuccess({
        title: 'User Updated',
        message: `User "${userName}" profile and permissions updated successfully.`,
        status: 'Completed',
        buttonText: 'Got it',
      });
    } catch (err) {
      showError({
        title: 'Update Failed',
        message: 'Error updating user: ' + (err.response?.data?.message || err.message),
      });
    } finally {
      setSubmitting(false);
    }
  };

  const columns = [
    {
      key: 'name',
      header: 'User',
      render: (u) => (
        <div className="flex items-center gap-3">
          {u.avatar ? (
            <img src={u.avatar} alt={u.name} className="w-8 h-8 rounded-full object-cover" />
          ) : (
            <div className="w-8 h-8 rounded-full bg-blue-600 text-white font-bold flex items-center justify-center text-xs">
              {u.name?.charAt(0)}
            </div>
          )}
          <div>
            <span className="font-semibold text-slate-900 dark:text-slate-100 block">
              {u.name}
            </span>
            <span className="text-[11px] text-slate-400">{u.email}</span>
          </div>
        </div>
      ),
    },
    {
      key: 'role',
      header: 'Role',
      render: (u) => {
        const info = ROLES[u.role] || ROLES.employee;
        return (
          <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${info.badge}`}>
            {info.label}
          </span>
        );
      },
    },
    {
      key: 'team',
      header: 'Assigned Team',
      render: (u) => (
        <span className="text-xs text-slate-600 dark:text-slate-300 font-medium">
          {u.team?.name || '—'}
        </span>
      ),
    },
    {
      key: 'skills',
      header: 'Specialties',
      render: (u) => (
        <div className="flex flex-wrap gap-1">
          {u.skills?.length > 0 ? (
            u.skills.map((s) => (
              <span
                key={s}
                className="px-2 py-0.2 rounded text-[10px] bg-slate-100 dark:bg-navy-800 text-slate-600 dark:text-slate-300"
              >
                {s}
              </span>
            ))
          ) : (
            <span className="text-xs text-slate-400">—</span>
          )}
        </div>
      ),
    },
    {
      key: 'isActive',
      header: 'Status',
      render: (u) => (
        <span
          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold ${
            u.isActive ? 'bg-emerald-500/10 text-emerald-500' : 'bg-rose-500/10 text-rose-500'
          }`}
        >
          {u.isActive ? <CheckCircle className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
          {u.isActive ? 'Active' : 'Deactivated'}
        </span>
      ),
    },
    {
      key: 'actions',
      header: '',
      align: 'right',
      render: (u) => (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            handleEditClick(u);
          }}
          className="p-1.5 rounded-lg text-slate-400 hover:text-blue-500 hover:bg-slate-100 dark:hover:bg-navy-800 transition-colors"
        >
          <Edit2 className="w-4 h-4" />
        </button>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="User & Access Management"
        description="Manage organization accounts, support roles, security permissions, and team allocations."
      />

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="w-full sm:w-80">
          <SearchBar
            value={search}
            onChange={setSearch}
            placeholder="Search by name or email..."
          />
        </div>

        <select
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
          className="w-full sm:w-auto text-xs rounded-xl bg-slate-100 dark:bg-navy-850 border border-slate-200 dark:border-navy-750 text-slate-700 dark:text-slate-300 px-3 py-2 focus:outline-none"
        >
          <option value="">All Roles</option>
          <option value="employee">Employees</option>
          <option value="technician">Technicians</option>
          <option value="manager">Managers</option>
          <option value="admin">Administrators</option>
        </select>
      </div>

      <DataTable columns={columns} data={users} loading={loading} />

      {/* Edit User Modal */}
      <Modal
        isOpen={!!selectedUser}
        onClose={() => setSelectedUser(null)}
        title={`Modify User: ${selectedUser?.name}`}
        subtitle={selectedUser?.email}
      >
        <form onSubmit={handleSaveUser} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
              Assigned Role
            </label>
            <select
              value={editRole}
              onChange={(e) => setEditRole(e.target.value)}
              className="w-full rounded-lg text-sm bg-white dark:bg-navy-950 border border-slate-300 dark:border-navy-750 text-slate-900 dark:text-slate-100 p-2.5 focus:outline-none focus:ring-2 focus:ring-cyan-500"
            >
              <option value="employee">Employee</option>
              <option value="technician">Technician</option>
              <option value="manager">Manager</option>
              <option value="admin">Administrator</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
              Support Team
            </label>
            <select
              value={editTeam}
              onChange={(e) => setEditTeam(e.target.value)}
              className="w-full rounded-lg text-sm bg-white dark:bg-navy-950 border border-slate-300 dark:border-navy-750 text-slate-900 dark:text-slate-100 p-2.5 focus:outline-none focus:ring-2 focus:ring-cyan-500"
            >
              <option value="">None / Unassigned</option>
              {teams.map((t) => (
                <option key={t._id} value={t._id}>
                  {t.name}
                </option>
              ))}
            </select>
          </div>

          <div className="pt-2">
            <label className="flex items-center gap-2 text-xs font-medium text-slate-700 dark:text-slate-300 cursor-pointer">
              <input
                type="checkbox"
                checked={editActive}
                onChange={(e) => setEditActive(e.target.checked)}
                className="rounded border-slate-300 dark:border-navy-700 text-cyan-500 focus:ring-cyan-500"
              />
              Account Active (Permit Login)
            </label>
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100 dark:border-navy-800">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setSelectedUser(null)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              isLoading={submitting}
            >
              Save Changes
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

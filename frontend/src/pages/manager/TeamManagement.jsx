import React, { useState, useEffect } from 'react';
import { Users, Plus, UserPlus, Shield, Wrench, CheckCircle, Trash2 } from 'lucide-react';
import { api } from '../../services/apiClient.js';
import { PageHeader } from '../../components/layout/PageHeader.jsx';
import { Button } from '../../components/common/Button.jsx';
import { Modal } from '../../components/common/Modal.jsx';
import { Input } from '../../components/common/Input.jsx';
import { LoadingSkeleton } from '../../components/common/LoadingSkeleton.jsx';
import { useModal } from '../../contexts/ModalContext.jsx';

export const TeamManagement = () => {
  const { showConfirm, showSuccess, showError } = useModal();
  const [teams, setTeams] = useState([]);
  const [technicians, setTechnicians] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);

  const [teamName, setTeamName] = useState('');
  const [specialties, setSpecialties] = useState(['Hardware']);
  const [leadId, setLeadId] = useState('');
  const [selectedMemberIds, setSelectedMemberIds] = useState([]);
  const [submitting, setSubmitting] = useState(false);

  async function loadData() {
    try {
      setLoading(true);
      const [teamData, usersData] = await Promise.all([
        api.get('/teams'),
        api.get('/users?role=technician'),
      ]);
      setTeams(teamData || []);
      setTechnicians(usersData || []);
    } catch (err) {
      console.error('Failed to load teams data:', err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  const handleCreateTeam = async (e) => {
    e.preventDefault();
    if (!teamName.trim()) return;
    setSubmitting(true);
    try {
      await api.post('/teams', {
        name: teamName.trim(),
        specialties,
        leadId: leadId || null,
        memberIds: selectedMemberIds,
      });
      setModalOpen(false);
      setTeamName('');
      setSelectedMemberIds([]);
      await loadData();
      showSuccess({
        title: 'Team Created',
        message: `Team "${teamName.trim()}" has been created successfully.`,
        status: 'Completed',
        buttonText: 'Got it',
      });
    } catch (err) {
      showError({
        title: 'Create Team Failed',
        message: 'Error creating team: ' + (err.response?.data?.message || err.message),
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteTeam = async (team) => {
    const confirmed = await showConfirm({
      title: `Delete Team: ${team.name}`,
      message: `Are you sure you want to delete team "${team.name}"? Technicians will be unassigned from this team. This action cannot be undone.`,
      confirmLabel: 'Delete Team',
      type: 'danger',
    });
    if (!confirmed) return;

    try {
      await api.delete(`/teams/${team._id}`);
      showSuccess({
        title: 'Team Deleted',
        message: `Team "${team.name}" has been deleted successfully.`,
        status: 'Completed',
        buttonText: 'Got it',
      });
      await loadData();
    } catch (err) {
      showError({
        title: 'Delete Team Failed',
        message: 'Failed to delete team: ' + (err.response?.data?.message || err.message),
      });
    }
  };

  const toggleSpecialty = (spec) => {
    setSpecialties((prev) =>
      prev.includes(spec) ? prev.filter((s) => s !== spec) : [...prev, spec]
    );
  };

  const toggleMember = (memberId) => {
    setSelectedMemberIds((prev) =>
      prev.includes(memberId) ? prev.filter((id) => id !== memberId) : [...prev, memberId]
    );
  };

  if (loading) {
    return <LoadingSkeleton type="card" count={3} />;
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Support Team Management"
        description="Organize technicians into specialized tier teams and route incoming incidents effectively."
        actions={
          <Button
            variant="primary"
            size="sm"
            leftIcon={Plus}
            onClick={() => setModalOpen(true)}
          >
            Create Team
          </Button>
        }
      />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {teams.map((team) => (
          <div
            key={team._id}
            className="p-5 rounded-2xl border border-slate-200 dark:border-navy-800 bg-white dark:bg-navy-900 shadow-sm flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="text-base font-bold text-slate-900 dark:text-slate-100">
                  {team.name}
                </span>
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-500/10 text-blue-500">
                    {team.members?.length || 0} Members
                  </span>
                  <button
                    type="button"
                    onClick={() => handleDeleteTeam(team)}
                    title="Delete team"
                    className="p-1.5 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Specialties */}
              <div className="flex flex-wrap gap-1.5 mb-4">
                {team.specialties?.map((spec) => (
                  <span
                    key={spec}
                    className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-slate-100 dark:bg-navy-800 text-slate-600 dark:text-slate-300"
                  >
                    {spec}
                  </span>
                ))}
              </div>

              {/* Team Members List */}
              <div className="space-y-2 pt-3 border-t border-slate-100 dark:border-navy-800/80">
                <span className="text-[11px] font-semibold text-slate-400 block">
                  Active Specialists
                </span>
                {team.members?.length === 0 ? (
                  <p className="text-xs italic text-slate-400">No technicians assigned yet</p>
                ) : (
                  team.members?.map((member) => (
                    <div key={member._id} className="flex items-center gap-2 text-xs">
                      {member.avatar ? (
                        <img
                          src={member.avatar}
                          alt={member.name}
                          className="w-5 h-5 rounded-full object-cover"
                        />
                      ) : (
                        <div className="w-5 h-5 rounded-full bg-blue-600 text-white font-bold flex items-center justify-center text-[9px]">
                          {member.name?.charAt(0)}
                        </div>
                      )}
                      <span className="text-slate-700 dark:text-slate-300 font-medium">
                        {member.name}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Create Team Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Create Support Team"
        subtitle="Group technicians by domain specialization"
      >
        <form onSubmit={handleCreateTeam} className="space-y-4">
          <Input
            label="Team Name"
            type="text"
            required
            value={teamName}
            onChange={(e) => setTeamName(e.target.value)}
            placeholder="e.g. Infrastructure & Cloud Security"
          />

          <div>
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
              Domain Specialties
            </label>
            <div className="flex flex-wrap gap-2">
              {['Hardware', 'Software', 'Network', 'Account', 'Security', 'Other'].map(
                (spec) => (
                  <button
                    key={spec}
                    type="button"
                    onClick={() => toggleSpecialty(spec)}
                    className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${
                      specialties.includes(spec)
                        ? 'bg-blue-600 text-white'
                        : 'bg-slate-100 dark:bg-navy-800 text-slate-600 dark:text-slate-300'
                    }`}
                  >
                    {spec}
                  </button>
                )
              )}
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
              Select Technicians
            </label>
            <div className="max-h-48 overflow-y-auto space-y-1.5 p-2 rounded-xl border border-slate-200 dark:border-navy-800">
              {technicians.map((tech) => (
                <label
                  key={tech._id}
                  className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-slate-50 dark:hover:bg-navy-850 cursor-pointer text-xs"
                >
                  <input
                    type="checkbox"
                    checked={selectedMemberIds.includes(tech._id)}
                    onChange={() => toggleMember(tech._id)}
                    className="rounded text-cyan-500 focus:ring-cyan-500"
                  />
                  <span>{tech.name} ({tech.skills?.join(', ') || 'No skills listed'})</span>
                </label>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100 dark:border-navy-800">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              isLoading={submitting}
            >
              Save Team
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

import React, { useState, useEffect } from 'react';
import {
  Users,
  Building2,
  AlertCircle,
  Sparkles,
  ArrowRightLeft,
  CheckCircle2,
} from 'lucide-react';
import { Modal } from '../common/Modal.jsx';
import { Button } from '../common/Button.jsx';
import { ticketService } from '../../services/ticketService.js';

export const RequestReassignmentModal = ({
  isOpen,
  onClose,
  ticket,
  onSuccess,
  showError,
  showSuccess,
}) => {
  const [targetType, setTargetType] = useState('technician'); // 'technician' | 'team'
  const [technicians, setTechnicians] = useState([]);
  const [teams, setTeams] = useState([]);
  const [selectedTechId, setSelectedTechId] = useState('');
  const [selectedTeamId, setSelectedTeamId] = useState('');
  const [reason, setReason] = useState('');
  const [loadingCandidates, setLoadingCandidates] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (!isOpen || !ticket?._id) return;

    setErrorMsg('');
    setReason('');

    async function loadCandidates() {
      try {
        setLoadingCandidates(true);
        const [candidates, teamsData] = await Promise.all([
          ticketService.getRecommendedTechnicians(ticket._id),
          ticketService.getTeams(),
        ]);

        // Filter out current assignee from technician list
        const eligibleTechs = (candidates || []).filter(
          (t) => t._id.toString() !== ticket.assignee?._id?.toString()
        );
        setTechnicians(eligibleTechs);
        if (eligibleTechs.length > 0) {
          setSelectedTechId(eligibleTechs[0]._id);
        }

        const eligibleTeams = teamsData || [];
        setTeams(eligibleTeams);
        if (eligibleTeams.length > 0) {
          setSelectedTeamId(eligibleTeams[0]._id);
        }
      } catch (err) {
        console.error('Failed to load reassignment candidates:', err);
      } finally {
        setLoadingCandidates(false);
      }
    }

    loadCandidates();
  }, [isOpen, ticket]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    if (!reason.trim() || reason.trim().length < 3) {
      setErrorMsg('A specific reason for reassignment is mandatory (minimum 3 characters).');
      return;
    }

    if (targetType === 'technician' && !selectedTechId) {
      setErrorMsg('Please select a target technician.');
      return;
    }

    if (targetType === 'team' && !selectedTeamId) {
      setErrorMsg('Please select a target team.');
      return;
    }

    try {
      setSubmitting(true);
      const payload = {
        reason: reason.trim(),
        targetTechnicianId: targetType === 'technician' ? selectedTechId : null,
        targetTeamId: targetType === 'team' ? selectedTeamId : null,
      };

      const res = await ticketService.requestReassignment(ticket._id, payload);
      onSuccess?.(res);
      onClose();
      showSuccess?.({
        title: 'Reassignment Requested',
        message: 'Your reassignment request has been submitted to your manager for review.',
        status: 'Submitted',
        buttonText: 'Got it',
      });
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Failed to submit request.';
      setErrorMsg(msg);
      showError?.({
        title: 'Request Failed',
        message: msg,
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Request Ticket Reassignment">
      <form onSubmit={handleSubmit} className="space-y-4 text-xs">
        {/* Info Box */}
        <div className="p-3 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-600 dark:text-cyan-400 leading-relaxed">
          <p className="font-semibold flex items-center gap-1.5 text-xs mb-1">
            <ArrowRightLeft className="w-4 h-4" />
            <span>Manager Approval Workflow</span>
          </p>
          <span>
            Reassignment requests are routed to management for verification. Your current assignment
            will remain active until a manager reviews and approves the request.
          </span>
        </div>

        {errorMsg && (
          <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Target Switcher: Specialist vs Team */}
        <div>
          <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-2">
            Reassign To:
          </label>
          <div className="grid grid-cols-2 gap-2 p-1 rounded-xl bg-slate-100 dark:bg-navy-950 border border-slate-200 dark:border-navy-800">
            <button
              type="button"
              onClick={() => setTargetType('technician')}
              className={`py-2 px-3 rounded-lg font-semibold flex items-center justify-center gap-2 transition-all ${
                targetType === 'technician'
                  ? 'bg-white dark:bg-navy-800 text-cyan-600 dark:text-cyan-400 shadow-sm'
                  : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              <span>Specific Specialist</span>
            </button>
            <button
              type="button"
              onClick={() => setTargetType('team')}
              className={`py-2 px-3 rounded-lg font-semibold flex items-center justify-center gap-2 transition-all ${
                targetType === 'team'
                  ? 'bg-white dark:bg-navy-800 text-cyan-600 dark:text-cyan-400 shadow-sm'
                  : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
              }`}
            >
              <Building2 className="w-3.5 h-3.5" />
              <span>Department / Team</span>
            </button>
          </div>
        </div>

        {/* Technician Dropdown */}
        {targetType === 'technician' && (
          <div>
            <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1.5">
              Select Specialist *
            </label>
            {loadingCandidates ? (
              <div className="h-10 bg-slate-100 dark:bg-navy-950 rounded-xl animate-pulse" />
            ) : technicians.length > 0 ? (
              <select
                required
                value={selectedTechId}
                onChange={(e) => setSelectedTechId(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-navy-750 bg-white dark:bg-navy-950 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-cyan-500 text-xs sm:text-sm"
              >
                {technicians.map((t) => (
                  <option key={t._id} value={t._id}>
                    {t.name} &bull; {t.teamName} ({t.activeTickets} active tickets)
                    {t.hasSkill ? ' — Skill Match' : ''}
                  </option>
                ))}
              </select>
            ) : (
              <p className="text-slate-400 italic py-2">
                No other eligible technicians available in this organization.
              </p>
            )}
          </div>
        )}

        {/* Team Dropdown */}
        {targetType === 'team' && (
          <div>
            <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1.5">
              Select Department Team *
            </label>
            {loadingCandidates ? (
              <div className="h-10 bg-slate-100 dark:bg-navy-950 rounded-xl animate-pulse" />
            ) : teams.length > 0 ? (
              <select
                required
                value={selectedTeamId}
                onChange={(e) => setSelectedTeamId(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-navy-750 bg-white dark:bg-navy-950 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-cyan-500 text-xs sm:text-sm"
              >
                {teams.map((tm) => (
                  <option key={tm._id} value={tm._id}>
                    {tm.name} {tm.specialties?.length ? `(${tm.specialties.join(', ')})` : ''}
                  </option>
                ))}
              </select>
            ) : (
              <p className="text-slate-400 italic py-2">No teams configured in this organization.</p>
            )}
          </div>
        )}

        {/* Mandatory Reason */}
        <div>
          <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1.5">
            Mandatory Reason for Reassignment *
          </label>
          <textarea
            required
            rows={3}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="e.g. Hardware diagnostic requires physical datacenter access or specialized cloud certifications..."
            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-navy-750 bg-white dark:bg-navy-950 text-slate-900 dark:text-slate-100 placeholder-slate-400 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500"
          />
          <p className="text-[10px] text-slate-400 mt-1">
            Provide clear context for the manager to evaluate workload and domain qualifications.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-2.5 pt-2">
          <Button type="button" variant="outline" size="sm" onClick={onClose}>
            Cancel
          </Button>
          <Button
            type="submit"
            variant="primary"
            size="sm"
            isLoading={submitting}
            leftIcon={ArrowRightLeft}
          >
            Submit Request
          </Button>
        </div>
      </form>
    </Modal>
  );
};

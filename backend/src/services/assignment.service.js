import { User } from '../models/User.js';
import { Team } from '../models/Team.js';
import { Ticket } from '../models/Ticket.js';
import { logger } from '../utils/logger.js';

export const assignmentService = {
  /**
   * Find the best technician for a ticket based on skills, team specialties, and current active workload
   */
  findBestTechnician: async (ticket) => {
    try {
      const orgId = ticket.organization?._id || ticket.organization;

      // 1. Fetch all active technicians in this organization
      const technicians = await User.find({
        organization: orgId,
        role: 'technician',
        isActive: true,
      }).populate('team');

      if (!technicians.length) {
        logger.warn(`No active technicians found in organization ${orgId}`);
        return null;
      }

      // 2. Fetch current active workload for all technicians in parallel
      const workloadMap = {};
      const activeCounts = await Ticket.aggregate([
        {
          $match: {
            organization: orgId,
            status: { $in: ['Assigned', 'In Progress', 'Pending User'] },
            assignee: { $in: technicians.map((t) => t._id) },
          },
        },
        {
          $group: {
            _id: '$assignee',
            count: { $sum: 1 },
          },
        },
      ]);

      activeCounts.forEach((item) => {
        workloadMap[item._id.toString()] = item.count;
      });

      // 3. Score each technician
      const scoredTechnicians = technicians.map((tech) => {
        let score = 50; // baseline score
        const activeTickets = workloadMap[tech._id.toString()] || 0;

        // Skill match bonus
        const hasDirectSkill = tech.skills?.some(
          (s) => s.toLowerCase() === ticket.category?.toLowerCase()
        );
        if (hasDirectSkill) score += 30;

        // Team specialty bonus
        if (tech.team && tech.team.specialties?.some(
          (s) => s.toLowerCase() === ticket.category?.toLowerCase()
        )) {
          score += 20;
        }

        // Workload penalty (less busy technicians receive higher score)
        score -= activeTickets * 5;

        return {
          technician: tech,
          score,
          activeTickets,
          hasDirectSkill,
        };
      });

      // Sort by score descending, then lowest workload
      scoredTechnicians.sort((a, b) => {
        if (b.score !== a.score) return b.score - a.score;
        return a.activeTickets - b.activeTickets;
      });

      logger.info(
        `Auto-assignment ranking for ticket [Category: ${ticket.category}]: ${scoredTechnicians
          .map((st) => `${st.technician.name} (score: ${st.score}, load: ${st.activeTickets})`)
          .join(', ')}`
      );

      return scoredTechnicians[0]?.technician || null;
    } catch (error) {
      logger.error('Failed to find best technician:', error);
      return null;
    }
  },

  /**
   * Get ranked candidates with explanations for UI recommendation dropdown
   */
  getRecommendedTechnicians: async (ticketId, organizationId) => {
    const ticket = await Ticket.findById(ticketId);
    if (!ticket) return [];

    const technicians = await User.find({
      organization: organizationId,
      role: 'technician',
      isActive: true,
    }).populate('team');

    const activeCounts = await Ticket.aggregate([
      {
        $match: {
          organization: organizationId,
          status: { $in: ['Assigned', 'In Progress', 'Pending User'] },
          assignee: { $in: technicians.map((t) => t._id) },
        },
      },
      {
        $group: {
          _id: '$assignee',
          count: { $sum: 1 },
        },
      },
    ]);

    const workloadMap = {};
    activeCounts.forEach((item) => {
      workloadMap[item._id.toString()] = item.count;
    });

    return technicians.map((tech) => {
      const activeTickets = workloadMap[tech._id.toString()] || 0;
      const hasSkill = tech.skills?.some(
        (s) => s.toLowerCase() === ticket.category?.toLowerCase()
      );
      const isTeamMatch = tech.team?.specialties?.some(
        (s) => s.toLowerCase() === ticket.category?.toLowerCase()
      );

      return {
        _id: tech._id,
        name: tech.name,
        email: tech.email,
        teamName: tech.team?.name || 'Unassigned Team',
        skills: tech.skills,
        activeTickets,
        hasSkill,
        isTeamMatch,
        recommendationScore: (hasSkill ? 30 : 0) + (isTeamMatch ? 20 : 0) - activeTickets * 5 + 50,
      };
    }).sort((a, b) => b.recommendationScore - a.recommendationScore);
  },
};

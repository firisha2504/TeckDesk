import mongoose from 'mongoose';
import { Team } from '../models/Team.js';
import { User } from '../models/User.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { ApiError } from '../utils/ApiError.js';
import { auditService } from '../services/audit.service.js';

/**
 * Validates that team lead and all team members exist, belong to the
 * requesting organization, and prevents duplicates.
 */
async function validateTeamUsers(leadId, memberIds, organizationId) {
  const orgIdStr = organizationId ? organizationId.toString() : '';

  // 1. Validate team lead if specified
  if (leadId) {
    if (!mongoose.Types.ObjectId.isValid(leadId)) {
      throw ApiError.badRequest(`Invalid team lead ID format: '${leadId}'`);
    }

    const leadUser = await User.findById(leadId);
    if (!leadUser) {
      throw ApiError.badRequest('Specified team lead user does not exist.');
    }

    if (!leadUser.organization || leadUser.organization.toString() !== orgIdStr) {
      throw ApiError.forbidden(
        'Cross-organization team assignment forbidden: Team lead belongs to a different organization.'
      );
    }
  }

  // 2. Validate team members if specified
  let sanitizedMemberIds = [];
  if (memberIds !== undefined) {
    if (!Array.isArray(memberIds)) {
      throw ApiError.badRequest('memberIds must be an array of user IDs.');
    }

    for (const mId of memberIds) {
      if (!mongoose.Types.ObjectId.isValid(mId)) {
        throw ApiError.badRequest(`Invalid team member ID format: '${mId}'`);
      }
    }

    // Deduplicate member IDs to prevent duplicates
    const uniqueIds = [...new Set(memberIds.map((id) => id.toString()))];

    if (uniqueIds.length > 0) {
      const foundUsers = await User.find({ _id: { $in: uniqueIds } });
      if (foundUsers.length !== uniqueIds.length) {
        throw ApiError.badRequest('One or more specified team members do not exist.');
      }

      for (const member of foundUsers) {
        if (!member.organization || member.organization.toString() !== orgIdStr) {
          throw ApiError.forbidden(
            `Cross-organization team assignment forbidden: Member '${member.name}' belongs to a different organization.`
          );
        }
      }

      sanitizedMemberIds = uniqueIds;
    }
  }

  return sanitizedMemberIds;
}

export const teamController = {
  getTeams: async (req, res, next) => {
    try {
      const teams = await Team.find({ organization: req.organizationId })
        .populate('lead', 'name email avatar')
        .populate('members', 'name email avatar skills')
        .sort({ name: 1 })
        .lean();

      res.status(200).json(ApiResponse.success(teams));
    } catch (error) {
      next(error);
    }
  },

  createTeam: async (req, res, next) => {
    try {
      const { name, leadId, memberIds, specialties } = req.body;

      // Validate leadId and memberIds against req.organizationId
      const sanitizedMembers = await validateTeamUsers(leadId, memberIds, req.organizationId);

      const team = await Team.create({
        name,
        organization: req.organizationId,
        lead: leadId || null,
        members: sanitizedMembers,
        specialties: specialties || ['Software', 'Hardware', 'Network'],
      });

      await auditService.log({
        organization: req.organizationId,
        actor: req.user._id,
        action: 'TEAM_CREATED',
        resource: 'Team',
        resourceId: team._id,
        details: { name },
        req,
      });

      const populated = await Team.findById(team._id)
        .populate('lead', 'name email avatar')
        .populate('members', 'name email avatar skills');

      res.status(201).json(ApiResponse.created(populated, 'Team created successfully.'));
    } catch (error) {
      next(error);
    }
  },

  updateTeam: async (req, res, next) => {
    try {
      const { name, leadId, memberIds, specialties, isActive } = req.body;
      const team = await Team.findOne({
        _id: req.params.id,
        organization: req.organizationId,
      });

      if (!team) {
        throw ApiError.notFound('Team not found');
      }

      // Validate leadId and memberIds if provided
      let sanitizedMembers = undefined;
      if (leadId !== undefined || memberIds !== undefined) {
        const leadToCheck = leadId !== undefined ? leadId : team.lead;
        const membersToCheck = memberIds !== undefined ? memberIds : [];
        sanitizedMembers = await validateTeamUsers(leadToCheck, membersToCheck, req.organizationId);
      }

      if (name) team.name = name;
      if (leadId !== undefined) team.lead = leadId || null;
      if (memberIds !== undefined) team.members = sanitizedMembers;
      if (specialties) team.specialties = specialties;
      if (isActive !== undefined) team.isActive = isActive;

      await team.save();

      const populated = await Team.findById(team._id)
        .populate('lead', 'name email avatar')
        .populate('members', 'name email avatar skills');

      res.status(200).json(ApiResponse.success(populated, 'Team updated successfully.'));
    } catch (error) {
      next(error);
    }
  },

  deleteTeam: async (req, res, next) => {
    try {
      const team = await Team.findOneAndDelete({
        _id: req.params.id,
        organization: req.organizationId,
      });

      if (!team) {
        throw ApiError.notFound('Team not found');
      }

      res.status(200).json(ApiResponse.success(null, 'Team removed successfully.'));
    } catch (error) {
      next(error);
    }
  },
};

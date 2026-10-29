import { Team } from '../models/Team.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { ApiError } from '../utils/ApiError.js';
import { auditService } from '../services/audit.service.js';

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

      const team = await Team.create({
        name,
        organization: req.organizationId,
        lead: leadId || null,
        members: memberIds || [],
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

      if (name) team.name = name;
      if (leadId !== undefined) team.lead = leadId || null;
      if (memberIds) team.members = memberIds;
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

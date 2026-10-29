import { ticketService } from '../services/ticket.service.js';
import { assignmentService } from '../services/assignment.service.js';
import { Attachment } from '../models/Attachment.js';
import { Ticket } from '../models/Ticket.js';
import { TicketEvent } from '../models/TicketEvent.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { ApiError } from '../utils/ApiError.js';
import { broadcastTicketUpdate, ticketEvents } from '../sockets/ticket.socket.js';

export const ticketController = {
  createTicket: async (req, res, next) => {
    try {
      const ticket = await ticketService.createTicket(req.body, req.user, req);
      res.status(201).json(ApiResponse.created(ticket, 'Ticket created successfully.'));
    } catch (error) {
      next(error);
    }
  },

  listTickets: async (req, res, next) => {
    try {
      const result = await ticketService.listTickets(req.query, req.user);
      res.status(200).json(ApiResponse.success(result.tickets, 'Tickets retrieved', {
        total: result.total,
        page: result.page,
        totalPages: result.totalPages,
        limit: result.limit,
      }));
    } catch (error) {
      next(error);
    }
  },

  getTicketById: async (req, res, next) => {
    try {
      const ticket = await ticketService.getTicketById(req.params.id, req.user);
      res.status(200).json(ApiResponse.success(ticket));
    } catch (error) {
      next(error);
    }
  },

  changeStatus: async (req, res, next) => {
    try {
      const ticket = await ticketService.changeStatus(req.params.id, req.body, req.user, req);
      res.status(200).json(ApiResponse.success(ticket, `Status changed to ${ticket.status}`));
    } catch (error) {
      next(error);
    }
  },

  reassignTicket: async (req, res, next) => {
    try {
      const ticket = await ticketService.reassignTicket(
        req.params.id,
        req.body.assigneeId,
        req.user,
        req
      );
      res.status(200).json(ApiResponse.success(ticket, 'Ticket reassigned successfully.'));
    } catch (error) {
      next(error);
    }
  },

  addComment: async (req, res, next) => {
    try {
      const comment = await ticketService.addComment(req.params.id, req.body, req.user, req);
      res.status(201).json(ApiResponse.created(comment, 'Comment added successfully.'));
    } catch (error) {
      next(error);
    }
  },

  getTicketComments: async (req, res, next) => {
    try {
      const comments = await ticketService.getTicketComments(req.params.id, req.user);
      res.status(200).json(ApiResponse.success(comments));
    } catch (error) {
      next(error);
    }
  },

  getTicketTimeline: async (req, res, next) => {
    try {
      const timeline = await ticketService.getTicketTimeline(req.params.id, req.user);
      res.status(200).json(ApiResponse.success(timeline));
    } catch (error) {
      next(error);
    }
  },

  getRecommendedTechnicians: async (req, res, next) => {
    try {
      const candidates = await assignmentService.getRecommendedTechnicians(
        req.params.id,
        req.organizationId
      );
      res.status(200).json(ApiResponse.success(candidates));
    } catch (error) {
      next(error);
    }
  },

  uploadAttachment: async (req, res, next) => {
    try {
      if (!req.file) {
        throw ApiError.badRequest('No file uploaded.');
      }

      const ticket = await Ticket.findOne({
        _id: req.params.id,
        organization: req.organizationId,
      });

      if (!ticket) {
        throw ApiError.notFound('Ticket not found.');
      }

      const attachment = await Attachment.create({
        originalName: req.file.originalname,
        filename: req.file.filename,
        mimeType: req.file.mimetype,
        size: req.file.size,
        path: `/uploads/${req.file.filename}`,
        uploader: req.user._id,
        organization: req.organizationId,
        ticket: ticket._id,
      });

      ticket.attachments.push(attachment._id);
      await ticket.save();

      await TicketEvent.create({
        ticket: ticket._id,
        organization: req.organizationId,
        actor: req.user._id,
        eventType: 'ATTACHMENT_ADDED',
        details: { filename: req.file.originalname, size: req.file.size },
        message: `${req.user.name} attached file: ${req.file.originalname}`,
      });

      broadcastTicketUpdate(ticket, ticketEvents.UPDATED, { attachment });

      res.status(201).json(ApiResponse.created(attachment, 'Attachment uploaded successfully.'));
    } catch (error) {
      next(error);
    }
  },
};

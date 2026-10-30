import path from 'path';
import fs from 'fs';
import mongoose from 'mongoose';
import { Attachment } from '../models/Attachment.js';
import { Ticket } from '../models/Ticket.js';
import { uploadDir } from '../config/storage.js';
import { ApiError } from '../utils/ApiError.js';
import { ApiResponse } from '../utils/ApiResponse.js';

export const attachmentController = {
  /**
   * Securely download or view an attachment with tenant and ticket-level authorization
   */
  downloadAttachment: async (req, res, next) => {
    try {
      const { id } = req.params;

      const filter = mongoose.Types.ObjectId.isValid(id)
        ? { _id: id }
        : { filename: id };

      const attachment = await Attachment.findOne(filter).populate('ticket');
      if (!attachment) {
        throw ApiError.notFound('Attachment not found.');
      }

      // Authorization Check
      if (req.user.role !== 'superadmin') {
        // 1. Organization boundary enforcement
        if (
          !attachment.organization ||
          attachment.organization.toString() !== req.organizationId.toString()
        ) {
          throw ApiError.forbidden(
            'Access denied: Attachment belongs to another organization.'
          );
        }

        // 2. Ticket-level role scoping for employees
        if (req.user.role === 'employee') {
          const isCreator =
            attachment.ticket &&
            attachment.ticket.creator.toString() === req.user._id.toString();
          const isUploader =
            attachment.uploader &&
            attachment.uploader.toString() === req.user._id.toString();

          if (!isCreator && !isUploader) {
            throw ApiError.forbidden(
              'Access denied: You do not have permission to view attachments for this ticket.'
            );
          }
        }
      }

      // Anti-path-traversal verification
      const sanitizedFilename = path.basename(attachment.filename);
      const safeFilePath = path.resolve(uploadDir, sanitizedFilename);
      const resolvedUploadDir = path.resolve(uploadDir);

      if (!safeFilePath.startsWith(resolvedUploadDir)) {
        throw ApiError.forbidden('Security violation: Path traversal detected.');
      }

      if (!fs.existsSync(safeFilePath)) {
        throw ApiError.notFound('Attachment file not found on storage disk.');
      }

      res.setHeader('Content-Type', attachment.mimeType);
      res.download(safeFilePath, attachment.originalName);
    } catch (error) {
      next(error);
    }
  },

  /**
   * Delete an attachment
   */
  deleteAttachment: async (req, res, next) => {
    try {
      const { id } = req.params;
      const attachment = await Attachment.findById(id).populate('ticket');

      if (!attachment) {
        throw ApiError.notFound('Attachment not found.');
      }

      // Organization boundary check
      if (
        req.user.role !== 'superadmin' &&
        attachment.organization.toString() !== req.organizationId.toString()
      ) {
        throw ApiError.forbidden('Access denied: Cannot delete attachment from another organization.');
      }

      // Permission check: Admins, Managers, or the original uploader may delete
      const isPrivileged = ['admin', 'manager', 'superadmin'].includes(req.user.role);
      const isUploader = attachment.uploader.toString() === req.user._id.toString();

      if (!isPrivileged && !isUploader) {
        throw ApiError.forbidden('You are not authorized to delete this attachment.');
      }

      // Remove from ticket
      if (attachment.ticket) {
        await Ticket.findByIdAndUpdate(attachment.ticket._id, {
          $pull: { attachments: attachment._id },
        });
      }

      // Delete file from disk safely
      const sanitizedFilename = path.basename(attachment.filename);
      const safeFilePath = path.resolve(uploadDir, sanitizedFilename);
      if (fs.existsSync(safeFilePath)) {
        fs.unlinkSync(safeFilePath);
      }

      await Attachment.findByIdAndDelete(attachment._id);

      res.status(200).json(ApiResponse.success(null, 'Attachment deleted successfully.'));
    } catch (error) {
      next(error);
    }
  },
};

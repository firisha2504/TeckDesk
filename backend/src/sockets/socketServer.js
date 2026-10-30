import { Server } from 'socket.io';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import { env } from '../config/env.js';
import { logger } from '../utils/logger.js';
import { User } from '../models/User.js';
import { Ticket } from '../models/Ticket.js';

let io = null;

export const initSocketServer = (httpServer) => {
  io = new Server(httpServer, {
    cors: {
      origin: [
        env.FRONTEND_URL,
        'http://localhost:5173',
        'http://127.0.0.1:5173',
        'http://localhost:80',
        'http://localhost',
      ].filter(Boolean),
      methods: ['GET', 'POST'],
      credentials: true,
    },
  });

  // Socket Authentication Middleware
  io.use(async (socket, next) => {
    try {
      const token =
        socket.handshake.auth?.token ||
        socket.handshake.headers?.authorization?.split(' ')[1] ||
        parseCookieToken(socket.handshake.headers?.cookie);

      if (!token) {
        return next(new Error('Authentication token required for WebSocket connection'));
      }

      let decoded;
      try {
        decoded = jwt.verify(token, env.JWT_SECRET);
      } catch (jwtErr) {
        return next(new Error('Invalid or expired WebSocket authentication token'));
      }

      const user = await User.findById(decoded.id)
        .select('_id name email role organization isActive')
        .populate('organization', 'status');

      if (!user) {
        return next(new Error('User associated with token not found'));
      }

      if (!user.isActive) {
        return next(new Error('User account has been deactivated'));
      }

      // Check organization status for non-superadmin users
      if (user.role === 'superadmin') {
        socket.user = user;
        socket.isSuperAdmin = true;
        socket.orgId = null;
      } else {
        if (!user.organization) {
          return next(new Error('No organization associated with this account'));
        }

        const orgStatus = user.organization.status;
        if (orgStatus !== 'active' && orgStatus !== 'trial') {
          return next(new Error(`WebSocket connection denied: Organization status is '${orgStatus}'`));
        }

        socket.user = user;
        socket.isSuperAdmin = false;
        socket.orgId = user.organization._id.toString();
      }

      next();
    } catch (err) {
      logger.warn(`Socket authentication error: ${err.message}`);
      next(new Error('WebSocket authentication failure'));
    }
  });

  io.on('connection', (socket) => {
    const user = socket.user;
    logger.info(`WebSocket connected: ${user.name} (${user.email}) [Role: ${user.role}]`);

    // 1. Join user-specific personal room
    socket.join(`user:${user._id}`);

    // 2. Join organization-specific rooms
    if (socket.isSuperAdmin) {
      socket.join('platform:superadmin');
    } else {
      socket.join(`org:${socket.orgId}`);
      socket.join(`role:${socket.orgId}:${user.role}`);
    }

    // 3. Secure ticket room subscription with organization & role validation
    socket.on('ticket:join', async (ticketId, callback) => {
      try {
        if (!ticketId || !mongoose.Types.ObjectId.isValid(ticketId)) {
          if (typeof callback === 'function') callback({ error: 'Invalid ticket ID format' });
          return socket.emit('error', { message: 'Invalid ticket ID format' });
        }

        const ticket = await Ticket.findById(ticketId).select('organization creator assignee');
        if (!ticket) {
          if (typeof callback === 'function') callback({ error: 'Ticket not found' });
          return socket.emit('error', { message: 'Ticket not found' });
        }

        // Platform Super Admin is authorized across tickets
        if (socket.isSuperAdmin) {
          socket.join(`ticket:${ticketId}`);
          logger.debug(`Super Admin joined room ticket:${ticketId}`);
          if (typeof callback === 'function') callback({ success: true });
          return;
        }

        // Validate organization boundary
        if (!ticket.organization || ticket.organization.toString() !== socket.orgId) {
          logger.warn(`Cross-tenant ticket join blocked: user ${user.email} from org ${socket.orgId} attempted ticket ${ticketId}`);
          if (typeof callback === 'function') callback({ error: 'Unauthorized: Ticket belongs to a different organization' });
          return socket.emit('error', { message: 'Unauthorized: Ticket belongs to a different organization' });
        }

        // Role check for employees: employees may only join tickets they created
        if (user.role === 'employee' && ticket.creator.toString() !== user._id.toString()) {
          logger.warn(`Employee ticket join blocked: employee ${user.email} attempted non-owned ticket ${ticketId}`);
          if (typeof callback === 'function') callback({ error: 'Unauthorized: Employees may only view their own tickets' });
          return socket.emit('error', { message: 'Unauthorized: Employees may only view their own tickets' });
        }

        // Role check for technicians: technicians may only join tickets assigned to them
        if (user.role === 'technician') {
          const isAssigned = ticket.assignee && ticket.assignee.toString() === user._id.toString();
          if (!isAssigned) {
            logger.warn(`Technician ticket join blocked: technician ${user.email} attempted ticket ${ticketId}`);
            if (typeof callback === 'function') callback({ error: 'Unauthorized: Technicians may only access tickets assigned to them' });
            return socket.emit('error', { message: 'Unauthorized: Technicians may only access tickets assigned to them' });
          }
        }

        socket.join(`ticket:${ticketId}`);
        logger.debug(`User ${user.name} joined room ticket:${ticketId}`);
        if (typeof callback === 'function') callback({ success: true });
      } catch (err) {
        logger.error(`Error in ticket:join socket handler: ${err.message}`);
        if (typeof callback === 'function') callback({ error: 'Internal server error joining ticket' });
      }
    });

    socket.on('ticket:leave', (ticketId) => {
      socket.leave(`ticket:${ticketId}`);
      logger.debug(`User ${user.name} left room ticket:${ticketId}`);
    });

    socket.on('disconnect', () => {
      logger.debug(`WebSocket disconnected: ${user.name}`);
    });
  });

  return io;
};

// Helper to extract JWT token from cookie header
function parseCookieToken(cookieHeader) {
  if (!cookieHeader) return null;
  const match = cookieHeader.match(/(?:^|;\s*)token=([^;]*)/);
  return match ? decodeURIComponent(match[1]) : null;
}

export const getIO = () => {
  return io;
};

export const socketEmitter = {
  emitToUser: (userId, event, data) => {
    if (io && userId) {
      io.to(`user:${userId}`).emit(event, data);
    }
  },
  emitToOrg: (orgId, event, data) => {
    if (io && orgId) {
      io.to(`org:${orgId}`).emit(event, data);
    }
  },
  emitToOrganization: (orgId, event, data) => {
    if (io && orgId) {
      io.to(`org:${orgId}`).emit(event, data);
    }
  },
  emitToTicket: (ticketId, event, data) => {
    if (io && ticketId) {
      io.to(`ticket:${ticketId}`).emit(event, data);
    }
  },
  emitToRole: (orgId, role, event, data) => {
    if (io && orgId && role) {
      io.to(`role:${orgId}:${role}`).emit(event, data);
    }
  },
};

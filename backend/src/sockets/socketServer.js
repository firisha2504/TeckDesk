import { Server } from 'socket.io';
import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { logger } from '../utils/logger.js';
import { User } from '../models/User.js';

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
        return next(new Error('Authentication required for WebSocket connection'));
      }

      const decoded = jwt.verify(token, env.JWT_SECRET);
      const user = await User.findById(decoded.id).select('_id name email role organization');

      if (!user) {
        return next(new Error('User not found'));
      }

      socket.user = user;
      socket.orgId = user.organization.toString();
      next();
    } catch (err) {
      logger.warn(`Socket authentication error: ${err.message}`);
      next(new Error('Invalid token for WebSocket connection'));
    }
  });

  io.on('connection', (socket) => {
    const user = socket.user;
    logger.info(`WebSocket connected: ${user.name} (${user.email}) [Role: ${user.role}]`);

    // Join user-specific room
    socket.join(`user:${user._id}`);

    // Join organization-specific room
    socket.join(`org:${socket.orgId}`);

    // Join role-specific room inside organization
    socket.join(`role:${socket.orgId}:${user.role}`);

    // Allow user to join specific ticket room for live collaboration
    socket.on('ticket:join', (ticketId) => {
      socket.join(`ticket:${ticketId}`);
      logger.debug(`User ${user.name} joined room ticket:${ticketId}`);
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
    if (io) {
      io.to(`user:${userId}`).emit(event, data);
    }
  },
  emitToOrg: (orgId, event, data) => {
    if (io) {
      io.to(`org:${orgId}`).emit(event, data);
    }
  },
  emitToTicket: (ticketId, event, data) => {
    if (io) {
      io.to(`ticket:${ticketId}`).emit(event, data);
    }
  },
  emitToRole: (orgId, role, event, data) => {
    if (io) {
      io.to(`role:${orgId}:${role}`).emit(event, data);
    }
  },
};

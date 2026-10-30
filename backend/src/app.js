import express from 'express';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import { corsMiddleware } from './config/cors.js';
import { uploadDir } from './config/storage.js';
import { errorHandler } from './middleware/errorHandler.js';
import { apiLimiter } from './middleware/rateLimiter.js';
import { ApiError } from './utils/ApiError.js';
import { ApiResponse } from './utils/ApiResponse.js';

import authRoutes from './routes/auth.routes.js';
import userRoutes from './routes/user.routes.js';
import ticketRoutes from './routes/ticket.routes.js';
import teamRoutes from './routes/team.routes.js';
import slaRoutes from './routes/sla.routes.js';
import analyticsRoutes from './routes/analytics.routes.js';
import notificationRoutes from './routes/notification.routes.js';
import organizationRoutes from './routes/organization.routes.js';
import superadminRoutes from './routes/superadmin.routes.js';
import attachmentRoutes from './routes/attachment.routes.js';

const app = express();

// Security HTTP headers
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' },
  })
);

// CORS
app.use(corsMiddleware);

// Cookie parsing
app.use(cookieParser());

// Body parsers
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// NoSQL Injection sanitization middleware
app.use((req, res, next) => {
  const sanitize = (obj) => {
    if (!obj || typeof obj !== 'object') return obj;
    for (const key of Object.keys(obj)) {
      if (key.startsWith('$') || key.includes('.')) {
        delete obj[key];
      } else if (typeof obj[key] === 'object') {
        sanitize(obj[key]);
      }
    }
    return obj;
  };
  if (req.body) sanitize(req.body);
  if (req.query) sanitize(req.query);
  if (req.params) sanitize(req.params);
  next();
});

// Secure file access routes (authentication & organization isolation required)
app.use('/uploads', apiLimiter, attachmentRoutes);

// System Health Check endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json(
    ApiResponse.success(
      {
        status: 'UP',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        memoryUsage: process.memoryUsage(),
      },
      'TechDesk API is healthy and operational.'
    )
  );
});

// Mount modular feature routes with rate limiting
app.use('/api/auth', authRoutes);
app.use('/api/users', apiLimiter, userRoutes);
app.use('/api/tickets', apiLimiter, ticketRoutes);
app.use('/api/teams', apiLimiter, teamRoutes);
app.use('/api/sla', apiLimiter, slaRoutes);
app.use('/api/analytics', apiLimiter, analyticsRoutes);
app.use('/api/notifications', apiLimiter, notificationRoutes);
app.use('/api/organizations', apiLimiter, organizationRoutes);
app.use('/api/superadmin', apiLimiter, superadminRoutes);
app.use('/api/attachments', apiLimiter, attachmentRoutes);

// Catch-all for undefined routes
app.use('*', (req, res, next) => {
  next(ApiError.notFound(`Endpoint ${req.originalUrl} not found on this server`));
});

// Centralized error handler
app.use(errorHandler);

export default app;

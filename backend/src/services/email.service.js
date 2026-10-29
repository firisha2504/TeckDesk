import nodemailer from 'nodemailer';
import { env } from '../config/env.js';
import { logger } from '../utils/logger.js';

let cachedTransporter = null;

const getTransporter = () => {
  if (cachedTransporter) return cachedTransporter;

  if (!env.SMTP_HOST) {
    return null;
  }

  const transportOptions = {
    host: env.SMTP_HOST,
    port: env.SMTP_PORT,
    secure: env.SMTP_SECURE,
  };

  if (env.SMTP_USER && env.SMTP_PASS) {
    transportOptions.auth = {
      user: env.SMTP_USER,
      pass: env.SMTP_PASS,
    };
  }

  cachedTransporter = nodemailer.createTransport(transportOptions);
  return cachedTransporter;
};

export const emailService = {
  /**
   * Checks whether SMTP transport is configured.
   */
  isSmtpConfigured: () => {
    return Boolean(env.SMTP_HOST);
  },

  /**
   * Test/verify SMTP connectivity.
   */
  verifyConnection: async () => {
    const transporter = getTransporter();
    if (!transporter) {
      return { configured: false, status: 'SMTP_NOT_CONFIGURED' };
    }
    try {
      await transporter.verify();
      return { configured: true, status: 'CONNECTED' };
    } catch (err) {
      logger.error('SMTP connection verification failed:', err.message);
      return { configured: true, status: 'ERROR', error: err.message };
    }
  },

  /**
   * Dispatches a secure password reset email with single-use token.
   * If SMTP is not configured or fails, it fails safely without exposing tokens in logs.
   *
   * @param {Object} params
   * @param {string} params.to - Recipient email address
   * @param {string} params.name - Recipient user name
   * @param {string} params.resetToken - Raw unhashed single-use reset token
   * @returns {Promise<{ sent: boolean, reason?: string, messageId?: string }>}
   */
  sendPasswordResetEmail: async ({ to, name, resetToken }) => {
    const transporter = getTransporter();

    // If SMTP is not configured, fail safely without logging tokens or URLs
    if (!transporter) {
      logger.warn(
        `SMTP is not configured (SMTP_HOST is empty). Password reset email for [${to}] was suppressed safely.`
      );
      return { sent: false, reason: 'SMTP_NOT_CONFIGURED' };
    }

    const resetUrl = `${env.FRONTEND_URL}/reset-password?token=${encodeURIComponent(resetToken)}`;

    const textContent = `Hello ${name || 'User'},

We received a request to reset your password for your TechDesk account.

Please use the following link to set a new password:
${resetUrl}

This link is valid for 1 hour and can only be used once.

If you did not request a password reset, you can safely ignore this email. Your password will remain unchanged.

Best regards,
The TechDesk IT Support Team`;

    const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Reset Your TechDesk Password</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; margin: 0; padding: 24px; color: #1e293b;">
  <div style="max-width: 560px; margin: 0 auto; background-color: #ffffff; border-radius: 16px; border: 1px solid #e2e8f0; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);">
    <div style="background: linear-gradient(135deg, #0284c7 0%, #2563eb 100%); padding: 24px; text-align: center;">
      <h1 style="color: #ffffff; margin: 0; font-size: 22px; font-weight: 700; letter-spacing: -0.5px;">TechDesk</h1>
      <p style="color: #e0f2fe; margin: 4px 0 0 0; font-size: 13px;">Smart IT Support & Incident Management</p>
    </div>
    <div style="padding: 32px 24px;">
      <h2 style="font-size: 18px; font-weight: 600; color: #0f172a; margin-top: 0;">Password Reset Request</h2>
      <p style="font-size: 14px; line-height: 1.6; color: #475569;">Hello <strong>${name || 'there'}</strong>,</p>
      <p style="font-size: 14px; line-height: 1.6; color: #475569;">We received a request to reset your password. Click the secure link below to proceed:</p>
      <div style="text-align: center; margin: 28px 0;">
        <a href="${resetUrl}" style="background-color: #0284c7; color: #ffffff; padding: 12px 28px; border-radius: 8px; text-decoration: none; font-size: 14px; font-weight: 600; display: inline-block;">Reset Password</a>
      </div>
      <p style="font-size: 12px; line-height: 1.5; color: #64748b; background-color: #f1f5f9; padding: 12px; border-radius: 8px;">
        <strong>Security Notice:</strong> This password reset link expires in <strong>1 hour</strong> and can only be used once. If you did not initiate this request, no further action is needed and your account remains secure.
      </p>
    </div>
    <div style="border-top: 1px solid #e2e8f0; padding: 16px 24px; text-align: center; font-size: 11px; color: #94a3b8;">
      TechDesk Enterprise IT Management &bull; Automated System Notification
    </div>
  </div>
</body>
</html>
`;

    try {
      const info = await transporter.sendMail({
        from: env.SMTP_FROM,
        to,
        subject: 'TechDesk - Password Reset Instructions',
        text: textContent,
        html: htmlContent,
      });

      logger.info(`Password reset email delivered to [${to}] (messageId: ${info.messageId})`);
      return { sent: true, messageId: info.messageId };
    } catch (err) {
      // Log failure safely without exposing the reset token or URL
      logger.error(`Failed to deliver password reset email to [${to}]: ${err.message}`);
      return { sent: false, reason: 'SEND_FAILED', error: err.message };
    }
  },
};

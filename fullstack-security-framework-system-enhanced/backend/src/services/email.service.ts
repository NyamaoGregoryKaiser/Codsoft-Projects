import nodemailer from 'nodemailer';
import { env } from '@config/env';
import { logger } from '@utils/logger';

// Configure Nodemailer transporter (for demo, just logs to console or uses a dummy transporter)
let transporter: nodemailer.Transporter | null = null;

if (env.emailService && env.emailUser && env.emailPass) {
  transporter = nodemailer.createTransport({
    service: env.emailService, // e.g., 'gmail'
    auth: {
      user: env.emailUser,
      pass: env.emailPass,
    },
  });
} else {
  logger.warn('Email service not fully configured. Emails will be logged to console.');
  transporter = nodemailer.createTransport({
    jsonTransport: true // Use JSON transport for logging emails to console in development
  });
}

/**
 * Send an email
 * @param {string} to
 * @param {string} subject
 * @param {string} text
 * @returns {Promise<void>}
 */
export const sendEmail = async (to: string, subject: string, text: string) => {
  const msg = { from: env.emailFrom, to, subject, html: text };
  if (transporter) {
    try {
      const info = await transporter.sendMail(msg);
      logger.info(`Email sent to ${to}: ${info.response}`);
      if (info.envelope) {
        logger.debug('Email Envelope:', info.envelope);
      }
      if (info.messageId) {
        logger.debug('Message ID:', info.messageId);
      }
    } catch (error) {
      logger.error(`Error sending email to ${to}:`, error);
      // In production, you might want to rethrow or queue for retry
    }
  } else {
    logger.info(`Simulating email to: ${to}, Subject: ${subject}, Body: ${text}`);
  }
};

/**
 * Send reset password email
 * @param {string} to
 * @param {string} resetUrl
 * @returns {Promise<void>}
 */
export const sendResetPasswordEmail = async (to: string, resetUrl: string) => {
  const subject = 'Reset your password';
  const text = `Dear user,
    To reset your password, click on this link: ${resetUrl}
    If you did not request any password reset, then ignore this email.`;
  await sendEmail(to, subject, text);
};
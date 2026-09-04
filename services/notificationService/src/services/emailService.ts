import nodemailer from 'nodemailer'
import { prisma } from '../lib/prisma.js'
import { logger } from '../lib/logger.js'

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: process.env.SMTP_SECURE === 'true',
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
})

export const emailService = {
  async sendEmail({
    to,
    subject,
    body,
  }: {
    to: string
    subject: string
    body: string
  }) {
    try {
      const info = await transporter.sendMail({
        from: process.env.SMTP_FROM,
        to,
        subject,
        text: body,
      })

      // Log to own database
      await prisma.emailLog.create({
        data: {
          recipient: to,
          subject,
          body,
          status: 'sent',
          sentAt: new Date(),
        },
      })

      logger.info({ to, subject, messageId: info.messageId }, 'email sent')

      return { success: true, messageId: info.messageId }
    } catch (error) {
      logger.error({ to, subject, error }, 'email send failed')

      await prisma.emailLog.create({
        data: {
          recipient: to,
          subject,
          body,
          status: 'failed',
          errorMessage: error.message,
        },
      })

      throw error
    }
  },
}

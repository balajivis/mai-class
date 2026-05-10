import { logger } from './logger.js'

export interface EmailPayload {
  to: string
  from: string
  subject: string
  body: string
  replyTo?: string
}

export interface SendResult {
  success: boolean
  messageId?: string
  error?: string
  bounceType?: 'hard' | 'soft'
}

export async function sendEmail(payload: EmailPayload): Promise<SendResult> {
  // In production, this would use AWS SES or Mailgun SMTP
  // For now, log and return success
  logger.info('Sending email', {
    to: payload.to,
    from: payload.from,
    subject: payload.subject,
  })

  try {
    // TODO: Replace with actual SMTP transport
    // const transporter = nodemailer.createTransport({
    //   host: env.SMTP_HOST,
    //   port: env.SMTP_PORT,
    //   auth: { user: env.SMTP_USER, pass: env.SMTP_PASS },
    // })
    // const info = await transporter.sendMail(payload)

    return {
      success: true,
      messageId: `msg_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    logger.error('Email send failed', { to: payload.to, error: message })
    return { success: false, error: message }
  }
}

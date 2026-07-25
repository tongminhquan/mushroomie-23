import nodemailer from 'nodemailer'
import { prisma } from '@/lib/prisma'
import { EmailTemplateKey, EMAIL_SUBJECTS } from '@/types'
import { renderPaymentSuccessEmail, renderOrderStatusEmail } from './templates'
import { MAIL_TRANSPORT_SECURITY } from '@/lib/mail-security'

function createTransporter() {
  const provider = process.env.EMAIL_PROVIDER || 'smtp'

  if (provider === 'resend') {
    return nodemailer.createTransport({
      ...MAIL_TRANSPORT_SECURITY,
      host: 'smtp.resend.com',
      port: 465,
      secure: true,
      auth: {
        user: 'resend',
        pass: process.env.RESEND_API_KEY,
      },
    })
  }

  return nodemailer.createTransport({
    ...MAIL_TRANSPORT_SECURITY,
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: Number(process.env.SMTP_PORT) || 587,
    secure: Number(process.env.SMTP_PORT) === 465,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASSWORD,
    },
  })
}

export async function sendOrderEmail(
  orderId: number,
  templateKey: EmailTemplateKey
): Promise<void> {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: {
      items: true,
      payment: true,
    },
  })

  if (!order) {
    console.error(`[EMAIL] Order ${orderId} not found`)
    return
  }

  const subject = EMAIL_SUBJECTS[templateKey]
  const html = templateKey === 'payment_success'
    ? renderPaymentSuccessEmail(order)
    : renderOrderStatusEmail(order, templateKey)

  const emailLog = await prisma.emailLog.create({
    data: {
      order_id: orderId,
      recipient_email: order.customer_email,
      subject,
      template_key: templateKey,
      status: 'PENDING',
    },
  })

  try {
    const transporter = createTransporter()
    await transporter.sendMail({
      from: process.env.EMAIL_FROM || 'Mushroomie <noreply@mushroomie.vn>',
      to: order.customer_email,
      subject,
      html,
    })

    await prisma.emailLog.update({
      where: { id: emailLog.id },
      data: { status: 'SENT', sent_at: new Date() },
    })

    console.info(`[EMAIL] Sent ${templateKey} for order ${orderId}`)
  } catch (error) {
    console.error(`[EMAIL] Failed to send ${templateKey}:`, error)
    await prisma.emailLog.update({
      where: { id: emailLog.id },
      data: { status: 'FAILED', error_message: String(error) },
    })
  }
}

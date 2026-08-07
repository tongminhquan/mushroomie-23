import nodemailer from 'nodemailer-v9'
import { MAIL_TRANSPORT_SECURITY } from './mail-security'

export function createTransporter() {
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

export async function sendPasswordResetEmail(email: string, resetUrl: string): Promise<void> {
  const transporter = createTransporter()

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #d946ef;">Khôi Phục Mật Khẩu</h2>
      <p>Chào bạn,</p>
      <p>Chúng tôi nhận được yêu cầu khôi phục mật khẩu cho tài khoản liên kết với email này tại <strong>Mushroomie</strong>.</p>
      <p>Vui lòng click vào nút bên dưới để đặt lại mật khẩu của bạn. Link này sẽ hết hạn sau 1 giờ.</p>
      <div style="text-align: center; margin: 30px 0;">
        <a href="${resetUrl}" style="background-color: #d946ef; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">Đặt Lại Mật Khẩu</a>
      </div>
      <p>Nếu bạn không yêu cầu thay đổi mật khẩu, vui lòng bỏ qua email này.</p>
      <p>Trân trọng,<br>Đội ngũ Mushroomie</p>
    </div>
  `

  try {
    await transporter.sendMail({
      from: process.env.EMAIL_FROM || 'Mushroomie <noreply@mushroomie.vn>',
      to: email,
      subject: 'Yêu Cầu Khôi Phục Mật Khẩu - Mushroomie',
      html,
    })
    console.info('[EMAIL] Sent password reset email')
  } catch (error) {
    console.error(`[EMAIL] Failed to send password reset email to ${email}:`, error)
    throw new Error('Không thể gửi email khôi phục mật khẩu')
  }
}

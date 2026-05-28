import crypto from 'crypto'
import { IPaymentProvider, CreatePaymentInput, PaymentResult, WebhookVerifyResult, PaymentStatus } from '../types'
import { buildVietQRUrl, buildVietQRPayload } from '../qr-generator'

/**
 * VietQR + Casso Webhook Provider
 * Docs: https://casso.vn/docs/webhook
 * 
 * Setup:
 * 1. Đăng ký tại casso.vn
 * 2. Kết nối tài khoản ngân hàng
 * 3. Cấu hình webhook URL: POST /api/webhooks/payment
 * 4. Lấy webhook secret từ Casso dashboard
 */
export class VietQRCassoProvider implements IPaymentProvider {
  readonly providerKey = 'vietqr_casso'

  private get bankBin() {
    return process.env.BANK_BIN || '970436'
  }

  private get bankAccount() {
    return process.env.BANK_ACCOUNT_NUMBER || ''
  }

  private get accountName() {
    return process.env.BANK_ACCOUNT_NAME || ''
  }

  private get bankName() {
    return process.env.BANK_NAME || 'Vietcombank'
  }

  private get webhookSecret() {
    return process.env.PAYMENT_WEBHOOK_SECRET || ''
  }

  async createPayment(input: CreatePaymentInput): Promise<PaymentResult> {
    const transferContent = input.orderCode
    const qrCodeUrl = buildVietQRUrl({
      bankBin: this.bankBin,
      bankAccount: this.bankAccount,
      amount: input.amount,
      addInfo: transferContent,
      accountName: this.accountName,
    })
    const qrCodePayload = buildVietQRPayload({
      bankBin: this.bankBin,
      bankAccount: this.bankAccount,
      amount: input.amount,
      addInfo: transferContent,
    })

    return {
      qrCodeUrl,
      qrCodePayload,
      transferContent,
      bankName: this.bankName,
      bankAccount: this.bankAccount,
      accountName: this.accountName,
      bankBin: this.bankBin,
    }
  }

  async generateQRCode(transferContent: string, amount: number): Promise<string> {
    return buildVietQRUrl({
      bankBin: this.bankBin,
      bankAccount: this.bankAccount,
      amount,
      addInfo: transferContent,
      accountName: this.accountName,
    })
  }

  /**
   * Verify Casso webhook signature
   * Casso gửi header: Secure-Token: <secret>
   * hoặc dùng HMAC nếu được cấu hình
   */
  async verifyWebhookSignature(request: Request): Promise<WebhookVerifyResult> {
    let body: string
    let payload: any

    try {
      body = await request.text()
      payload = JSON.parse(body)
    } catch {
      return { isValid: false, eventId: '', transactionCode: '', amount: 0, transferContent: '', rawPayload: null }
    }

    // Casso dùng Secure-Token header
    const secureToken = request.headers.get('Secure-Token') || request.headers.get('secure-token')
    const isValid = secureToken === this.webhookSecret

    // Casso payload structure:
    // { id, tid, bankSubAccId, amount, description, when, bookingDate, ... }
    const data = payload?.data?.[0] || payload

    const eventId = String(data?.id || data?.tid || Date.now())
    const transactionCode = String(data?.tid || data?.id || '')
    const amount = Number(data?.amount || 0)
    const transferContent = String(data?.description || data?.memo || '')

    return {
      isValid,
      eventId,
      transactionCode,
      amount,
      transferContent,
      rawPayload: payload,
      signature: secureToken || '',
    }
  }

  async getTransactionStatus(transactionCode: string): Promise<PaymentStatus> {
    // Gọi Casso API để check transaction status
    // GET https://oauth.casso.vn/v2/transactions?page=1&pageSize=10
    try {
      const apiKey = process.env.PAYMENT_API_KEY
      if (!apiKey) return 'PENDING'

      const res = await fetch(
        `https://oauth.casso.vn/v2/transactions?page=1&pageSize=20`,
        {
          headers: {
            'Authorization': `Apikey ${apiKey}`,
            'Content-Type': 'application/json',
          },
        }
      )

      if (!res.ok) return 'PENDING'

      const data = await res.json()
      const transactions = data?.data?.records || []
      const found = transactions.find((t: any) => String(t.tid) === transactionCode)

      if (found) return 'PAID'
      return 'PENDING'
    } catch {
      return 'PENDING'
    }
  }
}

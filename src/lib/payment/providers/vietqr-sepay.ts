import { IPaymentProvider, CreatePaymentInput, PaymentResult, WebhookVerifyResult, PaymentStatus } from '../types'
import { buildVietQRUrl, buildVietQRPayload } from '../qr-generator'
import { timingSafeStringEqual } from '@/lib/security'
import crypto from 'crypto'

/**
 * VietQR + SePay Webhook Provider
 * Docs: https://docs.sepay.vn
 */
export class VietQRSePayProvider implements IPaymentProvider {
  readonly providerKey = 'vietqr_sepay'

  private get bankBin() { return process.env.BANK_BIN || '970436' }
  private get bankAccount() { return process.env.BANK_ACCOUNT_NUMBER || '' }
  private get accountName() { return process.env.BANK_ACCOUNT_NAME || '' }
  private get bankName() { return process.env.BANK_NAME || 'Vietcombank' }
  private get webhookSecret() { return process.env.PAYMENT_WEBHOOK_SECRET || '' }

  async createPayment(input: CreatePaymentInput): Promise<PaymentResult> {
    const transferContent = input.orderCode
    const qrCodeUrl = buildVietQRUrl({
      bankBin: this.bankBin,
      bankAccount: this.bankAccount,
      amount: input.amount,
      addInfo: transferContent,
      accountName: this.accountName,
    })
    return {
      qrCodeUrl,
      qrCodePayload: buildVietQRPayload({ bankBin: this.bankBin, bankAccount: this.bankAccount, amount: input.amount, addInfo: transferContent }),
      transferContent,
      bankName: this.bankName,
      bankAccount: this.bankAccount,
      accountName: this.accountName,
      bankBin: this.bankBin,
    }
  }

  async generateQRCode(transferContent: string, amount: number): Promise<string> {
    return buildVietQRUrl({ bankBin: this.bankBin, bankAccount: this.bankAccount, amount, addInfo: transferContent, accountName: this.accountName })
  }

  async verifyWebhookSignature(request: Request): Promise<WebhookVerifyResult> {
    let body: string
    let payload: any
    try {
      body = await request.text()
      payload = JSON.parse(body)
    } catch {
      return { isValid: false, eventId: '', transactionCode: '', amount: 0, transferContent: '', rawPayload: null }
    }

    // SePay dùng API token hoặc HMAC SHA256
    const signature = request.headers.get('X-Sepay-Signature') || ''
    let isValid = false

    // Fail-closed: chỉ verify khi có webhook secret; so sánh HMAC bằng constant-time
    if (this.webhookSecret) {
      const hmac = crypto.createHmac('sha256', this.webhookSecret)
      hmac.update(body)
      const expected = hmac.digest('hex')
      isValid = timingSafeStringEqual(expected, signature)
    }

    // SePay payload: { id, gateway, transactionDate, accountNumber, code, content, transferAmount, ... }
    const eventId = String(payload?.id || Date.now())
    const transactionCode = String(payload?.referenceCode || payload?.id || '')
    const amount = Number(payload?.transferAmount || 0)
    const transferContent = String(payload?.content || '')

    return { isValid, eventId, transactionCode, amount, transferContent, rawPayload: payload, signature }
  }

  async getTransactionStatus(transactionCode: string): Promise<PaymentStatus> {
    return 'PENDING'
  }
}

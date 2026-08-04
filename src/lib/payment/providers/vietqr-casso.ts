import crypto from 'crypto'
import { IPaymentProvider, CreatePaymentInput, PaymentResult, WebhookTransaction, WebhookVerifyResult, PaymentStatus } from '../types'
import { buildVietQRUrl, buildVietQRPayload } from '../qr-generator'
import { timingSafeStringEqual } from '@/lib/security'

function sortObjectByKey(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(sortObjectByKey)
  if (!value || typeof value !== 'object') return value

  return Object.fromEntries(
    Object.keys(value as Record<string, unknown>)
      .sort()
      .map((key) => [key, sortObjectByKey((value as Record<string, unknown>)[key])]),
  )
}

function verifyCassoV2Signature(payload: unknown, signatureHeader: string, secret: string) {
  const match = signatureHeader.match(/^t=(\d+),v1=([a-f0-9]+)$/i)
  if (!match || !secret) return false

  const [, timestamp, receivedSignature] = match
  const message = `${timestamp}.${JSON.stringify(sortObjectByKey(payload))}`
  const expectedSignature = crypto.createHmac('sha512', secret).update(message).digest('hex')
  return timingSafeStringEqual(receivedSignature.toLowerCase(), expectedSignature)
}

function normalizeCassoTransaction(data: any): WebhookTransaction {
  return {
    eventId: String(data?.id || data?.tid || data?.reference || ''),
    transactionCode: String(data?.reference || data?.tid || data?.id || ''),
    amount: Number(data?.amount || 0),
    transferContent: String(data?.description || data?.memo || ''),
    receivingAccount: String(data?.accountNumber || data?.bankSubAccId || ''),
  }
}

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

    // Casso dùng Secure-Token header.
    // Fail-closed: nếu webhook secret chưa được cấu hình thì luôn coi là KHÔNG hợp lệ
    // (tránh trường hợp so sánh "" === "" cho phép giả mạo webhook đã thanh toán).
    const secureToken = request.headers.get('Secure-Token') || request.headers.get('secure-token') || ''
    const cassoV2Signature = request.headers.get('X-Casso-Signature') || ''
    const payloadHasNoError = payload?.error === undefined || Number(payload.error) === 0
    const isValid = payloadHasNoError && this.webhookSecret.length > 0 && (
      cassoV2Signature
        ? verifyCassoV2Signature(payload, cassoV2Signature, this.webhookSecret)
        : timingSafeStringEqual(secureToken, this.webhookSecret)
    )

    // Casso payload structure:
    // { id, tid, bankSubAccId, amount, description, when, bookingDate, ... }
    const transactionData = Array.isArray(payload?.data) ? payload.data : [payload?.data || payload]
    const transactions = transactionData.map(normalizeCassoTransaction)
    const firstTransaction = transactions[0] || normalizeCassoTransaction(null)

    return {
      isValid,
      ...firstTransaction,
      transactions,
      rawPayload: payload,
      signature: cassoV2Signature || secureToken || '',
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

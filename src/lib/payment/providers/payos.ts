import { PayOS } from '@payos/node'
import { IPaymentProvider, CreatePaymentInput, PaymentResult, WebhookVerifyResult, PaymentStatus } from '../types'
import { buildVietQRUrl } from '../qr-generator'

/**
 * PayOS Provider
 * Docs: https://payos.vn/docs/
 */
export class PayOSProvider implements IPaymentProvider {
  readonly providerKey = 'payos'
  private payos: PayOS

  constructor() {
    this.payos = new PayOS({
      clientId: process.env.PAYOS_CLIENT_ID || '',
      apiKey: process.env.PAYOS_API_KEY || '',
      checksumKey: process.env.PAYOS_CHECKSUM_KEY || ''
    })
  }

  // Bank info from env (used to generate VietQR image)
  private get bankBin() { return process.env.BANK_BIN || '970422' }
  private get bankAccount() { return process.env.BANK_ACCOUNT_NUMBER || '' }
  private get accountName() { return process.env.BANK_ACCOUNT_NAME || '' }
  private get bankName() { return process.env.BANK_NAME || 'MB Bank' }

  async createPayment(input: CreatePaymentInput): Promise<PaymentResult> {
    const transferContent = input.orderCode

    // Always generate a proper VietQR image URL from env bank config
    // This is a real image URL that <img> can render
    const qrCodeUrl = buildVietQRUrl({
      bankBin: this.bankBin,
      bankAccount: this.bankAccount,
      amount: input.amount,
      addInfo: transferContent,
      accountName: this.accountName,
    })

    // Also try PayOS payment link for redirect-based flow (optional)
    let paymentUrl = ''
    try {
      const domain = process.env.NEXT_PUBLIC_APP_URL || 'https://mushroomie.io.vn'
      const returnUrl = `${domain}/thanh-toan/xac-nhan?orderCode=${input.orderCode}&status=success`
      const cancelUrl = `${domain}/thanh-toan/xac-nhan?orderCode=${input.orderCode}&status=cancelled`
      const timeInSeconds = Math.floor(Date.now() / 1000)
      const payosOrderCode = Number(`${timeInSeconds}${input.orderId}`)

      const paymentLinkData = {
        orderCode: payosOrderCode,
        amount: input.amount,
        description: `Thanh toan don ${input.orderCode}`.substring(0, 25),
        returnUrl: returnUrl,
        cancelUrl: cancelUrl,
      }

      const paymentLink = await this.payos.paymentRequests.create(paymentLinkData)
      paymentUrl = paymentLink.checkoutUrl || ''
    } catch (error) {
      // PayOS link creation failed - that's OK, we still have VietQR image
      console.warn('[PAYOS] Failed to create payment link, using VietQR only:', error)
    }

    return {
      qrCodeUrl,          // VietQR image URL (always works)
      paymentUrl,         // PayOS checkout URL (optional redirect)
      transferContent,
      bankName: this.bankName,
      bankAccount: this.bankAccount,
      accountName: this.accountName,
      bankBin: this.bankBin,
    }
  }

  async generateQRCode(transferContent: string, amount: number): Promise<string> {
    return ''
  }

  async verifyWebhookSignature(request: Request): Promise<WebhookVerifyResult> {
    let body: any
    try {
      const text = await request.text()
      body = JSON.parse(text)
    } catch {
      return { isValid: false, eventId: '', transactionCode: '', amount: 0, transferContent: '', rawPayload: null }
    }

    const signature = body.signature || ''
    let isValid = false
    
    try {
      if (body.data) {
        // webhooks.verify returns verified data or throws error
        await this.payos.webhooks.verify(body)
        isValid = true
      }
    } catch (error) {
      console.error('[PAYOS WEBHOOK ERROR] Sai chữ ký:', error)
      isValid = false
    }

    const payloadData = body.data || {}
    const eventId = String(body.code || Date.now())
    const transactionCode = String(payloadData.reference || payloadData.orderCode || '')
    const amount = Number(payloadData.amount || 0)
    const transferContent = String(payloadData.description || '')

    return { 
      isValid, 
      eventId, 
      transactionCode, 
      amount, 
      transferContent, 
      rawPayload: body, 
      signature 
    }
  }

  async getTransactionStatus(transactionCode: string): Promise<PaymentStatus> {
    try {
      const paymentInfo = await this.payos.paymentRequests.get(Number(transactionCode))
      if (paymentInfo && paymentInfo.status === 'PAID') {
        return 'PAID'
      }
      return 'PENDING'
    } catch {
      return 'PENDING'
    }
  }
}


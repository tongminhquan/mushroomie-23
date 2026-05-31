import { PayOS } from '@payos/node'
import { IPaymentProvider, CreatePaymentInput, PaymentResult, WebhookVerifyResult, PaymentStatus } from '../types'

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

  async createPayment(input: CreatePaymentInput): Promise<PaymentResult> {
    const domain = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
    const transferContent = input.orderCode

    // PayOS yêu cầu orderCode là number và duy nhất
    const timeInSeconds = Math.floor(Date.now() / 1000)
    const payosOrderCode = Number(`${timeInSeconds}${input.orderId}`)

    const paymentLinkData = {
      orderCode: payosOrderCode,
      amount: input.amount,
      description: `Thanh toan don ${input.orderCode}`.substring(0, 25), // PayOS giới hạn 25 ký tự
      cancelUrl: `${domain}/checkout`, // Chuyển hướng khi hủy
      returnUrl: `${domain}/thanh-toan-thanh-cong`, // Chuyển hướng khi thành công
    }

    try {
      const paymentLink = await this.payos.paymentRequests.create(paymentLinkData)

      return {
        providerPaymentId: String(paymentLink.paymentLinkId),
        qrCodeUrl: paymentLink.checkoutUrl, // Trả về link checkout của PayOS để dùng làm URL hoặc hiển thị QR
        paymentUrl: paymentLink.checkoutUrl,
        transferContent: transferContent, 
        bankName: paymentLink.bin || '', // PayOS hiện tại trả về qua webhook, ở lúc tạo chưa chắc có đủ detail
        bankAccount: paymentLink.accountNumber || '',
        accountName: paymentLink.accountName || '',
        bankBin: paymentLink.bin || '',
      }
    } catch (error) {
      console.error('[PAYOS ERROR] Lỗi tạo payment link:', error)
      throw new Error('Không thể tạo liên kết thanh toán PayOS')
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


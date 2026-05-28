export type PaymentStatus = 'PENDING' | 'PAID' | 'FAILED' | 'EXPIRED' | 'CANCELLED'

export interface CreatePaymentInput {
  orderId: number
  orderCode: string
  amount: number
  customerEmail: string
  customerName: string
  expiresAt: Date
}

export interface PaymentResult {
  providerPaymentId?: string
  qrCodeUrl?: string
  qrCodePayload?: string
  paymentUrl?: string
  transferContent: string
  bankName: string
  bankAccount: string
  accountName: string
  bankBin: string
}

export interface WebhookVerifyResult {
  isValid: boolean
  eventId: string
  transactionCode: string
  amount: number
  transferContent: string
  rawPayload: unknown
  signature?: string
}

export interface IPaymentProvider {
  readonly providerKey: string
  createPayment(input: CreatePaymentInput): Promise<PaymentResult>
  generateQRCode(transferContent: string, amount: number): Promise<string>
  verifyWebhookSignature(request: Request): Promise<WebhookVerifyResult>
  getTransactionStatus(transactionCode: string): Promise<PaymentStatus>
}

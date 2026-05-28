/**
 * VietQR Generator
 * Docs: https://vietqr.io/danh-sach-api/generate-qr-code
 */

export interface VietQRParams {
  bankBin: string
  bankAccount: string
  amount: number
  addInfo: string
  accountName?: string
  template?: 'compact' | 'compact2' | 'qr_only' | 'print'
}

export function buildVietQRUrl(params: VietQRParams): string {
  const {
    bankBin,
    bankAccount,
    amount,
    addInfo,
    accountName = '',
    template = 'compact2',
  } = params

  const encodedInfo = encodeURIComponent(addInfo)
  const encodedName = encodeURIComponent(accountName)

  return `https://img.vietqr.io/image/${bankBin}-${bankAccount}-${template}.png?amount=${amount}&addInfo=${encodedInfo}&accountName=${encodedName}`
}

export function buildVietQRPayload(params: VietQRParams): string {
  // EMV QR payload (simplified)
  const { bankBin, bankAccount, amount, addInfo } = params
  return JSON.stringify({ bankBin, bankAccount, amount, addInfo })
}

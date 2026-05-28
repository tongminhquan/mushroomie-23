import { IPaymentProvider } from './types'
import { VietQRCassoProvider } from './providers/vietqr-casso'
import { VietQRSePayProvider } from './providers/vietqr-sepay'

export function getPaymentProvider(): IPaymentProvider {
  const provider = process.env.PAYMENT_PROVIDER

  switch (provider) {
    case 'vietqr_casso':
      return new VietQRCassoProvider()
    case 'vietqr_sepay':
      return new VietQRSePayProvider()
    default:
      throw new Error(
        `PAYMENT_PROVIDER "${provider}" không được hỗ trợ. ` +
        'Chọn một trong: vietqr_casso | vietqr_sepay | vnpay'
      )
  }
}

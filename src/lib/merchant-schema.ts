/**
 * Các khối schema phục vụ Google Merchant listings cho trang sản phẩm.
 *
 * Số liệu ở đây phải khớp với nội dung công bố trên site — Merchant Center đối chiếu
 * structured data với chính sách thật và cảnh báo nếu lệch:
 *  - Đổi trả:   src/app/(user)/chinh-sach-doi-tra/page.tsx  (3 ngày, chỉ hàng lỗi)
 *  - Giao hàng: src/app/(user)/chinh-sach-giao-hang/page.tsx (xử lý 1-3 ngày, giao 1-5 ngày)
 */

/** Số ngày khách được yêu cầu đổi trả kể từ khi nhận hàng. */
export const RETURN_WINDOW_DAYS = 3
/** Thời gian chuẩn bị hàng handmade trước khi bàn giao đơn vị vận chuyển (ngày làm việc). */
export const HANDLING_TIME_DAYS = { min: 1, max: 3 } as const
/** Thời gian vận chuyển: 1-2 ngày nội tỉnh Đồng Nai, 3-5 ngày các tỉnh khác. */
export const TRANSIT_TIME_DAYS = { min: 1, max: 5 } as const

/**
 * Mushroomie chỉ nhận đổi trả với hàng lỗi sản xuất hoặc hư hỏng khi vận chuyển, trong
 * 3 ngày — tức là một cửa sổ đổi trả hữu hạn, không phải "không nhận đổi trả".
 */
export function merchantReturnPolicySchema() {
  return {
    '@type': 'MerchantReturnPolicy',
    applicableCountry: 'VN',
    returnPolicyCategory: 'https://schema.org/MerchantReturnFiniteReturnWindow',
    merchantReturnDays: RETURN_WINDOW_DAYS,
    returnMethod: 'https://schema.org/ReturnByMail',
    returnFees: 'https://schema.org/FreeReturn',
  }
}

export function offerShippingDetailsSchema(shippingFee: number) {
  return {
    '@type': 'OfferShippingDetails',
    shippingRate: {
      '@type': 'MonetaryAmount',
      value: shippingFee,
      currency: 'VND',
    },
    shippingDestination: {
      '@type': 'DefinedRegion',
      addressCountry: 'VN',
    },
    deliveryTime: {
      '@type': 'ShippingDeliveryTime',
      handlingTime: {
        '@type': 'QuantitativeValue',
        minValue: HANDLING_TIME_DAYS.min,
        maxValue: HANDLING_TIME_DAYS.max,
        unitCode: 'DAY',
      },
      transitTime: {
        '@type': 'QuantitativeValue',
        minValue: TRANSIT_TIME_DAYS.min,
        maxValue: TRANSIT_TIME_DAYS.max,
        unitCode: 'DAY',
      },
    },
  }
}

/**
 * Giá handmade không có ngày hết hạn thực tế; Google vẫn muốn `priceValidUntil` để biết
 * khi nào cần crawl lại, nên chốt mốc 1 năm kể từ lúc render.
 */
export function priceValidUntil(from: Date = new Date()): string {
  const until = new Date(from)
  until.setFullYear(until.getFullYear() + 1)
  return until.toISOString().slice(0, 10)
}

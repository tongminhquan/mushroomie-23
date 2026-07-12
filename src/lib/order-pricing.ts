import type { OrderInput } from '@/lib/order-schema'

type OrderItemInput = OrderInput['items'][number]

interface ProductOptionForOrder {
  option_name: string
  option_type: string
  option_values: string | null
}

interface ProductForOrder {
  id: number
  name: string
  price: unknown
  sale_price: unknown | null
  stock: number
  options: ProductOptionForOrder[]
}

export interface VoucherForOrder {
  discountType: string
  discountValue: unknown
  maxDiscount?: unknown | null
}

export function buildAuthoritativeOrderItems(
  items: OrderItemInput[],
  products: ProductForOrder[],
) {
  const productById = new Map(products.map((product) => [product.id, product]))

  return items.map((item) => {
    const product = productById.get(item.product_id)
    if (!product || product.stock < item.quantity) {
      throw new Error('PRODUCT_UNAVAILABLE')
    }

    const selectedOptions = item.selected_options || {}
    const optionByName = new Map(product.options.map((option) => [option.option_name, option]))

    for (const [name, value] of Object.entries(selectedOptions)) {
      const option = optionByName.get(name)
      if (!option) throw new Error('INVALID_PRODUCT_OPTIONS')

      if (option.option_type !== 'text') {
        const allowedValues = parseAllowedOptionValues(option.option_values)
        if (!allowedValues.includes(value)) throw new Error('INVALID_PRODUCT_OPTIONS')
      }
    }

    const regularPrice = Number(product.price)
    const salePrice = product.sale_price === null ? null : Number(product.sale_price)
    const unitPrice = salePrice !== null && salePrice > 0 && salePrice < regularPrice
      ? salePrice
      : regularPrice

    return {
      ...item,
      product_name: product.name,
      price_snapshot: unitPrice,
      total_price: unitPrice * item.quantity,
    }
  })
}

export function calculateVoucherDiscount(
  subtotal: number,
  shippingFee: number,
  voucher: VoucherForOrder,
) {
  let itemDiscountAmount = 0
  let shippingDiscountAmount = 0

  if (voucher.discountType === 'PERCENT') {
    itemDiscountAmount = Math.floor((subtotal * Number(voucher.discountValue)) / 100)
    if (voucher.maxDiscount) {
      itemDiscountAmount = Math.min(itemDiscountAmount, Number(voucher.maxDiscount))
    }
  } else if (voucher.discountType === 'FIXED') {
    itemDiscountAmount = Number(voucher.discountValue)
  } else if (voucher.discountType === 'FREE_SHIPPING') {
    shippingDiscountAmount = shippingFee
  }

  itemDiscountAmount = Math.min(subtotal, Math.max(0, itemDiscountAmount))
  shippingDiscountAmount = Math.min(shippingFee, Math.max(0, shippingDiscountAmount))

  return {
    itemDiscountAmount,
    shippingDiscountAmount,
    voucherDiscountAmount: itemDiscountAmount + shippingDiscountAmount,
  }
}

export function calculateOrderTotal(
  subtotal: number,
  shippingFee: number,
  itemDiscountAmount: number,
  shippingDiscountAmount: number,
) {
  return Math.max(0, subtotal - itemDiscountAmount) + Math.max(0, shippingFee - shippingDiscountAmount)
}

function parseAllowedOptionValues(value: string | null): string[] {
  try {
    const parsed: unknown = JSON.parse(value || '[]')
    return Array.isArray(parsed) && parsed.every((item) => typeof item === 'string') ? parsed : []
  } catch {
    return []
  }
}

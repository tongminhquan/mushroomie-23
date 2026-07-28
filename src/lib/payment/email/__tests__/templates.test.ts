import { afterEach, describe, expect, it, vi } from 'vitest'
import { renderOrderStatusEmail, renderPaymentSuccessEmail } from '@/lib/payment/email/templates'

const order = {
  customer_name: 'Nguyễn An',
  customer_email: 'buyer@example.com',
  order_code: 'MSH-42',
  order_status: 'PROCESSING',
  subtotal: 200_000,
  shipping_fee: 30_000,
  total: 230_000,
  items: [{ product_name: 'Vòng tay nấm', quantity: 2, total_price: 200_000 }],
}

describe('order email templates', () => {
  afterEach(() => {
    vi.unstubAllEnvs()
  })

  it('renders a complete payment receipt with products, totals, and HTTPS order link', () => {
    vi.stubEnv('NEXT_PUBLIC_APP_URL', 'https://mushroomie.test')
    const html = renderPaymentSuccessEmail(order)

    expect(html).toContain('<!DOCTYPE html>')
    expect(html).toContain('Nguyễn An')
    expect(html).toContain('Vòng tay nấm x2')
    expect(html).toContain('230.000')
    expect(html).toContain('href="https://mushroomie.test/tai-khoan/don-hang/MSH-42"')
  })

  it('renders status-specific and fallback updates with current order status', () => {
    vi.stubEnv('NEXT_PUBLIC_APP_URL', 'https://mushroomie.test')
    const shipping = renderOrderStatusEmail({ ...order, order_status: 'SHIPPING' }, 'order_shipping')
    const fallback = renderOrderStatusEmail(order, 'unexpected-template' as never)

    expect(shipping).toContain('MSH-42')
    expect(shipping).toContain('Đang giao hàng')
    expect(fallback).toContain('MSH-42')
  })

  it('escapes customer and product fields before inserting them into email HTML', () => {
    const html = renderPaymentSuccessEmail({
      ...order,
      customer_name: '<img src=x onerror=alert(1)>',
      items: [{ product_name: '<script>alert(1)</script>', quantity: 1, total_price: 1 }],
    })

    expect(html).not.toContain('<script>alert(1)</script>')
    expect(html).not.toContain('<img src=x')
    expect(html).toContain('&lt;script&gt;alert(1)&lt;/script&gt;')
    expect(html).toContain('&lt;img src=x onerror=alert(1)&gt;')
  })
})

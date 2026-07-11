import { ORDER_STATUS_LABELS, EmailTemplateKey } from '@/types'
import { createOrderAccessToken } from '@/lib/order-access'

function getOrderDetailUrl(order: { id: number; order_code: string }) {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://mushroomie.io.vn'
  const accessToken = createOrderAccessToken(order.id, order.order_code)
  return `${baseUrl}/tai-khoan/don-hang/${encodeURIComponent(order.order_code)}?accessToken=${encodeURIComponent(accessToken)}`
}

function emailWrapper(content: string): string {
  return `
<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: 'Montserrat', Arial, sans-serif; background: #fff5f5; color: #1A1A1A; }
    .container { max-width: 600px; margin: 0 auto; background: #fff; border-radius: 16px; overflow: hidden; }
    .header { background: #e41d1d; padding: 32px; text-align: center; }
    .header h1 { color: #fff; font-size: 28px; font-weight: 900; }
    .header p { color: rgba(255,255,255,0.85); font-size: 14px; margin-top: 8px; }
    .body { padding: 32px; }
    .badge { display: inline-block; background: #fde8e8; color: #e41d1d; border-radius: 100px; padding: 6px 16px; font-size: 13px; font-weight: 600; margin-bottom: 20px; }
    h2 { font-size: 22px; font-weight: 700; margin-bottom: 16px; }
    .info-box { background: #fafafa; border-radius: 12px; padding: 20px; margin: 16px 0; }
    .info-row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #f0f0f0; font-size: 14px; }
    .info-row:last-child { border-bottom: none; font-weight: 700; color: #e41d1d; }
    .product-item { display: flex; padding: 12px 0; border-bottom: 1px solid #f5f5f5; font-size: 14px; }
    .product-item .name { flex: 1; }
    .btn { display: block; background: #e41d1d; color: #fff; text-decoration: none; border-radius: 100px; padding: 14px 32px; text-align: center; font-weight: 700; font-size: 15px; margin: 24px 0; }
    .footer { background: #fafafa; padding: 24px 32px; text-align: center; font-size: 13px; color: #6B7280; }
  </style>
</head>
<body>
  <div class="container">
    ${content}
  </div>
</body>
</html>`
}

function formatMoney(amount: number | string | any): string {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(Number(amount))
}

export function renderPaymentSuccessEmail(order: any): string {
  const itemsHtml = order.items.map((item: any) => `
    <div class="product-item">
      <div class="name">${item.product_name} x${item.quantity}</div>
      <div>${formatMoney(item.total_price)}</div>
    </div>`).join('')

  return emailWrapper(`
    <div class="header">
      <h1>🍄 Mushroomie</h1>
      <p>Phụ kiện Handmade Cá nhân hóa</p>
    </div>
    <div class="body">
      <span class="badge">✅ Thanh toán thành công</span>
      <h2>Xin chào ${order.customer_name}!</h2>
      <p style="font-size:14px;color:#6B7280;margin-bottom:16px">Mushroomie đã nhận được thanh toán của bạn. Chúng mình sẽ bắt đầu làm sản phẩm ngay nha! 💛</p>
      <div class="info-box">
        <div class="info-row"><span>Mã đơn hàng</span><strong>#${order.order_code}</strong></div>
        <div class="info-row"><span>Trạng thái thanh toán</span><span style="color:#16a34a">✅ Đã thanh toán</span></div>
        <div class="info-row"><span>Trạng thái đơn hàng</span><span>Đang xử lý</span></div>
      </div>
      <h3 style="margin:16px 0 8px;font-size:16px">Sản phẩm đã đặt</h3>
      ${itemsHtml}
      <div class="info-box" style="margin-top:12px">
        <div class="info-row"><span>Tạm tính</span><span>${formatMoney(order.subtotal)}</span></div>
        <div class="info-row"><span>Phí vận chuyển</span><span>${formatMoney(order.shipping_fee)}</span></div>
        <div class="info-row"><span>Tổng cộng</span><span>${formatMoney(order.total)}</span></div>
      </div>
      <a href="${getOrderDetailUrl(order)}" class="btn">Xem chi tiết đơn hàng →</a>
    </div>
    <div class="footer">Cảm ơn bạn đã tin tưởng Mushroomie 🍄<br><small>Nếu có thắc mắc, liên hệ chúng mình qua email hoặc mạng xã hội nhé!</small></div>
  `)
}

export function renderOrderStatusEmail(order: any, templateKey: EmailTemplateKey): string {
  const statusMessages: Record<string, { emoji: string; title: string; body: string }> = {
    order_processing: { emoji: '🎉', title: 'Đơn hàng đang được xử lý', body: 'Mushroomie đã nhận được đơn hàng và đang chuẩn bị.' },
    order_making: { emoji: '🧵', title: 'Đang làm sản phẩm handmade', body: 'Chúng mình đang tỉ mỉ làm từng chiếc phụ kiện cho bạn với tất cả tình yêu thương! 💛' },
    order_packing: { emoji: '📦', title: 'Đang đóng gói sản phẩm', body: 'Sản phẩm đã hoàn thành và đang được đóng gói cẩn thận để đến tay bạn.' },
    order_shipping: { emoji: '🚚', title: 'Đơn hàng đang giao', body: 'Đơn hàng đang trên đường đến tay bạn rồi! Hãy để ý điện thoại nhé.' },
    order_completed: { emoji: '🍄', title: 'Hoàn tất! Cảm ơn bạn!', body: 'Đơn hàng đã được giao thành công. Cảm ơn bạn đã ủng hộ Mushroomie! Hãy để lại review nhé 💛' },
    order_cancelled: { emoji: '❌', title: 'Đơn hàng đã bị hủy', body: 'Rất tiếc, đơn hàng của bạn đã bị hủy. Nếu có thắc mắc, hãy liên hệ Mushroomie nhé.' },
  }
  const msg = statusMessages[templateKey] || { emoji: 'ℹ️', title: 'Cập nhật đơn hàng', body: 'Trạng thái đơn hàng đã được cập nhật.' }

  return emailWrapper(`
    <div class="header">
      <h1>🍄 Mushroomie</h1>
      <p>Phụ kiện Handmade Cá nhân hóa</p>
    </div>
    <div class="body">
      <span class="badge">${msg.emoji} ${msg.title}</span>
      <h2>Xin chào ${order.customer_name}!</h2>
      <p style="font-size:14px;color:#6B7280;margin-bottom:16px">${msg.body}</p>
      <div class="info-box">
        <div class="info-row"><span>Mã đơn hàng</span><strong>#${order.order_code}</strong></div>
        <div class="info-row"><span>Trạng thái</span><span>${ORDER_STATUS_LABELS[order.order_status as keyof typeof ORDER_STATUS_LABELS] || order.order_status}</span></div>
      </div>
      <a href="${getOrderDetailUrl(order)}" class="btn">Theo dõi đơn hàng →</a>
    </div>
    <div class="footer">Mushroomie — Phụ kiện Handmade Cá nhân hóa 🍄</div>
  `)
}

---
name: "source-command-audit-ux-ui"
description: "Audit and fix UX/UI issues across Mushroomie user and admin website."
---

# source-command-audit-ux-ui

Use this skill when the user asks to run the migrated source command `audit-ux-ui`.

## Command Template

Bạn là senior UX/UI engineer và frontend QA cho Mushroomie. Hãy dò toàn bộ lỗi UX/UI trên user site và admin, phân loại mức độ ưu tiên (Critical / High / Medium / Low), sửa các lỗi đã xác minh, đảm bảo đúng brand Mushroomie.

## Phạm vi kiểm tra

**User site:**
- Header / footer / navigation / mobile bottom nav
- Trang chủ (homepage)
- Danh sách sản phẩm / chi tiết sản phẩm
- Giỏ hàng (CartDrawer) / Checkout / Xác nhận đơn / QR thanh toán
- Voucher / Mini game
- Tin tức (listing + detail)
- Giới thiệu / Liên hệ / Policy pages
- Tài khoản (đăng nhập, đăng ký, đặt lại mật khẩu, danh sách đơn, chi tiết đơn)

**Admin:**
- Dashboard, sản phẩm, bài viết (TipTap), đơn hàng, thanh toán, webhook logs
- Banner, thư viện media, tài khoản, liên hệ, đánh giá, nhat-ky, cài đặt

## Tiêu chí

- Không broken image (logo, favicon, banner, product, blog, QR, avatar)
- Không scroll ngang trên mobile
- Product image ratio 3:4
- CTA rõ ràng, màu đúng brand (#e41d1d primary)
- Contrast WCAG AA, tap target ≥ 44px trên mobile
- Empty state / loading skeleton / error state đầy đủ
- Animation chỉ transform/opacity, hỗ trợ prefers-reduced-motion
- Font: Paytone One (heading), Montserrat (body)
- Không phá chức năng sau khi sửa

## Checks sau sửa

```bash
npm ci
npx prisma generate
npm run typecheck
npm run build
```

## Báo cáo

Liệt kê file đã sửa, lỗi phát hiện (theo mức độ), cách sửa, kết quả typecheck + build.

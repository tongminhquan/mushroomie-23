import type { Metadata } from 'next'
import Link from 'next/link'
import { prisma } from '@/lib/prisma'
import { verifyReviewToken } from '@/lib/review-request'
import BrandContainer from '@/components/ui/BrandContainer'
import TokenReviewForm from '@/components/product/TokenReviewForm'

/** Trang chỉ tới được qua link trong email — không index, không nằm trong sitemap. */
export const metadata: Metadata = {
  title: 'Đánh giá đơn hàng',
  robots: { index: false, follow: false },
}

export const dynamic = 'force-dynamic'

function Notice({ title, body }: { title: string; body: string }) {
  return (
    <div className="rounded-[18px] border-[1.5px] border-warm-border bg-white p-6 text-center">
      <div className="text-4xl" aria-hidden>🍄</div>
      <h1 className="mt-3 font-heading text-xl text-neutral-900">{title}</h1>
      <p className="mt-2 text-sm leading-relaxed text-neutral-600">{body}</p>
      <Link
        href="/san-pham"
        className="mt-5 inline-block rounded-full bg-primary px-6 py-3 text-sm font-bold text-white"
      >
        Xem sản phẩm
      </Link>
    </div>
  )
}

export default async function ReviewByTokenPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>
}) {
  const { token } = await searchParams
  const payload = verifyReviewToken(token)

  if (!payload) {
    return (
      <BrandContainer>
        <div className="py-10">
          <Notice
            title="Link không hợp lệ"
            body="Link đánh giá đã hết hạn hoặc không đúng. Bạn có thể đánh giá trong mục Đơn hàng của tôi nếu đã có tài khoản."
          />
        </div>
      </BrandContainer>
    )
  }

  const order = await prisma.order
    .findUnique({
      where: { id: payload.orderId },
      select: { order_code: true, customer_name: true, order_status: true, is_reviewed: true },
    })
    .catch(() => null)

  if (!order || order.order_code !== payload.orderCode) {
    return (
      <BrandContainer>
        <div className="py-10">
          <Notice title="Không tìm thấy đơn hàng" body="Đơn hàng gắn với link này không còn tồn tại." />
        </div>
      </BrandContainer>
    )
  }

  if (order.is_reviewed) {
    return (
      <BrandContainer>
        <div className="py-10">
          <Notice
            title="Bạn đã đánh giá đơn này rồi"
            body="Cảm ơn bạn đã dành thời gian chia sẻ cảm nhận với Mushroomie."
          />
        </div>
      </BrandContainer>
    )
  }

  if (order.order_status !== 'COMPLETED') {
    return (
      <BrandContainer>
        <div className="py-10">
          <Notice
            title="Đơn hàng chưa hoàn tất"
            body="Bạn có thể đánh giá sau khi đơn hàng được giao thành công."
          />
        </div>
      </BrandContainer>
    )
  }

  return (
    <BrandContainer>
      <div className="py-10">
        <div className="mx-auto max-w-lg">
          <p className="text-xs font-extrabold uppercase tracking-[0.12em] text-primary">Đơn {order.order_code}</p>
          <h1 className="mt-2 font-heading text-2xl text-neutral-900 md:text-3xl">
            {order.customer_name.trim() || 'Bạn'} thấy sản phẩm thế nào?
          </h1>
          <p className="mt-2 text-sm leading-relaxed text-neutral-600">
            Mushroomie làm thủ công từng món nên rất mong nghe cảm nhận thật của bạn. Đánh giá sẽ hiển thị sau khi
            được duyệt.
          </p>
          <div className="mt-6">
            <TokenReviewForm token={token!} />
          </div>
        </div>
      </div>
    </BrandContainer>
  )
}

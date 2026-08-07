'use client'

import { useSession } from 'next-auth/react'

export default function MiniGameLoginNotice() {
  const { status } = useSession()

  if (status !== 'unauthenticated') return null

  return (
    <div className="max-w-xl rounded-2xl border border-amber-400/30 bg-amber-400/10 px-4 py-3 text-sm font-semibold text-theme-secondary">
      Đăng nhập để lưu điểm và nhận voucher sau mỗi lượt chơi đạt mốc.
    </div>
  )
}

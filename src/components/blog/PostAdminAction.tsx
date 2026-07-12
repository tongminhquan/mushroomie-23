'use client'

import Link from 'next/link'
import { Eye, Pencil } from 'lucide-react'
import { useSession } from 'next-auth/react'

const ADMIN_ACCESS_ROLES = new Set(['super_admin', 'admin', 'viewer'])
const POST_EDITOR_ROLES = new Set(['super_admin', 'admin'])

export default function PostAdminAction({ postId }: { postId: number }) {
  const { data: session } = useSession()
  const role = (session?.user as { role?: string } | undefined)?.role

  if (!role || !ADMIN_ACCESS_ROLES.has(role)) {
    return null
  }

  const canEdit = POST_EDITOR_ROLES.has(role)
  const Icon = canEdit ? Pencil : Eye

  return (
    <Link
      href={`/admin/bai-viet/${postId}`}
      className="inline-flex min-h-11 items-center gap-2 rounded-full border border-primary/25 bg-primary-light px-4 py-2 text-sm font-bold text-primary transition-colors hover:border-primary hover:bg-primary hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
      aria-label={canEdit ? 'Chỉnh sửa bài viết trong trang quản trị' : 'Xem bài viết trong trang quản trị'}
    >
      <Icon size={16} aria-hidden="true" />
      {canEdit ? 'Chỉnh sửa bài viết' : 'Xem trong quản trị'}
    </Link>
  )
}

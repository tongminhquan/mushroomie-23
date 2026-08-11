import { redirect } from 'next/navigation'

import { AdminPageHeader } from '@/components/admin/AdminUI'
import SeoDiscoveryDashboard from '@/components/admin/SeoDiscoveryDashboard'
import { requireAdmin } from '@/lib/auth'

export const dynamic = 'force-dynamic'

export default async function SeoDiscoveryAdminPage() {
  try {
    await requireAdmin()
  } catch (error) {
    if (error instanceof Error && error.message === 'FORBIDDEN') {
      redirect('/admin')
    }
    if (error instanceof Error && error.message === 'UNAUTHORIZED') {
      redirect('/tai-khoan/dang-nhap')
    }
    throw error
  }

  return (
    <div className="mx-auto w-full max-w-[1680px] p-4 sm:p-6 lg:p-8">
      <AdminPageHeader
        title="Khám phá & lập chỉ mục"
        description="Theo dõi URL công khai, điều kiện SEO, sitemap và bằng chứng Google Search Console."
        icon="🔎"
      />
      <SeoDiscoveryDashboard />
    </div>
  )
}

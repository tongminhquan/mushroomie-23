import { prisma } from '@/lib/prisma'
import { formatDate } from '@/lib/utils'
import type { Metadata } from 'next'
import ContactActions from '@/components/admin/ContactActions'

export const metadata: Metadata = { title: 'Quản lý liên hệ | Admin Mushroomie' }

interface SearchParams { status?: string }

export default async function AdminContactsPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const sp = await searchParams
  const where: any = {}
  if (sp.status) where.status = sp.status

  const contacts = await prisma.contact.findMany({
    where,
    orderBy: { created_at: 'desc' },
    take: 50,
  }).catch(() => [])

  const unreadCount = await prisma.contact.count({ where: { status: 'unread' } }).catch(() => 0)

  const statusColors: Record<string, string> = {
    unread: 'bg-red-100 text-red-700',
    read: 'bg-neutral-100 text-neutral-700',
    replied: 'bg-green-100 text-green-700',
  }

  return (
    <div className="p-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-neutral-400">Nội dung &amp; hệ thống</p>
          <h1 className="font-heading text-2xl font-bold text-neutral-900 mt-0.5">Quản lý liên hệ</h1>
          {unreadCount > 0 && (
            <p className="text-red-600 text-sm font-semibold mt-1 flex items-center gap-1.5">
              <span className="inline-block w-2 h-2 rounded-full bg-red-500" />
              {unreadCount} tin chưa đọc
            </p>
          )}
        </div>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2 mb-6 overflow-x-auto whitespace-nowrap pb-1">
        {[
          { value: '', label: 'Tất cả' },
          { value: 'unread', label: '🔴 Chưa đọc' },
          { value: 'read', label: '👁 Đã đọc' },
          { value: 'replied', label: '✅ Đã trả lời' },
        ].map((tab) => (
          <a key={tab.value} href={`/admin/lien-he${tab.value ? `?status=${tab.value}` : ''}`}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors border-[1.5px] ${
              (sp.status || '') === tab.value
                ? 'bg-primary text-white border-primary'
                : 'bg-white text-neutral-700 border-[#f0e0d6] hover:border-primary hover:text-primary'
            }`}>
            {tab.label}
          </a>
        ))}
      </div>

      <div className="space-y-3">
        {contacts.map((contact) => (
          <div key={contact.id} className="bg-white rounded-[16px] border-[1.5px] border-[#f0e0d6] p-5 shadow-card hover:shadow-hover transition-all">
            <div className="flex flex-wrap items-start justify-between gap-3 mb-3">
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-full bg-[#ffece6] flex items-center justify-center text-primary font-semibold text-sm shrink-0">
                  {contact.name?.trim()?.charAt(0)?.toUpperCase() || '?'}
                </div>
                <div>
                  <span className="font-semibold text-neutral-900">{contact.name}</span>
                  <span className="text-neutral-500 text-sm ml-2">{contact.email}</span>
                  {contact.phone && <span className="text-neutral-500 text-sm ml-2">· {contact.phone}</span>}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${statusColors[contact.status] || ''}`}>
                  {contact.status === 'unread' ? 'Chưa đọc' : contact.status === 'read' ? 'Đã đọc' : 'Đã trả lời'}
                </span>
                <span className="text-neutral-400 text-xs">{formatDate(contact.created_at)}</span>
              </div>
            </div>
            <p className="text-neutral-600 text-sm leading-relaxed bg-neutral-50 border-[1.5px] border-[#f0e0d6] rounded-lg p-3">{contact.message}</p>
              <ContactActions contact={contact} />
          </div>
        ))}
        {contacts.length === 0 && (
          <div className="text-center py-12 text-neutral-500 bg-white rounded-[16px] border-[1.5px] border-[#f0e0d6] shadow-card">Không có liên hệ nào</div>
        )}
      </div>
    </div>
  )
}

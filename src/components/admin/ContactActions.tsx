'use client'
import { useRouter } from 'next/navigation'
import { useState } from 'react'

export default function ContactActions({ contact }: { contact: { id: number, status: string, email: string } }) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)

  const markAsRead = async () => {
    setIsLoading(true)
    await fetch(`/api/contacts/${contact.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'read' })
    })
    setIsLoading(false)
    router.refresh()
  }

  return (
    <div className="flex gap-3 mt-3">
      {contact.status === 'unread' && (
        <button
          disabled={isLoading}
          className="text-xs text-primary font-semibold hover:underline disabled:opacity-50"
          onClick={markAsRead}
        >
          Đánh dấu đã đọc
        </button>
      )}
      <a href={`mailto:${contact.email}`} className="text-xs text-blue-600 font-semibold hover:underline">Trả lời qua email →</a>
    </div>
  )
}

'use client'

import { SessionProvider } from 'next-auth/react'
import ProfileCompletionGuard from '@/components/layout/ProfileCompletionGuard'

export default function PublicProviders({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <ProfileCompletionGuard>{children}</ProfileCompletionGuard>
    </SessionProvider>
  )
}

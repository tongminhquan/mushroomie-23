'use client'

import { SessionProvider } from 'next-auth/react'
import ProfileCompletionGuard from '@/components/layout/ProfileCompletionGuard'

export default function PublicProviders({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider refetchInterval={0} refetchOnWindowFocus={false}>
      <ProfileCompletionGuard>{children}</ProfileCompletionGuard>
    </SessionProvider>
  )
}

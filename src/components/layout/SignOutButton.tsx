'use client'
import { signOut } from 'next-auth/react'
import { LogOut } from 'lucide-react'

export function SignOutButton({ className }: { className?: string }) {
  return (
    <button 
      onClick={() => signOut({ callbackUrl: '/' })} 
      className={className || "flex items-center gap-2"}
    >
      <LogOut size={20} />
      Đăng xuất
    </button>
  )
}

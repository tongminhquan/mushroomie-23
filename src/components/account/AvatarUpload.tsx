'use client'

import { useState, useRef } from 'react'
import { Camera } from 'lucide-react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'

interface AvatarUploadProps {
  initialAvatar: string | null
  userName: string
}

export function AvatarUpload({ initialAvatar, userName }: AvatarUploadProps) {
  const [avatar, setAvatar] = useState<string | null>(initialAvatar)
  const [loading, setLoading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const router = useRouter()

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    try {
      setLoading(true)
      
      // Upload file to /api/upload
      const formData = new FormData()
      formData.append('file', file)
      formData.append('purpose', 'avatar')
      
      const uploadRes = await fetch('/api/upload', {
        method: 'POST',
        body: formData
      })
      
      if (!uploadRes.ok) throw new Error('Không thể tải ảnh lên')
      
      const uploadData = await uploadRes.json()
      const newAvatarUrl = uploadData.url

      // Save to profile
      const updateRes = await fetch('/api/user/update-avatar', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ avatar: newAvatarUrl })
      })
      
      if (!updateRes.ok) throw new Error('Không thể lưu ảnh đại diện')
      
      setAvatar(newAvatarUrl)
      router.refresh() // Reload data
    } catch (error) {
      console.error(error)
      alert('Đã xảy ra lỗi khi cập nhật ảnh đại diện')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="relative group cursor-pointer" onClick={() => fileInputRef.current?.click()}>
      {avatar ? (
        <div className="relative w-12 h-12">
          <Image src={avatar} alt={userName} fill className="rounded-full object-cover border border-stone-200 shadow-sm" sizes="48px" />
        </div>
      ) : (
        <div className="w-12 h-12 rounded-full bg-yellow-100 flex items-center justify-center text-yellow-600 font-bold text-xl">
          {userName.charAt(0).toUpperCase()}
        </div>
      )}
      
      <div className="absolute inset-0 bg-black/40 rounded-full opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
        <Camera size={16} className="text-white" />
      </div>
      
      <input 
        type="file" 
        ref={fileInputRef} 
        onChange={handleFileChange} 
        accept="image/jpeg,image/png,image/webp,image/avif"
        className="hidden" 
      />
      {loading && (
        <div className="absolute inset-0 bg-theme-card/60 rounded-full flex items-center justify-center">
          <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
        </div>
      )}
    </div>
  )
}

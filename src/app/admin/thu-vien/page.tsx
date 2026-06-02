import type { Metadata } from 'next'
import MediaLibrary from './MediaLibrary'

export const metadata: Metadata = { 
  title: 'Thư viện hình ảnh | Admin Mushroomie',
  description: 'Quản lý thư viện hình ảnh của website'
}

export default function AdminMediaLibraryPage() {
  return <MediaLibrary />
}

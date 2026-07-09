import type { Metadata } from 'next'
import WordPressAutoPosterClient from './WordPressAutoPosterClient'

export const metadata: Metadata = {
  title: 'Đăng bài WordPress | Admin Mushroomie',
}

export default function AdminWordPressAutoPosterPage() {
  return <WordPressAutoPosterClient />
}

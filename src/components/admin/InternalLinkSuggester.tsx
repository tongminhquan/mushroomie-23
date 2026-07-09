'use client'
import { useState, useEffect } from 'react'
import { Search, Link as LinkIcon, Copy, CheckCircle2, ExternalLink, Loader2 } from 'lucide-react'

export default function InternalLinkSuggester() {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [copiedId, setCopiedId] = useState<string | null>(null)

  useEffect(() => {
    if (!query.trim()) {
      setResults([])
      return
    }

    const timer = setTimeout(async () => {
      setIsLoading(true)
      try {
        // We'll search posts and products
        const [postsRes, productsRes] = await Promise.all([
          fetch(`/api/posts?search=${encodeURIComponent(query)}&limit=5`),
          fetch(`/api/products?search=${encodeURIComponent(query)}&limit=5`)
        ])
        
        let posts: any[] = []
        let products: any[] = []

        if (postsRes.ok) {
          const postsData = await postsRes.json()
          posts = (postsData.posts || postsData).map((p: any) => ({
            id: `post-${p.id}`,
            title: p.title,
            url: `/tin-tuc/${p.slug}`,
            type: 'Bài viết'
          }))
        }

        if (productsRes.ok) {
          const productsData = await productsRes.json()
          products = (productsData.products || productsData).map((p: any) => ({
            id: `product-${p.id}`,
            title: p.name,
            url: `/san-pham/${p.slug}`,
            type: 'Sản phẩm'
          }))
        }

        setResults([...posts, ...products].slice(0, 8))
      } catch (e) {
        console.error('Lỗi tìm kiếm liên kết:', e)
      } finally {
        setIsLoading(false)
      }
    }, 500)

    return () => clearTimeout(timer)
  }, [query])

  const copyToClipboard = (url: string, id: string) => {
    navigator.clipboard.writeText(url)
    setCopiedId(id)
    setTimeout(() => setCopiedId(null), 2000)
  }

  return (
    <div className="bg-white rounded-2xl border border-[#f0e0d6] shadow-sm overflow-hidden">
      <div className="px-4 py-3 bg-[#fdfaf7] border-b border-neutral-100 flex items-center gap-2">
        <LinkIcon size={14} className="text-neutral-500" />
        <span className="font-semibold text-sm text-neutral-800">Gợi ý Liên kết Nội bộ</span>
      </div>
      <div className="p-4 space-y-3">
        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
          <input
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Tìm kiếm bài viết hoặc sản phẩm..."
            className="w-full pl-9 pr-3 py-2 border border-[#f0e0d6] rounded-lg text-sm focus:border-primary outline-none bg-white"
          />
          {isLoading && <Loader2 size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-primary animate-spin" />}
        </div>
        
        {results.length > 0 ? (
          <div className="space-y-2 max-h-60 overflow-y-auto">
            {results.map(item => (
              <div key={item.id} className="flex items-center justify-between p-2 border border-neutral-100 rounded-lg hover:bg-[#fdfaf7] transition-colors">
                <div className="flex-1 min-w-0 pr-2">
                  <p className="text-xs font-semibold text-neutral-800 truncate" title={item.title}>{item.title}</p>
                  <p className="text-[10px] text-neutral-400 truncate flex gap-2">
                    <span className="text-primary font-medium">{item.type}</span>
                    <span>{item.url}</span>
                  </p>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <a href={item.url} target="_blank" rel="noreferrer" className="p-1.5 text-neutral-400 hover:text-primary transition-colors bg-white border border-[#f0e0d6] rounded-md">
                    <ExternalLink size={12} />
                  </a>
                  <button
                    onClick={() => copyToClipboard(item.url, item.id)}
                    className="p-1.5 text-neutral-600 hover:text-primary hover:bg-primary/5 transition-colors bg-white border border-[#f0e0d6] rounded-md flex items-center justify-center w-7 h-7"
                    title="Copy Link"
                  >
                    {copiedId === item.id ? <CheckCircle2 size={12} className="text-green-500" /> : <Copy size={12} />}
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : query.trim() && !isLoading ? (
          <p className="text-xs text-neutral-400 text-center py-4">Không tìm thấy kết quả.</p>
        ) : (
          <p className="text-xs text-neutral-400 text-center py-4">Nhập từ khóa để tìm liên kết chèn vào bài.</p>
        )}
      </div>
    </div>
  )
}

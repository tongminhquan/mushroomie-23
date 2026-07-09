'use client'
import { useState, useEffect } from 'react'
import { Check, Plus } from 'lucide-react'

interface Category {
  id: number
  name: string
  slug: string
  type: string
}

interface CategoryPanelProps {
  selectedIds: number[]
  onChange: (ids: number[]) => void
}

function generateSlug(text: string) {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
}

export default function CategoryPanel({ selectedIds, onChange }: CategoryPanelProps) {
  const [categories, setCategories] = useState<Category[]>([])
  const [showAdd, setShowAdd] = useState(false)
  const [newName, setNewName] = useState('')
  const [newSlug, setNewSlug] = useState('')
  const [parentId, setParentId] = useState('')
  const [isAdding, setIsAdding] = useState(false)
  const [tab, setTab] = useState<'all' | 'most_used'>('all')

  const fetchCategories = () => {
    fetch('/api/categories?type=post')
      .then(r => r.json())
      .then(d => setCategories(d.categories || []))
      .catch(() => {})
  }

  useEffect(() => { fetchCategories() }, [])

  const handleToggle = (id: number) => {
    if (selectedIds.includes(id)) {
      onChange(selectedIds.filter(i => i !== id))
    } else {
      onChange([...selectedIds, id])
    }
  }

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const name = e.target.value
    setNewName(name)
    setNewSlug(generateSlug(name))
  }

  const handleAddCategory = async () => {
    if (!newName.trim()) return
    setIsAdding(true)
    try {
      const res = await fetch('/api/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newName.trim(), slug: newSlug || generateSlug(newName), type: 'post', parent_id: parentId ? Number(parentId) : undefined }),
      })
      if (res.ok) {
        const data = await res.json()
        fetchCategories()
        if (data.category?.id) onChange([...selectedIds, data.category.id])
        setNewName('')
        setNewSlug('')
        setParentId('')
        setShowAdd(false)
      }
    } catch {}
    setIsAdding(false)
  }

  // Sort by most used (simulated by id desc for demo)
  const displayCats = tab === 'most_used'
    ? [...categories].sort((a, b) => b.id - a.id).slice(0, 10)
    : categories

  return (
    <div className="overflow-hidden rounded-[4px] border border-[#c3c4c7] bg-white shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
      <div className="flex items-center justify-between border-b border-[#dcdcde] bg-[#f6f7f7] px-4 py-3">
        <span className="text-sm font-semibold text-[#1d2327]">Danh mục</span>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-[#dcdcde] bg-white text-xs font-semibold">
        <button
          onClick={() => setTab('all')}
          className={`flex-1 py-2 transition-colors ${tab === 'all' ? 'border-b-2 border-primary text-primary' : 'text-[#646970] hover:text-[#1d2327]'}`}
        >
          Tất cả danh mục
        </button>
        <button
          onClick={() => setTab('most_used')}
          className={`flex-1 py-2 transition-colors ${tab === 'most_used' ? 'border-b-2 border-primary text-primary' : 'text-[#646970] hover:text-[#1d2327]'}`}
        >
          Dùng nhiều nhất
        </button>
      </div>

      {/* Category list */}
      <div className="max-h-52 space-y-1 overflow-y-auto p-3">
        {displayCats.length === 0 ? (
          <p className="py-4 text-center text-xs text-[#646970]">Chưa có danh mục nào</p>
        ) : displayCats.map(cat => (
          <label key={cat.id} className="flex cursor-pointer items-center gap-2 rounded-[4px] px-2 py-1.5 transition-colors hover:bg-[#f6f7f7]">
            <div
              onClick={() => handleToggle(cat.id)}
              className={`flex h-4 w-4 flex-shrink-0 cursor-pointer items-center justify-center rounded-[3px] border transition-colors ${
                selectedIds.includes(cat.id) ? 'border-primary bg-primary' : 'border-[#8c8f94] hover:border-primary'
              }`}
            >
              {selectedIds.includes(cat.id) && <Check size={10} className="text-white" />}
            </div>
            <span className="text-sm text-[#1d2327]">{cat.name}</span>
          </label>
        ))}
      </div>

      {/* Add category */}
      <div className="border-t border-[#dcdcde] p-3">
        <button
          onClick={() => setShowAdd(!showAdd)}
          className="flex items-center gap-1 text-sm font-semibold text-[#2271b1] hover:text-primary hover:underline"
        >
          <Plus size={14} />
          Thêm danh mục mới
        </button>

        {showAdd && (
          <div className="mt-3 space-y-2">
            <input
              value={newName}
              onChange={handleNameChange}
              placeholder="Tên danh mục"
              className="w-full rounded-[4px] border border-[#8c8f94] px-3 py-2 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary"
            />
            <input
              value={newSlug}
              onChange={e => setNewSlug(e.target.value)}
              placeholder="Slug (tự động)"
              className="w-full rounded-[4px] border border-[#8c8f94] px-3 py-2 font-mono text-xs outline-none focus:border-primary focus:ring-1 focus:ring-primary"
            />
            <select
              value={parentId}
              onChange={e => setParentId(e.target.value)}
              className="w-full rounded-[4px] border border-[#8c8f94] bg-white px-3 py-2 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary"
            >
              <option value="">Danh mục gốc</option>
              {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
            <button
              onClick={handleAddCategory}
              disabled={isAdding || !newName.trim()}
              className="w-full rounded-[4px] bg-primary py-2 text-sm font-semibold text-white transition-colors hover:bg-primary-dark disabled:opacity-50"
            >
              {isAdding ? 'Đang thêm...' : 'Thêm danh mục'}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

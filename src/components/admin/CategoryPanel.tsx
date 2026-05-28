'use client'
import { useState, useEffect } from 'react'
import { Plus, X, ChevronDown, ChevronUp, Check } from 'lucide-react'

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
    <div className="bg-white rounded-2xl shadow-sm border border-neutral-200 overflow-hidden">
      <div className="px-4 py-3 border-b border-neutral-100 bg-neutral-50 flex items-center justify-between">
        <span className="font-semibold text-sm text-neutral-800">Danh mục</span>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-neutral-100 text-xs font-medium">
        <button
          onClick={() => setTab('all')}
          className={`flex-1 py-2 transition-colors ${tab === 'all' ? 'bg-primary text-white' : 'text-neutral-600 hover:bg-neutral-50'}`}
        >
          Tất cả danh mục
        </button>
        <button
          onClick={() => setTab('most_used')}
          className={`flex-1 py-2 transition-colors ${tab === 'most_used' ? 'bg-primary text-white' : 'text-neutral-600 hover:bg-neutral-50'}`}
        >
          Dùng nhiều nhất
        </button>
      </div>

      {/* Category list */}
      <div className="p-3 max-h-52 overflow-y-auto space-y-1">
        {displayCats.length === 0 ? (
          <p className="text-xs text-neutral-400 text-center py-4">Chưa có danh mục nào</p>
        ) : displayCats.map(cat => (
          <label key={cat.id} className="flex items-center gap-2 cursor-pointer hover:bg-neutral-50 px-2 py-1.5 rounded-lg transition-colors">
            <div
              onClick={() => handleToggle(cat.id)}
              className={`w-4 h-4 rounded border-2 flex items-center justify-center flex-shrink-0 transition-colors cursor-pointer ${
                selectedIds.includes(cat.id) ? 'bg-primary border-primary' : 'border-neutral-300 hover:border-primary'
              }`}
            >
              {selectedIds.includes(cat.id) && <Check size={10} className="text-white" />}
            </div>
            <span className="text-sm text-neutral-700">{cat.name}</span>
          </label>
        ))}
      </div>

      {/* Add category */}
      <div className="border-t border-neutral-100 p-3">
        <button
          onClick={() => setShowAdd(!showAdd)}
          className="text-sm text-primary font-medium hover:underline flex items-center gap-1"
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
              className="w-full px-3 py-2 border border-neutral-200 rounded-lg text-sm focus:border-primary outline-none"
            />
            <input
              value={newSlug}
              onChange={e => setNewSlug(e.target.value)}
              placeholder="Slug (tự động)"
              className="w-full px-3 py-2 border border-neutral-200 rounded-lg text-sm focus:border-primary outline-none font-mono text-xs"
            />
            <select
              value={parentId}
              onChange={e => setParentId(e.target.value)}
              className="w-full px-3 py-2 border border-neutral-200 rounded-lg text-sm focus:border-primary outline-none bg-white"
            >
              <option value="">Danh mục gốc</option>
              {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
            <button
              onClick={handleAddCategory}
              disabled={isAdding || !newName.trim()}
              className="w-full bg-primary text-white py-2 rounded-lg text-sm font-semibold hover:bg-primary-dark transition-colors disabled:opacity-50"
            >
              {isAdding ? 'Đang thêm...' : 'Thêm danh mục'}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

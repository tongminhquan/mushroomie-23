'use client'
import { useEffect, useRef, useCallback, useState } from 'react'
import { ImageIcon, AlignLeft, AlignCenter, AlignRight, AlignJustify, Edit2, X, Upload } from 'lucide-react'
import MediaPicker from './MediaPicker'
import ImageEditorModal from './ImageEditorModal'
import { normalizeArticleImages } from '@/lib/sanitize'

interface RichTextEditorProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
}

const TOOLBAR_BUTTONS = [
  { group: 'format', items: [
    { cmd: 'formatBlock', val: 'p', icon: 'Đoạn', title: 'Đoạn văn' },
    { cmd: 'formatBlock', val: 'h1', icon: 'H1', title: 'Tiêu đề 1' },
    { cmd: 'formatBlock', val: 'h2', icon: 'H2', title: 'Tiêu đề 2' },
    { cmd: 'formatBlock', val: 'h3', icon: 'H3', title: 'Tiêu đề 3' },
    { cmd: 'formatBlock', val: 'h4', icon: 'H4', title: 'Tiêu đề 4' },
    { cmd: 'formatBlock', val: 'h5', icon: 'H5', title: 'Tiêu đề 5' },
    { cmd: 'formatBlock', val: 'h6', icon: 'H6', title: 'Tiêu đề 6' },
  ]},
  { group: 'inline', items: [
    { cmd: 'bold', icon: '<b>B</b>', title: 'In đậm (Ctrl+B)' },
    { cmd: 'italic', icon: '<i>I</i>', title: 'In nghiêng (Ctrl+I)' },
    { cmd: 'underline', icon: '<u>U</u>', title: 'Gạch chân (Ctrl+U)' },
    { cmd: 'strikeThrough', icon: '<s>S</s>', title: 'Gạch ngang' },
  ]},
  { group: 'align', items: [
    { cmd: 'justifyLeft', icon: '⬛◻◻', title: 'Căn trái' },
    { cmd: 'justifyCenter', icon: '◻⬛◻', title: 'Căn giữa' },
    { cmd: 'justifyRight', icon: '◻◻⬛', title: 'Căn phải' },
    { cmd: 'justifyFull', icon: '⬛⬛⬛', title: 'Căn đều' },
  ]},
  { group: 'list', items: [
    { cmd: 'insertUnorderedList', icon: '• ≡', title: 'Danh sách dấu chấm' },
    { cmd: 'insertOrderedList', icon: '1. ≡', title: 'Danh sách số thứ tự' },
    { cmd: 'outdent', icon: '←⬛', title: 'Giảm thụt đầu dòng' },
    { cmd: 'indent', icon: '⬛→', title: 'Tăng thụt đầu dòng' },
  ]},
  { group: 'insert', items: [
    { cmd: 'createLink', icon: '🔗', title: 'Chèn liên kết' },
    { cmd: 'insertHorizontalRule', icon: '─', title: 'Kẻ ngang' },
    { cmd: 'formatBlock', val: 'blockquote', icon: '❝', title: 'Trích dẫn' },
    { cmd: 'formatBlock', val: 'pre', icon: '{ }', title: 'Code block' },
  ]},
  { group: 'history', items: [
    { cmd: 'undo', icon: '↩', title: 'Hoàn tác (Ctrl+Z)' },
    { cmd: 'redo', icon: '↪', title: 'Làm lại (Ctrl+Y)' },
    { cmd: 'removeFormat', icon: '✕⁰', title: 'Xóa định dạng' },
  ]},
]

export default function RichTextEditor({ value, onChange, placeholder }: RichTextEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null)
  const isComposing = useRef(false)
  const lastValue = useRef<string | null>(null)
  const [showMediaPicker, setShowMediaPicker] = useState(false)
  const [selectedImage, setSelectedImage] = useState<HTMLImageElement | null>(null)
  const [imgOffset, setImgOffset] = useState({ top: 0, left: 0 })
  const [showImageDetails, setShowImageDetails] = useState(false)
  const [showImageEditor, setShowImageEditor] = useState(false)
  const [isReplacingImage, setIsReplacingImage] = useState(false)
  const [wordCount, setWordCount] = useState(0)
  const [isDragging, setIsDragging] = useState(false)
  const [uploadingCount, setUploadingCount] = useState(0)
  const dragCounter = useRef(0)
  // Chế độ soạn thảo kiểu WordPress: Visual (trực quan) | HTML (mã nguồn)
  const [htmlMode, setHtmlMode] = useState(false)

  useEffect(() => {
    if (!editorRef.current || htmlMode) return
    const normalizedValue = normalizeArticleImages(value || '', 'storage')
    if (editorRef.current.innerHTML !== normalizedValue && lastValue.current !== normalizedValue) {
      editorRef.current.innerHTML = normalizedValue
      lastValue.current = normalizedValue
      setWordCount(editorRef.current.innerText?.trim().split(/\s+/).filter(Boolean).length ?? 0)
    }
  }, [value, htmlMode])

  const switchMode = useCallback((toHtml: boolean) => {
    if (!toHtml) {
      // Quay về Visual: ép đồng bộ lại innerHTML từ value ở effect trên
      lastValue.current = null
    }
    setHtmlMode(toHtml)
  }, [])

  const execCmd = useCallback((cmd: string, val?: string) => {
    if (!editorRef.current) return
    editorRef.current.focus()

    if (cmd === 'createLink') {
      const url = prompt('Nhập URL liên kết:', 'https://')
      if (url) document.execCommand('createLink', false, url)
    } else if (val) {
      document.execCommand(cmd, false, val)
    } else {
      document.execCommand(cmd, false)
    }

    const html = editorRef.current.innerHTML
    lastValue.current = html
    onChange(html)
  }, [onChange])

  const handleInput = useCallback(() => {
    if (isComposing.current || !editorRef.current) return
    const html = editorRef.current.innerHTML
    if (html !== lastValue.current) {
      lastValue.current = html
      setWordCount(editorRef.current.innerText?.trim().split(/\s+/).filter(Boolean).length ?? 0)
      onChange(html)
    }
  }, [onChange])

  const handleForeColor = (e: React.ChangeEvent<HTMLInputElement>) => {
    editorRef.current?.focus()
    document.execCommand('foreColor', false, e.target.value)
    onChange(editorRef.current?.innerHTML || '')
  }

  const handleBackColor = (e: React.ChangeEvent<HTMLInputElement>) => {
    editorRef.current?.focus()
    document.execCommand('hiliteColor', false, e.target.value)
    onChange(editorRef.current?.innerHTML || '')
  }

  // Upload a File and insert/replace blob URL with server URL
  const uploadImageFile = useCallback(async (file: File, savedRange?: Range) => {
    if (!editorRef.current) return
    if (!file.type.startsWith('image/')) return

    // Show the image immediately via blob URL so there's no waiting
    const blobUrl = URL.createObjectURL(file)
    const placeholderId = `img-upload-${Date.now()}-${Math.random().toString(36).slice(2)}`

    editorRef.current.focus()
    if (savedRange) {
      const sel = window.getSelection()
      sel?.removeAllRanges()
      sel?.addRange(savedRange)
    }
    document.execCommand(
      'insertHTML', false,
      `<img id="${placeholderId}" src="${blobUrl}" alt="" data-uploading="true" />`
    )
    // Sync immediately so the placeholder is visible
    const htmlWithBlob = editorRef.current.innerHTML
    lastValue.current = htmlWithBlob
    onChange(htmlWithBlob)

    setUploadingCount(c => c + 1)
    try {
      const form = new FormData()
      form.append('file', file)
      form.append('purpose', 'post')
      const res = await fetch('/api/upload', { method: 'POST', body: form })
      if (!res.ok) throw new Error('Upload thất bại')
      const data = await res.json()

      // Swap blob URL → server URL
      const el = editorRef.current?.querySelector(`#${placeholderId}`) as HTMLImageElement | null
      if (el) {
        el.src = data.url
        el.removeAttribute('data-uploading')
        el.removeAttribute('id')
      }
    } catch {
      // Remove broken placeholder
      const el = editorRef.current?.querySelector(`#${placeholderId}`)
      el?.remove()
    } finally {
      URL.revokeObjectURL(blobUrl)
      setUploadingCount(c => c - 1)
      const final = editorRef.current?.innerHTML || ''
      lastValue.current = final
      onChange(final)
    }
  }, [onChange])

  // Upload multiple files, preserving insertion order
  const uploadFiles = useCallback((files: File[], savedRange?: Range) => {
    const images = files.filter(f => f.type.startsWith('image/'))
    images.reduce(
      (chain, file) => chain.then(() => uploadImageFile(file, savedRange)),
      Promise.resolve()
    )
  }, [uploadImageFile])

  useEffect(() => {
    const editor = editorRef.current
    if (!editor) return

    const handleGlobalClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement
      if (
        target.closest('.img-floating-toolbar') ||
        target.closest('.img-details-modal') ||
        target.closest('.image-editor-modal') ||
        target.closest('.media-picker-modal')
      ) return

      if (target.tagName === 'IMG' && editor.contains(target)) {
        setSelectedImage(target as HTMLImageElement)
        setImgOffset({
          top: target.offsetTop,
          left: target.offsetLeft + target.offsetWidth / 2
        })
      } else {
        setSelectedImage(null)
      }
    }

    const handleKeydown = (e: KeyboardEvent) => {
      if (selectedImage) {
        if (e.key === 'Backspace' || e.key === 'Delete') {
          const parent = selectedImage.parentElement
          if (parent && parent.tagName === 'FIGURE') {
            parent.remove()
          } else {
            selectedImage.remove()
          }
          setSelectedImage(null)
          onChange(editor.innerHTML)
        } else {
          setSelectedImage(null)
        }
      }
    }

    document.addEventListener('mousedown', handleGlobalClick)
    editor.addEventListener('keydown', handleKeydown)

    return () => {
      document.removeEventListener('mousedown', handleGlobalClick)
      editor.removeEventListener('keydown', handleKeydown)
    }
  }, [selectedImage, onChange])

  const handleAlign = (align: 'left' | 'center' | 'right' | 'none') => {
    if (!selectedImage) return
    const target = (selectedImage.parentElement?.tagName === 'FIGURE') ? selectedImage.parentElement : selectedImage

    target.style.display = ''
    target.style.margin = ''
    target.style.float = ''

    if (align === 'center') {
      target.style.display = 'block'
      target.style.margin = '1em auto'
    } else if (align === 'left') {
      target.style.display = 'inline'
      target.style.float = 'left'
      target.style.margin = '0 1em 1em 0'
    } else if (align === 'right') {
      target.style.display = 'inline'
      target.style.float = 'right'
      target.style.margin = '0 0 1em 1em'
    }

    onChange(editorRef.current?.innerHTML || '')
    setImgOffset({
      top: target.offsetTop,
      left: target.offsetLeft + target.offsetWidth / 2
    })
  }

  // Drag-and-drop handlers
  const handleDragEnter = useCallback((e: React.DragEvent) => {
    if (!e.dataTransfer.types.includes('Files')) return
    e.preventDefault()
    dragCounter.current++
    setIsDragging(true)
  }, [])

  const handleDragOver = useCallback((e: React.DragEvent) => {
    if (!e.dataTransfer.types.includes('Files')) return
    e.preventDefault()
    e.dataTransfer.dropEffect = 'copy'
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    dragCounter.current--
    if (dragCounter.current === 0) setIsDragging(false)
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    dragCounter.current = 0
    setIsDragging(false)

    const files = Array.from(e.dataTransfer.files)
    if (!files.length) return

    // Capture caret position at drop coordinates
    let savedRange: Range | undefined
    const x = e.clientX
    const y = e.clientY
    if (document.caretRangeFromPoint) {
      savedRange = document.caretRangeFromPoint(x, y) ?? undefined
    } else {
      // Firefox
      const pos = (document as unknown as { caretPositionFromPoint?: (x: number, y: number) => { offsetNode: Node; offset: number } | null }).caretPositionFromPoint?.(x, y)
      if (pos) {
        savedRange = document.createRange()
        savedRange.setStart(pos.offsetNode, pos.offset)
        savedRange.collapse(true)
      }
    }

    uploadFiles(files, savedRange)
  }, [uploadFiles])

  return (
    <div className="rich-editor border border-neutral-200 rounded-xl overflow-hidden bg-white relative">
      <style>{`
        .rich-editor .editor-toolbar {
          display: flex; flex-wrap: wrap; gap: 2px; padding: 6px 8px;
          border-bottom: 1px solid #e5e7eb; background: #f9fafb;
        }
        .rich-editor .editor-toolbar .sep { width: 1px; background: #d1d5db; margin: 2px 3px; align-self: stretch; }
        .rich-editor .toolbar-btn {
          padding: 3px 7px; border-radius: 5px; font-size: 13px; cursor: pointer;
          border: 1px solid transparent; background: transparent; min-width: 28px;
          display: flex; align-items: center; justify-content: center; line-height: 1.4;
          color: #374151; transition: all 0.1s;
        }
        .rich-editor .toolbar-btn:hover { background: #e5e7eb; border-color: #d1d5db; }
        .rich-editor .toolbar-btn:active { background: #dbeafe; border-color: #3b82f6; }
        .rich-editor .toolbar-select {
          padding: 3px 6px; border-radius: 5px; font-size: 13px; cursor: pointer;
          border: 1px solid #d1d5db; background: white; color: #374151; height: 28px;
        }
        .rich-editor .color-btn { width: 28px; height: 28px; border-radius: 5px; border: 1px solid #d1d5db; cursor: pointer; padding: 0; overflow: hidden; }
        .rich-editor .color-btn input { width: 100%; height: 100%; border: none; cursor: pointer; opacity: 0; position: absolute; }
        .rich-editor .color-btn { position: relative; display: flex; align-items: center; justify-content: center; font-size: 11px; font-weight: bold; }
        .rich-editor .ql-editor-area {
          min-height: 450px; padding: 20px 24px; outline: none; font-size: 15px;
          line-height: 1.8; color: #111827;
        }
        .rich-editor .ql-editor-area:empty:before {
          content: attr(data-placeholder); color: #9ca3af; pointer-events: none;
        }
        .rich-editor .ql-editor-area h1 { font-size: 2em; font-weight: 700; margin: 0.67em 0; }
        .rich-editor .ql-editor-area h2 { font-size: 1.5em; font-weight: 700; margin: 0.75em 0; }
        .rich-editor .ql-editor-area h3 { font-size: 1.25em; font-weight: 600; margin: 0.83em 0; }
        .rich-editor .ql-editor-area h4 { font-size: 1.1em; font-weight: 600; margin: 1em 0; }
        .rich-editor .ql-editor-area h5, .rich-editor .ql-editor-area h6 { font-size: 1em; font-weight: 600; margin: 1em 0; }
        .rich-editor .ql-editor-area p { margin: 0.5em 0; }
        .rich-editor .ql-editor-area ul { list-style: disc; padding-left: 1.5em; margin: 0.5em 0; }
        .rich-editor .ql-editor-area ol { list-style: decimal; padding-left: 1.5em; margin: 0.5em 0; }
        .rich-editor .ql-editor-area blockquote {
          border-left: 4px solid #e5305b; margin: 1em 0; padding: 0.5em 1em;
          background: #fef2f2; color: #6b7280; font-style: italic; border-radius: 0 8px 8px 0;
        }
        .rich-editor .ql-editor-area pre {
          background: #1f2937; color: #f9fafb; padding: 1em; border-radius: 8px;
          font-family: monospace; font-size: 13px; overflow-x: auto; margin: 0.5em 0;
        }
        .rich-editor .ql-editor-area figure.image {
          display: block; margin: 1em 0; text-align: center;
        }
        .rich-editor .ql-editor-area img { max-width: 100%; border-radius: 8px; margin: 0.5em 0; }
        .rich-editor .ql-editor-area img[data-uploading] {
          opacity: 0.6; outline: 2px dashed #e5305b; outline-offset: 2px;
          animation: pulse-upload 1s ease-in-out infinite;
        }
        @keyframes pulse-upload { 0%,100% { opacity: 0.6; } 50% { opacity: 0.9; } }
        .rich-editor .ql-editor-area figcaption {
          font-size: 13px; color: #6b7280; margin-top: 0.5em; font-style: italic; text-align: center;
        }
        .rich-editor .ql-editor-area a { color: #2563eb; text-decoration: underline; }
        .rich-editor .ql-editor-area hr { border: none; border-top: 2px solid #e5e7eb; margin: 1em 0; }
        .rich-editor .status-bar {
          padding: 4px 12px; font-size: 11px; color: #9ca3af; background: #f9fafb;
          border-top: 1px solid #e5e7eb; display: flex; justify-content: space-between; align-items: center;
        }
        .rich-editor .drag-overlay {
          position: absolute; inset: 0; z-index: 20;
          background: rgba(229,48,91,0.08); border: 2px dashed #e5305b;
          border-radius: 11px; pointer-events: none;
          display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 8px;
        }
        .rich-editor .drag-overlay svg { color: #e5305b; }
        .rich-editor .drag-overlay span { font-size: 15px; font-weight: 600; color: #e5305b; }
        .rich-editor .drag-overlay small { font-size: 12px; color: #9ca3af; }
      `}</style>

      {/* Drag-over overlay */}
      {isDragging && (
        <div className="drag-overlay" aria-hidden>
          <Upload size={36} />
          <span>Thả ảnh vào đây</span>
          <small>Hỗ trợ JPG, PNG, WebP, AVIF — không giới hạn số lượng</small>
        </div>
      )}

      {/* Media Button */}
      <div className="p-2 border-b border-neutral-200 bg-neutral-50 flex items-center">
        <button onClick={() => setShowMediaPicker(true)} className="flex items-center gap-2 px-3 py-1.5 border border-primary text-primary rounded-lg text-sm font-semibold hover:bg-primary/5 transition-colors">
          <ImageIcon size={16} /> Thêm tệp Media
        </button>
      </div>

      {/* Toolbar */}
      <div className="editor-toolbar">
        <select
          className="toolbar-select"
          onChange={e => execCmd('formatBlock', e.target.value)}
          defaultValue="p"
          title="Định dạng"
        >
          <option value="p">Đoạn văn</option>
          <option value="h1">Tiêu đề 1</option>
          <option value="h2">Tiêu đề 2</option>
          <option value="h3">Tiêu đề 3</option>
          <option value="h4">Tiêu đề 4</option>
          <option value="h5">Tiêu đề 5</option>
          <option value="h6">Tiêu đề 6</option>
          <option value="blockquote">Trích dẫn</option>
          <option value="pre">Code</option>
        </select>

        <div className="sep" />

        <button className="toolbar-btn" onMouseDown={e => { e.preventDefault(); execCmd('bold') }} title="In đậm (Ctrl+B)">
          <strong>B</strong>
        </button>
        <button className="toolbar-btn" onMouseDown={e => { e.preventDefault(); execCmd('italic') }} title="In nghiêng (Ctrl+I)">
          <em>I</em>
        </button>
        <button className="toolbar-btn" onMouseDown={e => { e.preventDefault(); execCmd('underline') }} title="Gạch chân (Ctrl+U)">
          <u>U</u>
        </button>
        <button className="toolbar-btn" onMouseDown={e => { e.preventDefault(); execCmd('strikeThrough') }} title="Gạch ngang">
          <s>S</s>
        </button>

        <label className="color-btn" title="Màu chữ" style={{ background: '#374151' }}>
          <span style={{ color: 'white', pointerEvents: 'none' }}>A</span>
          <input type="color" style={{ position: 'absolute', width: '100%', height: '100%', opacity: 0, cursor: 'pointer' }} onChange={handleForeColor} />
        </label>

        <label className="color-btn" title="Màu nền chữ" style={{ background: '#fbbf24' }}>
          <span style={{ pointerEvents: 'none', fontSize: 10 }}>A▲</span>
          <input type="color" style={{ position: 'absolute', width: '100%', height: '100%', opacity: 0, cursor: 'pointer' }} onChange={handleBackColor} />
        </label>

        <div className="sep" />

        <button className="toolbar-btn" onMouseDown={e => { e.preventDefault(); execCmd('justifyLeft') }} title="Căn trái">⬛◻◻</button>
        <button className="toolbar-btn" onMouseDown={e => { e.preventDefault(); execCmd('justifyCenter') }} title="Căn giữa">◻⬛◻</button>
        <button className="toolbar-btn" onMouseDown={e => { e.preventDefault(); execCmd('justifyRight') }} title="Căn phải">◻◻⬛</button>
        <button className="toolbar-btn" onMouseDown={e => { e.preventDefault(); execCmd('justifyFull') }} title="Căn đều">⬛⬛⬛</button>

        <div className="sep" />

        <button className="toolbar-btn" onMouseDown={e => { e.preventDefault(); execCmd('insertUnorderedList') }} title="Danh sách dấu chấm">• ≡</button>
        <button className="toolbar-btn" onMouseDown={e => { e.preventDefault(); execCmd('insertOrderedList') }} title="Danh sách số">1.≡</button>
        <button className="toolbar-btn" onMouseDown={e => { e.preventDefault(); execCmd('outdent') }} title="Giảm thụt">⇤</button>
        <button className="toolbar-btn" onMouseDown={e => { e.preventDefault(); execCmd('indent') }} title="Tăng thụt">⇥</button>

        <div className="sep" />

        <button className="toolbar-btn" onMouseDown={e => { e.preventDefault(); execCmd('createLink') }} title="Chèn liên kết">🔗</button>
        <button className="toolbar-btn" onMouseDown={e => { e.preventDefault(); execCmd('insertHorizontalRule') }} title="Kẻ ngang">—</button>

        <div className="sep" />

        <button className="toolbar-btn" onMouseDown={e => { e.preventDefault(); execCmd('undo') }} title="Hoàn tác (Ctrl+Z)">↩</button>
        <button className="toolbar-btn" onMouseDown={e => { e.preventDefault(); execCmd('redo') }} title="Làm lại (Ctrl+Y)">↪</button>
        <button className="toolbar-btn" onMouseDown={e => { e.preventDefault(); execCmd('removeFormat') }} title="Xóa định dạng">✕A</button>
      </div>

      {/* Editor area */}
      <div
        ref={editorRef}
        className="ql-editor-area"
        contentEditable
        suppressContentEditableWarning
        data-placeholder={placeholder || 'Bắt đầu viết nội dung bài viết của bạn...'}
        onInput={handleInput}
        onCompositionStart={() => { isComposing.current = true }}
        onCompositionEnd={() => {
          isComposing.current = false
          handleInput()
        }}
        onDragEnter={handleDragEnter}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onPaste={e => {
          // Handle image files pasted from clipboard (e.g. screenshot)
          const imageFiles = Array.from(e.clipboardData.files).filter(f => f.type.startsWith('image/'))
          if (imageFiles.length > 0) {
            e.preventDefault()
            uploadFiles(imageFiles)
            return
          }
          // Fallback: HTML / plain text
          e.preventDefault()
          const text = e.clipboardData.getData('text/html') || e.clipboardData.getData('text/plain')
          document.execCommand('insertHTML', false, text)
          setTimeout(() => { onChange(editorRef.current?.innerHTML || '') }, 0)
        }}
      />

      {/* Floating Image Toolbar */}
      {selectedImage && !showImageDetails && (
        <div
          className="img-floating-toolbar absolute z-10 flex items-center bg-white border border-neutral-200 shadow-lg rounded-lg overflow-hidden transition-all"
          style={{ top: Math.max(0, imgOffset.top - 45), left: imgOffset.left, transform: 'translateX(-50%)' }}
        >
          <button className="p-2 hover:bg-neutral-100 text-neutral-600" onClick={() => handleAlign('left')} title="Căn trái"><AlignLeft size={16} /></button>
          <button className="p-2 hover:bg-neutral-100 text-neutral-600" onClick={() => handleAlign('center')} title="Căn giữa"><AlignCenter size={16} /></button>
          <button className="p-2 hover:bg-neutral-100 text-neutral-600" onClick={() => handleAlign('right')} title="Căn phải"><AlignRight size={16} /></button>
          <button className="p-2 hover:bg-neutral-100 text-neutral-600" onClick={() => handleAlign('none')} title="Không căn lề"><AlignJustify size={16} /></button>
          <div className="w-px h-6 bg-neutral-200 mx-1" />
          <button className="p-2 hover:bg-neutral-100 text-neutral-600" onClick={() => setShowImageDetails(true)} title="Chỉnh sửa chi tiết"><Edit2 size={16} /></button>
          <button className="p-2 hover:bg-red-50 text-red-500" onClick={() => {
            const p = selectedImage.parentElement
            if (p && p.tagName === 'FIGURE') p.remove()
            else selectedImage.remove()
            setSelectedImage(null)
            onChange(editorRef.current?.innerHTML || '')
          }} title="Xóa"><X size={16} /></button>
        </div>
      )}

      {/* Status bar */}
      <div className="status-bar">
        <span>
          {uploadingCount > 0
            ? `⏳ Đang tải lên ${uploadingCount} ảnh…`
            : 'Kéo ảnh vào đây hoặc dán (Ctrl+V) để chèn trực tiếp'}
        </span>
        <span>{wordCount} từ</span>
      </div>

      {showMediaPicker && (
        <MediaPicker
          value=""
          title="Chèn Media vào bài viết"
          submitText={isReplacingImage ? "Thay thế ảnh" : "Chèn vào bài viết"}
          purpose="post"
          onChange={(url, meta) => {
            setShowMediaPicker(false)
            if (!url) {
              setIsReplacingImage(false)
              return
            }

            if (isReplacingImage && selectedImage) {
              selectedImage.src = url
              if (meta?.alt_text || meta?.seo_title) {
                selectedImage.alt = (meta?.alt_text || meta?.seo_title) as string
              }
              onChange(editorRef.current?.innerHTML || '')
              setIsReplacingImage(false)
              return
            }

            editorRef.current?.focus()

            const alt = meta?.alt_text || meta?.seo_title || ''
            let html = `<img src="${url}" alt="${alt}" />`
            if (meta?.caption) {
              html = `<figure class="image"><img src="${url}" alt="${alt}" /><figcaption>${meta.caption}</figcaption></figure>`
            }
            document.execCommand('insertHTML', false, html)
            onChange(editorRef.current?.innerHTML || '')
          }}
          onClose={() => {
            setShowMediaPicker(false)
            setIsReplacingImage(false)
          }}
        />
      )}

      {showImageDetails && selectedImage && (
        <div className="img-details-modal fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl flex flex-col overflow-hidden">
            <div className="p-4 border-b border-neutral-200 flex justify-between items-center">
              <h3 className="font-bold text-lg text-neutral-800">Chi tiết hình ảnh</h3>
              <button onClick={() => setShowImageDetails(false)} className="p-1 text-neutral-400 hover:bg-neutral-100 rounded-lg"><X size={20}/></button>
            </div>
            <div className="p-6 flex flex-col md:flex-row gap-6">
              <div className="flex-1 space-y-4">
                <div>
                  <label className="block text-sm font-semibold mb-1 text-neutral-700">Văn bản thay thế (Alt text)</label>
                  <input id="img-details-alt" defaultValue={selectedImage.alt} className="w-full px-3 py-2 text-sm border border-neutral-200 rounded-lg focus:border-primary outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-1 text-neutral-700">Chú thích (Caption)</label>
                  <textarea id="img-details-caption" defaultValue={selectedImage.parentElement?.tagName === 'FIGURE' ? (selectedImage.parentElement.querySelector('figcaption')?.textContent || '') : ''} className="w-full px-3 py-2 text-sm border border-neutral-200 rounded-lg focus:border-primary outline-none resize-none" rows={2} />
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-1 text-neutral-700">Kích thước (pixel)</label>
                  <div className="flex gap-2">
                    <input id="img-details-width" placeholder="Rộng" defaultValue={selectedImage.getAttribute('width') || ''} className="w-full px-3 py-2 text-sm border border-neutral-200 rounded-lg focus:border-primary outline-none" />
                    <input id="img-details-height" placeholder="Cao" defaultValue={selectedImage.getAttribute('height') || ''} className="w-full px-3 py-2 text-sm border border-neutral-200 rounded-lg focus:border-primary outline-none" />
                  </div>
                </div>
              </div>
              <div className="w-full md:w-64 flex flex-col items-center justify-center border border-neutral-200 rounded-xl p-4 bg-white shadow-sm">
                <img src={selectedImage.src} className="max-w-full max-h-48 object-contain rounded" alt="" />
                <div className="mt-4 flex gap-2 w-full justify-center">
                  <button onClick={() => setShowImageEditor(true)} className="px-3 py-1.5 border border-primary text-primary rounded text-xs font-semibold hover:bg-primary/5 bg-white transition-colors">
                    Sửa bản gốc
                  </button>
                  <button onClick={() => { setIsReplacingImage(true); setShowMediaPicker(true) }} className="px-3 py-1.5 border border-primary text-primary rounded text-xs font-semibold hover:bg-primary/5 bg-white transition-colors">
                    Thay thế
                  </button>
                </div>
              </div>
            </div>
            <div className="p-4 border-t border-neutral-200 bg-neutral-50 flex justify-end gap-2">
              <button onClick={() => setShowImageDetails(false)} className="px-4 py-2 bg-white border border-neutral-200 text-neutral-600 rounded-xl text-sm font-semibold hover:bg-neutral-100">Hủy</button>
              <button onClick={() => {
                const alt = (document.getElementById('img-details-alt') as HTMLInputElement).value
                const caption = (document.getElementById('img-details-caption') as HTMLTextAreaElement).value
                const width = (document.getElementById('img-details-width') as HTMLInputElement).value
                const height = (document.getElementById('img-details-height') as HTMLInputElement).value

                selectedImage.alt = alt
                if (width) selectedImage.setAttribute('width', width); else selectedImage.removeAttribute('width')
                if (height) selectedImage.setAttribute('height', height); else selectedImage.removeAttribute('height')

                const parent = selectedImage.parentElement
                if (caption.trim()) {
                  if (parent && parent.tagName === 'FIGURE') {
                    let fc = parent.querySelector('figcaption')
                    if (!fc) {
                      fc = document.createElement('figcaption')
                      parent.appendChild(fc)
                    }
                    fc.textContent = caption
                  } else {
                    const figure = document.createElement('figure')
                    figure.className = 'image'
                    if (selectedImage.style.float) {
                      figure.style.float = selectedImage.style.float
                      figure.style.margin = selectedImage.style.margin
                      figure.style.display = 'inline'
                      selectedImage.style.float = ''
                      selectedImage.style.margin = ''
                      selectedImage.style.display = ''
                    } else if (selectedImage.style.display === 'block') {
                      figure.style.display = 'block'
                      figure.style.margin = '1em auto'
                      selectedImage.style.display = ''
                      selectedImage.style.margin = ''
                    }
                    selectedImage.parentNode?.insertBefore(figure, selectedImage)
                    figure.appendChild(selectedImage)
                    const fc = document.createElement('figcaption')
                    fc.textContent = caption
                    figure.appendChild(fc)
                  }
                } else {
                  if (parent && parent.tagName === 'FIGURE') {
                    if (parent.style.float) {
                      selectedImage.style.float = parent.style.float
                      selectedImage.style.margin = parent.style.margin
                      selectedImage.style.display = 'inline'
                    } else if (parent.style.display === 'block') {
                      selectedImage.style.display = 'block'
                      selectedImage.style.margin = '1em auto'
                    }
                    parent.parentNode?.insertBefore(selectedImage, parent)
                    parent.remove()
                  }
                }

                onChange(editorRef.current?.innerHTML || '')
                setShowImageDetails(false)
                setSelectedImage(null)
              }} className="px-4 py-2 bg-primary text-white rounded-xl text-sm font-semibold hover:bg-primary-dark transition-colors">Cập nhật</button>
            </div>
          </div>
        </div>
      )}

      {showImageEditor && selectedImage && (
        <ImageEditorModal
          src={selectedImage.src}
          onSave={(newUrl) => {
            selectedImage.src = newUrl
            onChange(editorRef.current?.innerHTML || '')
            setShowImageEditor(false)
          }}
          onCancel={() => setShowImageEditor(false)}
        />
      )}
    </div>
  )
}

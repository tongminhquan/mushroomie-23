'use client'
import { useEffect, useRef, useCallback } from 'react'

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
    { cmd: 'insertImage', icon: '🖼', title: 'Chèn hình ảnh' },
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
  const lastValue = useRef(value)

  // Init editor
  useEffect(() => {
    if (!editorRef.current) return
    if (!editorRef.current.innerHTML && value) {
      editorRef.current.innerHTML = value
    }
  }, [])

  const execCmd = useCallback((cmd: string, val?: string) => {
    if (!editorRef.current) return
    editorRef.current.focus()

    if (cmd === 'createLink') {
      const url = prompt('Nhập URL liên kết:', 'https://')
      if (url) document.execCommand('createLink', false, url)
    } else if (cmd === 'insertImage') {
      const url = prompt('Nhập URL hình ảnh:', 'https://')
      if (url) document.execCommand('insertImage', false, url)
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
      onChange(html)
    }
  }, [onChange])

  // Forecolor/backcolor pickers
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

  return (
    <div className="rich-editor border border-neutral-200 rounded-xl overflow-hidden bg-white">
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
        .rich-editor .ql-editor-area img { max-width: 100%; border-radius: 8px; margin: 0.5em 0; }
        .rich-editor .ql-editor-area a { color: #2563eb; text-decoration: underline; }
        .rich-editor .ql-editor-area hr { border: none; border-top: 2px solid #e5e7eb; margin: 1em 0; }
        .rich-editor .status-bar {
          padding: 4px 12px; font-size: 11px; color: #9ca3af; background: #f9fafb;
          border-top: 1px solid #e5e7eb; display: flex; justify-content: space-between;
        }
      `}</style>

      {/* Toolbar */}
      <div className="editor-toolbar">
        {/* Block format select */}
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

        {/* Inline formatting */}
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

        {/* Forecolor */}
        <label className="color-btn" title="Màu chữ" style={{ background: '#374151' }}>
          <span style={{ color: 'white', pointerEvents: 'none' }}>A</span>
          <input type="color" style={{ position: 'absolute', width: '100%', height: '100%', opacity: 0, cursor: 'pointer' }} onChange={handleForeColor} />
        </label>

        {/* Backcolor */}
        <label className="color-btn" title="Màu nền chữ" style={{ background: '#fbbf24' }}>
          <span style={{ pointerEvents: 'none', fontSize: 10 }}>A▲</span>
          <input type="color" style={{ position: 'absolute', width: '100%', height: '100%', opacity: 0, cursor: 'pointer' }} onChange={handleBackColor} />
        </label>

        <div className="sep" />

        {/* Align */}
        <button className="toolbar-btn" onMouseDown={e => { e.preventDefault(); execCmd('justifyLeft') }} title="Căn trái">⬛◻◻</button>
        <button className="toolbar-btn" onMouseDown={e => { e.preventDefault(); execCmd('justifyCenter') }} title="Căn giữa">◻⬛◻</button>
        <button className="toolbar-btn" onMouseDown={e => { e.preventDefault(); execCmd('justifyRight') }} title="Căn phải">◻◻⬛</button>
        <button className="toolbar-btn" onMouseDown={e => { e.preventDefault(); execCmd('justifyFull') }} title="Căn đều">⬛⬛⬛</button>

        <div className="sep" />

        {/* Lists */}
        <button className="toolbar-btn" onMouseDown={e => { e.preventDefault(); execCmd('insertUnorderedList') }} title="Danh sách dấu chấm">• ≡</button>
        <button className="toolbar-btn" onMouseDown={e => { e.preventDefault(); execCmd('insertOrderedList') }} title="Danh sách số">1.≡</button>
        <button className="toolbar-btn" onMouseDown={e => { e.preventDefault(); execCmd('outdent') }} title="Giảm thụt">⇤</button>
        <button className="toolbar-btn" onMouseDown={e => { e.preventDefault(); execCmd('indent') }} title="Tăng thụt">⇥</button>

        <div className="sep" />

        {/* Insert */}
        <button className="toolbar-btn" onMouseDown={e => { e.preventDefault(); execCmd('createLink') }} title="Chèn liên kết">🔗</button>
        <button className="toolbar-btn" onMouseDown={e => { e.preventDefault(); execCmd('insertImage') }} title="Chèn hình ảnh">🖼️</button>
        <button className="toolbar-btn" onMouseDown={e => { e.preventDefault(); execCmd('insertHorizontalRule') }} title="Kẻ ngang">—</button>

        <div className="sep" />

        {/* History */}
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
        onPaste={e => {
          e.preventDefault()
          const text = e.clipboardData.getData('text/html') || e.clipboardData.getData('text/plain')
          document.execCommand('insertHTML', false, text)
          setTimeout(() => {
            onChange(editorRef.current?.innerHTML || '')
          }, 0)
        }}
      />

      {/* Status bar */}
      <div className="status-bar">
        <span>Hỗ trợ định dạng HTML</span>
        <span>{editorRef.current?.innerText?.trim().split(/\s+/).filter(Boolean).length ?? 0} từ</span>
      </div>
    </div>
  )
}

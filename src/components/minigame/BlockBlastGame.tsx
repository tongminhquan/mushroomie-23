'use client'

import React, { useEffect, useRef, useState, useCallback } from 'react'

const ROWS = 8
const COLS = 8
const BOARD_PAD = 6   // px padding inside board element
const GAP = 2         // px gap between cells

const COLORS: Record<string, string> = {
  '#00e5ff': 'linear-gradient(135deg, #00e5ff 0%, #0099cc 100%)',
  '#b44dff': 'linear-gradient(135deg, #b44dff 0%, #7a00cc 100%)',
  '#ff4d6a': 'linear-gradient(135deg, #ff4d6a 0%, #cc0033 100%)',
  '#e41d1d': 'linear-gradient(135deg, #e41d1d 0%, #990000 100%)',
  '#ffe14d': 'linear-gradient(135deg, #ffe14d 0%, #cca300 100%)',
  '#39e75f': 'linear-gradient(135deg, #39e75f 0%, #009933 100%)',
  '#ff8c1a': 'linear-gradient(135deg, #ff8c1a 0%, #cc6600 100%)',
}
const COLOR_KEYS = Object.keys(COLORS)

const SHAPES = [
  [[1]],
  [[1,1]], [[1],[1]],
  [[1,1,1]], [[1],[1],[1]],
  [[1,1,1,1]], [[1],[1],[1],[1]],
  [[1,1,1,1,1]], [[1],[1],[1],[1],[1]],
  [[1,1],[1,1]],
  [[1,1,1],[1,1,1],[1,1,1]],
  [[1,1],[1,0]], [[1,1],[0,1]], [[1,0],[1,1]], [[0,1],[1,1]],
  [[1,0,0],[1,0,0],[1,1,1]], [[0,0,1],[0,0,1],[1,1,1]],
  [[1,1,1],[1,0,0],[1,0,0]], [[1,1,1],[0,0,1],[0,0,1]],
  [[1,1,1],[0,1,0]], [[0,1,0],[1,1,1]],
  [[1,0],[1,1],[1,0]], [[0,1],[1,1],[0,1]],
  [[0,1,0],[1,1,1],[0,1,0]],
  [[1,1,0],[0,1,1]], [[0,1,1],[1,1,0]],
  [[1,0],[1,1],[0,1]], [[0,1],[1,1],[1,0]],
]

type Piece = { id: string; matrix: number[][]; color: string }
type Cell = { r: number; c: number }

function mkPiece(): Piece {
  return {
    id: Math.random().toString(36).slice(2),
    matrix: SHAPES[Math.floor(Math.random() * SHAPES.length)],
    color: COLOR_KEYS[Math.floor(Math.random() * COLOR_KEYS.length)],
  }
}

function emptyBoard(): (string | null)[][] {
  return Array.from({ length: ROWS }, () => Array(COLS).fill(null))
}

// ─── Pure block cell element ────────────────────────────────────────────────
function Block({ color, style }: { color: string; style?: React.CSSProperties }) {
  return (
    <div style={{ width: '100%', height: '100%', borderRadius: 6, background: COLORS[color], boxShadow: 'inset 0 0 0 1px rgba(0,0,0,.2),0 2px 5px rgba(0,0,0,.4)', position: 'relative', overflow: 'hidden', ...style }}>
      <div style={{ position: 'absolute', inset: '12%', borderRadius: 3, background: 'rgba(255,255,255,.18)', boxShadow: 'inset 0 1px 3px rgba(255,255,255,.5)' }} />
    </div>
  )
}

export default function BlockBlastGame({ onGameOver }: { onGameOver: (score: number) => void }) {
  const [cs, setCs] = useState(48)             // cellSize
  const csRef = useRef(48)

  const [board, setBoard] = useState(emptyBoard)
  const boardRef = useRef<(string | null)[][]>(emptyBoard())

  const [hand, setHand] = useState<(Piece | null)[]>(() => [mkPiece(), mkPiece(), mkPiece()])
  const handRef = useRef<(Piece | null)[]>([])

  const [score, setScore] = useState(0); const scoreRef = useRef(0)
  const [lines, setLines] = useState(0); const linesRef = useRef(0)
  const [combo, setCombo] = useState(0); const comboRef = useRef(0)
  const [isOver, setIsOver] = useState(false); const isOverRef = useRef(false)
  const [isFS, setIsFS] = useState(false)

  // ─── Board highlight (React state – drives render) ─────────────────────────
  const [hl, setHl] = useState<{ piece: Piece; row: number; col: number; ok: boolean } | null>(null)
  const hlRef = useRef(hl)
  hlRef.current = hl

  const [clearing, setClearing] = useState<Cell[]>([])
  const [placed,   setPlaced]   = useState<Cell[]>([])

  // ─── Drag (lives in refs only – ZERO React re-renders during drag) ──────────
  const dragging = useRef<{ idx: number; piece: Piece; isTouch: boolean } | null>(null)
  const overlayRef  = useRef<HTMLDivElement>(null) // the floating piece while dragging
  const boardElRef  = useRef<HTMLDivElement>(null) // the 8×8 grid DOM element
  const containerRef = useRef<HTMLDivElement>(null)
  const rafRef = useRef(0)

  // Sync refs
  useEffect(() => { csRef.current = cs }, [cs])
  useEffect(() => { boardRef.current = board }, [board])
  useEffect(() => { handRef.current = hand }, [hand])
  useEffect(() => { isOverRef.current = isOver }, [isOver])

  // ─── Resize ────────────────────────────────────────────────────────────────
  useEffect(() => {
    const upd = () => {
      const w = window.innerWidth
      const size = w < 390 ? 34 : w < 500 ? 40 : w < 700 ? 46 : 52
      setCs(size); csRef.current = size
    }
    upd(); window.addEventListener('resize', upd)
    return () => window.removeEventListener('resize', upd)
  }, [])

  // ─── Fullscreen ────────────────────────────────────────────────────────────
  useEffect(() => {
    const h = () => setIsFS(!!document.fullscreenElement)
    document.addEventListener('fullscreenchange', h)
    return () => document.removeEventListener('fullscreenchange', h)
  }, [])

  // ─── Helpers ───────────────────────────────────────────────────────────────
  const canPlace = useCallback((b: (string|null)[][], m: number[][], r: number, c: number) => {
    for (let dr = 0; dr < m.length; dr++)
      for (let dc = 0; dc < m[dr].length; dc++)
        if (m[dr][dc] && (r+dr < 0 || r+dr >= ROWS || c+dc < 0 || c+dc >= COLS || b[r+dr][c+dc])) return false
    return true
  }, [])

  /**
   * Given the real cursor position (clientX, clientY), compute which board cell
   * the TOP-LEFT of the piece should land on so the piece is CENTERED on cursor.
   *
   * stride = cs + GAP
   * piece top-left offset from cursor = -pieceW/2, -pieceH/2
   * board cell start x = rect.left + BOARD_PAD + col * stride
   *
   * => col = (cursorX - rect.left - BOARD_PAD) / stride - pieceCols/2
   */
  const getLift = (isTouch: boolean) => isTouch ? 80 : 40

  const cursorToCell = useCallback((cx: number, cy: number, piece: Piece, isTouch: boolean) => {
    const el = boardElRef.current
    if (!el) return { row: -99, col: -99 }
    const rect = el.getBoundingClientRect()
    const stride = csRef.current + GAP
    
    // Virtual center of the piece
    const pieceCenterX = cx
    const pieceCenterY = cy - getLift(isTouch)

    const col = Math.round((pieceCenterX - rect.left - BOARD_PAD) / stride - piece.matrix[0].length / 2)
    const row = Math.round((pieceCenterY - rect.top  - BOARD_PAD) / stride - piece.matrix.length    / 2)
    return { row, col }
  }, [])

  /**
   * Position the floating overlay exactly centered on the cursor.
   * Uses transform: translate3d for GPU-accelerated compositing.
   * Called directly in event handlers – NO React state update.
   */
  const moveOverlay = useCallback((cx: number, cy: number) => {
    const el = overlayRef.current
    const drag = dragging.current
    if (!el || !drag) return
    const stride = csRef.current + GAP
    const pw = drag.piece.matrix[0].length * stride
    const ph = drag.piece.matrix.length    * stride
    const lift = getLift(drag.isTouch)
    const x = cx - pw / 2
    const y = cy - ph / 2 - lift
    el.style.transform = `translate3d(${x}px,${y}px,0) scale(1.15)`
    el.style.visibility = 'visible'
  }, [])

  // ─── Global pointer handlers (attached once) ────────────────────────────────
  const onMove = useCallback((cx: number, cy: number) => {
    moveOverlay(cx, cy)
    // Board highlight update throttled to rAF
    cancelAnimationFrame(rafRef.current)
    rafRef.current = requestAnimationFrame(() => {
      const drag = dragging.current
      if (!drag) return
      const { row, col } = cursorToCell(cx, cy, drag.piece, drag.isTouch)
      const ok = canPlace(boardRef.current, drag.piece.matrix, row, col)
      setHl(prev => {
        if (prev && prev.row === row && prev.col === col && prev.ok === ok) return prev
        return { piece: drag.piece, row, col, ok }
      })
    })
  }, [moveOverlay, cursorToCell, canPlace])

  // ─── Place piece logic ─────────────────────────────────────────────────────
  const checkGameOver = useCallback((b: (string|null)[][], h: (Piece|null)[], sc: number) => {
    const any = h.some(p => p && Array.from({ length: ROWS }, (_, r) =>
      Array.from({ length: COLS }, (_, c) => canPlace(b, p.matrix, r, c))
    ).flat().some(Boolean))
    if (!any && h.some(Boolean)) { setIsOver(true); onGameOver(sc) }
  }, [canPlace, onGameOver])

  const placePiece = useCallback((piece: Piece, idx: number, row: number, col: number) => {
    const nb = boardRef.current.map(r => [...r])
    let count = 0
    const pcs: Cell[] = []
    piece.matrix.forEach((r, dr) => r.forEach((v, dc) => {
      if (v) { nb[row+dr][col+dc] = piece.color; pcs.push({ r: row+dr, c: col+dc }); count++ }
    }))
    setBoard(nb); boardRef.current = nb
    setPlaced(pcs); setTimeout(() => setPlaced([]), 300)

    const rows = Array.from({ length: ROWS }, (_, r) => r).filter(r => nb[r].every(Boolean))
    const cols = Array.from({ length: COLS }, (_, c) => c).filter(c => nb.every(r => r[c]))
    const lc = rows.length + cols.length

    const finish = (fb: (string|null)[][], sc: number, co: number) => {
      const nh = [...handRef.current]; nh[idx] = null
      const allGone = nh.every(p => !p)
      const fh = allGone ? [mkPiece(), mkPiece(), mkPiece()] : nh
      setHand(fh); handRef.current = fh
      checkGameOver(fb, fh, sc)
    }

    if (lc > 0) {
      const toClear: Cell[] = []
      rows.forEach(r => { for (let c = 0; c < COLS; c++) toClear.push({ r, c }) })
      cols.forEach(c => { for (let r = 0; r < ROWS; r++) if (!toClear.some(x => x.r === r && x.c === c)) toClear.push({ r, c }) })
      setClearing(toClear)
      const newCombo = comboRef.current + lc
      const added = count + lc * 10 * newCombo
      const ns = scoreRef.current + added
      const nl = linesRef.current + lc
      setTimeout(() => {
        const cb = nb.map(r => [...r])
        toClear.forEach(({ r, c }) => { cb[r][c] = null })
        setBoard(cb); boardRef.current = cb
        setClearing([])
        setScore(ns); scoreRef.current = ns
        setLines(nl); linesRef.current = nl
        setCombo(newCombo); comboRef.current = newCombo
        finish(cb, ns, newCombo)
      }, 400)
    } else {
      const ns = scoreRef.current + count
      setScore(ns); scoreRef.current = ns
      setCombo(0); comboRef.current = 0
      finish(nb, ns, 0)
    }
  }, [checkGameOver])

  // ─── Pointer Down (on piece) ────────────────────────────────────────────────
  const startDrag = useCallback((e: React.PointerEvent<HTMLDivElement>, idx: number, piece: Piece) => {
    if (dragging.current || isOverRef.current || clearing.length > 0) return
    e.preventDefault()
    e.stopPropagation()

    const isTouch = e.pointerType === 'touch' || e.pointerType === 'pen'
    dragging.current = { idx, piece, isTouch }

    // ★ Pointer capture: all future pointermove/up events come here even if cursor leaves
    ;(e.currentTarget as HTMLElement).setPointerCapture(e.pointerId)

    if (isTouch) document.body.style.overflow = 'hidden'

    // Populate overlay content imperatively (avoid React render cycle for position)
    const el = overlayRef.current
    if (el) {
      el.style.visibility = 'hidden'
      el.style.transform = 'translate3d(0,0,0)'
      // Build cells imperatively
      el.innerHTML = ''
      const stride = csRef.current + GAP
      el.style.width  = `${piece.matrix[0].length * stride}px`
      el.style.height = `${piece.matrix.length    * stride}px`
      el.style.display = 'grid'
      el.style.gridTemplateColumns = `repeat(${piece.matrix[0].length},${csRef.current}px)`
      el.style.gap = `${GAP}px`
      piece.matrix.forEach(row => row.forEach(val => {
        const cell = document.createElement('div')
        cell.style.cssText = `width:${csRef.current}px;height:${csRef.current}px;`
        if (val) {
          cell.style.borderRadius = '6px'
          cell.style.background = COLORS[piece.color]
          cell.style.boxShadow = 'inset 0 0 0 1px rgba(0,0,0,.2),0 2px 5px rgba(0,0,0,.4)'
          cell.style.position = 'relative'
          cell.style.overflow = 'hidden'
          const inner = document.createElement('div')
          inner.style.cssText = 'position:absolute;inset:12%;border-radius:3px;background:rgba(255,255,255,.18);box-shadow:inset 0 1px 3px rgba(255,255,255,.5);'
          cell.appendChild(inner)
        }
        el.appendChild(cell)
      }))
      moveOverlay(e.clientX, e.clientY)
    }

    // React state for board highlight only
    const { row, col } = cursorToCell(e.clientX, e.clientY, piece, isTouch)
    const ok = canPlace(boardRef.current, piece.matrix, row, col)
    setHl({ piece, row, col, ok })
  }, [clearing.length, moveOverlay, cursorToCell, canPlace])

  // ─── Pointer Move (captured to same piece element) ─────────────────────────
  const continueDrag = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    if (!dragging.current) return
    e.preventDefault()
    onMove(e.clientX, e.clientY)
  }, [onMove])

  // ─── Pointer Up (captured to same piece element) ───────────────────────────
  const endDrag = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    const drag = dragging.current
    if (!drag) return
    dragging.current = null
    cancelAnimationFrame(rafRef.current)
    document.body.style.overflow = ''

    // Hide overlay
    const el = overlayRef.current
    if (el) { el.style.visibility = 'hidden'; el.innerHTML = '' }

    // Place piece if valid
    const { row, col } = cursorToCell(e.clientX, e.clientY, drag.piece, drag.isTouch)
    const ok = canPlace(boardRef.current, drag.piece.matrix, row, col)
    if (ok) placePiece(drag.piece, drag.idx, row, col)

    setHl(null)
  }, [cursorToCell, canPlace, placePiece])

  const restart = () => {
    const nb = emptyBoard(); setBoard(nb); boardRef.current = nb
    const nh = [mkPiece(), mkPiece(), mkPiece()]; setHand(nh); handRef.current = nh
    setScore(0); scoreRef.current = 0
    setLines(0); linesRef.current = 0
    setCombo(0); comboRef.current = 0
    setIsOver(false); isOverRef.current = false
    setHl(null)
  }

  const stride = cs + GAP  // pixel stride per cell

  return (
    <div
      ref={containerRef}
      style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        width: '100%', userSelect: 'none', touchAction: 'none',
        background: isFS ? '#0a0a1a' : 'transparent',
        padding: isFS ? 20 : 0,
        height: isFS ? '100vh' : 'auto',
      }}
    >
      {/* ─── Drag overlay: always in DOM, positioned with transform3d ─── */}
      <div
        ref={overlayRef}
        style={{
          position: 'fixed', top: 0, left: 0,
          visibility: 'hidden',
          pointerEvents: 'none',
          zIndex: 9999,
          willChange: 'transform',
        }}
      />

      <div style={{ display: 'flex', gap: 24, justifyContent: 'center', alignItems: 'stretch', width: '100%', maxWidth: 900, flexWrap: 'wrap' }}>

        {/* ─── Board column ─── */}
        <div style={{ position: 'relative', flexShrink: 0, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          {/* Fullscreen toggle */}
          <button
            onClick={() => document.fullscreenElement ? document.exitFullscreen() : containerRef.current?.requestFullscreen()}
            style={{ position: 'absolute', top: 4, right: 4, zIndex: 10, background: 'rgba(255,255,255,.1)', border: 'none', borderRadius: 8, padding: '4px 8px', cursor: 'pointer', color: '#fff', fontSize: 14 }}
          >{isFS ? '↙' : '↗'}</button>

          {/* ─── Grid ─── */}
          <div
            ref={boardElRef}
            style={{
              display: 'grid',
              gridTemplateColumns: `repeat(${COLS},${cs}px)`,
              gridTemplateRows: `repeat(${ROWS},${cs}px)`,
              gap: GAP,
              padding: BOARD_PAD,
              background: '#050510',
              borderRadius: 12,
              border: '2px solid rgba(255,255,255,.08)',
              boxShadow: 'inset 0 0 40px rgba(0,0,0,.8)',
            }}
          >
            {board.map((row, r) => row.map((color, c) => {
              // Is this cell part of the hover preview?
              const inHl = hl?.ok &&
                r >= hl.row && r < hl.row + hl.piece.matrix.length &&
                c >= hl.col && c < hl.col + hl.piece.matrix[0].length &&
                !!hl.piece.matrix[r - hl.row]?.[c - hl.col]
              const isClearing = clearing.some(x => x.r === r && x.c === c)
              const isPlaced   = placed.some(x => x.r === r && x.c === c)

              return (
                <div
                  key={`${r}-${c}`}
                  style={{
                    width: cs, height: cs,
                    background: 'rgba(255,255,255,.02)',
                    borderRadius: 6,
                    boxShadow: 'inset 0 0 0 1px rgba(255,255,255,.03)',
                    animation: isClearing ? 'bbPop 0.4s ease-out forwards' : isPlaced ? 'bbIn 0.3s cubic-bezier(.175,.885,.32,1.275)' : undefined,
                  }}
                >
                  {(color || inHl) && (
                    <Block
                      color={(color ?? hl!.piece.color) as string}
                      style={{ opacity: color ? 1 : 0.45 }}
                    />
                  )}
                </div>
              )
            }))}
          </div>

          {/* ─── Hand ─── */}
          <div style={{
            display: 'flex', justifyContent: 'center', gap: 12, marginTop: 24,
            width: '100%', minHeight: cs * 3,
          }}>
            {hand.map((piece, i) => (
              <div key={i} style={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                {piece && (
                  <div
                    onPointerDown={e => startDrag(e, i, piece)}
                    onPointerMove={continueDrag}
                    onPointerUp={endDrag}
                    onPointerCancel={endDrag}
                    style={{
                      display: 'grid',
                      gridTemplateColumns: `repeat(${piece.matrix[0].length},${Math.round(cs * 0.55)}px)`,
                      gap: 2,
                      touchAction: 'none',
                      cursor: hl?.piece === piece ? 'none' : 'grab',
                      opacity: hl?.piece === piece ? 0 : 1,
                      transition: 'transform .15s',
                    }}
                  >
                    {piece.matrix.map((row, r) => row.map((val, c) => (
                      <div key={`${r}-${c}`} style={{ width: Math.round(cs * 0.55), height: Math.round(cs * 0.55) }}>
                        {val ? <Block color={piece.color} /> : null}
                      </div>
                    )))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* ─── Sidebar ─── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, minWidth: 170, maxWidth: 210, flex: 1 }}>
          {[
            { label: 'ĐIỂM SỐ', val: score.toLocaleString(), color: '#00e5ff', big: true },
            { label: 'HÀNG', val: lines, color: '#39e75f', big: false },
            { label: 'COMBO', val: combo, color: '#ffe14d', big: false },
          ].map(({ label, val, color, big }) => (
            <div key={label} style={{ background: 'rgba(255,255,255,.04)', border: '1px solid rgba(255,255,255,.08)', borderRadius: 16, padding: 16 }}>
              <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: 2, color: 'rgba(255,255,255,.4)', marginBottom: 6 }}>{label}</div>
              <div style={{ fontSize: big ? 34 : 28, fontWeight: 900, color, textShadow: `0 0 10px ${color},0 0 30px ${color}` }}>{val}</div>
              {big && (
                <div style={{ marginTop: 10, height: 5, borderRadius: 5, background: 'rgba(255,255,255,.06)', overflow: 'hidden' }}>
                  <div style={{ height: '100%', borderRadius: 5, background: 'linear-gradient(90deg,#00e5ff,#b44dff)', width: `${Math.min((score / 20000) * 100, 100)}%`, transition: 'width .5s' }} />
                </div>
              )}
            </div>
          ))}
          <button onClick={restart} style={{ padding: '12px 0', borderRadius: 14, background: 'rgba(0,229,255,.1)', border: '1px solid rgba(0,229,255,.2)', color: '#00e5ff', fontWeight: 800, fontSize: 15, cursor: 'pointer', fontFamily: 'inherit' }}>
            🔄 Chơi lại
          </button>
        </div>
      </div>

      {/* Game Over */}
      {isOver && (
        <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,.85)', borderRadius: 12, display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 200, backdropFilter: 'blur(8px)' }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ color: '#ff4d6a', fontSize: 48, fontWeight: 900, marginBottom: 12, textShadow: '0 0 20px rgba(255,77,106,.6)' }}>HẾT CHỖ!</div>
            <div style={{ color: 'rgba(255,255,255,.8)', fontSize: 20, marginBottom: 28 }}>Tổng điểm: {score}</div>
            <button onClick={restart} style={{ padding: '14px 40px', borderRadius: 14, background: 'linear-gradient(135deg,#e41d1d,#ff4d6a)', border: 'none', color: '#fff', fontSize: 18, fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit', boxShadow: '0 5px 20px rgba(228,29,29,.4)' }}>
              Chơi Lại
            </button>
          </div>
        </div>
      )}

      <style>{`
        @keyframes bbIn  { 0%{transform:scale(.5);opacity:0} 70%{transform:scale(1.1)} 100%{transform:scale(1);opacity:1} }
        @keyframes bbPop { 0%{transform:scale(1);opacity:1} 50%{transform:scale(1.2);opacity:.8;filter:brightness(1.5)} 100%{transform:scale(0);opacity:0} }
      `}</style>
    </div>
  )
}

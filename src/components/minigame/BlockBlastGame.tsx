'use client'

import React, { useEffect, useRef, useState, useCallback } from 'react'

// ─── Constants ─────────────────────────────────────────────────────────────────
const ROWS = 8
const COLS = 8
const GAP = 2       // px gap between cells
const PAD = 6       // board padding

const COLORS: Record<string, string> = {
  '#00e5ff': 'linear-gradient(135deg,#00e5ff 0%,#0099cc 100%)',
  '#b44dff': 'linear-gradient(135deg,#b44dff 0%,#7a00cc 100%)',
  '#ff4d6a': 'linear-gradient(135deg,#ff4d6a 0%,#cc0033 100%)',
  '#e41d1d': 'linear-gradient(135deg,#e41d1d 0%,#990000 100%)',
  '#ffe14d': 'linear-gradient(135deg,#ffe14d 0%,#cca300 100%)',
  '#39e75f': 'linear-gradient(135deg,#39e75f 0%,#009933 100%)',
  '#ff8c1a': 'linear-gradient(135deg,#ff8c1a 0%,#cc6600 100%)',
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

// ─── Types ──────────────────────────────────────────────────────────────────────
type Piece = { id: string; matrix: number[][]; color: string }
type Cell  = { r: number; c: number }

// ─── Helpers ────────────────────────────────────────────────────────────────────
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

// ─── Block cell ─────────────────────────────────────────────────────────────────
function BlockCell({ color, opacity = 1 }: { color: string; opacity?: number }) {
  return (
    <div style={{
      width: '100%', height: '100%', borderRadius: 6,
      background: COLORS[color],
      boxShadow: 'inset 0 0 0 1px rgba(0,0,0,.25), 0 2px 6px rgba(0,0,0,.5)',
      position: 'relative', overflow: 'hidden', opacity,
    }}>
      <div style={{
        position: 'absolute', inset: '12%', borderRadius: 3,
        background: 'rgba(255,255,255,.2)',
        boxShadow: 'inset 0 1px 3px rgba(255,255,255,.6)',
      }} />
    </div>
  )
}

// ─── Main Game ──────────────────────────────────────────────────────────────────
export default function BlockBlastGame({ onGameOver }: { onGameOver: (score: number) => void }) {
  // ── Cell size (responsive) ──────────────────────────────────────────────────
  const [cs, setCs] = useState(48)
  const csRef = useRef(48)

  // ── Game state ──────────────────────────────────────────────────────────────
  const [board, setBoard]     = useState(emptyBoard)
  const boardRef              = useRef<(string | null)[][]>(emptyBoard())
  const [hand, setHand]       = useState<(Piece | null)[]>(() => [mkPiece(), mkPiece(), mkPiece()])
  const handRef               = useRef<(Piece | null)[]>([])
  const [score, setScore]     = useState(0);  const scoreRef = useRef(0)
  const [lines, setLines]     = useState(0);  const linesRef = useRef(0)
  const [combo, setCombo]     = useState(0);  const comboRef = useRef(0)
  const [isOver, setIsOver]   = useState(false); const isOverRef = useRef(false)
  const [clearing, setClearing] = useState<Cell[]>([])
  const [placed,   setPlaced]   = useState<Cell[]>([])

  // ── Board hover highlight ───────────────────────────────────────────────────
  const [hl, setHl] = useState<{ piece: Piece; row: number; col: number; ok: boolean } | null>(null)

  // ── Drag state (all in refs – zero React re-renders per frame) ──────────────
  // grabOffsetX/Y = where INSIDE the full-size overlay the pointer clicked
  // This ensures the piece doesn't jump on pickup - it stays exactly under the finger
  const dragging = useRef<{
    idx: number
    piece: Piece
    isTouch: boolean
    grabOffsetX: number   // pointer position relative to overlay top-left at pickup
    grabOffsetY: number
    touchLift: number     // extra upward shift for touch so finger doesn't block view
  } | null>(null)

  const overlayRef   = useRef<HTMLDivElement>(null)   // floating piece DOM node
  const boardElRef   = useRef<HTMLDivElement>(null)   // 8×8 grid DOM node
  const containerRef = useRef<HTMLDivElement>(null)
  const handRefs     = useRef<(HTMLDivElement | null)[]>([null, null, null])
  const rafRef       = useRef(0)

  // ── Sync refs ───────────────────────────────────────────────────────────────
  useEffect(() => { csRef.current = cs },         [cs])
  useEffect(() => { boardRef.current = board },   [board])
  useEffect(() => { handRef.current = hand },     [hand])
  useEffect(() => { isOverRef.current = isOver }, [isOver])

  // ── Responsive cell size ────────────────────────────────────────────────────
  useEffect(() => {
    const upd = () => {
      const w = window.innerWidth
      const size = w < 380 ? 32 : w < 480 ? 38 : w < 640 ? 44 : 50
      setCs(size); csRef.current = size
    }
    upd()
    window.addEventListener('resize', upd)
    return () => window.removeEventListener('resize', upd)
  }, [])

  // ── Logic helpers ───────────────────────────────────────────────────────────
  const canPlace = useCallback((b: (string|null)[][], m: number[][], r: number, c: number) => {
    for (let dr = 0; dr < m.length; dr++)
      for (let dc = 0; dc < m[dr].length; dc++)
        if (m[dr][dc] && (r+dr < 0 || r+dr >= ROWS || c+dc < 0 || c+dc >= COLS || b[r+dr][c+dc]))
          return false
    return true
  }, [])

  /**
   * Convert the overlay's current TOP-LEFT position (overlayLeft, overlayTop)
   * into a board cell (row, col).
   *
   * The overlay is rendered at full cell size (csRef.current px per cell).
   * overlayLeft = clientX - grabOffsetX + touchLift_adjustedX
   * overlayTop  = clientY - grabOffsetY - touchLift
   *
   * Board cell origin = boardRect.left + PAD + col * stride
   * => col = (overlayLeft - boardRect.left - PAD) / stride   (then round)
   */
  const overlayToCell = useCallback((overlayLeft: number, overlayTop: number, piece: Piece) => {
    const el = boardElRef.current
    if (!el) return { row: -99, col: -99 }
    const rect = el.getBoundingClientRect()
    const stride = csRef.current + GAP
    // Centre of the piece overlay
    const pieceCenterX = overlayLeft + (piece.matrix[0].length * stride) / 2
    const pieceCenterY = overlayTop  + (piece.matrix.length    * stride) / 2
    // Which cell would that land on?
    const col = Math.round((pieceCenterX - rect.left - PAD - csRef.current / 2) / stride)
    const row = Math.round((pieceCenterY - rect.top  - PAD - csRef.current / 2) / stride)
    return { row, col }
  }, [])

  /**
   * Move the overlay so it follows the pointer with the correct grab-point offset.
   * Returns the overlay's new top-left position so we can also update the board highlight.
   */
  const moveOverlay = useCallback((cx: number, cy: number): { left: number; top: number } => {
    const el = overlayRef.current
    const drag = dragging.current
    if (!el || !drag) return { left: 0, top: 0 }

    const left = cx - drag.grabOffsetX
    const top  = cy - drag.grabOffsetY - drag.touchLift

    el.style.transform   = `translate3d(${left}px,${top}px,0) scale(1.1)`
    el.style.visibility  = 'visible'
    el.style.opacity     = '1'

    return { left, top }
  }, [])

  // ── Piece placement ─────────────────────────────────────────────────────────
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

    const fullRows = Array.from({ length: ROWS }, (_, r) => r).filter(r => nb[r].every(Boolean))
    const fullCols = Array.from({ length: COLS }, (_, c) => c).filter(c => nb.every(r => r[c]))
    const lc = fullRows.length + fullCols.length

    const finish = (fb: (string|null)[][], sc: number, co: number) => {
      const nh = [...handRef.current]; nh[idx] = null
      const allGone = nh.every(p => !p)
      const fh = allGone ? [mkPiece(), mkPiece(), mkPiece()] : nh
      setHand(fh); handRef.current = fh
      checkGameOver(fb, fh, sc)
    }

    if (lc > 0) {
      const toClear: Cell[] = []
      fullRows.forEach(r => { for (let c = 0; c < COLS; c++) toClear.push({ r, c }) })
      fullCols.forEach(c => { for (let r = 0; r < ROWS; r++) if (!toClear.some(x => x.r === r && x.c === c)) toClear.push({ r, c }) })
      setClearing(toClear)
      const newCombo = comboRef.current + lc
      const ns = scoreRef.current + count + lc * 10 * newCombo
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

  // ── BUILD OVERLAY CONTENT ───────────────────────────────────────────────────
  const buildOverlay = useCallback((piece: Piece, cellSize: number) => {
    const el = overlayRef.current
    if (!el) return
    el.innerHTML = ''
    const stride = cellSize + GAP
    el.style.width  = `${piece.matrix[0].length * stride}px`
    el.style.height = `${piece.matrix.length * stride}px`
    el.style.display = 'grid'
    el.style.gridTemplateColumns = `repeat(${piece.matrix[0].length},${cellSize}px)`
    el.style.gap = `${GAP}px`
    el.style.filter = 'drop-shadow(0 8px 24px rgba(0,0,0,.7))'

    piece.matrix.forEach(row => row.forEach(val => {
      const cell = document.createElement('div')
      cell.style.width  = `${cellSize}px`
      cell.style.height = `${cellSize}px`
      if (val) {
        cell.style.cssText += `
          width:${cellSize}px;height:${cellSize}px;
          border-radius:6px;
          background:${COLORS[piece.color]};
          box-shadow:inset 0 0 0 1px rgba(0,0,0,.25),0 2px 6px rgba(0,0,0,.5);
          position:relative;overflow:hidden;
        `
        const inner = document.createElement('div')
        inner.style.cssText = 'position:absolute;inset:12%;border-radius:3px;background:rgba(255,255,255,.2);box-shadow:inset 0 1px 3px rgba(255,255,255,.6);'
        cell.appendChild(inner)
      }
      el.appendChild(cell)
    }))
  }, [])

  // ── POINTER DOWN – start drag ───────────────────────────────────────────────
  const startDrag = useCallback((e: React.PointerEvent<HTMLDivElement>, idx: number, piece: Piece) => {
    if (dragging.current || isOverRef.current || clearing.length > 0) return
    e.preventDefault()
    e.stopPropagation()

    const isTouch = e.pointerType === 'touch' || e.pointerType === 'pen'

    // The hand piece is rendered at HALF cell size (0.5 * cs)
    // The overlay will be rendered at FULL cell size (cs)
    // We need to compute where within the FULL-SIZE overlay the pointer clicked.
    //
    // Step 1: find the hand piece element's bounding rect
    const handEl = handRefs.current[idx]
    const cellSize = csRef.current
    const stride = cellSize + GAP
    const overlayW = piece.matrix[0].length * stride
    const overlayH = piece.matrix.length * stride

    let grabOffsetX: number
    let grabOffsetY: number

    if (handEl) {
      const handRect = handEl.getBoundingClientRect()
      // Position of pointer relative to the hand piece element
      const relX = e.clientX - handRect.left
      const relY = e.clientY - handRect.top
      // Scale factor: hand piece uses 0.5*cs per cell, overlay uses cs per cell
      const scale = cellSize / (cellSize * 0.5)
      // Where in the overlay (full-size) does this correspond to?
      grabOffsetX = relX * scale
      grabOffsetY = relY * scale
      // Clamp to overlay bounds
      grabOffsetX = Math.max(0, Math.min(grabOffsetX, overlayW))
      grabOffsetY = Math.max(0, Math.min(grabOffsetY, overlayH))
    } else {
      // Fallback: centre of piece
      grabOffsetX = overlayW / 2
      grabOffsetY = overlayH / 2
    }

    // For touch: lift the piece above the finger so the user can see it
    // For mouse: no lift (piece stays exactly where grabbed)
    const touchLift = isTouch ? cellSize * 1.5 : 0

    dragging.current = { idx, piece, isTouch, grabOffsetX, grabOffsetY, touchLift }

    // Capture all pointer events to this element
    ;(e.currentTarget as HTMLElement).setPointerCapture(e.pointerId)

    if (isTouch) document.body.style.overflow = 'hidden'

    // Build overlay at full cell size
    buildOverlay(piece, cellSize)
    overlayRef.current!.style.visibility = 'hidden'
    overlayRef.current!.style.opacity = '0'

    // Position it immediately
    const { left, top } = moveOverlay(e.clientX, e.clientY)

    // Board highlight
    const { row, col } = overlayToCell(left, top, piece)
    const ok = canPlace(boardRef.current, piece.matrix, row, col)
    setHl({ piece, row, col, ok })
  }, [clearing.length, buildOverlay, moveOverlay, overlayToCell, canPlace])

  // ── POINTER MOVE ────────────────────────────────────────────────────────────
  const continueDrag = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    if (!dragging.current) return
    e.preventDefault()

    const { left, top } = moveOverlay(e.clientX, e.clientY)

    // Throttle board highlight to requestAnimationFrame
    cancelAnimationFrame(rafRef.current)
    rafRef.current = requestAnimationFrame(() => {
      const drag = dragging.current
      if (!drag) return
      const { row, col } = overlayToCell(left, top, drag.piece)
      const ok = canPlace(boardRef.current, drag.piece.matrix, row, col)
      setHl(prev => {
        if (prev && prev.row === row && prev.col === col && prev.ok === ok) return prev
        return { piece: drag.piece, row, col, ok }
      })
    })
  }, [moveOverlay, overlayToCell, canPlace])

  // ── POINTER UP / CANCEL – end drag ──────────────────────────────────────────
  const endDrag = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    const drag = dragging.current
    if (!drag) return
    dragging.current = null
    cancelAnimationFrame(rafRef.current)
    document.body.style.overflow = ''

    // Hide overlay
    const el = overlayRef.current
    if (el) { el.style.visibility = 'hidden'; el.style.opacity = '0'; el.innerHTML = '' }

    // Calculate final position and place if valid
    const { left, top } = (() => {
      const cellSize = csRef.current
      const stride = cellSize + GAP
      const overlayW = drag.piece.matrix[0].length * stride
      const overlayH = drag.piece.matrix.length * stride
      const left = e.clientX - drag.grabOffsetX
      const top  = e.clientY - drag.grabOffsetY - drag.touchLift
      return { left, top }
    })()

    const { row, col } = overlayToCell(left, top, drag.piece)
    const ok = canPlace(boardRef.current, drag.piece.matrix, row, col)
    if (ok) placePiece(drag.piece, drag.idx, row, col)

    setHl(null)
  }, [overlayToCell, canPlace, placePiece])

  // ── RESTART ─────────────────────────────────────────────────────────────────
  const restart = () => {
    const nb = emptyBoard(); setBoard(nb); boardRef.current = nb
    const nh = [mkPiece(), mkPiece(), mkPiece()]; setHand(nh); handRef.current = nh
    setScore(0); scoreRef.current = 0
    setLines(0); linesRef.current = 0
    setCombo(0); comboRef.current = 0
    setIsOver(false); isOverRef.current = false
    setHl(null)
  }

  const stride = cs + GAP

  // ── RENDER ──────────────────────────────────────────────────────────────────
  return (
    <div
      ref={containerRef}
      style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        width: '100%', userSelect: 'none',
        position: 'relative',
      }}
    >
      {/* ── Drag overlay: fixed position, moved imperatively via transform3d ── */}
      <div
        ref={overlayRef}
        style={{
          position: 'fixed',
          top: 0, left: 0,
          visibility: 'hidden',
          opacity: 0,
          pointerEvents: 'none',
          zIndex: 9999,
          willChange: 'transform',
          transformOrigin: 'top left',
          transition: 'opacity 0.05s',
        }}
      />

      <div style={{ display: 'flex', gap: 20, justifyContent: 'center', alignItems: 'flex-start', width: '100%', maxWidth: 860, flexWrap: 'wrap' }}>

        {/* ── Board column ── */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>

          {/* Board */}
          <div
            ref={boardElRef}
            style={{
              display: 'grid',
              gridTemplateColumns: `repeat(${COLS},${cs}px)`,
              gridTemplateRows:    `repeat(${ROWS},${cs}px)`,
              gap: GAP,
              padding: PAD,
              background: '#050510',
              borderRadius: 14,
              border: '2px solid rgba(255,255,255,.08)',
              boxShadow: 'inset 0 0 50px rgba(0,0,0,.9)',
            }}
          >
            {board.map((row, r) => row.map((color, c) => {
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
                    background: 'rgba(255,255,255,.025)',
                    borderRadius: 5,
                    boxShadow: 'inset 0 0 0 1px rgba(255,255,255,.04)',
                    animation: isClearing ? 'bbPop .4s ease-out forwards'
                              : isPlaced   ? 'bbIn .3s cubic-bezier(.175,.885,.32,1.275)'
                              : undefined,
                  }}
                >
                  {(color || inHl) && (
                    <BlockCell
                      color={(color ?? hl!.piece.color) as string}
                      opacity={color ? 1 : 0.4}
                    />
                  )}
                </div>
              )
            }))}
          </div>

          {/* Hand (tray) */}
          <div style={{
            display: 'flex', justifyContent: 'center', gap: 8, marginTop: 20,
            width: '100%', minHeight: cs * 2.5,
          }}>
            {hand.map((piece, i) => {
              const handCellSize = Math.round(cs * 0.5)
              const isDragging = hl?.piece === piece
              return (
                <div
                  key={i}
                  style={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center' }}
                >
                  {piece && (
                    <div
                      ref={el => { handRefs.current[i] = el }}
                      onPointerDown={e => startDrag(e, i, piece)}
                      onPointerMove={continueDrag}
                      onPointerUp={endDrag}
                      onPointerCancel={endDrag}
                      style={{
                        display: 'grid',
                        gridTemplateColumns: `repeat(${piece.matrix[0].length},${handCellSize}px)`,
                        gap: 2,
                        touchAction: 'none',
                        cursor: isDragging ? 'none' : 'grab',
                        opacity: isDragging ? 0.2 : 1,
                        transition: 'opacity .1s',
                      }}
                    >
                      {piece.matrix.map((row, r) => row.map((val, c) => (
                        <div key={`${r}-${c}`} style={{ width: handCellSize, height: handCellSize }}>
                          {val ? <BlockCell color={piece.color} /> : null}
                        </div>
                      )))}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>

        {/* ── Sidebar ── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, minWidth: 160, maxWidth: 200, flex: 1 }}>
          {[
            { label: 'ĐIỂM SỐ', val: score.toLocaleString(), color: '#00e5ff', big: true  },
            { label: 'HÀNG',    val: lines,                   color: '#39e75f', big: false },
            { label: 'COMBO',   val: combo,                   color: '#ffe14d', big: false },
          ].map(({ label, val, color, big }) => (
            <div key={label} style={{
              background: 'rgba(255,255,255,.04)',
              border: '1px solid rgba(255,255,255,.08)',
              borderRadius: 14, padding: '14px 16px',
            }}>
              <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: 2, color: 'rgba(255,255,255,.4)', marginBottom: 5 }}>{label}</div>
              <div style={{ fontSize: big ? 32 : 26, fontWeight: 900, color, textShadow: `0 0 12px ${color},0 0 30px ${color}` }}>{val}</div>
              {big && (
                <div style={{ marginTop: 10, height: 4, borderRadius: 4, background: 'rgba(255,255,255,.06)', overflow: 'hidden' }}>
                  <div style={{ height: '100%', borderRadius: 4, background: 'linear-gradient(90deg,#00e5ff,#b44dff)', width: `${Math.min((score / 20000) * 100, 100)}%`, transition: 'width .5s' }} />
                </div>
              )}
            </div>
          ))}
          <button
            onClick={restart}
            style={{
              padding: '11px 0', borderRadius: 14,
              background: 'rgba(0,229,255,.1)', border: '1px solid rgba(0,229,255,.2)',
              color: '#00e5ff', fontWeight: 800, fontSize: 15,
              cursor: 'pointer', fontFamily: 'inherit',
            }}
          >🔄 Chơi lại</button>
        </div>
      </div>

      {/* Game Over overlay */}
      {isOver && (
        <div style={{
          position: 'absolute', inset: 0,
          background: 'rgba(0,0,0,.88)',
          borderRadius: 14, display: 'flex',
          justifyContent: 'center', alignItems: 'center',
          zIndex: 200, backdropFilter: 'blur(10px)',
        }}>
          <div style={{ textAlign: 'center', padding: '0 20px' }}>
            <div style={{ color: '#ff4d6a', fontSize: 46, fontWeight: 900, marginBottom: 10, textShadow: '0 0 20px rgba(255,77,106,.6)' }}>HẾT CHỖ!</div>
            <div style={{ color: 'rgba(255,255,255,.8)', fontSize: 20, marginBottom: 28 }}>Tổng điểm: {score.toLocaleString()}</div>
            <button
              onClick={restart}
              style={{
                padding: '14px 44px', borderRadius: 14,
                background: 'linear-gradient(135deg,#e41d1d,#ff4d6a)',
                border: 'none', color: '#fff', fontSize: 18, fontWeight: 800,
                cursor: 'pointer', fontFamily: 'inherit',
                boxShadow: '0 6px 24px rgba(228,29,29,.5)',
              }}
            >Chơi Lại</button>
          </div>
        </div>
      )}

      <style>{`
        @keyframes bbIn  { 0%{transform:scale(.4);opacity:0} 70%{transform:scale(1.12)} 100%{transform:scale(1);opacity:1} }
        @keyframes bbPop { 0%{transform:scale(1);opacity:1} 50%{transform:scale(1.25);opacity:.8;filter:brightness(2)} 100%{transform:scale(0);opacity:0} }
      `}</style>
    </div>
  )
}

'use client'

import React, { useEffect, useRef, useState, useCallback } from 'react'
import GameReadyOverlay, { type GameStartStateProps } from '@/components/minigame/GameReadyOverlay'
import type { GameOverPayload } from '@/lib/game-config'
import {
  canPlace as canPlacePure,
  generateHandMatrices,
  type Board,
} from '@/lib/minigame/block-blast'

// ─── Constants ─────────────────────────────────────────────────────────────────
const DEBUG_DRAG = false // Set true to log drag coordinates to console
const BOARD_SIZE = 8
const ROWS = BOARD_SIZE
const COLS = BOARD_SIZE
const GAP = 2       // px gap between cells
const PAD = 6       // board padding
const BOARD_BORDER = 2 // board border width in px
const OVERLAY_SCALE = 1.1 // visual scale of the dragged piece (purely cosmetic)

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

// ─── Types ──────────────────────────────────────────────────────────────────────
type Piece = { id: string; matrix: number[][]; color: string }
type Cell  = { r: number; c: number }

// ─── Helpers ────────────────────────────────────────────────────────────────────
function mkPieceFrom(matrix: number[][]): Piece {
  return {
    id: Math.random().toString(36).slice(2),
    matrix,
    color: COLOR_KEYS[Math.floor(Math.random() * COLOR_KEYS.length)],
  }
}

function mkHand(board: Board): Piece[] {
  return generateHandMatrices(board).map(mkPieceFrom)
}

function emptyBoard(): Board {
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

// ─── Audio System ──────────────────────────────────────────────────────────────
const playSound = (type: 'move' | 'drop' | 'invalid' | 'clear', combo: number = 0, enabled = true) => {
  if (!enabled) return
  try {
    const AudioContextClass = window.AudioContext ||
      (window as Window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
    if (!AudioContextClass) return

    const ctx = new AudioContextClass()
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.connect(gain)
    gain.connect(ctx.destination)

    const now = ctx.currentTime
    if (type === 'move') {
      osc.type = 'sine'
      osc.frequency.setValueAtTime(300, now)
      osc.frequency.exponentialRampToValueAtTime(600, now + 0.1)
      gain.gain.setValueAtTime(0, now)
      gain.gain.linearRampToValueAtTime(0.1, now + 0.05)
      gain.gain.linearRampToValueAtTime(0, now + 0.1)
      osc.start(now)
      osc.stop(now + 0.1)
    } else if (type === 'drop') {
      osc.type = 'triangle'
      osc.frequency.setValueAtTime(150, now)
      osc.frequency.exponentialRampToValueAtTime(50, now + 0.1)
      gain.gain.setValueAtTime(0.2, now)
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.1)
      osc.start(now)
      osc.stop(now + 0.1)
    } else if (type === 'invalid') {
      osc.type = 'sawtooth'
      osc.frequency.setValueAtTime(150, now)
      osc.frequency.linearRampToValueAtTime(100, now + 0.15)
      gain.gain.setValueAtTime(0.1, now)
      gain.gain.linearRampToValueAtTime(0, now + 0.15)
      osc.start(now)
      osc.stop(now + 0.15)
    } else if (type === 'clear') {
      osc.type = 'square'
      const baseFreq = 400 + Math.min(combo * 50, 600)
      osc.frequency.setValueAtTime(baseFreq, now)
      osc.frequency.exponentialRampToValueAtTime(baseFreq * 2, now + 0.2)
      gain.gain.setValueAtTime(0.1, now)
      gain.gain.linearRampToValueAtTime(0, now + 0.2)
      osc.start(now)
      osc.stop(now + 0.2)
    }
    osc.addEventListener('ended', () => {
      void ctx.close().catch(() => undefined)
    }, { once: true })
  } catch {
    // Browsers may block audio until a user gesture; gameplay should continue.
  }
}

// ─── Main Game ──────────────────────────────────────────────────────────────────
export default function BlockBlastGame({
  ready,
  starting,
  signedIn,
  onStart,
  onGameOver,
  onRestart,
  restartDisabled = false,
  soundEnabled = true,
}: GameStartStateProps & {
  onGameOver: (result: GameOverPayload) => void
  onRestart: () => void
  restartDisabled?: boolean
  soundEnabled?: boolean
  onSoundToggle?: (enabled: boolean) => void
}) {
  // ── Cell size (responsive) ──────────────────────────────────────────────────
  const [cs, setCs] = useState(48)
  const csRef = useRef(48)

  // ── Game state ──────────────────────────────────────────────────────────────
  const [board, setBoard]     = useState(emptyBoard)
  const boardRef              = useRef<Board>(emptyBoard())
  const [hand, setHand]       = useState<(Piece | null)[]>(() =>
    ready ? [null, null, null] : mkHand(emptyBoard()),
  )
  const handRef               = useRef<(Piece | null)[]>([])
  const [score, setScore]     = useState(0);  const scoreRef = useRef(0)
  const [lines, setLines]     = useState(0);  const linesRef = useRef(0)
  const [combo, setCombo]     = useState(0);  const comboRef = useRef(0)
  const [isOver, setIsOver]   = useState(false); const isOverRef = useRef(false)
  const [endReason, setEndReason] = useState<'blocked' | 'manual'>('blocked')
  const soundEnabledRef       = useRef(soundEnabled)
  const startedAtRef          = useRef(ready ? 0 : Date.now())
  const [clearing, setClearing] = useState<Cell[]>([])
  const [placed,   setPlaced]   = useState<Cell[]>([])

  // ── Board hover highlight ───────────────────────────────────────────────────
  const [hl, setHl] = useState<{ piece: Piece; row: number; col: number; ok: boolean } | null>(null)

  // ── Drag state ──────────────────────────────────────────────────────────────
  // grabOffsetX/Y: distance from pointer to the top-left of the piece (at full/overlay size)
  // fixedLift: how many px the overlay floats ABOVE the pointer (so finger doesn't cover it)
  // All coordinates are in clientX/clientY space (viewport-relative, no scroll offsets).
  const dragging = useRef<{
    idx: number
    piece: Piece
    isTouch: boolean
    grabOffsetX: number
    grabOffsetY: number
    fixedLift: number
  } | null>(null)

  const overlayRef   = useRef<HTMLDivElement>(null)
  const boardElRef   = useRef<HTMLDivElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const handRefs     = useRef<(HTMLDivElement | null)[]>([null, null, null])
  const rafRef       = useRef(0)

  // ── Sync refs ───────────────────────────────────────────────────────────────
  useEffect(() => { csRef.current = cs },         [cs])
  useEffect(() => { boardRef.current = board },   [board])
  useEffect(() => { handRef.current = hand },     [hand])
  useEffect(() => { isOverRef.current = isOver }, [isOver])
  useEffect(() => { soundEnabledRef.current = soundEnabled }, [soundEnabled])

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

  useEffect(() => {
    return () => {
      cancelAnimationFrame(rafRef.current)
      document.body.style.overflow = ''
    }
  }, [])

  // ── Logic helpers ───────────────────────────────────────────────────────────
  const canPlace = useCallback(
    (b: Board, m: number[][], r: number, c: number) => canPlacePure(b, m, r, c),
    [],
  )

  /**
   * Compute the visual top-left of the overlay from the current pointer position.
   * This is the UNSCALED top-left — the point that `translate3d` moves the overlay to.
   * scale(1.1) with transform-origin:top-left only expands right/down, so
   * the visual top-left corner of the overlay IS this point.
   */
  const getVisualPos = useCallback((clientX: number, clientY: number) => {
    const drag = dragging.current
    if (!drag) return { vx: 0, vy: 0 }
    const vx = clientX - drag.grabOffsetX
    const vy = clientY - drag.grabOffsetY - drag.fixedLift
    return { vx, vy }
  }, [])

  /**
   * Convert the overlay's visual top-left (vx, vy) into board cell (row, col).
   *
   * KEY INSIGHT: The board element has border (BOARD_BORDER) + padding (PAD).
   * getBoundingClientRect() includes border+padding in its left/top.
   * The first cell (0,0) starts at rect.left + BOARD_BORDER + PAD.
   * Each cell occupies (cellSize + GAP) px of stride.
   *
   * We use Math.round so the piece "snaps" to the nearest cell when the
   * overlay's top-left is within half a stride of a cell origin.
   */
  const overlayToCell = useCallback((vx: number, vy: number) => {
    const el = boardElRef.current
    if (!el) return { row: -99, col: -99 }
    const rect = el.getBoundingClientRect()

    // Where cell (0,0) starts inside the board element
    const gridOriginX = rect.left + BOARD_BORDER + PAD
    const gridOriginY = rect.top  + BOARD_BORDER + PAD

    const stride = csRef.current + GAP

    const col = Math.round((vx - gridOriginX) / stride)
    const row = Math.round((vy - gridOriginY) / stride)

    if (DEBUG_DRAG) {
      console.log('[overlayToCell]', {
        vx: vx.toFixed(1), vy: vy.toFixed(1),
        gridOriginX: gridOriginX.toFixed(1), gridOriginY: gridOriginY.toFixed(1),
        stride, row, col,
        cellSize: csRef.current,
        rectLeft: rect.left.toFixed(1), rectTop: rect.top.toFixed(1),
      })
    }

    return { row, col }
  }, [])

  /**
   * Move the overlay DOM element to follow the pointer.
   * Returns the UNSCALED visual top-left position used for cell detection.
   */
  const moveOverlay = useCallback((clientX: number, clientY: number): { vx: number; vy: number } => {
    const el = overlayRef.current
    const drag = dragging.current
    if (!el || !drag) return { vx: 0, vy: 0 }

    const { vx, vy } = getVisualPos(clientX, clientY)

    // translate3d positions the unscaled top-left; scale expands right+down only
    el.style.transform  = `translate3d(${vx}px,${vy}px,0) scale(${OVERLAY_SCALE})`
    el.style.visibility = 'visible'
    el.style.opacity    = '1'

    if (DEBUG_DRAG) {
      console.log('[moveOverlay]', {
        clientX, clientY,
        grabOffsetX: drag.grabOffsetX.toFixed(1),
        grabOffsetY: drag.grabOffsetY.toFixed(1),
        fixedLift: drag.fixedLift.toFixed(1),
        vx: vx.toFixed(1), vy: vy.toFixed(1),
      })
    }

    return { vx, vy }
  }, [getVisualPos])

  // ── Piece placement ──────────────────────────────────────────────────────────
  const completeGame = useCallback((finalScore: number, reason: 'blocked' | 'manual') => {
    if (ready || isOverRef.current) return

    isOverRef.current = true
    setEndReason(reason)
    setIsOver(true)
    onGameOver({
      game: 'block-blast',
      score: finalScore,
      lines: linesRef.current,
      combo: comboRef.current,
      level: 1,
      durationSec: Math.max(1, Math.round((Date.now() - startedAtRef.current) / 1000)),
    })
  }, [onGameOver, ready])

  const checkGameOver = useCallback((b: (string|null)[][], h: (Piece|null)[], sc: number) => {
    const any = h.some(p => p && Array.from({ length: ROWS }, (_, r) =>
      Array.from({ length: COLS }, (_, c) => canPlace(b, p.matrix, r, c))
    ).flat().some(Boolean))
    if (!any && h.some(Boolean)) {
      completeGame(sc, 'blocked')
    }
  }, [canPlace, completeGame])

  const endGame = useCallback(() => {
    completeGame(scoreRef.current, 'manual')
  }, [completeGame])

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

    const finish = (fb: (string|null)[][], sc: number) => {
      const nh = [...handRef.current]; nh[idx] = null
      const allGone = nh.every(p => !p)
      const fh = allGone ? mkHand(fb) : nh
      setHand(fh); handRef.current = fh
      checkGameOver(fb, fh, sc)
    }

    if (lc > 0) {
      playSound('clear', comboRef.current, soundEnabledRef.current)
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
        finish(cb, ns)
      }, 400)
    } else {
      playSound('drop', 0, soundEnabledRef.current)
      const ns = scoreRef.current + count
      setScore(ns); scoreRef.current = ns
      setCombo(0); comboRef.current = 0
      finish(nb, ns)
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
    if (ready || dragging.current || isOverRef.current || clearing.length > 0) return
    e.preventDefault()
    e.stopPropagation()

    const isTouch = e.pointerType === 'touch' || e.pointerType === 'pen'
    const cellSize = csRef.current
    const stride = cellSize + GAP
    const overlayW = piece.matrix[0].length * stride
    const overlayH = piece.matrix.length * stride

    // ── Compute grab offset ──
    // The tray piece is rendered at handCellSize (50% of cellSize).
    // We need to map the click position within the tray piece to the
    // corresponding position within the full-size overlay.
    const pieceRect = (e.currentTarget as HTMLElement).getBoundingClientRect()
    const percentX = (e.clientX - pieceRect.left) / pieceRect.width
    const percentY = (e.clientY - pieceRect.top)  / pieceRect.height
    const grabOffsetX = overlayW * percentX
    const grabOffsetY = overlayH * percentY

    // ── Fixed lift: piece floats above the finger/cursor ──
    const fixedLift = isTouch ? cellSize * 1.5 : cellSize * 0.5

    if (DEBUG_DRAG) {
      console.log('[startDrag]', {
        clientX: e.clientX, clientY: e.clientY,
        pieceRect: { left: pieceRect.left.toFixed(1), top: pieceRect.top.toFixed(1), w: pieceRect.width.toFixed(1), h: pieceRect.height.toFixed(1) },
        percentX: percentX.toFixed(3), percentY: percentY.toFixed(3),
        grabOffsetX: grabOffsetX.toFixed(1), grabOffsetY: grabOffsetY.toFixed(1),
        overlayW, overlayH, fixedLift,
        isTouch,
      })
    }

    playSound('move', 0, soundEnabledRef.current)

    dragging.current = { idx, piece, isTouch, grabOffsetX, grabOffsetY, fixedLift }

    // Capture all pointer events to this element
    try {
      ;(e.currentTarget as HTMLElement).setPointerCapture(e.pointerId)
    } catch {
      dragging.current = null
      return
    }

    if (isTouch) document.body.style.overflow = 'hidden'

    // Build overlay at full cell size
    buildOverlay(piece, cellSize)
    overlayRef.current!.style.visibility = 'hidden'
    overlayRef.current!.style.opacity = '0'
    overlayRef.current!.style.transformOrigin = 'top left'

    // Position overlay immediately
    const { vx, vy } = moveOverlay(e.clientX, e.clientY)

    // Board highlight
    const { row, col } = overlayToCell(vx, vy)
    const ok = canPlace(boardRef.current, piece.matrix, row, col)
    setHl({ piece, row, col, ok })
  }, [ready, clearing.length, buildOverlay, moveOverlay, overlayToCell, canPlace])

  // ── POINTER MOVE ────────────────────────────────────────────────────────────
  const continueDrag = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    if (!dragging.current) return
    e.preventDefault()

    const { vx, vy } = moveOverlay(e.clientX, e.clientY)

    // Throttle board highlight to requestAnimationFrame
    cancelAnimationFrame(rafRef.current)
    rafRef.current = requestAnimationFrame(() => {
      const drag = dragging.current
      if (!drag) return
      const { row, col } = overlayToCell(vx, vy)
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

    // CRITICAL: compute visual position from the SAVED drag state (local variable),
    // NOT from getVisualPos() which reads dragging.current (already null above).
    const vx = e.clientX - drag.grabOffsetX
    const vy = e.clientY - drag.grabOffsetY - drag.fixedLift

    const { row, col } = overlayToCell(vx, vy)
    const ok = canPlace(boardRef.current, drag.piece.matrix, row, col)

    if (DEBUG_DRAG) {
      console.log('[endDrag]', {
        clientX: e.clientX, clientY: e.clientY,
        grabOffsetX: drag.grabOffsetX, grabOffsetY: drag.grabOffsetY,
        fixedLift: drag.fixedLift,
        vx: vx.toFixed(1), vy: vy.toFixed(1),
        row, col, ok,
        piece: drag.piece.id, idx: drag.idx,
      })
    }

    if (ok) {
      placePiece(drag.piece, drag.idx, row, col)
    } else {
      playSound('invalid', 0, soundEnabledRef.current)
    }

    setHl(null)
  }, [overlayToCell, canPlace, placePiece])

  // ── RENDER ──────────────────────────────────────────────────────────────────
  return (
    <div
      ref={containerRef}
      aria-busy={ready && starting}
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

      <div
        inert={ready ? true : undefined}
        aria-hidden={ready ? true : undefined}
        style={{ display: 'flex', gap: 20, justifyContent: 'center', alignItems: 'flex-start', width: '100%', maxWidth: 860, flexWrap: 'wrap' }}
      >

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
              border: `${BOARD_BORDER}px solid rgba(255,255,255,.08)`,
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
                  className={isClearing ? 'bb-pop' : isPlaced ? 'bb-in' : undefined}
                  style={{
                    width: cs, height: cs,
                    background: 'rgba(255,255,255,.025)',
                    borderRadius: 5,
                    boxShadow: 'inset 0 0 0 1px rgba(255,255,255,.04)',
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
          <div style={{
            background: 'rgba(255,255,255,.04)',
            border: '1px solid rgba(255,255,255,.08)',
            borderRadius: 14,
            padding: '12px 16px',
          }}>
            <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: 2, color: 'rgba(255,255,255,.4)', marginBottom: 5 }}>BẢNG</div>
            <div style={{ fontSize: 22, fontWeight: 900, color: '#fff' }}>{BOARD_SIZE} x {BOARD_SIZE}</div>
          </div>
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
            type="button"
            onClick={endGame}
            disabled={ready || isOver || clearing.length > 0}
            style={{
              padding: '11px 0', borderRadius: 14,
              background: 'rgba(255,77,106,.12)', border: '1px solid rgba(255,77,106,.24)',
              color: '#ff8a9d', fontWeight: 800, fontSize: 15,
              cursor: ready || isOver || clearing.length > 0 ? 'not-allowed' : 'pointer', fontFamily: 'inherit',
              opacity: ready || isOver || clearing.length > 0 ? 0.5 : 1,
            }}
          >{clearing.length > 0 ? 'Đang tính điểm...' : 'Kết thúc lượt'}</button>
        </div>
      </div>

      {/* Game Over overlay */}
      {isOver && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="block-blast-game-over-title"
          style={{
          position: 'absolute', inset: 0,
          background: 'rgba(0,0,0,.88)',
          borderRadius: 14, display: 'flex',
          justifyContent: 'center', alignItems: 'center',
          zIndex: 200, backdropFilter: 'blur(10px)',
        }}>
          <div style={{ textAlign: 'center', padding: '0 20px' }}>
            <div id="block-blast-game-over-title" style={{ color: '#ff4d6a', fontSize: 40, lineHeight: 1.15, fontWeight: 900, marginBottom: 10, textShadow: '0 0 20px rgba(255,77,106,.6)' }}>
              {endReason === 'manual' ? 'LƯỢT CHƠI KẾT THÚC' : 'HẾT CHỖ!'}
            </div>
            <div style={{ color: 'rgba(255,255,255,.8)', fontSize: 20, marginBottom: 28 }}>Tổng điểm: {score.toLocaleString()}</div>
            <button
              type="button"
              onClick={onRestart}
              disabled={restartDisabled}
              style={{
                padding: '14px 44px', borderRadius: 14,
                background: 'linear-gradient(135deg,#e41d1d,#ff4d6a)',
                border: 'none', color: '#fff', fontSize: 18, fontWeight: 800,
                cursor: restartDisabled ? 'wait' : 'pointer', fontFamily: 'inherit',
                opacity: restartDisabled ? 0.55 : 1,
                boxShadow: '0 6px 24px rgba(228,29,29,.5)',
              }}
            >{restartDisabled ? 'Đang lưu điểm...' : 'Chơi lại'}</button>
          </div>
        </div>
      )}

      {ready && (
        <GameReadyOverlay
          game="block-blast"
          starting={starting}
          signedIn={signedIn}
          onStart={onStart}
        />
      )}

      <style>{`
        @keyframes bbIn  { 0%{transform:scale(.4);opacity:0} 70%{transform:scale(1.12)} 100%{transform:scale(1);opacity:1} }
        @keyframes bbPop { 0%{transform:scale(1);opacity:1} 50%{transform:scale(1.25);opacity:.8;filter:brightness(2)} 100%{transform:scale(0);opacity:0} }
        .bb-in { animation: bbIn .3s cubic-bezier(.175,.885,.32,1.275); }
        .bb-pop { animation: bbPop .4s ease-out forwards; }
        @media (prefers-reduced-motion: reduce) {
          .bb-in, .bb-pop { animation: none !important; }
        }
      `}</style>
    </div>
  )
}

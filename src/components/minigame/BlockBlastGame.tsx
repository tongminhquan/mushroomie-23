'use client'

import React, { useEffect, useLayoutEffect, useRef, useState, useCallback } from 'react'
import { createPortal } from 'react-dom'

const ROWS = 8
const COLS = 8

const COLORS: Record<string, string> = {
  '#00e5ff': 'linear-gradient(135deg, #00e5ff, #0099cc)',
  '#b44dff': 'linear-gradient(135deg, #b44dff, #7a00cc)',
  '#ff4d6a': 'linear-gradient(135deg, #ff4d6a, #cc0033)',
  '#e41d1d': 'linear-gradient(135deg, #e41d1d, #990000)',
  '#ffe14d': 'linear-gradient(135deg, #ffe14d, #cca300)',
  '#39e75f': 'linear-gradient(135deg, #39e75f, #009933)',
  '#ff8c1a': 'linear-gradient(135deg, #ff8c1a, #cc6600)',
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
  [[1,0,0],[1,0,0],[1,1,1]], [[0,0,1],[0,0,1],[1,1,1]], [[1,1,1],[1,0,0],[1,0,0]], [[1,1,1],[0,0,1],[0,0,1]],
  [[1,1,1],[0,1,0]], [[0,1,0],[1,1,1]], [[1,0],[1,1],[1,0]], [[0,1],[1,1],[0,1]],
  [[0,1,0],[1,1,1],[0,1,0]],
  [[1,1,0],[0,1,1]], [[0,1,1],[1,1,0]], [[1,0],[1,1],[0,1]], [[0,1],[1,1],[1,0]],
]

type Piece = { id: string; matrix: number[][]; color: string }

function getRandomPiece(): Piece {
  const matrix = SHAPES[Math.floor(Math.random() * SHAPES.length)]
  const color = COLOR_KEYS[Math.floor(Math.random() * COLOR_KEYS.length)]
  return { id: Math.random().toString(36).substring(2, 9), matrix, color }
}

// ─── Drag state lives entirely in refs (never causes re-renders) ─────────────
type DragState = {
  index: number
  piece: Piece
  isTouch: boolean
}

export default function BlockBlastGame({ onGameOver }: { onGameOver: (score: number) => void }) {
  const [cellSize, setCellSize] = useState(45)
  const cellSizeRef = useRef(45)
  useEffect(() => { cellSizeRef.current = cellSize }, [cellSize])

  const [board, setBoard] = useState<(string | null)[][]>(
    Array(ROWS).fill(null).map(() => Array(COLS).fill(null))
  )
  const [hand, setHand] = useState<(Piece | null)[]>([getRandomPiece(), getRandomPiece(), getRandomPiece()])
  const [score, setScore] = useState(0)
  const [lines, setLines] = useState(0)
  const [combo, setCombo] = useState(0)
  const [isGameOver, setIsGameOver] = useState(false)
  const [isFullscreen, setIsFullscreen] = useState(false)

  // Board highlight state (React state - OK to have slight lag)
  const [dragHighlight, setDragHighlight] = useState<{
    index: number
    piece: Piece
    hoverRow: number
    hoverCol: number
    isValid: boolean
  } | null>(null)

  const containerRef = useRef<HTMLDivElement>(null)
  const boardRef = useRef<HTMLDivElement>(null)
  // Overlay element ref - we position it imperatively via style.left / style.top
  const overlayRef = useRef<HTMLDivElement>(null)
  // Drag state ref - no re-renders needed for position tracking
  const dragStateRef = useRef<DragState | null>(null)
  // Last cursor position
  const cursorRef = useRef({ x: 0, y: 0 })
  // rAF id for throttling board highlight updates
  const rafRef = useRef(0)

  const boardStateRef = useRef(board)
  boardStateRef.current = board
  const scoreRef = useRef(score)
  scoreRef.current = score
  const linesRef = useRef(lines)
  linesRef.current = lines
  const comboRef = useRef(combo)
  comboRef.current = combo
  const handRef = useRef(hand)
  handRef.current = hand
  const isGameOverRef = useRef(isGameOver)
  isGameOverRef.current = isGameOver

  const canPlace = useCallback((
    boardState: (string | null)[][],
    matrix: number[][],
    row: number,
    col: number
  ) => {
    for (let r = 0; r < matrix.length; r++) {
      for (let c = 0; c < matrix[r].length; c++) {
        if (matrix[r][c]) {
          if (row + r < 0 || row + r >= ROWS || col + c < 0 || col + c >= COLS) return false
          if (boardState[row + r][col + c] !== null) return false
        }
      }
    }
    return true
  }, [])

  /**
   * Compute which board cell (row, col) the cursor is over,
   * so that the piece is CENTERED under the cursor.
   *
   * The board cell `col` has its left edge at:
   *   rect.left + BOARD_PADDING + col * CELL_STRIDE
   *
   * We want the overlay left edge (= cursor - pieceWidth/2) to align with that cell, so:
   *   col = (cursorX - rect.left - BOARD_PADDING) / CELL_STRIDE - pieceCols / 2
   */
  const computeHoverPos = useCallback((cursorX: number, cursorY: number, piece: Piece) => {
    let hoverRow = -1, hoverCol = -1, isValid = false
    if (boardRef.current) {
      const rect = boardRef.current.getBoundingClientRect()
      const BOARD_PADDING = 6
      const cs = cellSizeRef.current
      const CELL_STRIDE = cs + 2

      const relX = cursorX - rect.left - BOARD_PADDING
      const relY = cursorY - rect.top - BOARD_PADDING

      const col = Math.round(relX / CELL_STRIDE - piece.matrix[0].length / 2)
      const row = Math.round(relY / CELL_STRIDE - piece.matrix.length / 2)

      hoverRow = row
      hoverCol = col
      isValid = canPlace(boardStateRef.current, piece.matrix, row, col)
    }
    return { hoverRow, hoverCol, isValid }
  }, [canPlace])

  /**
   * Position the overlay DIRECTLY via DOM style - no React re-render.
   * This is what makes the overlay follow the cursor smoothly.
   */
  const applyOverlayPosition = useCallback((cursorX: number, cursorY: number) => {
    const drag = dragStateRef.current
    const el = overlayRef.current
    if (!drag || !el) return

    const cs = cellSizeRef.current
    const CELL_STRIDE = cs + 2
    const pieceCols = drag.piece.matrix[0].length
    const pieceRows = drag.piece.matrix.length
    const touchLift = drag.isTouch ? cs * 2.5 : 0

    const left = cursorX - (pieceCols * CELL_STRIDE) / 2
    const top = cursorY - (pieceRows * CELL_STRIDE) / 2 - touchLift

    el.style.left = `${left}px`
    el.style.top = `${top}px`
    el.style.visibility = 'visible'
  }, [])

  const [clearingCells, setClearingCells] = useState<{ r: number; c: number }[]>([])
  const [placedCells, setPlacedCells] = useState<{ r: number; c: number }[]>([])

  const checkGameOver = useCallback((
    boardState: (string | null)[][],
    currentHand: (Piece | null)[],
    currentScore: number
  ) => {
    let anyMovePossible = false
    outer: for (const piece of currentHand) {
      if (!piece) continue
      for (let r = 0; r < ROWS; r++) {
        for (let c = 0; c < COLS; c++) {
          if (canPlace(boardState, piece.matrix, r, c)) { anyMovePossible = true; break outer }
        }
      }
    }
    if (!anyMovePossible && currentHand.some(p => p !== null)) {
      setIsGameOver(true)
      onGameOver(currentScore)
    }
  }, [canPlace, onGameOver])

  const checkPostPlace = useCallback((
    currentBoard: (string | null)[][],
    usedIndex: number,
    currentScore: number
  ) => {
    const newHand = [...handRef.current]
    newHand[usedIndex] = null
    if (newHand.every(p => p === null)) {
      const freshHand = [getRandomPiece(), getRandomPiece(), getRandomPiece()]
      setHand(freshHand)
      checkGameOver(currentBoard, freshHand, currentScore)
    } else {
      setHand(newHand)
      checkGameOver(currentBoard, newHand, currentScore)
    }
  }, [checkGameOver])

  const placePiece = useCallback((piece: Piece, index: number, row: number, col: number) => {
    const currentBoard = boardStateRef.current
    const newBoard = currentBoard.map(r => [...r])
    let blocksCount = 0
    const newPlacedCells: { r: number; c: number }[] = []

    for (let r = 0; r < piece.matrix.length; r++) {
      for (let c = 0; c < piece.matrix[r].length; c++) {
        if (piece.matrix[r][c]) {
          newBoard[row + r][col + c] = piece.color
          newPlacedCells.push({ r: row + r, c: col + c })
          blocksCount++
        }
      }
    }

    setBoard(newBoard)
    boardStateRef.current = newBoard
    setPlacedCells(newPlacedCells)
    setTimeout(() => setPlacedCells([]), 300)

    const rowsToClear: number[] = []
    const colsToClear: number[] = []
    for (let r = 0; r < ROWS; r++) {
      if (newBoard[r].every(cell => cell !== null)) rowsToClear.push(r)
    }
    for (let c = 0; c < COLS; c++) {
      if (newBoard.every(rowArr => rowArr[c] !== null)) colsToClear.push(c)
    }

    const linesCleared = rowsToClear.length + colsToClear.length
    if (linesCleared > 0) {
      const cellsToClear: { r: number; c: number }[] = []
      rowsToClear.forEach(r => {
        for (let c = 0; c < COLS; c++) {
          if (!cellsToClear.some(x => x.r === r && x.c === c)) cellsToClear.push({ r, c })
        }
      })
      colsToClear.forEach(c => {
        for (let r = 0; r < ROWS; r++) {
          if (!cellsToClear.some(x => x.r === r && x.c === c)) cellsToClear.push({ r, c })
        }
      })
      setClearingCells(cellsToClear)

      const currentCombo = linesCleared > 1 ? comboRef.current + linesCleared : comboRef.current + 1
      const addedScore = blocksCount + linesCleared * 10 * currentCombo
      const newScore = scoreRef.current + addedScore
      const newLines = linesRef.current + linesCleared

      setTimeout(() => {
        const clearedBoard = newBoard.map(r => [...r])
        cellsToClear.forEach(({ r, c }) => { clearedBoard[r][c] = null })
        setBoard(clearedBoard)
        boardStateRef.current = clearedBoard
        setClearingCells([])
        setScore(newScore); scoreRef.current = newScore
        setLines(newLines); linesRef.current = newLines
        setCombo(currentCombo); comboRef.current = currentCombo
        checkPostPlace(clearedBoard, index, newScore)
      }, 400)
    } else {
      const newScore = scoreRef.current + blocksCount
      setScore(newScore); scoreRef.current = newScore
      setCombo(0); comboRef.current = 0
      checkPostPlace(newBoard, index, newScore)
    }
  }, [checkPostPlace])

  // ─── Global pointer move: imperative DOM update (zero React overhead) ───────
  const onGlobalPointerMove = useCallback((e: PointerEvent) => {
    if (!dragStateRef.current) return

    cursorRef.current = { x: e.clientX, y: e.clientY }

    // 1. Update overlay position DIRECTLY (no React, no lag)
    applyOverlayPosition(e.clientX, e.clientY)

    // 2. Update board highlight via rAF (throttled, slight lag is OK)
    cancelAnimationFrame(rafRef.current)
    rafRef.current = requestAnimationFrame(() => {
      const drag = dragStateRef.current
      if (!drag) return
      const { hoverRow, hoverCol, isValid } = computeHoverPos(
        cursorRef.current.x,
        cursorRef.current.y,
        drag.piece
      )
      setDragHighlight(prev => {
        if (!prev) return prev
        if (prev.hoverRow === hoverRow && prev.hoverCol === hoverCol && prev.isValid === isValid) return prev
        return { ...prev, hoverRow, hoverCol, isValid }
      })
    })
  }, [applyOverlayPosition, computeHoverPos])

  // ─── Global pointer up: place piece ─────────────────────────────────────────
  const onGlobalPointerUp = useCallback(() => {
    const drag = dragStateRef.current
    if (!drag) return
    dragStateRef.current = null
    cancelAnimationFrame(rafRef.current)
    document.body.style.overflow = ''

    setDragHighlight(prev => {
      if (
        prev &&
        prev.isValid &&
        canPlace(boardStateRef.current, prev.piece.matrix, prev.hoverRow, prev.hoverCol)
      ) {
        placePiece(prev.piece, drag.index, prev.hoverRow, prev.hoverCol)
      }
      return null
    })
  }, [canPlace, placePiece])

  // Attach global pointer listeners once (always on)
  useEffect(() => {
    // passive: false on move so we CAN call preventDefault if needed (e.g. iOS)
    document.addEventListener('pointermove', onGlobalPointerMove, { passive: false })
    document.addEventListener('pointerup', onGlobalPointerUp)
    document.addEventListener('pointercancel', onGlobalPointerUp)
    return () => {
      document.removeEventListener('pointermove', onGlobalPointerMove)
      document.removeEventListener('pointerup', onGlobalPointerUp)
      document.removeEventListener('pointercancel', onGlobalPointerUp)
    }
  }, [onGlobalPointerMove, onGlobalPointerUp])

  // ─── After overlay is first rendered, position it immediately ────────────────
  useLayoutEffect(() => {
    if (dragHighlight) {
      applyOverlayPosition(cursorRef.current.x, cursorRef.current.y)
    }
  }, [!!dragHighlight, applyOverlayPosition])

  // ─── Pointer down: start drag ────────────────────────────────────────────────
  const handlePointerDown = (
    e: React.PointerEvent<HTMLDivElement>,
    index: number,
    piece: Piece
  ) => {
    if (dragStateRef.current) return
    if (isGameOverRef.current || clearingCells.length > 0) return
    e.preventDefault()

    const isTouch = e.pointerType === 'touch' || e.pointerType === 'pen'
    if (isTouch) document.body.style.overflow = 'hidden'

    cursorRef.current = { x: e.clientX, y: e.clientY }
    dragStateRef.current = { index, piece, isTouch }

    const { hoverRow, hoverCol, isValid } = computeHoverPos(e.clientX, e.clientY, piece)
    // Show overlay (React render) - position will be applied in useLayoutEffect above
    setDragHighlight({ index, piece, hoverRow, hoverCol, isValid })
  }

  const restart = () => {
    setBoard(Array(ROWS).fill(null).map(() => Array(COLS).fill(null)))
    setHand([getRandomPiece(), getRandomPiece(), getRandomPiece()])
    setScore(0); setLines(0); setCombo(0); setIsGameOver(false)
  }

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen().catch(console.error)
    } else {
      document.exitFullscreen()
    }
  }

  useEffect(() => {
    const onChange = () => setIsFullscreen(!!document.fullscreenElement)
    document.addEventListener('fullscreenchange', onChange)
    return () => document.removeEventListener('fullscreenchange', onChange)
  }, [])

  useEffect(() => {
    const checkSize = () => {
      const w = window.innerWidth
      const newSize = w < 400 ? 36 : w < 600 ? 44 : 52
      setCellSize(newSize)
      cellSizeRef.current = newSize
    }
    checkSize()
    window.addEventListener('resize', checkSize)
    return () => window.removeEventListener('resize', checkSize)
  }, [])

  // ─── Render ──────────────────────────────────────────────────────────────────
  return (
    <div
      className={`blockblast-game ${isFullscreen ? 'fullscreen-mode' : ''}`}
      ref={containerRef}
      style={{
        '--cell-size': `${cellSize}px`,
        background: isFullscreen ? '#0a0a1a' : 'transparent',
        padding: isFullscreen ? '20px' : '0',
        height: isFullscreen ? '100vh' : 'auto',
      } as React.CSSProperties}
    >
      <div className="bb-main">
        {/* Board */}
        <div className="bb-board-wrap">
          <button
            onClick={toggleFullscreen}
            className="absolute top-2 right-2 z-10 p-1.5 rounded-lg hover:bg-white/10 transition-colors"
            style={{ background: 'rgba(255,255,255,0.1)', border: 'none', cursor: 'pointer' }}
            title="Toàn màn hình"
          >
            {isFullscreen ? '↙️' : '↗️'}
          </button>

          <div className="bb-board" ref={boardRef}>
            {board.map((row, r) =>
              row.map((cellColor, c) => {
                const isHover =
                  dragHighlight?.isValid &&
                  r >= dragHighlight.hoverRow &&
                  r < dragHighlight.hoverRow + dragHighlight.piece.matrix.length &&
                  c >= dragHighlight.hoverCol &&
                  c < dragHighlight.hoverCol + dragHighlight.piece.matrix[0].length &&
                  !!dragHighlight.piece.matrix[r - dragHighlight.hoverRow]?.[c - dragHighlight.hoverCol]

                const isClearing = clearingCells.some(x => x.r === r && x.c === c)
                const isPlaced = placedCells.some(x => x.r === r && x.c === c)

                return (
                  <div
                    key={`${r}-${c}`}
                    className={`bb-cell${isClearing ? ' anim-clear' : ''}${isPlaced ? ' anim-place' : ''}`}
                  >
                    {(cellColor || isHover) && (
                      <div
                        className="bb-block"
                        style={{
                          background: cellColor
                            ? COLORS[cellColor]
                            : COLORS[dragHighlight!.piece.color],
                          opacity: cellColor ? 1 : 0.45,
                        }}
                      >
                        <div className="bb-block-inner" />
                      </div>
                    )}
                  </div>
                )
              })
            )}
          </div>

          {/* Hand */}
          <div className="bb-hand">
            {hand.map((piece, i) => (
              <div key={i} className="bb-hand-slot">
                {piece && (
                  <div
                    className="bb-piece"
                    onPointerDown={e => handlePointerDown(e, i, piece)}
                    style={{
                      gridTemplateColumns: `repeat(${piece.matrix[0].length}, var(--hand-cell-size))`,
                      opacity: dragHighlight?.index === i ? 0 : 1,
                      cursor: dragHighlight?.index === i ? 'none' : 'grab',
                    }}
                  >
                    {piece.matrix.map((row, r) =>
                      row.map((val, c) => (
                        <div key={`${r}-${c}`} className="bb-piece-cell">
                          {val ? (
                            <div className="bb-block" style={{ background: COLORS[piece.color] }}>
                              <div className="bb-block-inner" />
                            </div>
                          ) : null}
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Sidebar */}
        <div className="bb-sidebar">
          <div className="bb-stat-card">
            <div className="bb-stat-label">
              <span className="desktop-only">ĐIỂM SỐ</span>
              <span className="mobile-only">ĐIỂM</span>
            </div>
            <div className="bb-stat-value bb-score-val">{score.toLocaleString()}</div>
            <div className="bb-progress">
              <div className="bb-progress-fill" style={{ width: `${Math.min((score / 20000) * 100, 100)}%` }} />
            </div>
          </div>

          <div className="bb-stat-row">
            <div className="bb-stat-card bb-stat-half">
              <div className="bb-stat-label">
                <span className="desktop-only">HÀNG ĐÃ XÓA</span>
                <span className="mobile-only">HÀNG</span>
              </div>
              <div className="bb-stat-value bb-lines-val">{lines}</div>
            </div>
            <div className="bb-stat-card bb-stat-half">
              <div className="bb-stat-label">
                <span className="desktop-only">COMBO</span>
                <span className="mobile-only">CB</span>
              </div>
              <div className="bb-stat-value bb-combo-val">{combo}</div>
            </div>
          </div>

          <div className="bb-stat-card desktop-only" style={{ textAlign: 'center' }}>
            <div className="bb-stat-label">HƯỚNG DẪN</div>
            <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)', marginTop: '4px', lineHeight: 1.4 }}>
              Kéo và thả các khối vào bàn cờ. Điền đầy một hàng hoặc cột để xóa và ghi điểm.
              <br /><br />Trò chơi kết thúc khi không còn chỗ trống.
            </p>
          </div>

          <div className="bb-quick-actions mobile-only">
            <button onClick={restart} className="bb-action-btn bb-action-restart">🔄 Chơi lại</button>
          </div>
        </div>
      </div>

      {/* ─── Drag Overlay: rendered via portal, positioned imperatively ─── */}
      {dragHighlight && typeof document !== 'undefined' && createPortal(
        <div
          ref={overlayRef}
          className="bb-drag-overlay"
          style={{
            // Start invisible - useLayoutEffect will position & show it
            visibility: 'hidden',
            gridTemplateColumns: `repeat(${dragHighlight.piece.matrix[0].length}, ${cellSize}px)`,
          }}
        >
          {dragHighlight.piece.matrix.map((row, r) =>
            row.map((val, c) => (
              <div key={`${r}-${c}`} className="bb-piece-cell" style={{ width: cellSize, height: cellSize }}>
                {val ? (
                  <div className="bb-block dragging" style={{ background: COLORS[dragHighlight.piece.color] }}>
                    <div className="bb-block-inner" />
                  </div>
                ) : null}
              </div>
            ))
          )}
        </div>,
        document.body
      )}

      {isGameOver && (
        <div className="bb-gameover">
          <div className="bb-gameover-content">
            <h2>HẾT CHỖ!</h2>
            <p>Tổng điểm: {score}</p>
            <button onClick={restart} className="bb-restart-btn">Chơi Lại</button>
          </div>
        </div>
      )}

      <style>{`
        .blockblast-game {
          display: flex; flex-direction: column; width: 100%; align-items: center;
          user-select: none; touch-action: none;
        }
        .blockblast-game.fullscreen-mode { justify-content: center; }
        .bb-main { display: flex; gap: 24px; justify-content: center; align-items: stretch; width: 100%; max-width: 900px; }
        .bb-board-wrap { position: relative; flex-shrink: 0; display: flex; flex-direction: column; align-items: center; }
        .bb-board {
          display: grid;
          grid-template-columns: repeat(8, var(--cell-size));
          grid-template-rows: repeat(8, var(--cell-size));
          background: #050510; border-radius: 12px; padding: 6px;
          border: 2px solid rgba(255,255,255,0.08);
          box-shadow: inset 0 0 40px rgba(0,0,0,0.8); gap: 2px;
        }
        .bb-cell {
          width: var(--cell-size); height: var(--cell-size);
          background: rgba(255,255,255,0.02); border-radius: 6px;
          box-shadow: inset 0 0 0 1px rgba(255,255,255,0.03);
        }
        .bb-block {
          width: 100%; height: 100%; border-radius: 6px;
          box-shadow: inset 0 0 0 1px rgba(0,0,0,0.2), 0 2px 5px rgba(0,0,0,0.4);
          position: relative; overflow: hidden;
        }
        .bb-block-inner {
          position: absolute; top: 12%; left: 12%; right: 12%; bottom: 12%;
          border-radius: 3px; background: rgba(255,255,255,0.18);
          box-shadow: inset 0 1px 3px rgba(255,255,255,0.5);
        }
        .bb-hand {
          display: flex; justify-content: center; gap: 16px; margin-top: 30px;
          height: calc(var(--cell-size) * 4); align-items: center; width: 100%;
          --hand-cell-size: calc(var(--cell-size) * 0.55);
        }
        .bb-hand-slot { flex: 1; height: 100%; display: flex; justify-content: center; align-items: center; }
        .bb-piece {
          display: grid; gap: 2px; touch-action: none; cursor: grab;
          transition: transform 0.15s;
        }
        .bb-piece:hover { transform: scale(1.08); }
        .bb-piece-cell { width: var(--cell-size); height: var(--cell-size); }
        .bb-hand-slot .bb-piece-cell { width: var(--hand-cell-size); height: var(--hand-cell-size); }

        /* ─── Overlay: position: fixed, left/top managed imperatively ─── */
        .bb-drag-overlay {
          position: fixed;
          top: 0; left: 0;        /* initial values - overwritten by JS */
          z-index: 9999;
          pointer-events: none;
          display: grid; gap: 2px;
          will-change: left, top;
        }
        .bb-block.dragging {
          box-shadow: 0 12px 30px rgba(0,0,0,0.7), 0 0 0 2px rgba(255,255,255,0.2);
          transform: scale(1.05);
        }

        .bb-sidebar { display: flex; flex-direction: column; gap: 12px; min-width: 180px; max-width: 220px; }
        .bb-stat-card {
          background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.08);
          border-radius: 16px; padding: 16px; backdrop-filter: blur(16px);
        }
        .bb-stat-label {
          font-size: 10px; font-weight: 700; letter-spacing: 2px;
          color: rgba(255,255,255,0.4); margin-bottom: 6px; text-transform: uppercase;
        }
        .bb-stat-value { font-weight: 900; line-height: 1; }
        .bb-score-val { font-size: 34px; color: #00e5ff; text-shadow: 0 0 10px #00e5ff, 0 0 30px #00e5ff; }
        .bb-lines-val { font-size: 28px; color: #39e75f; text-shadow: 0 0 10px #39e75f, 0 0 30px #39e75f; }
        .bb-combo-val { font-size: 28px; color: #ffe14d; text-shadow: 0 0 10px #ffe14d, 0 0 30px #ffe14d; }
        .bb-stat-row { display: flex; flex-direction: column; gap: 12px; }
        .bb-stat-half { flex: unset; }
        .bb-progress { margin-top: 12px; height: 5px; border-radius: 5px; background: rgba(255,255,255,0.06); overflow: hidden; }
        .bb-progress-fill {
          height: 100%; border-radius: 5px; transition: width 0.5s ease;
          background: linear-gradient(90deg, #00e5ff, #b44dff);
          box-shadow: 0 0 8px rgba(0,229,255,0.5);
        }
        .bb-quick-actions { display: flex; gap: 8px; }
        .bb-action-btn {
          flex: 1; padding: 10px; border-radius: 12px; font-size: 14px;
          font-weight: 700; cursor: pointer; font-family: 'Outfit', sans-serif;
        }
        .bb-action-restart { background: rgba(0,229,255,0.1); border: 1px solid rgba(0,229,255,0.2); color: #00e5ff; }
        .bb-gameover {
          position: absolute; inset: 0; background: rgba(0,0,0,0.85);
          border-radius: 12px; display: flex; justify-content: center; align-items: center;
          z-index: 200; backdrop-filter: blur(8px);
        }
        .bb-gameover-content { text-align: center; }
        .bb-gameover h2 { color: #ff4d6a; font-size: 42px; margin-bottom: 12px; text-shadow: 0 0 20px rgba(255,77,106,0.6); font-weight: 900; }
        .bb-gameover p { color: rgba(255,255,255,0.8); font-size: 18px; margin-bottom: 24px; font-weight: 600; }
        .bb-restart-btn {
          background: linear-gradient(135deg, #e41d1d, #ff4d6a); border: none;
          padding: 14px 36px; border-radius: 14px; color: white; font-size: 18px; font-weight: 800;
          cursor: pointer; transition: 0.2s; box-shadow: 0 5px 20px rgba(228,29,29,0.4);
          font-family: 'Outfit', sans-serif;
        }
        .bb-restart-btn:hover { transform: translateY(-2px) scale(1.05); box-shadow: 0 8px 25px rgba(228,29,29,0.6); }

        .mobile-only { display: none !important; }
        .desktop-only { display: inline !important; }

        @media (max-width: 800px) {
          .mobile-only { display: flex !important; }
          .desktop-only { display: none !important; }
          .bb-main { flex-direction: column; gap: 16px; align-items: center; }
          .bb-sidebar { flex-direction: row; min-width: 100%; max-width: 100%; gap: 10px; justify-content: center; padding: 0 10px; }
          .bb-stat-card { padding: 10px; border-radius: 12px; flex: 1; display: flex; flex-direction: column; align-items: center; }
          .bb-stat-row { flex-direction: row; gap: 10px; flex: 1.5; }
          .bb-stat-half { flex: 1; }
          .bb-stat-label { font-size: 9px; letter-spacing: 1px; margin-bottom: 4px; }
          .bb-score-val { font-size: 24px; }
          .bb-lines-val, .bb-combo-val { font-size: 20px; }
          .bb-progress { margin-top: 6px; height: 3px; }
          .bb-hand { height: auto; padding: 10px 0; gap: 8px; margin-top: 10px; }
          .bb-hand-slot { width: auto; flex: 1; }
          .bb-quick-actions { flex: 1; }
          .bb-action-btn { font-size: 13px; padding: 8px; }
        }

        @keyframes popIn {
          0% { transform: scale(0.5); opacity: 0; }
          70% { transform: scale(1.1); }
          100% { transform: scale(1); opacity: 1; }
        }
        .anim-place .bb-block { animation: popIn 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275); }

        @keyframes popOut {
          0% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.2); opacity: 0.8; filter: brightness(1.5); }
          100% { transform: scale(0); opacity: 0; }
        }
        .anim-clear .bb-block { animation: popOut 0.4s ease-out forwards; }
      `}</style>
    </div>
  )
}

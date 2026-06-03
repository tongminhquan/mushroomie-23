'use client'

import React, { useEffect, useRef, useState, useCallback } from 'react'
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
  [[1]], // 1x1
  [[1,1]], [[1],[1]], // 2x1, 1x2
  [[1,1,1]], [[1],[1],[1]], // 3x1, 1x3
  [[1,1,1,1]], [[1],[1],[1],[1]], // 4x1, 1x4
  [[1,1,1,1,1]], [[1],[1],[1],[1],[1]], // 5x1, 1x5
  [[1,1],[1,1]], // 2x2
  [[1,1,1],[1,1,1],[1,1,1]], // 3x3
  [[1,1],[1,0]], [[1,1],[0,1]], [[1,0],[1,1]], [[0,1],[1,1]], // Small L
  [[1,0,0],[1,0,0],[1,1,1]], [[0,0,1],[0,0,1],[1,1,1]], [[1,1,1],[1,0,0],[1,0,0]], [[1,1,1],[0,0,1],[0,0,1]], // Large L
  [[1,1,1],[0,1,0]], [[0,1,0],[1,1,1]], [[1,0],[1,1],[1,0]], [[0,1],[1,1],[0,1]], // T shapes
  [[0,1,0],[1,1,1],[0,1,0]], // Cross +
  [[1,1,0],[0,1,1]], [[0,1,1],[1,1,0]], [[1,0],[1,1],[0,1]], [[0,1],[1,1],[1,0]], // S/Z shapes
]

type Piece = {
  id: string
  matrix: number[][]
  color: string
}

function getRandomPiece(): Piece {
  const matrix = SHAPES[Math.floor(Math.random() * SHAPES.length)]
  const color = COLOR_KEYS[Math.floor(Math.random() * COLOR_KEYS.length)]
  return { id: Math.random().toString(36).substring(2, 9), matrix, color }
}

export default function BlockBlastGame({ onGameOver }: { onGameOver: (score: number) => void }) {
  const [cellSize, setCellSize] = useState(45)
  const cellSizeRef = useRef(45)
  useEffect(() => { cellSizeRef.current = cellSize }, [cellSize])
  
  const [board, setBoard] = useState<(string | null)[][]>(Array(ROWS).fill(null).map(() => Array(COLS).fill(null)))
  const [hand, setHand] = useState<(Piece | null)[]>([getRandomPiece(), getRandomPiece(), getRandomPiece()])
  const [score, setScore] = useState(0)
  const [lines, setLines] = useState(0)
  const [combo, setCombo] = useState(0)
  const [isGameOver, setIsGameOver] = useState(false)
  const [isFullscreen, setIsFullscreen] = useState(false)
  
  const containerRef = useRef<HTMLDivElement>(null)
  const boardRef = useRef<HTMLDivElement>(null)
  const overlayRef = useRef<HTMLDivElement>(null)

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

  const dragRef = useRef<{
    index: number;
    piece: Piece;
    offsetX: number;
    offsetY: number;
    isTouch: boolean;
  } | null>(null)

  const [dragRenderState, setDragRenderState] = useState<{
    index: number;
    piece: Piece;
    x: number;
    y: number;
    hoverRow: number;
    hoverCol: number;
    isValid: boolean;
  } | null>(null)

  const [clearingCells, setClearingCells] = useState<{r: number, c: number}[]>([])
  const [placedCells, setPlacedCells] = useState<{r: number, c: number}[]>([])

  const canPlace = useCallback((boardState: (string | null)[][], matrix: number[][], row: number, col: number) => {
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

  const computeHoverPos = useCallback((dragX: number, dragY: number, piece: Piece) => {
    let hoverRow = -1, hoverCol = -1, isValid = false
    if (boardRef.current) {
      const rect = boardRef.current.getBoundingClientRect()
      const BOARD_PADDING = 6
      const cs = cellSizeRef.current
      const CELL_STRIDE = cs + 2
      const pieceRelX = dragX - rect.left - BOARD_PADDING
      const pieceRelY = dragY - rect.top - BOARD_PADDING
      const col = Math.round(pieceRelX / CELL_STRIDE)
      const row = Math.round(pieceRelY / CELL_STRIDE)
      if (row >= -2 && row <= ROWS + 2 && col >= -2 && col <= COLS + 2) {
        hoverRow = row
        hoverCol = col
        isValid = canPlace(boardStateRef.current, piece.matrix, row, col)
      }
    }
    return { hoverRow, hoverCol, isValid }
  }, [canPlace])

  const onGlobalPointerMove = useCallback((e: PointerEvent) => {
    if (!dragRef.current) return
    const { piece, offsetX, offsetY } = dragRef.current
    const dragX = e.clientX - offsetX
    const dragY = e.clientY - offsetY
    
    if (overlayRef.current) {
      overlayRef.current.style.transform = `translate(${dragX}px, ${dragY}px)`
    }
    
    const { hoverRow, hoverCol, isValid } = computeHoverPos(dragX, dragY, piece)
    
    setDragRenderState(prev => {
      if (!prev) return prev
      return { ...prev, x: dragX, y: dragY, hoverRow, hoverCol, isValid }
    })
  }, [computeHoverPos])

  const checkGameOver = useCallback((boardState: (string | null)[][], currentHand: (Piece | null)[], currentScore: number) => {
    let anyMovePossible = false
    for (let i = 0; i < currentHand.length; i++) {
      const piece = currentHand[i]
      if (!piece) continue
      for (let r = 0; r < ROWS; r++) {
        for (let c = 0; c < COLS; c++) {
          if (canPlace(boardState, piece.matrix, r, c)) {
            anyMovePossible = true; break
          }
        }
        if (anyMovePossible) break
      }
      if (anyMovePossible) break
    }
    if (!anyMovePossible && currentHand.some(p => p !== null)) {
      setIsGameOver(true)
      onGameOver(currentScore)
    }
  }, [canPlace, onGameOver])

  const checkPostPlace = useCallback((currentBoard: (string | null)[][], usedIndex: number, currentScore: number) => {
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
    const newPlacedCells: {r: number, c: number}[] = []
    for (let r = 0; r < piece.matrix.length; r++) {
      for (let c = 0; c < piece.matrix[r].length; c++) {
        if (piece.matrix[r][c]) {
          newBoard[row + r][col + c] = piece.color
          newPlacedCells.push({r: row + r, c: col + c})
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
      const cellsToClear: {r: number, c: number}[] = []
      rowsToClear.forEach(r => {
        for (let c = 0; c < COLS; c++) {
          if (!cellsToClear.some(cell => cell.r === r && cell.c === c)) cellsToClear.push({r, c})
        }
      })
      colsToClear.forEach(c => {
        for (let r = 0; r < ROWS; r++) {
          if (!cellsToClear.some(cell => cell.r === r && cell.c === c)) cellsToClear.push({r, c})
        }
      })
      setClearingCells(cellsToClear)

      const currentCombo = linesCleared > 1 ? comboRef.current + linesCleared : comboRef.current + 1
      const addedScore = blocksCount + (linesCleared * 10 * currentCombo)
      const newScore = scoreRef.current + addedScore
      const newLines = linesRef.current + linesCleared

      setTimeout(() => {
        const clearedBoard = newBoard.map(r => [...r])
        cellsToClear.forEach(({r, c}) => clearedBoard[r][c] = null)
        setBoard(clearedBoard)
        boardStateRef.current = clearedBoard
        setClearingCells([])
        setScore(newScore)
        scoreRef.current = newScore
        setLines(newLines)
        linesRef.current = newLines
        setCombo(currentCombo)
        comboRef.current = currentCombo
        checkPostPlace(clearedBoard, index, newScore)
      }, 400)
    } else {
      const newScore = scoreRef.current + blocksCount
      setScore(newScore)
      scoreRef.current = newScore
      setCombo(0)
      comboRef.current = 0
      checkPostPlace(newBoard, index, newScore)
    }
  }, [checkPostPlace])

  const onGlobalPointerUp = useCallback((e: PointerEvent) => {
    if (!dragRef.current) return
    const drag = dragRef.current
    dragRef.current = null

    setDragRenderState(prev => {
      if (prev && prev.isValid && canPlace(boardStateRef.current, prev.piece.matrix, prev.hoverRow, prev.hoverCol)) {
        placePiece(prev.piece, drag.index, prev.hoverRow, prev.hoverCol)
      }
      return null
    })

    document.body.style.overflow = ''
  }, [canPlace, placePiece])

  useEffect(() => {
    if (!dragRenderState) return
    document.addEventListener('pointermove', onGlobalPointerMove, { passive: true })
    document.addEventListener('pointerup', onGlobalPointerUp)
    document.addEventListener('pointercancel', onGlobalPointerUp)
    return () => {
      document.removeEventListener('pointermove', onGlobalPointerMove)
      document.removeEventListener('pointerup', onGlobalPointerUp)
      document.removeEventListener('pointercancel', onGlobalPointerUp)
    }
  }, [!!dragRenderState, onGlobalPointerMove, onGlobalPointerUp])

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>, index: number, piece: Piece) => {
    if (dragRef.current) return
    if (isGameOverRef.current || clearingCells.length > 0) return
    e.preventDefault()

    const isTouch = e.pointerType === 'touch' || e.pointerType === 'pen'
    const el = e.currentTarget
    const rect = el.getBoundingClientRect()
    const relX = (e.clientX - rect.left) / rect.width
    const relY = (e.clientY - rect.top) / rect.height
    const cs = cellSizeRef.current
    const renderedWidth = piece.matrix[0].length * cs
    const renderedHeight = piece.matrix.length * cs
    const touchYOffset = isTouch ? cs * 1.5 : 0
    const offsetX = relX * renderedWidth
    const offsetY = relY * renderedHeight + touchYOffset

    dragRef.current = { index, piece, offsetX, offsetY, isTouch }
    if (isTouch) document.body.style.overflow = 'hidden'

    const dragX = e.clientX - offsetX
    const dragY = e.clientY - offsetY
    const { hoverRow, hoverCol, isValid } = computeHoverPos(dragX, dragY, piece)

    setDragRenderState({ index, piece, x: dragX, y: dragY, hoverRow, hoverCol, isValid })
  }

  const restart = () => {
    setBoard(Array(ROWS).fill(null).map(() => Array(COLS).fill(null)))
    setHand([getRandomPiece(), getRandomPiece(), getRandomPiece()])
    setScore(0)
    setLines(0)
    setCombo(0)
    setIsGameOver(false)
  }

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen().catch(e => console.error(e))
    } else {
      document.exitFullscreen()
    }
  }

  useEffect(() => {
    const onFullscreenChange = () => setIsFullscreen(!!document.fullscreenElement)
    document.addEventListener('fullscreenchange', onFullscreenChange)
    return () => document.removeEventListener('fullscreenchange', onFullscreenChange)
  }, [])

  useEffect(() => {
    const checkSize = () => {
      const width = window.innerWidth
      if (width < 400) setCellSize(40)
      else if (width < 600) setCellSize(48)
      else setCellSize(55)
    }
    checkSize()
    window.addEventListener('resize', checkSize)
    return () => window.removeEventListener('resize', checkSize)
  }, [])

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
        <div className="bb-board-wrap">
          <button 
             onClick={toggleFullscreen} 
             className="absolute top-2 right-2 z-10 p-1.5 rounded-lg hover:bg-white/10 transition-colors"
             style={{ background: 'rgba(255,255,255,0.1)', border: 'none', cursor: 'pointer' }}
             title="Toàn màn hình"
          >
             {isFullscreen ? '↙️' : '↗️'}
          </button>
          
          <div className="bb-size-controls hidden md:flex absolute top-2 left-2 z-10">
             <span className="text-xs text-white/50 mr-2 self-center">Kích thước:</span>
             {[30, 45, 60].map(s => (
                <button 
                   key={s} 
                   onClick={() => setCellSize(s)}
                   className={`bb-size-btn ${cellSize === s ? 'active' : ''}`}
                >
                   {s}
                </button>
             ))}
          </div>

          <div className="bb-board" ref={boardRef}>
            {board.map((row, r) => (
              row.map((cellColor, c) => {
                const isHover = dragRenderState?.isValid &&
                                r >= dragRenderState.hoverRow && 
                                r < dragRenderState.hoverRow + dragRenderState.piece.matrix.length &&
                                c >= dragRenderState.hoverCol && 
                                c < dragRenderState.hoverCol + dragRenderState.piece.matrix[0].length &&
                                dragRenderState.piece.matrix[r - dragRenderState.hoverRow][c - dragRenderState.hoverCol];
                
                const isClearing = clearingCells.some(cell => cell.r === r && cell.c === c);
                const isPlaced = placedCells.some(cell => cell.r === r && cell.c === c);

                return (
                  <div 
                    key={`${r}-${c}`} 
                    className={`bb-cell ${isClearing ? 'anim-clear' : ''} ${isPlaced ? 'anim-place' : ''}`}
                  >
                    {(cellColor || isHover) && (
                      <div 
                        className="bb-block"
                        style={{ 
                           background: cellColor ? COLORS[cellColor] : COLORS[dragRenderState!.piece.color],
                           opacity: cellColor ? 1 : 0.4
                        }}
                      >
                         <div className="bb-block-inner" />
                      </div>
                    )}
                  </div>
                )
              })
            ))}
          </div>

          <div className="bb-hand">
             {hand.map((piece, i) => (
                <div key={i} className="bb-hand-slot">
                   {piece && (
                      <div 
                         className="bb-piece"
                         onPointerDown={(e) => handlePointerDown(e, i, piece)}
                         style={{
                            gridTemplateColumns: `repeat(${piece.matrix[0].length}, var(--hand-cell-size))`,
                            opacity: dragRenderState?.index === i ? 0 : 1,
                            cursor: dragRenderState?.index === i ? 'none' : 'grab',
                         }}
                      >
                         {piece.matrix.map((row, r) => 
                            row.map((val, c) => (
                               <div key={`${r}-${c}`} className="bb-piece-cell">
                                  {val ? (
                                     <div 
                                        className="bb-block" 
                                        style={{ background: COLORS[piece.color] }}
                                     >
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

        <div className="bb-sidebar">
          <div className="bb-stat-card">
            <div className="bb-stat-label"><span className="desktop-only">ĐIỂM SỐ</span><span className="mobile-only">ĐIỂM</span></div>
            <div className="bb-stat-value bb-score-val">{score.toLocaleString()}</div>
            <div className="bb-progress">
              <div className="bb-progress-fill" style={{ width: `${Math.min((score / 20000) * 100, 100)}%` }} />
            </div>
          </div>

          <div className="bb-stat-row">
            <div className="bb-stat-card bb-stat-half">
              <div className="bb-stat-label"><span className="desktop-only">HÀNG ĐÃ XÓA</span><span className="mobile-only">HÀNG</span></div>
              <div className="bb-stat-value bb-lines-val">{lines}</div>
            </div>
            <div className="bb-stat-card bb-stat-half">
              <div className="bb-stat-label"><span className="desktop-only">COMBO</span><span className="mobile-only">CB</span></div>
              <div className="bb-stat-value bb-combo-val">{combo}</div>
            </div>
          </div>

          <div className="bb-stat-card desktop-only" style={{ textAlign: 'center' }}>
             <div className="bb-stat-label">HƯỚNG DẪN</div>
             <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)', marginTop: '4px', lineHeight: 1.4 }}>
                Kéo và thả các khối vào bàn cờ. Điền đầy một hàng hoặc một cột để xóa chúng và ghi điểm. 
                <br/><br/>Trò chơi kết thúc khi không còn chỗ trống.
             </p>
          </div>

          <div className="bb-quick-actions mobile-only">
            <button onClick={restart} className="bb-action-btn bb-action-restart">🔄 Chơi lại</button>
          </div>
        </div>
      </div>

      {dragRenderState && typeof document !== 'undefined' && createPortal(
         <div 
            className="bb-drag-overlay"
            ref={overlayRef}
            style={{
               transform: `translate(${dragRenderState.x}px, ${dragRenderState.y}px)`,
               gridTemplateColumns: `repeat(${dragRenderState.piece.matrix[0].length}, ${cellSize}px)`
            }}
         >
            {dragRenderState.piece.matrix.map((row, r) => 
               row.map((val, c) => (
                  <div key={`${r}-${c}`} className="bb-piece-cell" style={{ width: cellSize, height: cellSize }}>
                     {val ? (
                        <div 
                           className="bb-block dragging" 
                           style={{ background: COLORS[dragRenderState.piece.color] }}
                        >
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
        .blockblast-game { display: flex; flex-direction: column; width: 100%; align-items: center; user-select: none; touch-action: none; }
        .blockblast-game.fullscreen-mode { justify-content: center; }
        
        .bb-main { display: flex; gap: 24px; justify-content: center; align-items: stretch; width: 100%; max-width: 900px; }

        /* Board Area */
        .bb-board-wrap { position: relative; flex-shrink: 0; display: flex; flex-direction: column; align-items: center; }
        
        .bb-board {
           display: grid; grid-template-columns: repeat(8, var(--cell-size));
           grid-template-rows: repeat(8, var(--cell-size));
           background: #050510; border-radius: 12px; padding: 6px;
           border: 2px solid rgba(255,255,255,0.08); box-shadow: inset 0 0 40px rgba(0,0,0,0.8);
           gap: 2px;
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
        .bb-hand-slot {
           flex: 1; height: 100%;
           display: flex; justify-content: center; align-items: center;
        }
        .bb-piece {
           display: grid; gap: 2px; touch-action: none; cursor: grab;
           transition: transform 0.2s;
        }
        .bb-piece:active { cursor: grabbing; transform: scale(0.95); }
        .bb-piece-cell { width: var(--cell-size); height: var(--cell-size); }
        .bb-hand-slot .bb-piece-cell { width: var(--hand-cell-size); height: var(--hand-cell-size); }
        
        .bb-drag-overlay {
           position: fixed; top: 0; left: 0; z-index: 9999; pointer-events: none;
           display: grid; gap: 2px; will-change: transform;
        }
        .bb-block.dragging {
           box-shadow: 0 10px 25px rgba(0,0,0,0.6);
        }

        /* Sidebar similar to Tetris */
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
        .bb-progress-fill { height: 100%; border-radius: 5px; transition: width 0.5s ease; background: linear-gradient(90deg, #00e5ff, #b44dff); box-shadow: 0 0 8px rgba(0,229,255,0.5); }

        .bb-size-controls { display: flex; }
        .bb-size-btn {
           background: rgba(255,255,255,0.05); border: 1px solid transparent; color: rgba(255,255,255,0.5);
           border-radius: 6px; padding: 4px 8px; margin: 0 4px; cursor: pointer; transition: 0.2s; font-size: 11px;
        }
        .bb-size-btn.active {
           background: rgba(0,229,255,0.15); color: #00e5ff; border-color: rgba(0,229,255,0.3);
        }

        .bb-quick-actions { display: flex; gap: 8px; }
        .bb-action-btn {
          flex: 1; padding: 10px; border-radius: 12px; font-size: 14px;
          font-weight: 700; cursor: pointer; font-family: 'Outfit', sans-serif;
        }
        .bb-action-restart { background: rgba(0,229,255,0.1); border: 1px solid rgba(0,229,255,0.2); color: #00e5ff; }

        /* Game Over */
        .bb-gameover {
           position: absolute; inset: 0; background: rgba(0,0,0,0.85); border-radius: 12px;
           display: flex; justify-content: center; align-items: center; z-index: 200;
           backdrop-filter: blur(8px);
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

        /* Mobile specific hiding */
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
           
           .bb-size-controls { display: none !important; }
           .bb-quick-actions { flex: 1; }
           .bb-action-btn { font-size: 13px; padding: 8px; }
        }

        /* Animations */
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

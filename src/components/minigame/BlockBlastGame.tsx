'use client'

import React, { useEffect, useRef, useState, useCallback } from 'react'

const ROWS = 8
const COLS = 8

// Colors
const COLORS = [
  '#00e5ff', // cyan
  '#b44dff', // purple
  '#ff4d6a', // pink
  '#e41d1d', // red
  '#ffe14d', // yellow
  '#39e75f', // green
  '#ff8c1a', // orange
]

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
  matrix: number[][]
  color: string
}

function getRandomPiece(): Piece {
  const matrix = SHAPES[Math.floor(Math.random() * SHAPES.length)]
  const color = COLORS[Math.floor(Math.random() * COLORS.length)]
  return { matrix, color }
}

export default function BlockBlastGame({ onGameOver }: { onGameOver: (score: number) => void }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  
  // Game State
  const [cellSize, setCellSize] = useState(36)
  const [board, setBoard] = useState<(string | null)[][]>(Array(ROWS).fill(null).map(() => Array(COLS).fill(null)))
  const [hand, setHand] = useState<(Piece | null)[]>([getRandomPiece(), getRandomPiece(), getRandomPiece()])
  const [score, setScore] = useState(0)
  const [combo, setCombo] = useState(0)
  const [isGameOver, setIsGameOver] = useState(false)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [dragState, setDragState] = useState<{
    index: number;
    piece: Piece;
    x: number;
    y: number;
    offsetX: number;
    offsetY: number;
  } | null>(null)

  // Derived dimensions
  const BOARD_WIDTH = COLS * cellSize
  const BOARD_HEIGHT = ROWS * cellSize
  const HAND_HEIGHT = Math.max(120, cellSize * 4) 
  const CANVAS_WIDTH = Math.max(BOARD_WIDTH + 40, 320)
  const CANVAS_HEIGHT = BOARD_HEIGHT + HAND_HEIGHT + 60 // Padding

  // Draw function
  const draw = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // Clear
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    
    const boardOffsetX = (canvas.width - BOARD_WIDTH) / 2
    const boardOffsetY = 40 // Give space for score

    // Draw Board Background
    ctx.fillStyle = 'rgba(255,255,255,0.02)'
    ctx.strokeStyle = 'rgba(255,255,255,0.05)'
    ctx.lineWidth = 1
    
    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        const x = boardOffsetX + c * cellSize
        const y = boardOffsetY + r * cellSize
        ctx.fillRect(x, y, cellSize, cellSize)
        ctx.strokeRect(x, y, cellSize, cellSize)

        // Draw placed blocks
        if (board[r][c]) {
          drawBlock(ctx, x, y, cellSize, board[r][c]!)
        }
      }
    }

    // Draw Ghost (if dragging)
    if (dragState) {
      const hoverCol = Math.round((dragState.x - dragState.offsetX - boardOffsetX) / cellSize)
      const hoverRow = Math.round((dragState.y - dragState.offsetY - boardOffsetY) / cellSize)
      
      if (canPlace(board, dragState.piece.matrix, hoverRow, hoverCol)) {
        ctx.globalAlpha = 0.3
        for (let r = 0; r < dragState.piece.matrix.length; r++) {
          for (let c = 0; c < dragState.piece.matrix[r].length; c++) {
            if (dragState.piece.matrix[r][c]) {
              drawBlock(ctx, boardOffsetX + (hoverCol + c) * cellSize, boardOffsetY + (hoverRow + r) * cellSize, cellSize, dragState.piece.color)
            }
          }
        }
        ctx.globalAlpha = 1.0
      }
    }

    // Draw Hand Pieces
    const handCell = Math.min(26, cellSize * 0.7) // Smaller cells for hand
    const handY = boardOffsetY + BOARD_HEIGHT + 40
    const slotWidth = canvas.width / 3

    hand.forEach((piece, i) => {
      if (!piece) return
      if (dragState && dragState.index === i) return // Don't draw the piece in hand if it's being dragged

      const pW = piece.matrix[0].length * handCell
      const pH = piece.matrix.length * handCell
      const pX = (slotWidth * i) + (slotWidth - pW) / 2
      const pY = handY + (HAND_HEIGHT - pH) / 2 - 20

      for (let r = 0; r < piece.matrix.length; r++) {
        for (let c = 0; c < piece.matrix[r].length; c++) {
          if (piece.matrix[r][c]) {
            drawBlock(ctx, pX + c * handCell, pY + r * handCell, handCell, piece.color)
          }
        }
      }
    })

    // Draw Dragged Piece
    if (dragState) {
      for (let r = 0; r < dragState.piece.matrix.length; r++) {
        for (let c = 0; c < dragState.piece.matrix[r].length; c++) {
          if (dragState.piece.matrix[r][c]) {
            drawBlock(ctx, dragState.x - dragState.offsetX + c * cellSize, dragState.y - dragState.offsetY + r * cellSize, cellSize, dragState.piece.color)
          }
        }
      }
    }

    // Game Over Overlay
    if (isGameOver) {
      ctx.fillStyle = 'rgba(0,0,0,0.8)'
      ctx.fillRect(0, 0, canvas.width, canvas.height)
      ctx.fillStyle = '#ff4d6a'
      ctx.font = 'bold 36px Outfit'
      ctx.textAlign = 'center'
      ctx.fillText('HẾT CHỖ!', canvas.width/2, canvas.height/2 - 20)
      ctx.fillStyle = '#fff'
      ctx.font = '24px Outfit'
      ctx.fillText(`Điểm: ${score}`, canvas.width/2, canvas.height/2 + 20)
    }

  }, [board, hand, dragState, isGameOver, score, cellSize, BOARD_WIDTH, BOARD_HEIGHT, CANVAS_WIDTH, CANVAS_HEIGHT])

  useEffect(() => {
    let animationId: number
    const render = () => {
      draw()
      animationId = requestAnimationFrame(render)
    }
    render()
    return () => cancelAnimationFrame(animationId)
  }, [draw])

  const drawBlock = (ctx: CanvasRenderingContext2D, x: number, y: number, size: number, color: string) => {
    ctx.fillStyle = color
    ctx.shadowColor = color
    ctx.shadowBlur = 10
    ctx.fillRect(x + 1, y + 1, size - 2, size - 2)
    ctx.shadowBlur = 0 
    ctx.fillStyle = 'rgba(255,255,255,0.3)'
    ctx.fillRect(x + 2, y + 2, size - 4, size / 4)
  }

  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (isGameOver) return
    const canvas = canvasRef.current
    if (!canvas) return
    const rect = canvas.getBoundingClientRect()
    const scaleX = canvas.width / rect.width
    const scaleY = canvas.height / rect.height
    
    const x = (e.clientX - rect.left) * scaleX
    const y = (e.clientY - rect.top) * scaleY

    const handCell = Math.min(26, cellSize * 0.7)
    const boardOffsetY = 40
    const handY = boardOffsetY + BOARD_HEIGHT + 40
    const slotWidth = canvas.width / 3

    for (let i = 0; i < 3; i++) {
      const piece = hand[i]
      if (!piece) continue

      const pW = piece.matrix[0].length * handCell
      const pH = piece.matrix.length * handCell
      const pX = (slotWidth * i) + (slotWidth - pW) / 2
      const pY = handY + (HAND_HEIGHT - pH) / 2 - 20

      // Expanded hit area for mobile
      if (x >= pX - 20 && x <= pX + pW + 20 && y >= pY - 20 && y <= pY + pH + 20) {
        setDragState({
          index: i,
          piece,
          x,
          y,
          offsetX: (piece.matrix[0].length * cellSize) / 2, // center the drag
          offsetY: (piece.matrix.length * cellSize) / 2 + 30 // offset above finger
        })
        break
      }
    }
  }

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!dragState) return
    const canvas = canvasRef.current
    if (!canvas) return
    const rect = canvas.getBoundingClientRect()
    const scaleX = canvas.width / rect.width
    const scaleY = canvas.height / rect.height
    
    const x = (e.clientX - rect.left) * scaleX
    const y = (e.clientY - rect.top) * scaleY

    setDragState({ ...dragState, x, y })
  }

  const handlePointerUp = () => {
    if (!dragState) return
    
    const canvas = canvasRef.current
    if (!canvas) {
      setDragState(null)
      return
    }

    const boardOffsetX = (canvas.width - BOARD_WIDTH) / 2
    const boardOffsetY = 40

    const dropCol = Math.round((dragState.x - dragState.offsetX - boardOffsetX) / cellSize)
    const dropRow = Math.round((dragState.y - dragState.offsetY - boardOffsetY) / cellSize)

    if (canPlace(board, dragState.piece.matrix, dropRow, dropCol)) {
      const newBoard = board.map(row => [...row])
      let blocksPlaced = 0
      for (let r = 0; r < dragState.piece.matrix.length; r++) {
        for (let c = 0; c < dragState.piece.matrix[r].length; c++) {
          if (dragState.piece.matrix[r][c]) {
            newBoard[dropRow + r][dropCol + c] = dragState.piece.color
            blocksPlaced++
          }
        }
      }

      let newScore = score + blocksPlaced * 1 // 1 điểm cho mỗi ô gạch đặt xuống
      
      const rowsToClear: number[] = []
      const colsToClear: number[] = []

      for (let r = 0; r < ROWS; r++) {
        if (newBoard[r].every(c => c !== null)) rowsToClear.push(r)
      }
      for (let c = 0; c < COLS; c++) {
        if (newBoard.every(r => r[c] !== null)) colsToClear.push(c)
      }

      rowsToClear.forEach(r => {
        for (let c = 0; c < COLS; c++) newBoard[r][c] = null
      })
      colsToClear.forEach(c => {
        for (let r = 0; r < ROWS; r++) newBoard[r][c] = null
      })

      const linesCleared = rowsToClear.length + colsToClear.length
      if (linesCleared > 0) {
        // Combo multiplier
        const currentCombo = linesCleared > 1 ? combo + linesCleared : combo + 1
        setCombo(currentCombo)
        newScore += (linesCleared * 10) * currentCombo // 10 điểm cho 1 hàng/cột * hệ số combo
      } else {
        setCombo(0)
      }

      setBoard(newBoard)
      setScore(newScore)
      
      const newHand = [...hand]
      newHand[dragState.index] = null
      
      if (newHand.every(p => p === null)) {
        setHand([getRandomPiece(), getRandomPiece(), getRandomPiece()])
      } else {
        setHand(newHand)
      }
    }
    
    setDragState(null)
  }

  const canPlace = (boardState: (string | null)[][], matrix: number[][], row: number, col: number) => {
    for (let r = 0; r < matrix.length; r++) {
      for (let c = 0; c < matrix[r].length; c++) {
        if (matrix[r][c]) {
          if (row + r < 0 || row + r >= ROWS || col + c < 0 || col + c >= COLS) return false
          if (boardState[row + r][col + c] !== null) return false
        }
      }
    }
    return true
  }

  const restart = () => {
    setBoard(Array(ROWS).fill(null).map(() => Array(COLS).fill(null)))
    setHand([getRandomPiece(), getRandomPiece(), getRandomPiece()])
    setScore(0)
    setCombo(0)
    setIsGameOver(false)
  }

  useEffect(() => {
    if (!isGameOver) {
      let anyMovePossible = false
      for (let i = 0; i < hand.length; i++) {
        const piece = hand[i]
        if (!piece) continue
        for (let r = 0; r < ROWS; r++) {
          for (let c = 0; c < COLS; c++) {
            if (canPlace(board, piece.matrix, r, c)) {
              anyMovePossible = true
              break
            }
          }
          if (anyMovePossible) break
        }
        if (anyMovePossible) break
      }

      if (!anyMovePossible && hand.some(p => p !== null)) {
        setIsGameOver(true)
        onGameOver(score)
      }
    }
  }, [board, hand])

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen().catch(err => {
        console.error(`Error attempting to enable fullscreen: ${err.message}`)
      })
      setIsFullscreen(true)
    } else {
      document.exitFullscreen()
      setIsFullscreen(false)
    }
  }

  useEffect(() => {
    const onFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement)
    }
    document.addEventListener('fullscreenchange', onFullscreenChange)
    return () => document.removeEventListener('fullscreenchange', onFullscreenChange)
  }, [])

  return (
    <div className="blockblast-wrapper w-full">
      
      {/* Size Options */}
      <div className="flex gap-2 justify-center mb-4">
        <span className="text-sm text-white/50 self-center mr-2 hidden sm:block">Kích thước ô:</span>
        {[30, 45, 60].map(size => (
          <button
            key={size}
            onClick={() => setCellSize(size)}
            className="px-3 py-1 rounded-lg text-xs font-bold transition-all"
            style={{
              background: cellSize === size ? 'rgba(0,229,255,0.15)' : 'rgba(255,255,255,0.05)',
              color: cellSize === size ? '#00e5ff' : 'rgba(255,255,255,0.5)',
              border: `1px solid ${cellSize === size ? 'rgba(0,229,255,0.3)' : 'transparent'}`
            }}
          >
            {size}x{size}
          </button>
        ))}
      </div>

      <div 
        ref={containerRef}
        className={`blockblast-container ${isFullscreen ? 'fullscreen-mode' : ''}`}
        style={{
          display: 'flex', flexDirection: 'column', alignItems: 'center', position: 'relative',
          background: isFullscreen ? '#0a0a1a' : 'transparent',
          padding: isFullscreen ? '20px' : '0',
          width: '100%',
          overflow: 'hidden', // prevent scrollbar when scaled
        }}
      >
        <div className="canvas-scaler" style={{
           position: 'relative',
           // Responsive scale based on viewport width (vw) maxed out at 1
           transform: `scale(min(1, calc(100vw / ${CANVAS_WIDTH + 40})))`,
           transformOrigin: 'top center',
           height: `calc(${CANVAS_HEIGHT}px * min(1, calc(100vw / ${CANVAS_WIDTH + 40})))`,
           width: CANVAS_WIDTH
        }}>
          <div style={{
            position: 'absolute', inset: '-3px', borderRadius: '16px', zIndex: 0,
            background: 'conic-gradient(from 0deg, #b44dff, #00e5ff, #39e75f, #ffe14d, #b44dff)',
            opacity: 0.12, filter: 'blur(6px)', animation: 'glowSpin 8s linear infinite',
          }} />
          
          <canvas
            ref={canvasRef}
            width={CANVAS_WIDTH}
            height={CANVAS_HEIGHT}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerLeave={handlePointerUp}
            style={{
              position: 'relative', zIndex: 1, display: 'block', borderRadius: '14px',
              border: '2px solid rgba(255,255,255,0.1)', background: '#050510',
              boxShadow: '0 0 40px rgba(0,229,255,0.06), inset 0 0 80px rgba(0,0,0,0.5)',
              touchAction: 'none',
              cursor: dragState ? 'grabbing' : 'grab'
            }}
          />
          
          <div className="blockblast-header">
            <div className="score-label">ĐIỂM SỐ {combo > 1 && <span style={{color: '#ffe14d'}}>• COMBO x{combo}</span>}</div>
            <div className="score-value">{score.toLocaleString()}</div>
          </div>

          <button 
            onClick={toggleFullscreen}
            className="absolute top-3 right-3 z-10 p-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors"
            title="Toàn màn hình"
          >
            {isFullscreen ? '↙️' : '↗️'}
          </button>

          {isGameOver && (
            <div className="absolute inset-0 z-20 flex flex-col items-center justify-center">
               <button onClick={restart} className="restart-btn">
                Chơi lại
              </button>
            </div>
          )}
        </div>
      </div>

      <style>{`
        .blockblast-wrapper {
          display: flex; flex-direction: column; align-items: center; width: 100%;
        }
        .blockblast-header {
          position: absolute; top: 15px; left: 0; width: 100%; text-align: center;
          pointer-events: none; z-index: 2;
        }
        .score-label {
          font-size: 10px; font-weight: 700; letter-spacing: 2px; color: rgba(255,255,255,0.5);
        }
        .score-value {
          font-size: 28px; font-weight: 900; color: #fff;
          text-shadow: 0 0 10px rgba(255,255,255,0.5);
        }
        .restart-btn {
          background: linear-gradient(135deg, #e41d1d, #ff4d6a);
          border: none; border-radius: 12px; padding: 12px 28px; font-size: 18px;
          color: white; font-weight: bold; font-family: 'Outfit'; cursor: pointer;
          box-shadow: 0 0 20px rgba(228,29,29,0.4);
          transition: transform 0.2s;
        }
        .restart-btn:hover { transform: scale(1.05); }
        .restart-btn:active { transform: scale(0.95); }
        .fullscreen-mode {
          justify-content: center;
          height: 100vh;
        }
      `}</style>
    </div>
  )
}

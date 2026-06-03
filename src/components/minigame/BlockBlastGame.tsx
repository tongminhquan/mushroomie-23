'use client'

import React, { useEffect, useRef, useState, useCallback } from 'react'

const ROWS = 8
const COLS = 8
const CELL = 36 // Size of a cell on the board
const BOARD_WIDTH = COLS * CELL
const BOARD_HEIGHT = ROWS * CELL
const HAND_HEIGHT = 160
const CANVAS_WIDTH = Math.max(BOARD_WIDTH + 20, 320)
const CANVAS_HEIGHT = BOARD_HEIGHT + HAND_HEIGHT + 40 // Padding

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
  
  // Game State
  const [board, setBoard] = useState<(string | null)[][]>(Array(ROWS).fill(null).map(() => Array(COLS).fill(null)))
  const [hand, setHand] = useState<(Piece | null)[]>([getRandomPiece(), getRandomPiece(), getRandomPiece()])
  const [score, setScore] = useState(0)
  const [isGameOver, setIsGameOver] = useState(false)
  const [dragState, setDragState] = useState<{
    index: number;
    piece: Piece;
    x: number;
    y: number;
    offsetX: number;
    offsetY: number;
  } | null>(null)

  // Draw function
  const draw = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // Clear
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    
    const boardOffsetX = (canvas.width - BOARD_WIDTH) / 2
    const boardOffsetY = 20

    // Draw Board Background
    ctx.fillStyle = 'rgba(255,255,255,0.02)'
    ctx.strokeStyle = 'rgba(255,255,255,0.05)'
    ctx.lineWidth = 1
    
    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        const x = boardOffsetX + c * CELL
        const y = boardOffsetY + r * CELL
        ctx.fillRect(x, y, CELL, CELL)
        ctx.strokeRect(x, y, CELL, CELL)

        // Draw placed blocks
        if (board[r][c]) {
          drawBlock(ctx, x, y, CELL, board[r][c]!)
        }
      }
    }

    // Draw Ghost (if dragging)
    if (dragState) {
      const hoverCol = Math.round((dragState.x - dragState.offsetX - boardOffsetX) / CELL)
      const hoverRow = Math.round((dragState.y - dragState.offsetY - boardOffsetY) / CELL)
      
      if (canPlace(board, dragState.piece.matrix, hoverRow, hoverCol)) {
        ctx.globalAlpha = 0.3
        for (let r = 0; r < dragState.piece.matrix.length; r++) {
          for (let c = 0; c < dragState.piece.matrix[r].length; c++) {
            if (dragState.piece.matrix[r][c]) {
              drawBlock(ctx, boardOffsetX + (hoverCol + c) * CELL, boardOffsetY + (hoverRow + r) * CELL, CELL, dragState.piece.color)
            }
          }
        }
        ctx.globalAlpha = 1.0
      }
    }

    // Draw Hand Pieces
    const handCell = 22 // Smaller cells for hand
    const handY = boardOffsetY + BOARD_HEIGHT + 40
    const slotWidth = canvas.width / 3

    hand.forEach((piece, i) => {
      if (!piece) return
      if (dragState && dragState.index === i) return // Don't draw the piece in hand if it's being dragged

      const pW = piece.matrix[0].length * handCell
      const pH = piece.matrix.length * handCell
      const pX = (slotWidth * i) + (slotWidth - pW) / 2
      const pY = handY + (80 - pH) / 2

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
            drawBlock(ctx, dragState.x - dragState.offsetX + c * CELL, dragState.y - dragState.offsetY + r * CELL, CELL, dragState.piece.color)
          }
        }
      }
    }

    // Game Over Overlay
    if (isGameOver) {
      ctx.fillStyle = 'rgba(0,0,0,0.8)'
      ctx.fillRect(0, 0, canvas.width, canvas.height)
      ctx.fillStyle = '#ff4d6a'
      ctx.font = 'bold 32px Outfit'
      ctx.textAlign = 'center'
      ctx.fillText('HẾT CHỖ!', canvas.width/2, canvas.height/2 - 20)
      ctx.fillStyle = '#fff'
      ctx.font = '20px Outfit'
      ctx.fillText(`Điểm: ${score}`, canvas.width/2, canvas.height/2 + 20)
    }

  }, [board, hand, dragState, isGameOver, score])

  useEffect(() => {
    let animationId: number
    const render = () => {
      draw()
      animationId = requestAnimationFrame(render)
    }
    render()
    return () => cancelAnimationFrame(animationId)
  }, [draw])

  // Helper to draw a single block with neon style
  const drawBlock = (ctx: CanvasRenderingContext2D, x: number, y: number, size: number, color: string) => {
    ctx.fillStyle = color
    ctx.shadowColor = color
    ctx.shadowBlur = 10
    ctx.fillRect(x + 1, y + 1, size - 2, size - 2)
    ctx.shadowBlur = 0 // Reset
    // Inner highlight
    ctx.fillStyle = 'rgba(255,255,255,0.3)'
    ctx.fillRect(x + 2, y + 2, size - 4, size / 4)
  }

  // Pointer Events for Drag & Drop
  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (isGameOver) return
    const canvas = canvasRef.current
    if (!canvas) return
    const rect = canvas.getBoundingClientRect()
    // Support responsive scaling
    const scaleX = canvas.width / rect.width
    const scaleY = canvas.height / rect.height
    
    const x = (e.clientX - rect.left) * scaleX
    const y = (e.clientY - rect.top) * scaleY

    // Check if clicked on a hand piece
    const handCell = 22
    const handY = 20 + BOARD_HEIGHT + 40
    const slotWidth = canvas.width / 3

    for (let i = 0; i < 3; i++) {
      const piece = hand[i]
      if (!piece) continue

      const pW = piece.matrix[0].length * handCell
      const pH = piece.matrix.length * handCell
      const pX = (slotWidth * i) + (slotWidth - pW) / 2
      const pY = handY + (80 - pH) / 2

      // Rough bounding box check for grab
      if (x >= pX && x <= pX + pW && y >= pY && y <= pY + pH) {
        // Grabbed! Set drag state
        setDragState({
          index: i,
          piece,
          x,
          y,
          offsetX: x - pX, // offset within the piece
          offsetY: y - pY
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
    const boardOffsetY = 20

    // Calculate which cell we dropped on based on the dragged piece's top-left corner
    const dropCol = Math.round((dragState.x - dragState.offsetX - boardOffsetX) / CELL)
    const dropRow = Math.round((dragState.y - dragState.offsetY - boardOffsetY) / CELL)

    if (canPlace(board, dragState.piece.matrix, dropRow, dropCol)) {
      // Place it
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

      // Check for clears
      let newScore = score + blocksPlaced * 10 // 10 pts per block placed
      
      // Find full rows and cols
      const rowsToClear: number[] = []
      const colsToClear: number[] = []

      for (let r = 0; r < ROWS; r++) {
        if (newBoard[r].every(cell => cell !== null)) rowsToClear.push(r)
      }
      for (let c = 0; c < COLS; c++) {
        if (newBoard.every(row => row[c] !== null)) colsToClear.push(c)
      }

      // Clear them
      rowsToClear.forEach(r => {
        for (let c = 0; c < COLS; c++) newBoard[r][c] = null
      })
      colsToClear.forEach(c => {
        for (let r = 0; r < ROWS; r++) newBoard[r][c] = null
      })

      const linesCleared = rowsToClear.length + colsToClear.length
      if (linesCleared > 0) {
        // Combo points
        newScore += (linesCleared * 100) * linesCleared 
      }

      setBoard(newBoard)
      setScore(newScore)
      
      // Update hand
      const newHand = [...hand]
      newHand[dragState.index] = null
      
      // If hand is empty, refill
      if (newHand.every(p => p === null)) {
        newHand[0] = getRandomPiece()
        newHand[1] = getRandomPiece()
        newHand[2] = getRandomPiece()
      }
      setHand(newHand)
      
      // Check Game Over after state updates
      checkGameOver(newBoard, newHand)

    }
    
    setDragState(null)
  }

  // Helpers
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

  const checkGameOver = (currentBoard: (string | null)[][], currentHand: (Piece | null)[]) => {
    // If ANY piece in the hand can be placed ANYWHERE, game is not over
    for (let i = 0; i < currentHand.length; i++) {
      const piece = currentHand[i]
      if (!piece) continue

      let canFit = false
      for (let r = 0; r < ROWS; r++) {
        for (let c = 0; c < COLS; c++) {
          if (canPlace(currentBoard, piece.matrix, r, c)) {
            canFit = true
            break
          }
        }
        if (canFit) break
      }

      if (canFit) return // We found a move, not game over
    }

    // No moves left!
    setIsGameOver(true)
    onGameOver(score) // Note: this score might be slightly stale if using state directly, but since we call it here, we should pass the latest score. Wait, onGameOver(newScore) is better. Let's fix that below.
  }

  const restart = () => {
    setBoard(Array(ROWS).fill(null).map(() => Array(COLS).fill(null)))
    setHand([getRandomPiece(), getRandomPiece(), getRandomPiece()])
    setScore(0)
    setIsGameOver(false)
  }

  // Update checkGameOver to take score
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
  }, [board, hand]) // Re-run check when board or hand changes

  return (
    <div className="blockblast-wrapper">
      <div className="blockblast-container">
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
          onPointerLeave={handlePointerUp} // Cancel drag if cursor leaves
          style={{
            position: 'relative', zIndex: 1, display: 'block', borderRadius: '14px',
            border: '2px solid rgba(255,255,255,0.1)', background: '#050510',
            boxShadow: '0 0 40px rgba(0,229,255,0.06), inset 0 0 80px rgba(0,0,0,0.5)',
            touchAction: 'none', // Prevent scrolling on mobile while dragging
            maxWidth: '100%',
            height: 'auto',
            cursor: dragState ? 'grabbing' : 'grab'
          }}
        />
        
        <div className="blockblast-header">
          <div className="score-label">ĐIỂM SỐ</div>
          <div className="score-value">{score.toLocaleString()}</div>
        </div>

        {isGameOver && (
          <button onClick={restart} className="restart-btn">
            Chơi lại
          </button>
        )}
      </div>

      <style>{`
        .blockblast-wrapper {
          display: flex; justify-content: center; width: 100%;
        }
        .blockblast-container {
          position: relative;
          display: flex; flex-direction: column; align-items: center;
        }
        .blockblast-header {
          position: absolute; top: 10px; left: 0; width: 100%; text-align: center;
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
          position: absolute; bottom: 20px; z-index: 3;
          background: linear-gradient(135deg, #e41d1d, #ff4d6a);
          border: none; border-radius: 12px; padding: 10px 24px;
          color: white; font-weight: bold; font-family: 'Outfit'; cursor: pointer;
          box-shadow: 0 0 20px rgba(228,29,29,0.4);
          transition: transform 0.2s;
        }
        .restart-btn:hover { transform: scale(1.05); }
        .restart-btn:active { transform: scale(0.95); }
      `}</style>
    </div>
  )
}

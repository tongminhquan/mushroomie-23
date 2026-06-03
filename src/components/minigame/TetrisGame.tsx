'use client'

import { useRef, useEffect, useCallback, useState } from 'react'

// ── Constants ──
const COLS = 10
const ROWS = 20
const CELL = 30

const COLORS: Record<string, string> = {
  I: '#00e5ff', J: '#4d7aff', L: '#ff8c1a',
  O: '#ffe14d', S: '#39e75f', T: '#b44dff', Z: '#ff4d6a',
}
const GLOW: Record<string, string> = {
  I: 'rgba(0,229,255,0.4)', J: 'rgba(77,122,255,0.4)', L: 'rgba(255,140,26,0.4)',
  O: 'rgba(255,225,77,0.4)', S: 'rgba(57,231,95,0.4)', T: 'rgba(180,77,255,0.4)', Z: 'rgba(255,77,106,0.4)',
}
const SHAPES: Record<string, [number, number][]> = {
  I: [[0,1],[1,1],[2,1],[3,1]],
  J: [[0,0],[0,1],[1,1],[2,1]],
  L: [[2,0],[0,1],[1,1],[2,1]],
  O: [[1,0],[2,0],[1,1],[2,1]],
  S: [[1,0],[2,0],[0,1],[1,1]],
  T: [[1,0],[0,1],[1,1],[2,1]],
  Z: [[0,0],[1,0],[1,1],[2,1]],
}
const TYPES = Object.keys(SHAPES)

interface Cell { x: number; y: number }
interface Piece { type: string; x: number; y: number; cells: Cell[] }

interface TetrisGameProps {
  onGameOver?: (score: number) => void
}

export default function TetrisGame({ onGameOver }: TetrisGameProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const nextCanvasRef = useRef<HTMLCanvasElement>(null)
  const gameRef = useRef<{
    grid: (string | null)[][]
    cur: Piece | null
    nextType: string
    score: number
    lines: number
    level: number
    dropInterval: number
    last: number
    acc: number
    over: boolean
    paused: boolean
    animFrame: number | null
    flashTimer: number
  }>({
    grid: [], cur: null, nextType: '',
    score: 0, lines: 0, level: 0,
    dropInterval: 1000, last: 0, acc: 0,
    over: false, paused: false, animFrame: null, flashTimer: 0,
  })

  const [score, setScore] = useState(0)
  const [lines, setLines] = useState(0)
  const [level, setLevel] = useState(0)
  const [isOver, setIsOver] = useState(false)
  const [isPaused, setIsPaused] = useState(false)
  const [nextType, setNextType] = useState('')

  // ── Helpers ──
  const randomType = () => TYPES[Math.floor(Math.random() * TYPES.length)]

  const newGrid = (): (string | null)[][] =>
    Array.from({ length: ROWS }, () => Array(COLS).fill(null))

  // ── Drawing ──
  const roundRect = (ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) => {
    ctx.beginPath()
    ctx.moveTo(x + r, y)
    ctx.lineTo(x + w - r, y)
    ctx.quadraticCurveTo(x + w, y, x + w, y + r)
    ctx.lineTo(x + w, y + h - r)
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h)
    ctx.lineTo(x + r, y + h)
    ctx.quadraticCurveTo(x, y + h, x, y + h - r)
    ctx.lineTo(x, y + r)
    ctx.quadraticCurveTo(x, y, x + r, y)
    ctx.closePath()
  }

  const drawCell = (ctx: CanvasRenderingContext2D, x: number, y: number, color: string, glow: string, cs: number = CELL) => {
    const px = x * cs, py = y * cs
    ctx.shadowColor = glow
    ctx.shadowBlur = 8
    ctx.fillStyle = color
    roundRect(ctx, px + 1, py + 1, cs - 2, cs - 2, 4)
    ctx.fill()
    // Highlight
    const grad = ctx.createLinearGradient(px, py, px + cs, py + cs)
    grad.addColorStop(0, 'rgba(255,255,255,0.3)')
    grad.addColorStop(0.5, 'rgba(255,255,255,0.05)')
    grad.addColorStop(1, 'rgba(0,0,0,0.2)')
    ctx.fillStyle = grad
    roundRect(ctx, px + 1, py + 1, cs - 2, cs - 2, 4)
    ctx.fill()
    // Border
    ctx.shadowBlur = 0
    ctx.strokeStyle = 'rgba(255,255,255,0.18)'
    ctx.lineWidth = 1
    roundRect(ctx, px + 1, py + 1, cs - 2, cs - 2, 4)
    ctx.stroke()
  }

  const drawGrid = (ctx: CanvasRenderingContext2D) => {
    ctx.strokeStyle = 'rgba(255,255,255,0.04)'
    ctx.lineWidth = 0.5
    for (let x = 0; x <= COLS; x++) {
      ctx.beginPath(); ctx.moveTo(x * CELL, 0); ctx.lineTo(x * CELL, ROWS * CELL); ctx.stroke()
    }
    for (let y = 0; y <= ROWS; y++) {
      ctx.beginPath(); ctx.moveTo(0, y * CELL); ctx.lineTo(COLS * CELL, y * CELL); ctx.stroke()
    }
  }

  const collide = (dx: number, dy: number, cells: Cell[], cur: Piece, grid: (string | null)[][]) => {
    for (const c of cells) {
      const x = cur.x + dx + c.x, y = cur.y + dy + c.y
      if (x < 0 || x >= COLS || y >= ROWS) return true
      if (y >= 0 && grid[y][x]) return true
    }
    return false
  }

  const drawGhost = (ctx: CanvasRenderingContext2D) => {
    const g = gameRef.current
    if (!g.cur) return
    let ghostY = 0
    while (!collide(0, ghostY + 1, g.cur.cells, g.cur, g.grid)) ghostY++
    if (ghostY === 0) return
    ctx.globalAlpha = 0.18
    for (const c of g.cur.cells) {
      const px = (g.cur.x + c.x) * CELL, py = (g.cur.y + ghostY + c.y) * CELL
      ctx.fillStyle = COLORS[g.cur.type]
      roundRect(ctx, px + 1, py + 1, CELL - 2, CELL - 2, 4)
      ctx.fill()
    }
    ctx.globalAlpha = 1
  }

  const drawBoard = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    const g = gameRef.current

    ctx.clearRect(0, 0, canvas.width, canvas.height)
    drawGrid(ctx)

    // Flash
    if (g.flashTimer > 0) {
      g.flashTimer--
      if (g.flashTimer % 2 === 0) {
        ctx.fillStyle = 'rgba(0,229,255,0.06)'
        ctx.fillRect(0, 0, canvas.width, canvas.height)
      }
    }

    // Locked blocks
    for (let y = 0; y < ROWS; y++) for (let x = 0; x < COLS; x++) {
      if (g.grid[y][x]) drawCell(ctx, x, y, COLORS[g.grid[y][x]!], GLOW[g.grid[y][x]!])
    }

    drawGhost(ctx)

    // Current piece
    if (g.cur) {
      for (const c of g.cur.cells) {
        drawCell(ctx, g.cur.x + c.x, g.cur.y + c.y, COLORS[g.cur.type], GLOW[g.cur.type])
      }
    }
  }, [])

  const drawNextPiece = useCallback(() => {
    const canvas = nextCanvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    const g = gameRef.current

    ctx.clearRect(0, 0, canvas.width, canvas.height)
    if (!g.nextType) return
    const cells = SHAPES[g.nextType]
    const cs = 24
    const ox = (canvas.width - 4 * cs) / 2
    const oy = (canvas.height - 3 * cs) / 2

    for (const [cx, cy] of cells) {
      const px = cx * cs + ox, py = cy * cs + oy
      ctx.shadowColor = GLOW[g.nextType]
      ctx.shadowBlur = 8
      ctx.fillStyle = COLORS[g.nextType]
      roundRect(ctx, px + 1, py + 1, cs - 2, cs - 2, 3)
      ctx.fill()
      const grad = ctx.createLinearGradient(px, py, px + cs, py + cs)
      grad.addColorStop(0, 'rgba(255,255,255,0.3)')
      grad.addColorStop(1, 'rgba(0,0,0,0.2)')
      ctx.fillStyle = grad
      roundRect(ctx, px + 1, py + 1, cs - 2, cs - 2, 3)
      ctx.fill()
      ctx.shadowBlur = 0
      ctx.strokeStyle = 'rgba(255,255,255,0.18)'
      ctx.lineWidth = 0.5
      roundRect(ctx, px + 1, py + 1, cs - 2, cs - 2, 3)
      ctx.stroke()
    }
  }, [])

  // ── Game Logic ──
  const spawn = useCallback(() => {
    const g = gameRef.current
    const type = g.nextType || randomType()
    g.nextType = randomType()
    g.cur = { type, x: 3, y: 0, cells: SHAPES[type].map(([x, y]) => ({ x, y })) }
    setNextType(g.nextType)
    drawNextPiece()
    if (collide(0, 0, g.cur.cells, g.cur, g.grid)) {
      gameOver()
    }
  }, [drawNextPiece])

  const syncHUD = useCallback(() => {
    const g = gameRef.current
    setScore(g.score)
    setLines(g.lines)
    setLevel(g.level)
  }, [])

  const clearLines = useCallback(() => {
    const g = gameRef.current
    let cleared = 0
    for (let y = ROWS - 1; y >= 0; y--) {
      if (g.grid[y].every(v => v)) {
        g.grid.splice(y, 1)
        g.grid.unshift(Array(COLS).fill(null))
        cleared++
        y++
      }
    }
    if (cleared > 0) {
      g.score += cleared > 4 ? cleared * 20 : cleared * 10
      g.lines += cleared
      g.level = Math.floor(g.lines / 5)
      g.dropInterval = Math.max(100, 1000 - g.level * 100)
      g.flashTimer = 8
      syncHUD()
    }
  }, [syncHUD])

  const lock = useCallback(() => {
    const g = gameRef.current
    if (!g.cur) return
    for (const c of g.cur.cells) {
      const x = g.cur.x + c.x, y = g.cur.y + c.y
      if (y >= 0) g.grid[y][x] = g.cur.type
    }
    clearLines()
    spawn()
  }, [clearLines, spawn])

  const move = useCallback((dx: number) => {
    const g = gameRef.current
    if (g.cur && !collide(dx, 0, g.cur.cells, g.cur, g.grid)) g.cur.x += dx
  }, [])

  const rotate = useCallback(() => {
    const g = gameRef.current
    if (!g.cur || g.cur.type === 'O') return
    const rot = g.cur.cells.map(({ x, y }) => ({ x: -y + 1, y: x }))
    if (!collide(0, 0, rot, g.cur, g.grid)) g.cur.cells = rot
  }, [])

  const softDrop = useCallback(() => {
    const g = gameRef.current
    if (g.cur && !collide(0, 1, g.cur.cells, g.cur, g.grid)) g.cur.y++
    else if (g.cur) lock()
  }, [lock])

  const hardDrop = useCallback(() => {
    const g = gameRef.current
    if (g.cur) {
      while (!collide(0, 1, g.cur.cells, g.cur, g.grid)) g.cur.y++
      lock()
    }
  }, [lock])

  const gameOver = useCallback(() => {
    const g = gameRef.current
    g.over = true
    setIsOver(true)

    // Draw game over overlay
    const canvas = canvasRef.current
    if (canvas) {
      const ctx = canvas.getContext('2d')
      if (ctx) {
        ctx.fillStyle = 'rgba(5,5,16,0.88)'
        ctx.fillRect(0, 0, canvas.width, canvas.height)
        ctx.save()
        ctx.textAlign = 'center'
        ctx.textBaseline = 'middle'
        const cx = canvas.width / 2, cy = canvas.height / 2
        ctx.shadowColor = '#ff4d6a'
        ctx.shadowBlur = 40
        ctx.font = "bold 36px 'Outfit', sans-serif"
        ctx.fillStyle = '#ff4d6a'
        ctx.fillText('GAME OVER', cx, cy - 35)
        ctx.shadowColor = '#00e5ff'
        ctx.shadowBlur = 20
        ctx.font = "700 22px 'Outfit', sans-serif"
        ctx.fillStyle = '#00e5ff'
        ctx.fillText(`Điểm: ${g.score}`, cx, cy + 15)
        ctx.shadowBlur = 0
        ctx.font = "500 14px 'Outfit', sans-serif"
        ctx.fillStyle = 'rgba(255,255,255,0.4)'
        ctx.fillText('Nhấn R hoặc nút bên dưới để chơi lại', cx, cy + 50)
        ctx.restore()
      }
    }
    onGameOver?.(g.score)
  }, [onGameOver])

  const start = useCallback(() => {
    const g = gameRef.current
    g.grid = newGrid()
    g.score = 0; g.lines = 0; g.level = 0
    g.over = false; g.paused = false
    g.dropInterval = 1000; g.last = 0; g.acc = 0
    g.flashTimer = 0
    setIsOver(false); setIsPaused(false)
    syncHUD()
    g.nextType = randomType()
    spawn()
  }, [syncHUD, spawn])

  const togglePause = useCallback(() => {
    const g = gameRef.current
    if (g.over) return
    g.paused = !g.paused
    setIsPaused(g.paused)
    if (!g.paused) g.last = 0
  }, [])

  // ── Game Loop ──
  useEffect(() => {
    const loop = (t: number) => {
      const g = gameRef.current
      if (!g.last) g.last = t
      const dt = t - g.last
      g.last = t
      if (!g.over && !g.paused) {
        g.acc += dt
        if (g.acc > g.dropInterval) { softDrop(); g.acc = 0 }
        drawBoard()
      }
      g.animFrame = requestAnimationFrame(loop)
    }
    start()
    gameRef.current.animFrame = requestAnimationFrame(loop)
    return () => {
      if (gameRef.current.animFrame) cancelAnimationFrame(gameRef.current.animFrame)
    }
  }, [])

  // ── Keyboard ──
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.code)) e.preventDefault()
      const g = gameRef.current
      if (g.over && e.code === 'KeyR') { start(); return }
      if (e.code === 'KeyP') { togglePause(); return }
      if (g.over || g.paused) return
      switch (e.code) {
        case 'ArrowLeft': move(-1); break
        case 'ArrowRight': move(1); break
        case 'ArrowUp': rotate(); break
        case 'ArrowDown': softDrop(); break
        case 'Space': hardDrop(); break
        case 'KeyR': start(); break
      }
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [move, rotate, softDrop, hardDrop, start, togglePause])

  // ── Styles ──
  const glassCard = {
    background: 'rgba(255,255,255,0.04)',
    border: '1px solid rgba(255,255,255,0.08)',
    borderRadius: '16px',
    padding: '14px 16px',
    backdropFilter: 'blur(16px)',
  }

  const neonText = (color: string) => ({
    textShadow: `0 0 10px ${color}, 0 0 30px ${color}`,
    color,
  })

  const labelStyle: React.CSSProperties = {
    fontSize: '9px', fontWeight: 700, letterSpacing: '2px',
    color: 'rgba(255,255,255,0.4)', marginBottom: '4px',
  }

  const mobileCard: React.CSSProperties = {
    background: 'rgba(255,255,255,0.04)',
    border: '1px solid rgba(255,255,255,0.08)',
    borderRadius: '10px',
    padding: '8px 10px',
    backdropFilter: 'blur(12px)',
  }

  const mobileLabelStyle: React.CSSProperties = {
    fontSize: '8px', fontWeight: 700, letterSpacing: '1.5px',
    color: 'rgba(255,255,255,0.35)', marginBottom: '2px',
  }

  const mobileActionBtn = (color: string): React.CSSProperties => ({
    flex: 1, padding: '6px', borderRadius: '8px',
    border: `1px solid ${color}33`,
    background: `${color}15`, color, fontSize: '14px',
    fontWeight: 700, cursor: 'pointer',
    fontFamily: "'Outfit', sans-serif",
  })

  return (
    <div className="tetris-game">
      {/* Main area: board + sidebar */}
      <div className="tetris-main">
        {/* Board */}
        <div className="tetris-board-wrap">
          <div className="tetris-glow-ring" />
          <canvas
            ref={canvasRef}
            width={COLS * CELL}
            height={ROWS * CELL}
            className="tetris-canvas"
          />
          {isPaused && (
            <div className="tetris-pause-overlay">
              <div style={{ fontSize: '28px', fontWeight: 900, ...neonText('#ffe14d') }}>TẠM DỪNG</div>
              <div className="tetris-pause-hint desktop-only">Nhấn P để tiếp tục</div>
              <div className="tetris-pause-hint mobile-only">Nhấn nút tiếp tục</div>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="tetris-sidebar">
          {/* Score */}
          <div className="tetris-stat-card">
            <div className="tetris-stat-label"><span className="desktop-only">ĐIỂM SỐ</span><span className="mobile-only">ĐIỂM</span></div>
            <div className="tetris-stat-value tetris-score-val">{score.toLocaleString()}</div>
            <div className="tetris-progress">
              <div className="tetris-progress-fill" style={{ width: `${Math.min((score / 20000) * 100, 100)}%` }} />
            </div>
          </div>

          {/* Lines + Level row */}
          <div className="tetris-stat-row">
            <div className="tetris-stat-card tetris-stat-half">
              <div className="tetris-stat-label"><span className="desktop-only">HÀNG ĐÃ XÓA</span><span className="mobile-only">HÀNG</span></div>
              <div className="tetris-stat-value tetris-lines-val">{lines}</div>
            </div>
            <div className="tetris-stat-card tetris-stat-half">
              <div className="tetris-stat-label"><span className="desktop-only">CẤP ĐỘ</span><span className="mobile-only">LV</span></div>
              <div className="tetris-stat-value tetris-level-val">{level + 1}</div>
            </div>
          </div>

          {/* Next Piece */}
          <div className="tetris-stat-card" style={{ textAlign: 'center' }}>
            <div className="tetris-stat-label"><span className="desktop-only">KHỐI TIẾP THEO</span><span className="mobile-only">TIẾP THEO</span></div>
            <div style={{ display: 'flex', justifyContent: 'center', marginTop: '4px' }}>
              <canvas ref={nextCanvasRef} width={120} height={80} className="tetris-next-canvas" />
            </div>
          </div>

          {/* Controls hint - desktop only */}
          <div className="tetris-stat-card desktop-only">
            <div className="tetris-stat-label">ĐIỀU KHIỂN</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              {[['← →','Di chuyển'],['↑','Xoay'],['↓','Rơi nhanh'],['Space','Rơi liền'],['P','Tạm dừng'],['R','Chơi lại']].map(([key, desc]) => (
                <div key={key} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span className="tetris-key">{key}</span>
                  <span className="tetris-key-desc">{desc}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Quick action buttons - mobile only */}
          <div className="tetris-quick-actions mobile-only">
            <button onClick={start} className="tetris-action-btn tetris-action-restart">🔄</button>
            <button onClick={togglePause} className="tetris-action-btn tetris-action-pause">{isPaused ? '▶' : '⏸'}</button>
          </div>
        </div>
      </div>

      {/* Mobile touch controls */}
      <div className="tetris-touch-controls mobile-only">
        <div className="tetris-touch-row">
          <MobileBtn onClick={() => move(-1)} label="←">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6" /></svg>
          </MobileBtn>
          <MobileBtn onClick={rotate} label="↻" accent>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 4 23 10 17 10" /><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" /></svg>
          </MobileBtn>
          <MobileBtn onClick={() => move(1)} label="→">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6" /></svg>
          </MobileBtn>
        </div>
        <div className="tetris-touch-row">
          <MobileBtn onClick={softDrop} label="↓" wide>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9" /></svg>
          </MobileBtn>
          <MobileBtn onClick={hardDrop} label="⏬" wide purple>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="7 13 12 18 17 13" /><polyline points="7 6 12 11 17 6" /></svg>
          </MobileBtn>
        </div>
      </div>

      <style>{`
        @keyframes glowSpin {
          to { filter: blur(6px) hue-rotate(360deg); }
        }
        .tetris-game { display: flex; flex-direction: column; gap: 10px; width: 100%; align-items: center; }

        /* Main row */
        .tetris-main { display: flex; gap: 16px; justify-content: center; align-items: flex-start; }

        /* Board */
        .tetris-board-wrap { position: relative; flex-shrink: 0; }
        .tetris-glow-ring {
          position: absolute; inset: -3px; border-radius: 16px; z-index: 0;
          background: conic-gradient(from 0deg, #00e5ff, #b44dff, #ff4d6a, #e41d1d, #ffe14d, #00e5ff);
          opacity: 0.12; filter: blur(6px); animation: glowSpin 8s linear infinite;
        }
        .tetris-canvas {
          position: relative; z-index: 1; display: block; border-radius: 14px;
          border: 2px solid rgba(255,255,255,0.1); background: #050510;
          box-shadow: 0 0 40px rgba(0,229,255,0.06), inset 0 0 80px rgba(0,0,0,0.5);
        }
        .tetris-pause-overlay {
          position: absolute; inset: 0; z-index: 2; border-radius: 14px;
          background: rgba(5,5,16,0.85); display: flex; flex-direction: column;
          align-items: center; justify-content: center; gap: 8px;
        }
        .tetris-pause-hint { font-size: 13px; color: rgba(255,255,255,0.4); }

        /* Sidebar */
        .tetris-sidebar { display: flex; flex-direction: column; gap: 10px; min-width: 160px; max-width: 180px; }
        .tetris-stat-card {
          background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.08);
          border-radius: 16px; padding: 14px 16px; backdrop-filter: blur(16px);
        }
        .tetris-stat-label {
          font-size: 9px; font-weight: 700; letter-spacing: 2px;
          color: rgba(255,255,255,0.4); margin-bottom: 4px;
        }
        .tetris-stat-value { font-weight: 900; line-height: 1; }
        .tetris-score-val { font-size: 30px; color: #00e5ff; text-shadow: 0 0 10px #00e5ff, 0 0 30px #00e5ff; }
        .tetris-lines-val { font-size: 26px; color: #39e75f; text-shadow: 0 0 10px #39e75f, 0 0 30px #39e75f; }
        .tetris-level-val { font-size: 26px; color: #ffe14d; text-shadow: 0 0 10px #ffe14d, 0 0 30px #ffe14d; }

        .tetris-stat-row { display: flex; flex-direction: column; gap: 10px; }
        .tetris-stat-half { flex: unset; }

        .tetris-progress { margin-top: 8px; height: 4px; border-radius: 4px; background: rgba(255,255,255,0.06); overflow: hidden; }
        .tetris-progress-fill { height: 100%; border-radius: 4px; transition: width 0.5s ease; background: linear-gradient(90deg, #00e5ff, #b44dff); box-shadow: 0 0 8px rgba(0,229,255,0.5); }

        .tetris-next-canvas { border-radius: 8px; background: rgba(0,0,0,0.3); border: 1px solid rgba(255,255,255,0.06); }

        .tetris-key {
          display: inline-flex; align-items: center; justify-content: center;
          min-width: 40px; padding: 2px 6px; font-size: 10px; font-weight: 700;
          color: #00e5ff; background: rgba(0,229,255,0.1);
          border: 1px solid rgba(0,229,255,0.2); border-radius: 5px;
          font-family: 'Outfit', monospace;
        }
        .tetris-key-desc { font-size: 11px; color: rgba(255,255,255,0.4); font-weight: 500; }

        /* Quick actions */
        .tetris-quick-actions { display: flex; gap: 4px; }
        .tetris-action-btn {
          flex: 1; padding: 6px; border-radius: 8px; font-size: 14px;
          font-weight: 700; cursor: pointer; font-family: 'Outfit', sans-serif;
        }
        .tetris-action-restart { background: rgba(0,229,255,0.1); border: 1px solid rgba(0,229,255,0.2); color: #00e5ff; }
        .tetris-action-pause { background: rgba(255,225,77,0.1); border: 1px solid rgba(255,225,77,0.2); color: #ffe14d; }

        /* Touch controls */
        .tetris-touch-controls { display: flex; flex-direction: column; gap: 6px; align-items: center; }
        .tetris-touch-row { display: flex; gap: 8px; }

        /* Desktop: show/hide */
        .mobile-only { display: none !important; }
        .desktop-only { display: inline !important; }

        /* ── MOBILE ── */
        @media (max-width: 767px) {
          .mobile-only { display: flex !important; }
          .desktop-only { display: none !important; }
          .tetris-main { gap: 8px; }
          .tetris-canvas { width: min(60vw, 240px) !important; height: auto !important; aspect-ratio: 1/2; border-radius: 10px; }
          .tetris-glow-ring { inset: -2px; border-radius: 12px; opacity: 0.1; filter: blur(4px); }
          .tetris-sidebar { min-width: 90px; max-width: 120px; gap: 6px; }
          .tetris-stat-card { border-radius: 10px; padding: 8px 10px; }
          .tetris-stat-label { font-size: 8px; letter-spacing: 1.5px; margin-bottom: 2px; }
          .tetris-score-val { font-size: 20px; }
          .tetris-lines-val, .tetris-level-val { font-size: 18px; }
          .tetris-stat-row { flex-direction: row; gap: 6px; }
          .tetris-stat-half { flex: 1; }
          .tetris-progress { margin-top: 4px; height: 3px; }
          .tetris-next-canvas { width: 80px; height: 54px; border-radius: 6px; }
          .tetris-pause-overlay { border-radius: 10px; }
          .tetris-pause-overlay > div:first-child { font-size: 20px !important; }
          .tetris-pause-hint { font-size: 11px; }
          .tetris-quick-actions { display: flex !important; }
        }
        @media (max-width: 767px) and (max-height: 700px) {
          .tetris-canvas { width: min(50vw, 200px) !important; }
        }
      `}</style>
    </div>
  )
}

// ── Mobile Button Component ──
function MobileBtn({ onClick, children, label, accent, purple, wide }: {
  onClick: () => void; children: React.ReactNode; label: string;
  accent?: boolean; purple?: boolean; wide?: boolean;
}) {
  const bg = accent ? 'rgba(228,29,29,0.12)' : purple ? 'rgba(180,77,255,0.1)' : 'rgba(255,255,255,0.06)'
  const border = accent ? 'rgba(228,29,29,0.25)' : purple ? 'rgba(180,77,255,0.2)' : 'rgba(255,255,255,0.1)'
  const color = accent ? '#ff4d6a' : purple ? '#b44dff' : '#ffffff'

  return (
    <button
      onClick={onClick}
      aria-label={label}
      style={{
        width: wide ? '80px' : '60px', height: '56px',
        border: `1px solid ${border}`, borderRadius: '14px',
        background: bg, color, fontSize: '20px', cursor: 'pointer',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        WebkitTapHighlightColor: 'transparent', touchAction: 'manipulation',
        transition: 'all 0.15s ease',
      }}
      onTouchStart={(e) => {
        const el = e.currentTarget
        el.style.transform = 'scale(0.9)'
        el.style.boxShadow = `0 0 15px ${border}`
      }}
      onTouchEnd={(e) => {
        const el = e.currentTarget
        el.style.transform = 'scale(1)'
        el.style.boxShadow = 'none'
      }}
    >
      {children}
    </button>
  )
}

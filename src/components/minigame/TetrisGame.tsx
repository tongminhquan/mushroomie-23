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

// ── Line-clear animation state ──
interface LineClearAnim {
  rows: number[]       // which rows are clearing
  progress: number     // 0..1
  startTime: number
  duration: number     // ms
}

interface TetrisGameProps {
  onGameOver?: (score: number) => void
}

// ── Web Audio synth for sound effects ──
function createAudioCtx(): AudioContext | null {
  try {
    return new (window.AudioContext || (window as any).webkitAudioContext)()
  } catch { return null }
}

function playTone(
  ctx: AudioContext,
  freq: number,
  type: OscillatorType,
  duration: number,
  gain: number,
  freqEnd?: number,
) {
  const osc = ctx.createOscillator()
  const vol = ctx.createGain()
  osc.connect(vol); vol.connect(ctx.destination)
  osc.type = type
  osc.frequency.setValueAtTime(freq, ctx.currentTime)
  if (freqEnd !== undefined) osc.frequency.exponentialRampToValueAtTime(freqEnd, ctx.currentTime + duration)
  vol.gain.setValueAtTime(gain, ctx.currentTime)
  vol.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration)
  osc.start(ctx.currentTime)
  osc.stop(ctx.currentTime + duration)
}

function sfxScore(ctx: AudioContext, lines: number) {
  // Ascending arpeggio – pitch & count scale with lines cleared
  const notes = lines >= 4
    ? [523, 659, 784, 1047, 1319]  // Tetris! big fanfare
    : lines === 3
    ? [440, 587, 740, 987]
    : lines === 2
    ? [392, 523, 659]
    : [330, 440]
  notes.forEach((freq, i) => {
    const osc = ctx.createOscillator()
    const vol = ctx.createGain()
    osc.connect(vol); vol.connect(ctx.destination)
    osc.type = 'triangle'
    osc.frequency.value = freq
    const t = ctx.currentTime + i * 0.07
    vol.gain.setValueAtTime(0.18, t)
    vol.gain.exponentialRampToValueAtTime(0.001, t + 0.18)
    osc.start(t); osc.stop(t + 0.2)
  })
  // Sub bass hit
  playTone(ctx, 80, 'sine', 0.3, 0.25, 40)
}

function sfxLock(ctx: AudioContext) {
  playTone(ctx, 180, 'square', 0.08, 0.12, 120)
}

function sfxRotate(ctx: AudioContext) {
  playTone(ctx, 440, 'sine', 0.06, 0.08, 600)
}

function sfxMove(ctx: AudioContext) {
  playTone(ctx, 220, 'sine', 0.04, 0.05, 220)
}

function sfxHardDrop(ctx: AudioContext) {
  playTone(ctx, 300, 'square', 0.12, 0.18, 60)
}

function sfxGameOver(ctx: AudioContext) {
  [440, 349, 294, 220].forEach((freq, i) => {
    const osc = ctx.createOscillator()
    const vol = ctx.createGain()
    osc.connect(vol); vol.connect(ctx.destination)
    osc.type = 'sawtooth'
    osc.frequency.value = freq
    const t = ctx.currentTime + i * 0.18
    vol.gain.setValueAtTime(0.15, t)
    vol.gain.exponentialRampToValueAtTime(0.001, t + 0.25)
    osc.start(t); osc.stop(t + 0.28)
  })
}

export default function TetrisGame({ onGameOver }: TetrisGameProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const canvasRef    = useRef<HTMLCanvasElement>(null)
  const nextCanvasRef = useRef<HTMLCanvasElement>(null)
  const audioCtxRef  = useRef<AudioContext | null>(null)

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
    // Line-clear animation
    lineClearAnim: LineClearAnim | null
    // Particle effects
    particles: Particle[]
  }>({
    grid: [], cur: null, nextType: '',
    score: 0, lines: 0, level: 0,
    dropInterval: 1000, last: 0, acc: 0,
    over: false, paused: false, animFrame: null, flashTimer: 0,
    lineClearAnim: null,
    particles: [],
  })

  const [score,  setScore]      = useState(0)
  const [lines,  setLines]      = useState(0)
  const [level,  setLevel]      = useState(0)
  const [isOver, setIsOver]     = useState(false)
  const [isPaused, setIsPaused] = useState(false)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [nextType, setNextType] = useState('')
  const [isMuted, setIsMuted]   = useState(false)
  const isMutedRef = useRef(false)

  // ── Audio helper ──
  const getAudio = () => {
    if (isMutedRef.current) return null
    if (!audioCtxRef.current) audioCtxRef.current = createAudioCtx()
    return audioCtxRef.current
  }

  const toggleMute = () => {
    isMutedRef.current = !isMutedRef.current
    setIsMuted(isMutedRef.current)
  }

  // ── Helpers ──
  const randomType = () => TYPES[Math.floor(Math.random() * TYPES.length)]
  const newGrid = (): (string | null)[][] => Array.from({ length: ROWS }, () => Array(COLS).fill(null))

  // ── Particle system ──
  interface Particle {
    x: number; y: number; vx: number; vy: number
    life: number; maxLife: number; color: string; size: number
  }

  const spawnParticles = (clearedRows: number[], grid: (string | null)[][]) => {
    const g = gameRef.current
    clearedRows.forEach(row => {
      for (let col = 0; col < COLS; col++) {
        const color = grid[row][col] ? COLORS[grid[row][col]!] : '#ffffff'
        for (let i = 0; i < 4; i++) {
          g.particles.push({
            x: (col + 0.5) * CELL,
            y: (row + 0.5) * CELL,
            vx: (Math.random() - 0.5) * 6,
            vy: (Math.random() - 1.5) * 5,
            life: 1,
            maxLife: 0.6 + Math.random() * 0.6,
            color,
            size: 3 + Math.random() * 4,
          })
        }
      }
    })
  }

  // ── Drawing ──
  const roundRect = (ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) => {
    ctx.beginPath()
    ctx.moveTo(x + r, y); ctx.lineTo(x + w - r, y)
    ctx.quadraticCurveTo(x + w, y, x + w, y + r)
    ctx.lineTo(x + w, y + h - r)
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h)
    ctx.lineTo(x + r, y + h)
    ctx.quadraticCurveTo(x, y + h, x, y + h - r)
    ctx.lineTo(x, y + r)
    ctx.quadraticCurveTo(x, y, x + r, y)
    ctx.closePath()
  }

  const drawCell = (ctx: CanvasRenderingContext2D, x: number, y: number, color: string, glow: string, cs: number = CELL, alpha = 1) => {
    const px = x * cs, py = y * cs
    ctx.globalAlpha = alpha
    ctx.shadowColor = glow; ctx.shadowBlur = 8
    ctx.fillStyle = color
    roundRect(ctx, px + 1, py + 1, cs - 2, cs - 2, 4); ctx.fill()
    const grad = ctx.createLinearGradient(px, py, px + cs, py + cs)
    grad.addColorStop(0, 'rgba(255,255,255,0.3)')
    grad.addColorStop(0.5, 'rgba(255,255,255,0.05)')
    grad.addColorStop(1, 'rgba(0,0,0,0.2)')
    ctx.fillStyle = grad
    roundRect(ctx, px + 1, py + 1, cs - 2, cs - 2, 4); ctx.fill()
    ctx.shadowBlur = 0
    ctx.strokeStyle = 'rgba(255,255,255,0.18)'; ctx.lineWidth = 1
    roundRect(ctx, px + 1, py + 1, cs - 2, cs - 2, 4); ctx.stroke()
    ctx.globalAlpha = 1
  }

  const drawGrid = (ctx: CanvasRenderingContext2D) => {
    ctx.strokeStyle = 'rgba(255,255,255,0.04)'; ctx.lineWidth = 0.5
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
    if (!g.cur || g.lineClearAnim) return
    let ghostY = 0
    while (!collide(0, ghostY + 1, g.cur.cells, g.cur, g.grid)) ghostY++
    if (ghostY === 0) return
    ctx.globalAlpha = 0.15
    for (const c of g.cur.cells) {
      const px = (g.cur.x + c.x) * CELL, py = (g.cur.y + ghostY + c.y) * CELL
      ctx.fillStyle = COLORS[g.cur.type]
      roundRect(ctx, px + 1, py + 1, CELL - 2, CELL - 2, 4); ctx.fill()
    }
    ctx.globalAlpha = 1
  }

  // Draw line-clear animation: rows flash white and explode outward
  const drawLineClearAnim = (ctx: CanvasRenderingContext2D, now: number) => {
    const g = gameRef.current
    const anim = g.lineClearAnim
    if (!anim) return

    anim.progress = Math.min(1, (now - anim.startTime) / anim.duration)
    const p = anim.progress

    anim.rows.forEach(row => {
      // Phase 1 (0-0.4): white flash fill
      if (p < 0.4) {
        const brightness = Math.sin(p / 0.4 * Math.PI)
        ctx.globalAlpha = brightness * 0.85
        ctx.fillStyle = '#ffffff'
        ctx.fillRect(0, row * CELL, COLS * CELL, CELL)
        ctx.globalAlpha = 1
      }

      // Phase 2 (0.4-1): row splits and slides out horizontally
      if (p >= 0.4) {
        const t = (p - 0.4) / 0.6    // 0..1 in second phase
        const slideX = t * COLS * CELL * 1.2
        const alpha = 1 - t

        // Left half slides left
        ctx.save()
        ctx.globalAlpha = alpha
        ctx.drawImage(
          ctx.canvas,
          0, row * CELL, (COLS * CELL) / 2, CELL,   // src
          -slideX, row * CELL, (COLS * CELL) / 2, CELL  // dst
        )
        // Right half slides right
        ctx.drawImage(
          ctx.canvas,
          (COLS * CELL) / 2, row * CELL, (COLS * CELL) / 2, CELL,
          (COLS * CELL) / 2 + slideX, row * CELL, (COLS * CELL) / 2, CELL
        )
        ctx.restore()
      }
    })

    if (anim.progress >= 1) {
      g.lineClearAnim = null
    }
  }

  // Draw particles
  const drawParticles = (ctx: CanvasRenderingContext2D, dt: number) => {
    const g = gameRef.current
    g.particles = g.particles.filter(p => p.life > 0)
    g.particles.forEach(p => {
      p.x  += p.vx
      p.y  += p.vy
      p.vy += 0.25  // gravity
      p.life -= dt / (p.maxLife * 1000)

      const alpha = Math.max(0, p.life)
      ctx.save()
      ctx.globalAlpha = alpha
      ctx.fillStyle = p.color
      ctx.shadowColor = p.color; ctx.shadowBlur = 6
      ctx.beginPath()
      ctx.arc(p.x, p.y, p.size * alpha, 0, Math.PI * 2)
      ctx.fill()
      ctx.restore()
    })
  }

  const drawBoard = useCallback((dt = 0) => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    const g = gameRef.current
    const now = performance.now()

    ctx.clearRect(0, 0, canvas.width, canvas.height)
    drawGrid(ctx)

    // Flash overlay
    if (g.flashTimer > 0) {
      g.flashTimer--
      if (g.flashTimer % 2 === 0) {
        ctx.fillStyle = 'rgba(0,229,255,0.06)'
        ctx.fillRect(0, 0, canvas.width, canvas.height)
      }
    }

    // Locked blocks (skip clearing rows during animation)
    const clearingRows = g.lineClearAnim?.rows ?? []
    for (let y = 0; y < ROWS; y++) {
      for (let x = 0; x < COLS; x++) {
        if (g.grid[y][x] && !clearingRows.includes(y)) {
          drawCell(ctx, x, y, COLORS[g.grid[y][x]!], GLOW[g.grid[y][x]!])
        }
      }
    }

    drawGhost(ctx)

    // Current piece (hidden during line-clear anim)
    if (g.cur && !g.lineClearAnim) {
      for (const c of g.cur.cells) {
        drawCell(ctx, g.cur.x + c.x, g.cur.y + c.y, COLORS[g.cur.type], GLOW[g.cur.type])
      }
    }

    // Particles
    drawParticles(ctx, dt)

    // Line-clear animation (drawn last, on top)
    if (g.lineClearAnim) drawLineClearAnim(ctx, now)
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
      ctx.shadowColor = GLOW[g.nextType]; ctx.shadowBlur = 8
      ctx.fillStyle = COLORS[g.nextType]
      roundRect(ctx, px + 1, py + 1, cs - 2, cs - 2, 3); ctx.fill()
      const grad = ctx.createLinearGradient(px, py, px + cs, py + cs)
      grad.addColorStop(0, 'rgba(255,255,255,0.3)'); grad.addColorStop(1, 'rgba(0,0,0,0.2)')
      ctx.fillStyle = grad; roundRect(ctx, px + 1, py + 1, cs - 2, cs - 2, 3); ctx.fill()
      ctx.shadowBlur = 0; ctx.strokeStyle = 'rgba(255,255,255,0.18)'; ctx.lineWidth = 0.5
      roundRect(ctx, px + 1, py + 1, cs - 2, cs - 2, 3); ctx.stroke()
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
    if (collide(0, 0, g.cur.cells, g.cur, g.grid)) gameOver()
  }, [drawNextPiece])

  const syncHUD = useCallback(() => {
    const g = gameRef.current
    setScore(g.score); setLines(g.lines); setLevel(g.level)
  }, [])

  const clearLines = useCallback(() => {
    const g = gameRef.current
    const clearedRows: number[] = []
    for (let y = ROWS - 1; y >= 0; y--) {
      if (g.grid[y].every(v => v)) clearedRows.push(y)
    }

    if (clearedRows.length > 0) {
      // Spawn particles from the rows about to clear
      spawnParticles(clearedRows, g.grid)

      // Start line-clear animation
      g.lineClearAnim = {
        rows: clearedRows,
        progress: 0,
        startTime: performance.now(),
        duration: 500,
      }

      // Sound effect
      const audio = getAudio()
      if (audio) sfxScore(audio, clearedRows.length)

      // Update grid after animation finishes
      setTimeout(() => {
        const gNow = gameRef.current
        // Remove cleared rows (sorted descending so splice doesn't offset)
        const sortedRows = [...clearedRows].sort((a, b) => b - a)
        sortedRows.forEach(y => {
          gNow.grid.splice(y, 1)
          gNow.grid.unshift(Array(COLS).fill(null))
        })

        const cleared = clearedRows.length
        gNow.score  += cleared >= 4 ? cleared * 20 : cleared * 10
        gNow.lines  += cleared
        gNow.level   = Math.floor(gNow.lines / 5)
        gNow.dropInterval = Math.max(100, 1000 - gNow.level * 100)
        gNow.flashTimer   = 8
        gNow.lineClearAnim = null
        syncHUD()
        spawn()
      }, 520)
    } else {
      spawn()
    }
  }, [syncHUD, spawn])

  const lock = useCallback(() => {
    const g = gameRef.current
    if (!g.cur) return
    for (const c of g.cur.cells) {
      const x = g.cur.x + c.x, y = g.cur.y + c.y
      if (y >= 0) g.grid[y][x] = g.cur.type
    }
    const audio = getAudio()
    if (audio) sfxLock(audio)
    clearLines()
  }, [clearLines])

  const move = useCallback((dx: number) => {
    const g = gameRef.current
    if (g.lineClearAnim) return
    if (g.cur && !collide(dx, 0, g.cur.cells, g.cur, g.grid)) {
      g.cur.x += dx
      const audio = getAudio()
      if (audio) sfxMove(audio)
    }
  }, [])

  const rotate = useCallback(() => {
    const g = gameRef.current
    if (!g.cur || g.cur.type === 'O' || g.lineClearAnim) return
    const rot = g.cur.cells.map(({ x, y }) => ({ x: -y + 1, y: x }))
    if (!collide(0, 0, rot, g.cur, g.grid)) {
      g.cur.cells = rot
      const audio = getAudio()
      if (audio) sfxRotate(audio)
    }
  }, [])

  const softDrop = useCallback(() => {
    const g = gameRef.current
    if (g.lineClearAnim) return
    if (g.cur && !collide(0, 1, g.cur.cells, g.cur, g.grid)) g.cur.y++
    else if (g.cur) lock()
  }, [lock])

  const hardDrop = useCallback(() => {
    const g = gameRef.current
    if (g.lineClearAnim) return
    if (g.cur) {
      while (!collide(0, 1, g.cur.cells, g.cur, g.grid)) g.cur.y++
      const audio = getAudio()
      if (audio) sfxHardDrop(audio)
      lock()
    }
  }, [lock])

  const gameOver = useCallback(() => {
    const g = gameRef.current
    g.over = true
    setIsOver(true)
    const audio = getAudio()
    if (audio) sfxGameOver(audio)
    const canvas = canvasRef.current
    if (canvas) {
      const ctx = canvas.getContext('2d')
      if (ctx) {
        ctx.fillStyle = 'rgba(5,5,16,0.88)'
        ctx.fillRect(0, 0, canvas.width, canvas.height)
        ctx.save(); ctx.textAlign = 'center'; ctx.textBaseline = 'middle'
        const cx = canvas.width / 2, cy = canvas.height / 2
        ctx.shadowColor = '#ff4d6a'; ctx.shadowBlur = 40
        ctx.font = "700 36px 'Montserrat', system-ui, sans-serif"
        ctx.fillStyle = '#ff4d6a'; ctx.fillText('GAME OVER', cx, cy - 35)
        ctx.shadowColor = '#00e5ff'; ctx.shadowBlur = 20
        ctx.font = "700 22px 'Montserrat', system-ui, sans-serif"
        ctx.fillStyle = '#00e5ff'; ctx.fillText(`Điểm: ${g.score}`, cx, cy + 15)
        ctx.shadowBlur = 0; ctx.font = "500 14px 'Montserrat', system-ui, sans-serif"
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
    g.flashTimer = 0;
    g.lineClearAnim = null; g.particles = []
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
    let lastTime = 0
    const loop = (t: number) => {
      const g = gameRef.current
      const dt = t - lastTime
      lastTime = t
      if (!g.last) g.last = t
      const framedt = t - g.last
      g.last = t

      if (!g.over && !g.paused) {
        // Skip drop while line-clear animation is playing
        if (!g.lineClearAnim) {
          g.acc += framedt
          if (g.acc > g.dropInterval) { softDrop(); g.acc = 0 }
        }
        drawBoard(dt)
      }
      g.animFrame = requestAnimationFrame(loop)
    }
    start()
    gameRef.current.animFrame = requestAnimationFrame(loop)
    return () => { if (gameRef.current.animFrame) cancelAnimationFrame(gameRef.current.animFrame) }
  }, [])

  // ── Keyboard ──
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (['Space','ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(e.code)) e.preventDefault()
      const g = gameRef.current
      if (g.over && e.code === 'KeyR') { start(); return }
      if (e.code === 'KeyP') { togglePause(); return }
      if (e.code === 'KeyM') { toggleMute(); return }
      if (g.over || g.paused) return
      switch (e.code) {
        case 'ArrowLeft':  move(-1);    break
        case 'ArrowRight': move(1);     break
        case 'ArrowUp':    rotate();    break
        case 'ArrowDown':  softDrop();  break
        case 'Space':      hardDrop();  break
        case 'KeyR':       start();     break
      }
    }
    window.addEventListener('keydown', handleKey)
    containerRef.current?.focus()
    return () => window.removeEventListener('keydown', handleKey)
  }, [move, rotate, softDrop, hardDrop, start, togglePause])

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen().catch(() => {})
      setIsFullscreen(true)
    } else {
      document.exitFullscreen()
      setIsFullscreen(false)
    }
  }
  useEffect(() => {
    const onChange = () => setIsFullscreen(!!document.fullscreenElement)
    document.addEventListener('fullscreenchange', onChange)
    return () => document.removeEventListener('fullscreenchange', onChange)
  }, [])

  const neonText = (color: string) => ({ textShadow: `0 0 10px ${color}, 0 0 30px ${color}`, color })

  return (
    <div
      className={`tetris-game ${isFullscreen ? 'fullscreen-mode' : ''}`}
      ref={containerRef}
      tabIndex={0}
      onFocus={() => {}}
      style={{
        background: isFullscreen ? '#0a0a1a' : 'transparent',
        padding: isFullscreen ? '20px' : '0',
        height: isFullscreen ? '100vh' : 'auto',
        justifyContent: isFullscreen ? 'center' : 'flex-start',
        outline: 'none',
      }}
    >
      <div className="tetris-main">
        {/* Board */}
        <div className="tetris-board-wrap">
          <button
            onClick={toggleFullscreen}
            style={{ position: 'absolute', top: 8, right: 8, zIndex: 10, background: 'rgba(255,255,255,0.1)', border: 'none', borderRadius: 8, cursor: 'pointer', padding: 6 }}
            title="Toàn màn hình"
          >{isFullscreen ? '↙️' : '↗️'}</button>
          <div className="tetris-glow-ring" />
          <canvas ref={canvasRef} width={COLS * CELL} height={ROWS * CELL} className="tetris-canvas" />
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

          {/* Lines + Level */}
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

          {/* Controls - desktop */}
          <div className="tetris-stat-card desktop-only">
            <div className="tetris-stat-label">ĐIỀU KHIỂN</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              {[['← →','Di chuyển'],['↑','Xoay thủ công'],['↓','Rơi nhanh'],['Space','Rơi liền'],['P','Tạm dừng'],['M','Tắt âm'],['R','Chơi lại']].map(([key, desc]) => (
                <div key={key} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span className="tetris-key">{key}</span>
                  <span className="tetris-key-desc">{desc}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Quick actions - mobile */}
          <div className="tetris-quick-actions mobile-only">
            <button onClick={start} className="tetris-action-btn tetris-action-restart">🔄</button>
            <button onClick={togglePause} className="tetris-action-btn tetris-action-pause">{isPaused ? '▶' : '⏸'}</button>
            <button onClick={toggleMute} className="tetris-action-btn tetris-action-mute" style={{ background: isMuted ? 'rgba(255,77,106,0.15)' : 'rgba(57,231,95,0.1)', border: `1px solid ${isMuted ? 'rgba(255,77,106,0.25)' : 'rgba(57,231,95,0.2)'}`, color: isMuted ? '#ff4d6a' : '#39e75f' }}>{isMuted ? '🔇' : '🔊'}</button>
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
        <div className="tetris-touch-row">
          <MobileBtn onClick={toggleMute} label={isMuted ? '🔇' : '🔊'} wide>
            <span style={{ fontSize: 20 }}>{isMuted ? '🔇' : '🔊'}</span>
          </MobileBtn>
        </div>
      </div>

      <style>{`
        @keyframes glowSpin { to { filter: blur(6px) hue-rotate(360deg); } }
        @keyframes scoreFlash {
          0%   { transform: scale(1); }
          40%  { transform: scale(1.25); color: #ffe14d; text-shadow: 0 0 20px #ffe14d, 0 0 40px #ffe14d; }
          100% { transform: scale(1); }
        }

        .tetris-game { display: flex; flex-direction: column; gap: 10px; width: 100%; align-items: center; }
        .tetris-main { display: flex; gap: 16px; justify-content: center; align-items: flex-start; }

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

        .tetris-sidebar { display: flex; flex-direction: column; gap: 10px; min-width: 160px; max-width: 180px; }
        .tetris-stat-card {
          background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.08);
          border-radius: 16px; padding: 14px 16px; backdrop-filter: blur(16px);
        }
        .tetris-stat-label { font-size: 9px; font-weight: 700; letter-spacing: 2px; color: rgba(255,255,255,0.4); margin-bottom: 4px; }
        .tetris-stat-value { font-weight: 900; line-height: 1; }
        .tetris-score-val { font-size: 30px; color: #00e5ff; text-shadow: 0 0 10px #00e5ff, 0 0 30px #00e5ff; transition: all .15s; }
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
          color: #00e5ff; background: rgba(0,229,255,0.1); border: 1px solid rgba(0,229,255,0.2);
          border-radius: 5px; font-family: var(--font-body), Montserrat, monospace;
        }
        .tetris-key-desc { font-size: 11px; color: rgba(255,255,255,0.4); font-weight: 500; }
        .tetris-quick-actions { display: flex; gap: 4px; }
        .tetris-action-btn {
          flex: 1; padding: 6px; border-radius: 8px; font-size: 14px;
          font-weight: 700; cursor: pointer; font-family: var(--font-body), Montserrat, sans-serif;
        }
        .tetris-action-restart { background: rgba(0,229,255,0.1); border: 1px solid rgba(0,229,255,0.2); color: #00e5ff; }
        .tetris-action-pause   { background: rgba(255,225,77,0.1); border: 1px solid rgba(255,225,77,0.2); color: #ffe14d; }
        .tetris-touch-controls { display: flex; flex-direction: column; gap: 6px; align-items: center; }
        .tetris-touch-row { display: flex; gap: 8px; }

        .mobile-only  { display: none !important; }
        .desktop-only { display: inline !important; }

        @media (max-width: 767px) {
          .mobile-only  { display: flex !important; }
          .desktop-only { display: none !important; }
          .tetris-main  { gap: 8px; }
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

function MobileBtn({ onClick, children, label, accent, purple, wide }: {
  onClick: () => void; children: React.ReactNode; label: string;
  accent?: boolean; purple?: boolean; wide?: boolean;
}) {
  const bg     = accent ? 'rgba(228,29,29,0.12)' : purple ? 'rgba(180,77,255,0.1)' : 'rgba(255,255,255,0.06)'
  const border = accent ? 'rgba(228,29,29,0.25)'  : purple ? 'rgba(180,77,255,0.2)' : 'rgba(255,255,255,0.1)'
  const color  = accent ? '#ff4d6a'                : purple ? '#b44dff'               : '#ffffff'
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
      onTouchStart={e => { e.currentTarget.style.transform = 'scale(0.9)'; e.currentTarget.style.boxShadow = `0 0 15px ${border}` }}
      onTouchEnd={e   => { e.currentTarget.style.transform = 'scale(1)';   e.currentTarget.style.boxShadow = 'none' }}
    >{children}</button>
  )
}

'use client'

import { useEffect, useRef } from 'react'
import type { GameKey } from '@/lib/game-config'

interface UseGameAudioOptions {
  game: GameKey
  active: boolean
  enabled: boolean
  volume?: number
}

function getAudioContext() {
  const AudioContextClass = window.AudioContext ||
    (window as Window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
  return AudioContextClass ? new AudioContextClass() : null
}

export function useGameAudio({ game, active, enabled, volume = 0.18 }: UseGameAudioOptions) {
  const ctxRef = useRef<AudioContext | null>(null)
  const timerRef = useRef<number | null>(null)

  useEffect(() => {
    if (!active || !enabled) return

    let disposed = false
    const ctx = getAudioContext()
    if (!ctx) return
    ctxRef.current = ctx

    const sequence = game === 'tetris'
      ? [196, 247, 294, 247, 220, 262]
      : [147, 196, 220, 196, 165, 220]
    let step = 0

    const playNote = () => {
      if (disposed || ctx.state === 'closed') return
      try {
        void ctx.resume()
        const osc = ctx.createOscillator()
        const gain = ctx.createGain()
        const filter = ctx.createBiquadFilter()
        const now = ctx.currentTime

        osc.type = game === 'tetris' ? 'triangle' : 'sine'
        osc.frequency.setValueAtTime(sequence[step % sequence.length], now)
        filter.type = 'lowpass'
        filter.frequency.setValueAtTime(900, now)
        gain.gain.setValueAtTime(0.0001, now)
        gain.gain.exponentialRampToValueAtTime(volume, now + 0.04)
        gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.36)

        osc.connect(filter)
        filter.connect(gain)
        gain.connect(ctx.destination)
        osc.start(now)
        osc.stop(now + 0.38)
        step += 1
      } catch {
        // Audio must never break gameplay.
      }
    }

    playNote()
    timerRef.current = window.setInterval(playNote, game === 'tetris' ? 420 : 560)

    return () => {
      disposed = true
      if (timerRef.current) window.clearInterval(timerRef.current)
      timerRef.current = null
      const current = ctxRef.current
      ctxRef.current = null
      if (current && current.state !== 'closed') void current.close().catch(() => undefined)
    }
  }, [active, enabled, game, volume])
}

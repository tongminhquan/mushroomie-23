import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import GameReadyOverlay from '../src/components/minigame/GameReadyOverlay'
import BlockBlastGame from '../src/components/minigame/BlockBlastGame'
import TetrisGame from '../src/components/minigame/TetrisGame'

const callbacks = {
  onGameOver: () => undefined,
  onRestart: () => undefined,
  onStart: () => undefined,
}

test('ready overlay exposes a branded start action and loading state', () => {
  const readyHtml = renderToStaticMarkup(createElement(GameReadyOverlay, {
    game: 'tetris',
    starting: false,
    signedIn: false,
    onStart: () => undefined,
  }))
  assert.match(readyHtml, /data-game-ready-overlay="tetris"/)
  assert.match(readyHtml, /Bắt đầu trò chơi/)
  assert.match(readyHtml, /Đăng nhập để lưu điểm và nhận voucher/)

  const startingHtml = renderToStaticMarkup(createElement(GameReadyOverlay, {
    game: 'block-blast',
    starting: true,
    signedIn: true,
    onStart: () => undefined,
  }))
  assert.match(startingHtml, /Đang chuẩn bị/)
  assert.match(startingHtml, /disabled=""/)
})

test('Tetris renders ready UI before a run and removes it for active play', () => {
  const readyHtml = renderToStaticMarkup(createElement(TetrisGame, {
    ...callbacks,
    ready: true,
    starting: false,
    signedIn: false,
    soundEnabled: false,
  }))
  assert.match(readyHtml, /data-game-ready-overlay="tetris"/)
  assert.match(readyHtml, /tabindex="-1"/)

  const activeHtml = renderToStaticMarkup(createElement(TetrisGame, {
    ...callbacks,
    ready: false,
    starting: false,
    signedIn: true,
    soundEnabled: false,
  }))
  assert.doesNotMatch(activeHtml, /data-game-ready-overlay=/)
  assert.match(activeHtml, /tabindex="0"/)
})

test('Block Blast renders ready UI before a run and removes it for active play', () => {
  const readyHtml = renderToStaticMarkup(createElement(BlockBlastGame, {
    ...callbacks,
    ready: true,
    starting: false,
    signedIn: false,
    soundEnabled: false,
  }))
  assert.match(readyHtml, /data-game-ready-overlay="block-blast"/)

  const activeHtml = renderToStaticMarkup(createElement(BlockBlastGame, {
    ...callbacks,
    ready: false,
    starting: false,
    signedIn: true,
    soundEnabled: false,
  }))
  assert.doesNotMatch(activeHtml, /data-game-ready-overlay=/)
})

test('game routes always mount the game card and delegate ready UI to the games', async () => {
  const source = await readFile('src/components/minigame/GamePageClient.tsx', 'utf8')
  assert.doesNotMatch(source, /function StartScreen/)
  assert.doesNotMatch(source, /phase === 'start'/)
  assert.match(source, /ready=\{phase === 'ready'\}/)
  assert.match(source, /starting=\{starting\}/)
  assert.match(source, /setStarting\(true\)/)
  assert.match(source, /setRunId\(\(value\) => value \+ 1\)/)
})

import assert from 'node:assert/strict'
import test from 'node:test'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import GameReadyOverlay from '../src/components/minigame/GameReadyOverlay'

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

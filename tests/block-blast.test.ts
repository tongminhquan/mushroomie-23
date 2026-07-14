import assert from 'node:assert/strict'
import test from 'node:test'
import {
  SHAPE_POOL,
  canPlace,
  canPlaceAnywhere,
  generateHandMatrices,
  normalizeShape,
  pickWeightedShape,
  withRotations,
  type Board,
  type ShapeMatrix,
} from '../src/lib/minigame/block-blast'

function emptyBoard(size = 8): Board {
  return Array.from({ length: size }, () => Array(size).fill(null))
}

function seededRandom(seed: number) {
  let state = seed >>> 0
  return () => {
    state = (Math.imul(state, 1664525) + 1013904223) >>> 0
    return state / 0x1_0000_0000
  }
}

function cellCount(matrix: ShapeMatrix) {
  return matrix.flat().filter(Boolean).length
}

function shapeKey(matrix: ShapeMatrix) {
  return normalizeShape(matrix).map((row) => row.join('')).join('/')
}

function isConnected(matrix: ShapeMatrix) {
  const cells = new Set<string>()
  matrix.forEach((row, rowIndex) => row.forEach((value, columnIndex) => {
    if (value) cells.add(`${rowIndex}:${columnIndex}`)
  }))
  const first = cells.values().next().value as string | undefined
  if (!first) return false

  const seen = new Set([first])
  const queue = [first]
  while (queue.length > 0) {
    const current = queue.shift()
    if (!current) continue
    const [row, column] = current.split(':').map(Number)
    for (const [nextRow, nextColumn] of [
      [row - 1, column],
      [row + 1, column],
      [row, column - 1],
      [row, column + 1],
    ]) {
      const key = `${nextRow}:${nextColumn}`
      if (cells.has(key) && !seen.has(key)) {
        seen.add(key)
        queue.push(key)
      }
    }
  }

  return seen.size === cells.size
}

test('shape normalization trims empty borders and rotations are deduplicated', () => {
  assert.deepEqual(
    normalizeShape([[0, 0, 0], [0, 1, 1], [0, 0, 0]]),
    [[1, 1]],
  )
  assert.equal(withRotations([[1, 1], [1, 1]]).length, 1)
  assert.equal(withRotations([[1, 1, 1]]).length, 2)
  assert.equal(withRotations([[1, 0], [1, 1]]).length, 4)
})

test('shape pool is globally unique, connected, bounded, and internally consistent', () => {
  const keys = new Set<string>()
  assert.equal(SHAPE_POOL.length, 50)

  for (const shape of SHAPE_POOL) {
    const key = shape.matrix.map((row) => row.join('')).join('/')
    assert.equal(keys.has(key), false, key)
    keys.add(key)
    assert.equal(isConnected(shape.matrix), true, key)
    assert.equal(shape.size, cellCount(shape.matrix), key)
    assert.ok(shape.size >= 1, key)
    assert.ok(shape.matrix.length <= 8, key)
    assert.ok(shape.matrix.every((row) => row.length <= 8), key)
  }
})

test('shape pool includes the new balanced polyomino families', () => {
  const poolKeys = new Set(SHAPE_POOL.map(({ matrix }) => shapeKey(matrix)))
  const expectedNewShapes = [
    [[1, 0], [1, 0], [1, 1]],
    [[0, 1], [0, 1], [1, 1]],
    [[1, 1, 1], [1, 1, 1]],
    [[1, 0, 1], [1, 1, 1]],
    [[1, 1], [1, 1], [1, 0]],
    [[1, 1], [1, 1], [0, 1]],
  ]

  for (const matrix of expectedNewShapes) {
    assert.equal(poolKeys.has(shapeKey(matrix)), true, shapeKey(matrix))
  }
})

test('placement helpers respect occupied cells and board bounds', () => {
  const board: Board = [
    [null, null, null],
    [null, 'filled', null],
    [null, null, null],
  ]
  const domino = [[1, 1]]

  assert.equal(canPlace(board, domino, 0, 0), true)
  assert.equal(canPlace(board, domino, 1, 0), false)
  assert.equal(canPlace(board, domino, 0, 2), false)
  assert.equal(canPlaceAnywhere(board, domino), true)
  assert.equal(SHAPE_POOL.every(({ matrix }) => canPlaceAnywhere(emptyBoard(), matrix)), true)
})

test('empty board hand has three playable pieces', () => {
  const board = emptyBoard()
  const hand = generateHandMatrices(board, seededRandom(11))

  assert.equal(hand.length, 3)
  assert.equal(hand.every((matrix) => canPlaceAnywhere(board, matrix)), true)
})

test('near-full board hand always contains a playable piece', () => {
  const board = Array.from({ length: 8 }, () => Array<string | null>(8).fill('filled'))
  board[7][7] = null

  const hand = generateHandMatrices(board, () => 0.999999)
  assert.equal(hand.length, 3)
  assert.equal(hand.some((matrix) => canPlaceAnywhere(board, matrix)), true)
})

test('full board returns promptly with no playable pieces', () => {
  const board = Array.from({ length: 8 }, () => Array<string | null>(8).fill('filled'))
  const hand = generateHandMatrices(board, seededRandom(19))

  assert.equal(hand.length, 3)
  assert.equal(hand.every((matrix) => !canPlaceAnywhere(board, matrix)), true)
})

test('weighted picker trends toward smaller pieces as the board fills', () => {
  const openBoard = emptyBoard()
  const denseBoard = emptyBoard()
  for (let row = 0; row < 7; row++) denseBoard[row].fill('filled')

  const openRng = seededRandom(2026)
  const denseRng = seededRandom(2026)
  const sampleCount = 10_000
  let openTotal = 0
  let denseTotal = 0

  for (let sample = 0; sample < sampleCount; sample++) {
    openTotal += cellCount(pickWeightedShape(openBoard, openRng))
    denseTotal += cellCount(pickWeightedShape(denseBoard, denseRng))
  }

  assert.ok(denseTotal / sampleCount < openTotal / sampleCount)
})

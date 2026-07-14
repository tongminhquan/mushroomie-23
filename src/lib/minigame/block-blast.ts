export type ShapeMatrix = number[][]
export type Board = (string | null)[][]

const MAX_HAND_ATTEMPTS = 40

const BASE_SHAPES: ShapeMatrix[] = [
  [[1]],
  [[1, 1]],
  [[1, 1, 1]],
  [[1, 1, 1, 1]],
  [[1, 1, 1, 1, 1]],
  [[1, 1], [1, 1]],
  [[1, 1, 1], [1, 1, 1], [1, 1, 1]],
  [[1, 0], [1, 1]],
  [[1, 0, 0], [1, 0, 0], [1, 1, 1]],
  [[1, 1, 1], [0, 1, 0]],
  [[0, 1, 1], [1, 1, 0]],
  [[1, 1, 0], [0, 1, 1]],
  [[0, 1, 0], [1, 1, 1], [0, 1, 0]],
  [[1, 0], [1, 0], [1, 1]],
  [[0, 1], [0, 1], [1, 1]],
  [[1, 1, 1], [1, 1, 1]],
  [[1, 0, 1], [1, 1, 1]],
  [[1, 1], [1, 1], [1, 0]],
  [[1, 1], [1, 1], [0, 1]],
]

export function normalizeShape(matrix: ShapeMatrix): ShapeMatrix {
  if (matrix.length === 0 || matrix.every((row) => row.length === 0)) return [[1]]

  let minRow = matrix.length
  let maxRow = -1
  let minColumn = Math.max(0, ...matrix.map((row) => row.length))
  let maxColumn = -1

  for (let row = 0; row < matrix.length; row++) {
    for (let column = 0; column < matrix[row].length; column++) {
      if (!matrix[row][column]) continue
      minRow = Math.min(minRow, row)
      maxRow = Math.max(maxRow, row)
      minColumn = Math.min(minColumn, column)
      maxColumn = Math.max(maxColumn, column)
    }
  }

  if (minRow > maxRow) return [[1]]

  return Array.from({ length: maxRow - minRow + 1 }, (_, rowOffset) =>
    Array.from(
      { length: maxColumn - minColumn + 1 },
      (_, columnOffset) => matrix[minRow + rowOffset]?.[minColumn + columnOffset] ?? 0,
    ),
  )
}

export function rotate90(matrix: ShapeMatrix): ShapeMatrix {
  const normalized = normalizeShape(matrix)
  const rowCount = normalized.length
  const columnCount = normalized[0].length

  return normalizeShape(
    Array.from({ length: columnCount }, (_, column) =>
      Array.from({ length: rowCount }, (_, row) => normalized[rowCount - row - 1][column]),
    ),
  )
}

function shapeKey(matrix: ShapeMatrix) {
  return normalizeShape(matrix).map((row) => row.join('')).join('/')
}

export function withRotations(base: ShapeMatrix): ShapeMatrix[] {
  const unique = new Map<string, ShapeMatrix>()
  let current = normalizeShape(base)

  for (let rotation = 0; rotation < 4; rotation++) {
    unique.set(shapeKey(current), current)
    current = rotate90(current)
  }

  return [...unique.values()]
}

const uniqueShapes = new Map<string, ShapeMatrix>()

for (const base of BASE_SHAPES) {
  for (const matrix of withRotations(base)) {
    uniqueShapes.set(shapeKey(matrix), matrix)
  }
}

export const SHAPE_POOL = [...uniqueShapes.values()].map((matrix) => ({
  matrix,
  size: matrix.reduce(
    (total, row) => total + row.reduce((rowTotal, cell) => rowTotal + (cell ? 1 : 0), 0),
    0,
  ),
}))

export function canPlace(
  board: Board,
  matrix: ShapeMatrix,
  startRow: number,
  startColumn: number,
): boolean {
  for (let row = 0; row < matrix.length; row++) {
    for (let column = 0; column < matrix[row].length; column++) {
      if (!matrix[row][column]) continue

      const boardRow = startRow + row
      const boardColumn = startColumn + column
      if (
        boardRow < 0 ||
        boardRow >= board.length ||
        boardColumn < 0 ||
        boardColumn >= (board[boardRow]?.length ?? 0) ||
        board[boardRow][boardColumn]
      ) {
        return false
      }
    }
  }

  return true
}

export function canPlaceAnywhere(board: Board, matrix: ShapeMatrix): boolean {
  for (let row = 0; row < board.length; row++) {
    for (let column = 0; column < (board[row]?.length ?? 0); column++) {
      if (canPlace(board, matrix, row, column)) return true
    }
  }

  return false
}

export function countFilled(board: Board): number {
  return board.reduce(
    (total, row) => total + row.reduce((rowTotal, cell) => rowTotal + (cell ? 1 : 0), 0),
    0,
  )
}

function randomUnit(rng: () => number) {
  const value = rng()
  if (!Number.isFinite(value)) return 0
  return Math.min(Math.max(value, 0), 1 - Number.EPSILON)
}

function weightForSize(size: number, filledRatio: number) {
  if (size <= 2) return 1 + 1.5 * filledRatio
  if (size <= 4) return 2
  if (size <= 6) return 1.2 * (1 - filledRatio)
  return 0.6 * (1 - filledRatio) ** 2
}

function pickFromPool(
  board: Board,
  pool: typeof SHAPE_POOL,
  rng: () => number,
): ShapeMatrix {
  const cellCount = board.reduce((total, row) => total + row.length, 0)
  const filledRatio = cellCount === 0 ? 0 : Math.min(1, countFilled(board) / cellCount)
  const weighted = pool.map((shape) => ({
    shape,
    weight: weightForSize(shape.size, filledRatio),
  }))
  const totalWeight = weighted.reduce((total, entry) => total + entry.weight, 0)
  let target = randomUnit(rng) * totalWeight

  for (const entry of weighted) {
    if (target < entry.weight) return entry.shape.matrix.map((row) => [...row])
    target -= entry.weight
  }

  return pool[pool.length - 1].matrix.map((row) => [...row])
}

export function pickWeightedShape(board: Board, rng: () => number = Math.random): ShapeMatrix {
  return pickFromPool(board, SHAPE_POOL, rng)
}

export function generateHandMatrices(
  board: Board,
  rng: () => number = Math.random,
): ShapeMatrix[] {
  let lastHand: ShapeMatrix[] = []

  for (let attempt = 0; attempt < MAX_HAND_ATTEMPTS; attempt++) {
    lastHand = Array.from({ length: 3 }, () => pickWeightedShape(board, rng))
    if (lastHand.some((matrix) => canPlaceAnywhere(board, matrix))) return lastHand
  }

  const placeableShapes = SHAPE_POOL.filter(({ matrix }) => canPlaceAnywhere(board, matrix))
  if (placeableShapes.length === 0) return lastHand

  const guaranteedHand = Array.from({ length: 3 }, () => pickWeightedShape(board, rng))
  const guaranteedIndex = Math.floor(randomUnit(rng) * guaranteedHand.length)
  guaranteedHand[guaranteedIndex] = pickFromPool(board, placeableShapes, rng)
  return guaranteedHand
}

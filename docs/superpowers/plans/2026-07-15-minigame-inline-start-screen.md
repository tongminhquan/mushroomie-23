# Mini Game Inline Start Screen Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Show the real Tetris and Block Blast game surfaces immediately while preventing all gameplay, timing, input, and audio until the player clicks an inline start action.

**Architecture:** `GamePageClient` remains the session/token/result orchestrator and always mounts the selected game. A shared `GameReadyOverlay` supplies the ready UI, while each game receives the same ready-state props and owns the lifecycle guard that prevents early initialization and interaction. Starting or replaying increments `runId`, so active runs mount as fresh component instances with fresh score-session tokens.

**Tech Stack:** Next.js 16 App Router, React 19, TypeScript, Tailwind CSS, Canvas API, Pointer Events, Node test runner through `tsx`, PM2 standalone deployment.

## Global Constraints

- Apply the ready state to both `tetris` and `block-blast`.
- Do not change scoring rules, voucher thresholds, database schema, authentication, or API authorization.
- Do not start timers, gameplay input, drag behavior, or audio before a user gesture.
- Preserve game-over, score submission, leaderboard refresh, and replay behavior.
- Do not add dependencies or move mini-game code into a shared public layout bundle.
- Keep controls inert and the 44px start action accessible at desktop, 390px, and 360px widths.
- Production target is the verified host `codex@103.77.242.153`, project `/var/www/mushroomie`, PM2 process `mushroomie_pm2`.

## File Map

- Create `src/components/minigame/GameReadyOverlay.tsx`: shared ready-state props and branded inline overlay.
- Create `tests/minigame-start-flow.test.ts`: server-rendered contract tests for the overlay and both game integrations.
- Modify `src/components/minigame/TetrisGame.tsx`: idle canvas, loop/input guards, and Tetris ready overlay.
- Modify `src/components/minigame/BlockBlastGame.tsx`: deferred hand/timer, pointer guards, and Block Blast ready overlay.
- Modify `src/components/minigame/GamePageClient.tsx`: always render the game card, expose visible start loading state, and remove the old route-level `StartScreen`.

---

### Task 1: Shared Ready Overlay

**Files:**
- Create: `src/components/minigame/GameReadyOverlay.tsx`
- Create: `tests/minigame-start-flow.test.ts`

**Interfaces:**
- Produces: `GameStartStateProps` with required `ready`, `starting`, `signedIn`, and `onStart` fields.
- Produces: `GameReadyOverlay({ game, starting, signedIn, onStart })`.
- Consumes: `GameKey` and `GAME_DEFINITIONS` from `src/lib/game-config.ts`.

- [ ] **Step 1: Write the failing shared-overlay test**

```ts
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
```

- [ ] **Step 2: Run the test and confirm the missing-module failure**

Run: `npm exec tsx -- --test tests/minigame-start-flow.test.ts`

Expected: FAIL because `GameReadyOverlay` does not exist.

- [ ] **Step 3: Implement the shared overlay and props contract**

```tsx
import { Play } from 'lucide-react'
import { GAME_DEFINITIONS, type GameKey } from '@/lib/game-config'

export interface GameStartStateProps {
  ready: boolean
  starting: boolean
  signedIn: boolean
  onStart: () => void
}

export default function GameReadyOverlay({ game, starting, signedIn, onStart }: {
  game: GameKey
  starting: boolean
  signedIn: boolean
  onStart: () => void
}) {
  const config = GAME_DEFINITIONS[game]
  const titleId = `${game}-ready-title`

  return (
    <section
      role="region"
      aria-labelledby={titleId}
      data-game-ready-overlay={game}
      className="absolute inset-0 z-50 flex items-center justify-center overflow-y-auto rounded-2xl bg-[#070711]/92 p-4 py-6 backdrop-blur-md sm:p-6"
    >
      <div className="w-full max-w-lg rounded-2xl border border-white/12 bg-[#11111f]/95 p-5 text-center shadow-[0_24px_80px_rgba(0,0,0,.55)] sm:p-7">
        <p className="text-[11px] font-extrabold uppercase tracking-[0.2em] text-[#ff6b6b]">Sẵn sàng chơi</p>
        <h3 id={titleId} className="mt-2 text-2xl font-extrabold text-white sm:text-3xl">{config.title}</h3>
        <p className="mx-auto mt-3 max-w-md text-sm font-medium leading-6 text-white/72">{config.startHint}</p>
        <div className="mt-5 grid gap-2 text-left sm:grid-cols-2">
          {config.instructions.slice(0, 4).map((instruction) => (
            <div key={instruction} className="rounded-xl border border-white/10 bg-white/[.04] px-3 py-2 text-xs font-semibold leading-5 text-white/68">
              {instruction}
            </div>
          ))}
        </div>
        {!signedIn && (
          <p className="mt-4 rounded-xl border border-amber-300/20 bg-amber-300/10 px-3 py-2 text-xs font-semibold text-amber-100">
            Đăng nhập để lưu điểm và nhận voucher.
          </p>
        )}
        <button
          type="button"
          onClick={onStart}
          disabled={starting}
          className="mt-5 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#e41d1d] px-5 text-sm font-extrabold text-white shadow-[0_16px_36px_rgba(228,29,29,.32)] transition-[transform,background-color] hover:-translate-y-0.5 hover:bg-[#c91515] focus-visible:outline-3 focus-visible:outline-offset-3 focus-visible:outline-white disabled:cursor-wait disabled:opacity-60 disabled:transform-none"
        >
          <Play size={18} aria-hidden="true" />
          {starting ? 'Đang chuẩn bị...' : 'Bắt đầu trò chơi'}
        </button>
      </div>
    </section>
  )
}
```

- [ ] **Step 4: Run the focused test**

Run: `npm exec tsx -- --test tests/minigame-start-flow.test.ts`

Expected: PASS for the shared overlay test.

- [ ] **Step 5: Commit the shared UI**

```bash
git add src/components/minigame/GameReadyOverlay.tsx tests/minigame-start-flow.test.ts
git commit -m "feat: add shared mini game start overlay"
```

### Task 2: Tetris Ready Lifecycle

**Files:**
- Modify: `tests/minigame-start-flow.test.ts`
- Modify: `src/components/minigame/TetrisGame.tsx`

**Interfaces:**
- Consumes: `GameStartStateProps` and `GameReadyOverlay` from Task 1.
- Produces: Tetris renders `data-game-ready-overlay="tetris"` only while `ready` is true.

- [ ] **Step 1: Add the failing Tetris integration test**

```ts
import TetrisGame from '../src/components/minigame/TetrisGame'

const callbacks = {
  onGameOver: () => undefined,
  onRestart: () => undefined,
  onStart: () => undefined,
}

test('Tetris renders ready UI before a run and removes it for active play', () => {
  const readyHtml = renderToStaticMarkup(createElement(TetrisGame, {
    ...callbacks,
    ready: true,
    starting: false,
    signedIn: false,
    soundEnabled: false,
  }))
  assert.match(readyHtml, /data-game-ready-overlay="tetris"/)

  const activeHtml = renderToStaticMarkup(createElement(TetrisGame, {
    ...callbacks,
    ready: false,
    starting: false,
    signedIn: true,
    soundEnabled: false,
  }))
  assert.doesNotMatch(activeHtml, /data-game-ready-overlay=/)
})
```

- [ ] **Step 2: Run the test and confirm the props/overlay failure**

Run: `npm exec tsx -- --test tests/minigame-start-flow.test.ts`

Expected: FAIL because Tetris does not accept or render the ready-state contract.

- [ ] **Step 3: Add Tetris lifecycle guards**

Move grid creation to a stable module helper and extend the props:

```tsx
import GameReadyOverlay, { type GameStartStateProps } from '@/components/minigame/GameReadyOverlay'

const createGrid = (): (string | null)[][] =>
  Array.from({ length: ROWS }, () => Array(COLS).fill(null))

interface TetrisGameProps extends GameStartStateProps {
  onGameOver?: (result: GameOverPayload) => void
  onRestart: () => void
  restartDisabled?: boolean
  soundEnabled?: boolean
  onSoundToggle?: (enabled: boolean) => void
}
```

Initialize `gameRef.grid` with `createGrid()` and `startedAt` with `0`. Destructure `ready`, `starting`, `signedIn`, and `onStart` from props. Replace every `newGrid()` call with `createGrid()`.

Replace the game-loop effect with:

```tsx
useEffect(() => {
  if (ready) {
    const game = gameRef.current
    game.grid = createGrid()
    game.cur = null
    game.nextType = ''
    drawBoard()
    drawNextPiece()
    return
  }

  let lastTime = 0
  const loop = (time: number) => {
    const game = gameRef.current
    const delta = time - lastTime
    lastTime = time
    if (!game.last) game.last = time
    const frameDelta = time - game.last
    game.last = time
    if (!game.over && !game.paused) {
      if (!game.lineClearAnim) {
        game.acc += frameDelta
        if (game.acc > game.dropInterval) {
          softDrop()
          game.acc = 0
        }
      }
      drawBoard(delta)
    }
    game.animFrame = requestAnimationFrame(loop)
  }

  start()
  gameRef.current.animFrame = requestAnimationFrame(loop)
  return () => {
    if (gameRef.current.animFrame) cancelAnimationFrame(gameRef.current.animFrame)
  }
}, [drawBoard, drawNextPiece, ready, softDrop, start])
```

Return early from the keyboard effect when `ready` is true and include `ready` in its dependency list. Mark gameplay wrappers inert while ready, make `.tetris-game` positioned, and render:

```tsx
{ready && (
  <GameReadyOverlay
    game="tetris"
    starting={starting}
    signedIn={signedIn}
    onStart={onStart}
  />
)}
```

- [ ] **Step 4: Run the focused tests**

Run: `npm exec tsx -- --test tests/minigame-start-flow.test.ts`

Expected: PASS.

- [ ] **Step 5: Hold the Tetris change for the shared-contract checkpoint**

Do not commit yet: `GamePageClient` cannot satisfy the new shared props until
both dynamic game components expose the same interface. Keep the focused test
green and commit Tasks 2-4 atomically after route orchestration is complete.

### Task 3: Block Blast Ready Lifecycle

**Files:**
- Modify: `tests/minigame-start-flow.test.ts`
- Modify: `src/components/minigame/BlockBlastGame.tsx`

**Interfaces:**
- Consumes: `GameStartStateProps` and `GameReadyOverlay` from Task 1.
- Produces: Block Blast renders `data-game-ready-overlay="block-blast"` only while ready and cannot drag, end, or accumulate duration before an active run.

- [ ] **Step 1: Add the failing Block Blast integration test**

```ts
import BlockBlastGame from '../src/components/minigame/BlockBlastGame'

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
```

- [ ] **Step 2: Run the test and confirm the props/overlay failure**

Run: `npm exec tsx -- --test tests/minigame-start-flow.test.ts`

Expected: FAIL because Block Blast does not accept or render the ready-state contract.

- [ ] **Step 3: Add Block Blast lifecycle guards**

Extend the props with `GameStartStateProps`, then initialize state using the mounted run mode:

```tsx
const [hand, setHand] = useState<(Piece | null)[]>(() =>
  ready ? [null, null, null] : mkHand(emptyBoard()),
)
const startedAtRef = useRef(ready ? 0 : Date.now())
```

Guard completion and pointer entry:

```tsx
const completeGame = useCallback((finalScore: number, reason: 'blocked' | 'manual') => {
  if (ready || isOverRef.current) return
  isOverRef.current = true
  setEndReason(reason)
  setIsOver(true)
  onGameOver({
    game: 'block-blast',
    score: finalScore,
    lines: linesRef.current,
    combo: comboRef.current,
    level: 1,
    durationSec: Math.max(1, Math.round((Date.now() - startedAtRef.current) / 1000)),
  })
}, [onGameOver, ready])
```

Change the first `startDrag` guard and its dependency list exactly as follows,
without modifying the pointer-capture calculations between them:

```tsx
if (ready || dragging.current || isOverRef.current || clearing.length > 0) return

// Existing callback closing dependency list:
}, [ready, clearing.length, buildOverlay, moveOverlay, overlayToCell, canPlace])
```

Make the board/tray/sidebar wrapper inert while ready, disable the manual end action while ready, and render:

```tsx
{ready && (
  <GameReadyOverlay
    game="block-blast"
    starting={starting}
    signedIn={signedIn}
    onStart={onStart}
  />
)}
```

- [ ] **Step 4: Run the focused tests**

Run: `npm exec tsx -- --test tests/minigame-start-flow.test.ts`

Expected: PASS.

- [ ] **Step 5: Hold the Block Blast change for the shared-contract checkpoint**

Do not commit yet. The full TypeScript contract becomes valid in Task 4 when
`GamePageClient` passes the shared props to both components.

### Task 4: Route-Level Orchestration

**Files:**
- Modify: `tests/minigame-start-flow.test.ts`
- Modify: `src/components/minigame/GamePageClient.tsx`

**Interfaces:**
- Consumes: identical ready-state props now supported by both dynamic game components.
- Produces: `GamePageClient` phases `ready | playing | result`, visible `starting` state, and an always-mounted game card.

- [ ] **Step 1: Add the failing orchestration regression test**

```ts
import { readFile } from 'node:fs/promises'

test('game routes always mount the game card and delegate ready UI to the games', async () => {
  const source = await readFile('src/components/minigame/GamePageClient.tsx', 'utf8')
  assert.doesNotMatch(source, /function StartScreen/)
  assert.doesNotMatch(source, /phase === 'start'/)
  assert.match(source, /ready=\{phase === 'ready'\}/)
  assert.match(source, /starting=\{starting\}/)
  assert.match(source, /setStarting\(true\)/)
  assert.match(source, /setRunId\(\(value\) => value \+ 1\)/)
})
```

- [ ] **Step 2: Run the focused test and confirm it fails on the old StartScreen**

Run: `npm exec tsx -- --test tests/minigame-start-flow.test.ts`

Expected: FAIL because the old route-level branch and `StartScreen` still exist.

- [ ] **Step 3: Refactor GamePageClient**

Use the explicit phase and loading state:

```tsx
const [phase, setPhase] = useState<'ready' | 'playing' | 'result'>('ready')
const [starting, setStarting] = useState(false)
```

Set `setStarting(true)` immediately after the duplicate-click guard and
`setStarting(false)` in `finally`. Remove the `Play` import and delete the
entire `StartScreen` function.

Always render the game card and pass the shared contract:

```tsx
<GameErrorBoundary resetKey={`${game}-${runId}`}>
  <GameComponent
    key={`${game}-${runId}`}
    ready={phase === 'ready'}
    starting={starting}
    signedIn={!!userId}
    onStart={startGame}
    onGameOver={handleGameOver}
    onRestart={startGame}
    restartDisabled={submitState.status === 'saving'}
    soundEnabled={soundEnabled}
    onSoundToggle={persistSound}
  />
</GameErrorBoundary>
```

Keep `useGameAudio({ active: phase === 'playing' })`, token creation, one-shot
result guarding, score submission, and leaderboard refresh unchanged.

- [ ] **Step 4: Run focused and full automated checks**

Run: `npm exec tsx -- --test tests/minigame-start-flow.test.ts`

Expected: all mini-game start-flow tests PASS.

Run: `npm test`

Expected: all repository tests PASS.

Run: `npm run typecheck`

Expected: PASS.

- [ ] **Step 5: Commit route orchestration**

```bash
git add docs/superpowers/plans/2026-07-15-minigame-inline-start-screen.md src/components/minigame/GamePageClient.tsx src/components/minigame/TetrisGame.tsx src/components/minigame/BlockBlastGame.tsx tests/minigame-start-flow.test.ts
git commit -m "feat: open mini games on an inline start screen"
```

### Task 5: Build And Browser Verification

**Files:**
- Modify only if verification exposes a scoped defect.

**Interfaces:**
- Verifies the complete ready, playing, result, and replay flow for both routes.

- [ ] **Step 1: Run installation, generation, tests, typecheck, and build**

Run: `npm ci --legacy-peer-deps`

Run: `npm exec prisma generate`

Run: `npm test`

Run: `npm run typecheck`

Run: `npm run build`

Expected: every command exits `0`; any environment-only Prisma warning is reported rather than hidden.

- [ ] **Step 2: Start an isolated local server**

Run: `npm run dev -- --hostname 127.0.0.1 --port 3011`

Expected: Next.js serves `http://127.0.0.1:3011` without replacing an existing service on port 3001.

- [ ] **Step 3: Verify Tetris in browser**

At desktop 1440px, mobile 390px, and mobile 360px:

- `/mini-game/tetris` opens directly on the board with the inline start overlay.
- No falling piece, keyboard movement, timer, or audio begins before start.
- Start removes the overlay and enables play.
- `R`/manual end shows the existing result and replay UI.
- Replay starts a clean board and a fresh run.

- [ ] **Step 4: Verify Block Blast in browser**

At desktop 1440px, mobile 390px, and mobile 360px:

- `/mini-game/block-blast` opens directly on the 8x8 board with the inline start overlay.
- Dragging, timing, end action, and audio are inactive before start.
- Start produces three pieces and enables pointer/touch placement.
- Manual end shows the result and replay UI.
- Replay clears the board and generates a fresh hand.

- [ ] **Step 5: Inspect browser quality**

Expected: no horizontal scrolling, overlapping overlay text, broken controls, severe console errors, or layout shift when the overlay closes. Confirm the start action remains at least 44px and keyboard-focus visible.

### Task 6: GitHub And Production Deployment

**Files:**
- No source changes unless deployment verification exposes a scoped issue.

**Interfaces:**
- Publishes the verified commits to `origin/main` and the verified production host.

- [ ] **Step 1: Confirm the branch can fast-forward main**

Run: `git fetch origin main`

Run: `git rev-list --left-right --count origin/main...HEAD`

Expected: the left count is `0`. If it is not, integrate remote changes before pushing.

- [ ] **Step 2: Push the current verified HEAD to main**

Run: `git push origin HEAD:main`

Expected: GitHub reports the new main revision without a non-fast-forward error.

- [ ] **Step 3: Update and deploy the verified production server**

Run: `ssh -i C:\Users\Admin\.ssh\mushroomie_deploy codex@103.77.242.153 "sudo -n git -C /var/www/mushroomie pull --ff-only origin main"`

Run: `ssh -i C:\Users\Admin\.ssh\mushroomie_deploy codex@103.77.242.153 "sudo -n bash /var/www/mushroomie/deploy.sh"`

Expected: deploy succeeds and restarts `mushroomie_pm2`.

- [ ] **Step 4: Verify PM2 and production routes**

Run: `ssh -i C:\Users\Admin\.ssh\mushroomie_deploy codex@103.77.242.153 "sudo -n pm2 describe mushroomie_pm2"`

Run: `curl.exe -I https://mushroomie.io.vn/mini-game/tetris`

Run: `curl.exe -I https://mushroomie.io.vn/mini-game/block-blast`

Expected: PM2 is `online`; both routes return HTTP `200` or the expected canonical redirect followed by `200`.

- [ ] **Step 5: Verify production UI and static MIME**

Repeat the ready/start/end/replay checks against production. Fetch one emitted CSS and one JS asset from the production HTML and confirm CSS returns `text/css` and JS returns `application/javascript` or `text/javascript`, never `text/html`.

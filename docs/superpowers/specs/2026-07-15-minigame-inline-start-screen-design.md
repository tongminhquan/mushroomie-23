# Mushroomie Mini Game Inline Start Screen Design

## Objective

Replace the separate pre-game card on both Tetris and Block Blast routes with
an inline start screen displayed over the real game surface. Opening either
route must show the game layout immediately, but no timer, input, score logic,
drag interaction, or audio may start before the player selects the start
action.

## Scope

- Apply the new ready state to both `tetris` and `block-blast`.
- Remove the route-level `StartScreen` branch from `GamePageClient`.
- Keep the route header, sound control, result panel, voucher tiers, and
  leaderboard visible.
- Preserve the existing game-over overlays and replay behavior.
- Preserve the existing score-token, score-submission, voucher, and
  leaderboard APIs.

The change does not alter game scoring rules, voucher thresholds, database
schema, authentication, or API authorization.

## Interaction Model

Each route has three explicit phases:

1. `ready`: the real board layout is visible with an inline start overlay.
2. `playing`: the overlay is removed and game input, timing, and audio become
   active.
3. `result`: the game-over UI is visible while the result is submitted and the
   result panel is updated.

The primary start button must:

- Ignore duplicate clicks while a start request is in flight.
- Request a score-session token for an authenticated player.
- Start a new local run even when token creation fails, while showing the
  existing non-blocking warning that the score may not be saved.
- Reset the previous result and submission state.
- Start background audio only after this user gesture.

Replay uses the same start path so every new run receives a fresh token and a
fresh component instance.

## Component Architecture

### GamePageClient

`GamePageClient` remains the owner of route-level phase, authentication, score
tokens, result submission, sound preference, and leaderboard refresh.

It always renders the game card and selected game component. The component
receives an explicit active/ready contract plus callbacks for start, game over,
restart, and sound state. A visible starting state disables the start button
and labels the in-flight action clearly.

The old route-level `StartScreen` component is removed. Its useful content is
condensed into the inline game overlays rather than duplicated beside the
board.

### Shared Ready Overlay

A small shared presentational component provides consistent Mushroomie styling
for both games:

- Game name and a short game-specific hint.
- A concise control summary.
- A primary `Bat dau tro choi` action.
- A signed-out notice explaining that login is required to save scores and
  receive vouchers.

The overlay is positioned inside the game surface, uses the existing dark
arcade palette with Mushroomie red accents, and does not resize the board when
it appears or disappears.

### Tetris Lifecycle

In the `ready` phase Tetris renders its canvas, HUD, next-piece panel, and
controls in an idle state. It may draw the empty grid for visual context, but
it must not spawn a piece, set `startedAt`, schedule the animation loop, attach
gameplay keyboard behavior, or accept touch controls.

When the phase changes to `playing`, Tetris initializes a fresh board, starts
the animation loop, focuses the game container, and enables keyboard/touch
controls. Existing pause, manual end, game-over, and replay behavior remains
unchanged.

### Block Blast Lifecycle

In the `ready` phase Block Blast renders its 8x8 board, score cards, and piece
tray shell. It must not start timing or accept pointer interaction. The initial
hand is generated only for an active run so the displayed preview cannot be
mistaken for an already running game.

When the phase changes to `playing`, Block Blast initializes a fresh board,
fresh hand, zeroed score state, and a new `startedAt` timestamp. Drag handlers
and the manual end action are enabled only during active play. Existing blocked
board detection, manual completion, result submission, and replay behavior
remains unchanged.

## Error And Loading States

- The start action shows a disabled loading state while `/api/game/start` is
  pending.
- A failed token request does not trap the user on the ready overlay.
- A game render failure remains handled by `GameErrorBoundary`.
- Score submission status remains visible in the existing result panel.
- Repeated clicks and repeated game-over callbacks remain guarded.

## Accessibility And Responsive Behavior

- The start overlay is a labelled dialog-like region without stealing focus
  before user interaction.
- The primary action has a minimum 44px touch target and visible focus state.
- Controls beneath the overlay are inert while the game is ready.
- Desktop, 390px, and 360px layouts must not overflow horizontally.
- The overlay must fit inside the board/card without obscuring unrelated route
  navigation, voucher tiers, or leaderboard content.
- Motion is limited to opacity and transform and respects
  `prefers-reduced-motion`.

## Verification

Automated and static verification must cover:

1. Both routes render their game surface in the initial ready phase.
2. No Tetris animation/input or Block Blast drag/timing starts before the start
   action.
3. A single start click creates at most one score-session request.
4. Token failure still starts a playable local run and reports the save warning.
5. Game over submits one result and exposes replay.
6. Replay resets the board and requests a fresh score session.
7. Typecheck and production build pass.

Browser verification must cover Tetris and Block Blast at desktop, 390px, and
360px widths, including ready, playing, manual end, natural game over where
practical, replay, sound, and signed-out behavior.

After local verification, the normal Mushroomie delivery flow is commit, push
to `main`, deploy `/var/www/mushroomie`, restart `mushroomie_pm2` when required,
and verify production mini-game routes and static asset MIME types.

## Rollback

Rollback is limited to the frontend commit. No database, uploads, production
content, or migration data is changed by this design.

import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'

function read(path: string): string {
  return readFileSync(new URL(`../${path}`, import.meta.url), 'utf8')
}

const createRoute = read('src/app/api/posts/route.ts')
const updateRoute = read('src/app/api/posts/[id]/route.ts')
const bulkRoute = read('src/app/api/posts/bulk/route.ts')
const bulkImportRoute = read('src/app/api/posts/bulk-import/route.ts')
const autosaveRoute = read('src/app/api/posts/autosave/route.ts')

function count(source: string, needle: string): number {
  return source.split(needle).length - 1
}

function assertOrdered(
  source: string,
  steps: ReadonlyArray<readonly [label: string, needle: string]>,
): void {
  let previous = -1
  for (const [label, needle] of steps) {
    const index = source.indexOf(needle, previous + 1)
    assert.ok(index >= 0, `${label}: missing ${needle}`)
    assert.ok(index > previous, `${label}: expected after the previous operation`)
    previous = index
  }
}

function bracedBlock(source: string, marker: string): string {
  const markerIndex = source.indexOf(marker)
  assert.ok(markerIndex >= 0, `missing block marker: ${marker}`)
  const openingBrace = source.indexOf('{', markerIndex)
  assert.ok(openingBrace >= 0, `missing opening brace after: ${marker}`)

  let depth = 0
  for (let index = openingBrace; index < source.length; index += 1) {
    if (source[index] === '{') depth += 1
    if (source[index] !== '}') continue

    depth -= 1
    if (depth === 0) return source.slice(markerIndex, index + 1)
  }

  assert.fail(`unterminated block after: ${marker}`)
}

function assertEventUsesSavedRow(source: string, rowName: string): void {
  const sourceIdIndex = source.indexOf(`sourceId: ${rowName}.id`)
  assert.ok(sourceIdIndex >= 0, `missing publication event from ${rowName}`)
  const eventStart = source.lastIndexOf("source: 'post'", sourceIdIndex)
  assert.ok(eventStart >= 0, `missing post source for ${rowName}`)
  const event = source.slice(eventStart, sourceIdIndex + 420)
  assert.match(event, /source: 'post'/)
  assert.match(event, new RegExp(`url: buildPublicContentUrl\\('post', ${rowName}\\.slug\\)`))
  assert.match(event, new RegExp(`contentUpdatedAt: ${rowName}\\.updated_at`))
}

test('published create records the Prisma-returned row after write and admin log', () => {
  assert.equal(count(createRoute, 'recordAndRevalidatePublication('), 1)
  const publishedGuard = bracedBlock(
    createRoute,
    "if (post.status === 'published') {",
  )

  assert.match(publishedGuard, /recordAndRevalidatePublication\(\{/)
  assertOrdered(createRoute, [
    ['database create', 'const post = await prisma.post.create'],
    ['admin log', 'await logAdminAction({'],
    ['saved-row visibility gate', "if (post.status === 'published')"],
    ['publication helper', 'await recordAndRevalidatePublication({'],
  ])
  assertEventUsesSavedRow(createRoute, 'post')
  assert.match(createRoute, /reason: 'created'/)
})

test('update records transitions and material edits only when the saved row is public', () => {
  assert.equal(count(updateRoute, 'recordAndRevalidatePublication('), 1)
  assert.equal(count(updateRoute, 'shouldRecordPostPublication(existing, post)'), 1)
  const materialPublicationGuard = bracedBlock(
    updateRoute,
    'if (shouldRecordPostPublication(existing, post)) {',
  )

  assert.match(materialPublicationGuard, /recordAndRevalidatePublication\(\{/)
  assertOrdered(updateRoute, [
    ['read existing row', 'const existing = await prisma.post.findUnique'],
    ['database update', 'const post = await prisma.post.update'],
    ['admin log', 'await logAdminAction({'],
    ['saved-row material publication gate', 'if (shouldRecordPostPublication(existing, post))'],
    ['publication helper', 'await recordAndRevalidatePublication({'],
  ])
  assertEventUsesSavedRow(updateRoute, 'post')
  assert.match(
    updateRoute,
    /reason: existing\.status === 'published' \? 'updated' : 'published'/,
  )
})

test('slug updates invalidate the old DB-backed URL but enqueue only the new row URL', () => {
  const helperStart = updateRoute.indexOf('await recordAndRevalidatePublication({')
  const helperCall = updateRoute.slice(helperStart, helperStart + 760)

  assert.match(helperCall, /url: buildPublicContentUrl\('post', post\.slug\)/)
  assert.match(helperCall, /previousUrl: existing\.slug !== post\.slug/)
  assert.match(helperCall, /buildPublicContentUrl\('post', existing\.slug\)/)
  assert.equal(
    count(helperCall, "sourceId: existing.id"),
    0,
    'the old row must not become a deletion/publication queue event',
  )
})

test('bulk publish collects every successfully returned transition and records after logging', () => {
  assert.equal(count(bulkRoute, 'recordAndRevalidatePublication('), 1)
  assert.equal(count(bulkRoute, 'await drainPublicationEvents()'), 2)
  const publishCaseStart = bulkRoute.indexOf("case 'publish':")
  const draftCaseStart = bulkRoute.indexOf("case 'draft':", publishCaseStart)
  const publishCase = bulkRoute.slice(publishCaseStart, draftCaseStart)
  const drain = bracedBlock(
    bulkRoute,
    'const drainPublicationEvents = async () =>',
  )

  assertOrdered(publishCase, [
    ['database update', 'const publishedPost = await prisma.post.update'],
    ['collect saved row', 'publicationEvents.push({'],
  ])
  assertEventUsesSavedRow(publishCase, 'publishedPost')
  assert.match(publishCase, /reason: 'published'/)
  assert.match(drain, /const committedEvents = publicationEvents\.splice\(0\)/)
  assert.match(drain, /for \(const publicationEvent of committedEvents\)/)
  assert.match(drain, /await recordAndRevalidatePublication\(publicationEvent\)/)
  assertOrdered(bulkRoute, [
    ['bulk write loop', 'for (const post of posts)'],
    ['admin log', 'await logAdminAction({'],
    ['successful event drain', 'await drainPublicationEvents()'],
  ])

  const failedRequestCatch = bracedBlock(bulkRoute, '} catch {')
  assertOrdered(failedRequestCatch, [
    ['partial-failure event drain', 'await drainPublicationEvents()'],
    ['unchanged error response', "return NextResponse.json({ error: 'Server error' }, { status: 500 })"],
  ])
})

test('bulk import atomically commits each post and its normalized tags before collecting an event', () => {
  assert.equal(count(bulkImportRoute, 'recordAndRevalidatePublication('), 1)
  assert.equal(count(bulkImportRoute, 'publicationEvents.push({'), 1)
  assert.equal(count(bulkImportRoute, 'shouldRecordPostPublication(existingPost, post)'), 1)
  const transaction = bracedBlock(
    bulkImportRoute,
    'prisma.$transaction(async (transaction) =>',
  )
  const transactionDelegates = [
    ...transaction.matchAll(/transaction\.(post|postTag|postTagMap)\./g),
  ].map((match) => match[1])

  assert.deepEqual(
    [...new Set(transactionDelegates)].sort(),
    ['post', 'postTag', 'postTagMap'],
  )
  assert.match(transaction, /transaction\.post\.update/)
  assert.match(transaction, /transaction\.post\.create/)
  assert.match(transaction, /transaction\.postTag\.upsert/)
  assert.match(transaction, /transaction\.postTagMap\.upsert/)
  assert.match(transaction, /return savedPost/)
  assert.doesNotMatch(
    transaction,
    /uploadOne|optimizeUploadImage|category\.upsert|logAdminAction|recordAndRevalidatePublication|revalidatePath|sleep/,
  )
  const materialPublicationGuard = bracedBlock(
    bulkImportRoute,
    "(!existingPost && post.status === 'published')",
  )
  assert.match(
    materialPublicationGuard,
    /shouldRecordPostPublication\(existingPost, post\)/,
  )
  assert.match(materialPublicationGuard, /publicationEvents\.push\(\{/)
  assert.match(
    bulkImportRoute,
    /const normalizedTags[\s\S]*?\.sort\(\(left, right\) => left\.slug\.localeCompare\(right\.slug\)\)/,
  )
  assertOrdered(bulkImportRoute, [
    ['deduplicated tag preparation', 'const normalizedTags'],
    ['old row lookup', 'const existingPost = existingPostsBySlug.get(row.slug)'],
    ['row transaction', 'const post = await prisma.$transaction'],
    ['saved-row material publication gate', 'shouldRecordPostPublication(existingPost, post)'],
    ['collect saved row', 'publicationEvents.push({'],
    ['successful result', 'results.push({'],
    ['admin log', 'await logAdminAction({'],
    ['successful event loop', 'for (const publicationEvent of publicationEvents)'],
    ['publication helper', 'await recordAndRevalidatePublication(publicationEvent)'],
  ])
  assertEventUsesSavedRow(bulkImportRoute, 'post')
  assert.match(
    bulkImportRoute,
    /reason: !existingPost[\s\S]*?\? 'created'[\s\S]*?: existingPost\.status === 'published' \? 'updated' : 'published'/,
  )

  const transactionCallStart = bulkImportRoute.indexOf('const post = await prisma.$transaction')
  const publicationStart = bulkImportRoute.indexOf(
    "(!existingPost && post.status === 'published')",
    transactionCallStart,
  )
  const transactionCall = bulkImportRoute.slice(transactionCallStart, publicationStart)
  assert.match(transactionCall, /maxWait: 2_000/)
  assert.match(transactionCall, /timeout: 5_000/)
  assert.doesNotMatch(transactionCall, /isolationLevel|P2002|retry/)

  const failedRowCatch = bracedBlock(bulkImportRoute, '} catch (error) {')
  assert.doesNotMatch(failedRowCatch, /publicationEvents\.push|recordAndRevalidatePublication/)
})

test('non-public statuses, failed import rows, and autosaves never enqueue', () => {
  const createPublishedGuard = bracedBlock(
    createRoute,
    "if (post.status === 'published') {",
  )
  assert.equal(count(createRoute, 'recordAndRevalidatePublication('), 1)
  assert.match(createPublishedGuard, /recordAndRevalidatePublication\(\{/)

  const updatePublishedGuard = bracedBlock(
    updateRoute,
    'if (shouldRecordPostPublication(existing, post)) {',
  )
  assert.equal(count(updateRoute, 'recordAndRevalidatePublication('), 1)
  assert.match(updatePublishedGuard, /recordAndRevalidatePublication\(\{/)

  const importPublishedGuard = bracedBlock(
    bulkImportRoute,
    "(!existingPost && post.status === 'published')",
  )
  assert.equal(count(bulkImportRoute, 'publicationEvents.push({'), 1)
  assert.match(importPublishedGuard, /publicationEvents\.push\(\{/)

  assert.doesNotMatch(autosaveRoute, /recordAndRevalidatePublication|seo-discovery\/publication/)
  assert.match(autosaveRoute, /data\.status = 'draft'/)
})

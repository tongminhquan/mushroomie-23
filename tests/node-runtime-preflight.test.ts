import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

import {
  assertSupportedNodeVersion,
  isSupportedNodeVersion,
} from '../scripts/check-node-version.mjs'

const rootUrl = new URL('../', import.meta.url)

test('the Node runtime preflight accepts Node 22+ and rejects older or invalid versions', () => {
  assert.equal(isSupportedNodeVersion('21.99.0'), false)
  assert.equal(isSupportedNodeVersion('v22.0.0'), true)
  assert.equal(isSupportedNodeVersion('24.16.0'), true)
  assert.equal(isSupportedNodeVersion('not-a-version'), false)
  assert.throws(
    () => assertSupportedNodeVersion('20.19.6'),
    /requires Node\.js >=22; detected 20\.19\.6/,
  )
  assert.doesNotThrow(() => assertSupportedNodeVersion('22.0.0'))
})

test('package and deploy gate Node 22 before install, database mutation, or restart', async () => {
  const packageJson = JSON.parse(
    await readFile(new URL('package.json', rootUrl), 'utf8'),
  ) as {
    engines?: { node?: string }
    scripts?: { 'check:node'?: string }
  }
  const deploy = await readFile(new URL('deploy.sh', rootUrl), 'utf8')
  const pullIndex = deploy.indexOf('git pull --ff-only origin main')
  const preflightIndex = deploy.indexOf('npm run check:node')
  const installIndex = deploy.indexOf('npm ci')
  const databaseMutationIndex = deploy.indexOf('npm exec prisma db push')
  const mainRestartIndex = deploy.indexOf(
    'if ! pm2 restart mushroomie_pm2 --update-env; then',
  )

  assert.equal(packageJson.engines?.node, '>=22')
  assert.equal(
    packageJson.scripts?.['check:node'],
    'node scripts/check-node-version.mjs',
  )
  assert.ok(pullIndex > -1, 'deploy.sh must update the checked-out release first.')
  assert.ok(preflightIndex > -1, 'deploy.sh must run the Node runtime preflight.')
  assert.equal(
    deploy.lastIndexOf('npm run check:node'),
    preflightIndex,
    'deploy.sh must have one unambiguous Node runtime preflight.',
  )
  assert.ok(
    pullIndex < preflightIndex,
    'The preflight script must come from the newly pulled release.',
  )
  for (const [operation, operationIndex] of [
    ['dependency installation', installIndex],
    ['database mutation', databaseMutationIndex],
    ['main PM2 restart', mainRestartIndex],
  ] as const) {
    assert.ok(operationIndex > -1, `deploy.sh must retain ${operation}.`)
    assert.ok(
      preflightIndex < operationIndex,
      `The Node runtime preflight must run before ${operation}.`,
    )
  }
})

test('operator documentation states the Node 22 runtime prerequisite', async () => {
  const [readme, runbook, deploymentGuide] = await Promise.all([
    readFile(new URL('README.md', rootUrl), 'utf8'),
    readFile(new URL('docs/operations/google-search-console.md', rootUrl), 'utf8'),
    readFile(new URL('deployment_guide.md', rootUrl), 'utf8'),
  ])

  assert.match(readme, /Node\.js 22/)
  assert.match(runbook, /Node\.js 22/)
  assert.match(deploymentGuide, /Node\.js 22/)
})

import assert from 'node:assert/strict'
import { readdir, readFile, stat } from 'node:fs/promises'
import path from 'node:path'
import test from 'node:test'
import ts from 'typescript'

const projectRoot = process.cwd()
const sourceRoot = path.join(projectRoot, 'src')
const sourceExtensions = ['.ts', '.tsx', '.js', '.jsx', '.mjs'] as const
const nextRenderEntryPattern = /^(?:page|layout|template|loading|error|default|not-found)\.(?:ts|tsx|js|jsx)$/
const compilerOptions: ts.CompilerOptions = {
  allowJs: true,
  baseUrl: projectRoot,
  moduleResolution: ts.ModuleResolutionKind.Bundler,
  paths: { '@/*': ['./src/*'] },
  resolveJsonModule: true,
}

function importSpecifiers(source: string, fileName = 'inline.tsx'): string[] {
  const specifiers: string[] = []
  const sourceFile = ts.createSourceFile(
    fileName,
    source,
    ts.ScriptTarget.Latest,
    true,
    fileName.endsWith('.tsx') || fileName.endsWith('.jsx')
      ? ts.ScriptKind.TSX
      : ts.ScriptKind.TS,
  )

  const addLiteral = (node: ts.Expression, label: string) => {
    if (!ts.isStringLiteralLike(node)) {
      throw new Error(`Non-literal runtime import in ${fileName}: ${label}`)
    }
    specifiers.push(node.text)
  }

  const visit = (node: ts.Node): void => {
    if (ts.isImportDeclaration(node)) {
      const clause = node.importClause
      const onlyNamedTypes = clause
        && !clause.name
        && clause.namedBindings
        && ts.isNamedImports(clause.namedBindings)
        && clause.namedBindings.elements.length > 0
        && clause.namedBindings.elements.every((element) => element.isTypeOnly)
      if (!clause?.isTypeOnly && !onlyNamedTypes) {
        addLiteral(node.moduleSpecifier, 'import')
      }
      return
    }
    if (ts.isExportDeclaration(node) && node.moduleSpecifier) {
      if (!node.isTypeOnly) addLiteral(node.moduleSpecifier, 'export')
      return
    }
    if (
      ts.isCallExpression(node)
      && (
        node.expression.kind === ts.SyntaxKind.ImportKeyword
        || (ts.isIdentifier(node.expression) && node.expression.text === 'require')
      )
    ) {
      if (node.arguments.length !== 1) {
        throw new Error(`Non-literal runtime import in ${fileName}: call arity`)
      }
      addLiteral(node.arguments[0]!, 'dynamic import')
      return
    }
    ts.forEachChild(node, visit)
  }
  visit(sourceFile)

  return specifiers
}

async function isFile(filePath: string): Promise<boolean> {
  try {
    return (await stat(filePath)).isFile()
  } catch {
    return false
  }
}

async function resolveLocalImport(
  importer: string,
  specifier: string,
): Promise<string | null> {
  let basePath: string
  if (specifier.startsWith('@/')) {
    basePath = path.join(sourceRoot, specifier.slice(2))
  } else if (specifier.startsWith('.')) {
    basePath = path.resolve(path.dirname(importer), specifier)
  } else {
    return null
  }

  const resolved = ts.resolveModuleName(
    specifier,
    importer,
    compilerOptions,
    ts.sys,
  ).resolvedModule?.resolvedFileName
  if (resolved) return path.normalize(resolved)

  if (path.extname(basePath) && await isFile(basePath)) {
    return path.normalize(basePath)
  }

  throw new Error(`Unresolved local runtime import in ${importer}: ${specifier}`)
}

async function collectImportGraph(entrypoints: readonly string[]) {
  const pending = entrypoints.map((entrypoint) => path.join(projectRoot, entrypoint))
  const visited = new Set<string>()
  const external = new Set<string>()

  while (pending.length > 0) {
    const current = path.normalize(pending.pop()!)
    if (visited.has(current)) continue
    visited.add(current)

    if (!sourceExtensions.some((extension) => current.endsWith(extension))) continue

    const source = await readFile(current, 'utf8')
    for (const specifier of importSpecifiers(source, current)) {
      const resolved = await resolveLocalImport(current, specifier)
      if (resolved) {
        pending.push(resolved)
      } else if (!specifier.startsWith('.') && !specifier.startsWith('@/')) {
        external.add(specifier)
      }
    }
  }

  return { visited, external }
}

async function discoverPublicEntrypoints(): Promise<string[]> {
  const userEntries = (await collectSourceFiles(path.join(sourceRoot, 'app', '(user)')))
    .filter((filePath) => nextRenderEntryPattern.test(path.basename(filePath)))
  const rootEntries = (await readdir(path.join(sourceRoot, 'app'), { withFileTypes: true }))
    .filter((entry) => entry.isFile() && nextRenderEntryPattern.test(entry.name))
    .map((entry) => path.join(sourceRoot, 'app', entry.name))

  return [...rootEntries, ...userEntries]
    .map((filePath) => path.relative(projectRoot, filePath).replaceAll(path.sep, '/'))
    .sort()
}

async function collectSourceFiles(directory: string): Promise<string[]> {
  const entries = await readdir(directory, { withFileTypes: true })
  const nested = await Promise.all(entries.map(async (entry) => {
    const entryPath = path.join(directory, entry.name)
    if (entry.isDirectory()) {
      return entry.name === '__tests__' ? [] : collectSourceFiles(entryPath)
    }
    return sourceExtensions.some((extension) => entry.name.endsWith(extension))
      ? [entryPath]
      : []
  }))
  return nested.flat()
}

test('storefront entrypoints cannot reach admin, Search Console auth, adapters, or worker code', async () => {
  const publicEntrypoints = await discoverPublicEntrypoints()
  const { visited, external } = await collectImportGraph(publicEntrypoints)
  const relativeFiles = [...visited].map((filePath) => (
    path.relative(projectRoot, filePath).replaceAll(path.sep, '/')
  ))

  for (const forbidden of [
    'src/components/admin/',
    'src/lib/seo-discovery/google-gsc-client.ts',
    'src/lib/seo-discovery/gsc-client.ts',
    'src/lib/seo-discovery/sitemap-maintenance.ts',
    'src/lib/seo-discovery/worker.ts',
  ]) {
    assert.ok(
      relativeFiles.every((filePath) => !filePath.startsWith(forbidden)),
      `public import graph reached ${forbidden}`,
    )
  }
  assert.equal(external.has('google-auth-library'), false)
})

test('only the protected admin page imports the discovery dashboard client island', async () => {
  const sourceFiles = await collectSourceFiles(sourceRoot)
  const importers: string[] = []

  for (const filePath of sourceFiles) {
    const source = await readFile(filePath, 'utf8')
    if (importSpecifiers(source).some((specifier) => (
      specifier === '@/components/admin/SeoDiscoveryDashboard'
    ))) {
      importers.push(path.relative(projectRoot, filePath).replaceAll(path.sep, '/'))
    }
  }

  assert.deepEqual(importers, ['src/app/admin/seo/lap-chi-muc/page.tsx'])
  const dashboardSource = await readFile(
    path.join(sourceRoot, 'components', 'admin', 'SeoDiscoveryDashboard.tsx'),
    'utf8',
  )
  assert.match(dashboardSource.slice(0, 100), /^['"]use client['"]/)
})

test('maintenance processing remains bounded and outside public request rendering', async () => {
  const workerSource = await readFile(
    path.join(sourceRoot, 'lib', 'seo-discovery', 'worker.ts'),
    'utf8',
  )
  const sitemapMaintenancePath = path.join(
    sourceRoot,
    'lib',
    'seo-discovery',
    'sitemap-maintenance.ts',
  )
  const sitemapMaintenanceSource = await readFile(sitemapMaintenancePath, 'utf8')
  const publicGraph = await collectImportGraph(await discoverPublicEntrypoints())

  assert.match(workerSource, /const MAX_BATCH_SIZE = 10\b/)
  assert.match(sitemapMaintenanceSource, /60 \* 60 \* 1_000/)
  assert.ok(
    [...publicGraph.visited].every((filePath) => (
      path.normalize(filePath) !== path.join(sourceRoot, 'lib', 'seo-discovery', 'worker.ts')
    )),
  )
  assert.ok(
    [...publicGraph.visited].every((filePath) => (
      path.normalize(filePath) !== sitemapMaintenancePath
    )),
  )
})

test('public graph coverage includes every Next user and root rendering entrypoint', async () => {
  const userEntries = (await collectSourceFiles(path.join(sourceRoot, 'app', '(user)')))
    .filter((filePath) => (
      /^(?:page|layout|template|loading|error|default|not-found)\.(?:ts|tsx|js|jsx)$/.test(
        path.basename(filePath),
      )
    ))
  const rootEntries = (await readdir(path.join(sourceRoot, 'app'), { withFileTypes: true }))
    .filter((entry) => (
      entry.isFile()
      && /^(?:page|layout|template|loading|error|default|not-found)\.(?:ts|tsx|js|jsx)$/.test(
        entry.name,
      )
    ))
    .map((entry) => path.join(sourceRoot, 'app', entry.name))
  const expected = [...rootEntries, ...userEntries]
    .map((filePath) => path.relative(projectRoot, filePath).replaceAll(path.sep, '/'))
    .sort()

  assert.deepEqual(await discoverPublicEntrypoints(), expected)
  assert.ok(expected.length >= 60, 'the public route inventory unexpectedly shrank')
  assert.ok(expected.includes('src/app/(user)/san-pham/[slug]/page.tsx'))
  assert.ok(expected.includes('src/app/(user)/tin-tuc/[slug]/page.tsx'))
})

test('public import parser and resolver fail closed for runtime-local edges', async () => {
  const importer = path.join(sourceRoot, 'app', '(user)', 'layout.tsx')

  assert.deepEqual(
    importSpecifiers("const widget = import(/* webpackChunkName: 'x' */ './widget')"),
    ['./widget'],
  )
  assert.throws(
    () => importSpecifiers('const widget = import(runtimePath)'),
    /Non-literal runtime import/,
  )
  assert.equal(
    await resolveLocalImport(importer, '@/lib/utils.js'),
    path.join(sourceRoot, 'lib', 'utils.ts'),
  )
  await assert.rejects(
    () => resolveLocalImport(importer, './definitely-missing-runtime-module'),
    /Unresolved local runtime import/,
  )
})

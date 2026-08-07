import { access, readdir, rename, stat, writeFile } from 'node:fs/promises'
import path from 'node:path'
import sharp from 'sharp'

sharp.cache(false)
sharp.concurrency(1)

const VARIANT_WIDTHS = [384, 750]
const DERIVED_IMAGE_PATTERN = /-(?:384|750|1280)\.webp$/i
const apply = process.argv.includes('--apply')
const directoryArgument = process.argv.find((argument) => argument.startsWith('--dir='))
const uploadDirectory = path.resolve(
  directoryArgument?.slice('--dir='.length) || path.join(process.cwd(), 'public', 'uploads'),
)

if (path.basename(uploadDirectory).toLowerCase() !== 'uploads') {
  throw new Error(`Refusing to operate outside an uploads directory: ${uploadDirectory}`)
}

await access(uploadDirectory)

const entries = await readdir(uploadDirectory, { withFileTypes: true })
const sources = entries
  .filter((entry) => entry.isFile() && entry.name.endsWith('.webp') && !DERIVED_IMAGE_PATTERN.test(entry.name))
  .map((entry) => entry.name)
  .sort()

const pending = []
let existing = 0

for (const sourceName of sources) {
  const basename = path.parse(sourceName).name
  for (const width of VARIANT_WIDTHS) {
    const targetName = `${basename}-${width}.webp`
    const targetPath = path.join(uploadDirectory, targetName)

    try {
      const targetStat = await stat(targetPath)
      if (!targetStat.isFile() || targetStat.size <= 0) {
        throw new Error(`Existing variant is not a non-empty regular file: ${targetPath}`)
      }
      existing += 1
    } catch (error) {
      if (error?.code !== 'ENOENT') throw error
      pending.push({ sourceName, targetName, width })
    }
  }
}

if (!apply) {
  process.stdout.write(`${JSON.stringify({ mode: 'dry-run', uploadDirectory, sources: sources.length, existing, pending: pending.length })}\n`)
  process.exit(0)
}

let created = 0
let createdBytes = 0

for (const item of pending) {
  const sourcePath = path.join(uploadDirectory, item.sourceName)
  const targetPath = path.join(uploadDirectory, item.targetName)
  const temporaryPath = `${targetPath}.tmp-${process.pid}`
  const output = await sharp(sourcePath, { failOn: 'error', animated: false })
    .rotate()
    .resize({ width: item.width, fit: 'inside', withoutEnlargement: true })
    .webp({ quality: 75, effort: 5 })
    .toBuffer()

  await writeFile(temporaryPath, output, { flag: 'wx' })
  await rename(temporaryPath, targetPath)

  const targetStat = await stat(targetPath)
  if (!targetStat.isFile() || targetStat.size <= 0) {
    throw new Error(`Generated variant is invalid: ${targetPath}`)
  }

  created += 1
  createdBytes += targetStat.size
}

process.stdout.write(`${JSON.stringify({ mode: 'apply', uploadDirectory, sources: sources.length, existing, created, createdBytes })}\n`)

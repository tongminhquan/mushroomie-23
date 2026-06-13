#!/usr/bin/env ts-node

import { execFileSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()
const applyChanges = process.argv.includes('--apply')
const projectRoot = process.cwd()
const backupScript = path.join(projectRoot, 'scripts', 'backup-production.sh')
const imagePattern = /(<img\b[^>]*\bsrc\s*=\s*["'])([^"']+)(["'][^>]*>)/gi

const internalHosts = new Set([
  'mushroomie.io.vn',
  'www.mushroomie.io.vn',
  'localhost',
  '127.0.0.1',
])

async function main() {
  if (applyChanges) {
    runBackup()
  }

  const posts = await prisma.post.findMany({
    select: {
      id: true,
      slug: true,
      featured_image: true,
      og_image: true,
      twitter_image: true,
      content: true,
    },
    orderBy: { id: 'asc' },
  })

  const updates: Array<{
    id: number
    slug: string
    data: {
      featured_image?: string | null
      og_image?: string | null
      twitter_image?: string | null
      content?: string | null
    }
  }> = []

  for (const post of posts) {
    const next = {
      featured_image: normalizeStoredImage(post.featured_image),
      og_image: normalizeStoredImage(post.og_image),
      twitter_image: normalizeStoredImage(post.twitter_image),
      content: normalizeContentImages(post.content),
    }

    const data: {
      featured_image?: string | null
      og_image?: string | null
      twitter_image?: string | null
      content?: string | null
    } = {}

    if (next.featured_image !== post.featured_image) data.featured_image = next.featured_image
    if (next.og_image !== post.og_image) data.og_image = next.og_image
    if (next.twitter_image !== post.twitter_image) data.twitter_image = next.twitter_image
    if (next.content !== post.content) data.content = next.content

    if (Object.keys(data).length > 0) {
      updates.push({ id: post.id, slug: post.slug, data })
    }
  }

  console.log(JSON.stringify({
    mode: applyChanges ? 'apply' : 'dry-run',
    postsScanned: posts.length,
    postsToUpdate: updates.length,
    changes: updates.map(({ id, slug, data }) => ({ id, slug, fields: Object.keys(data) })),
  }, null, 2))

  if (!applyChanges || updates.length === 0) return

  await prisma.$transaction(
    updates.map(({ id, data }) => prisma.post.update({ where: { id }, data })),
  )

  console.log(`Updated ${updates.length} post(s).`)
}

function runBackup() {
  if (process.platform === 'win32') {
    throw new Error('Apply mode must run on the Linux production server so the production backup can be created first.')
  }
  if (!fs.existsSync(backupScript)) {
    throw new Error(`Backup script not found: ${backupScript}`)
  }

  execFileSync('bash', [backupScript], {
    cwd: projectRoot,
    stdio: 'inherit',
  })
}

function normalizeStoredImage(value?: string | null) {
  if (!value || !value.trim()) return value

  const normalized = normalizePathOrUrl(value.trim())
  return normalized || value.trim()
}

function normalizeContentImages(content?: string | null) {
  if (!content) return content

  return content.replace(imagePattern, (_match, prefix: string, source: string, suffix: string) => {
    const normalized = normalizePathOrUrl(source.trim()) || source.trim()
    return `${prefix}${normalized}${suffix}`
  })
}

function normalizePathOrUrl(value: string) {
  if (!value || value === 'null' || value === 'undefined') return ''
  if (value.startsWith('blob:') || value.startsWith('data:')) return value

  if (/^https?:\/\//i.test(value)) {
    try {
      const parsed = new URL(value)
      if (!internalHosts.has(parsed.hostname)) return value
      return normalizeLocalPath(parsed.pathname)
    } catch {
      return value
    }
  }

  return normalizeLocalPath(value)
}

function normalizeLocalPath(value: string) {
  const uploadIndex = value.indexOf('/uploads/')
  if (uploadIndex >= 0) return value.slice(uploadIndex)

  if (value.startsWith('./uploads/')) return `/${value.slice(2)}`
  if (value.startsWith('uploads/')) return `/${value}`
  if (value.startsWith('/public/uploads/')) return value.replace('/public', '')
  if (value.startsWith('public/uploads/')) return `/${value.replace('public/', '')}`
  if (/^[^/\\]+\.(avif|gif|jpe?g|png|svg|webp)$/i.test(value)) return `/uploads/${value}`

  return value
}

main()
  .catch((error) => {
    console.error(error instanceof Error ? error.message : error)
    process.exitCode = 1
  })
  .finally(async () => {
    await prisma.$disconnect()
  })

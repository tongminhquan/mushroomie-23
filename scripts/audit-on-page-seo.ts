#!/usr/bin/env tsx

import fs from 'node:fs'
import path from 'node:path'
import { PrismaClient } from '@prisma/client'
import { buildOnPageSeoAudit } from '../src/lib/on-page-seo-audit'

const SITE_URL = 'https://mushroomie.io.vn'
const prisma = new PrismaClient()

function outputPathFromArgs() {
  const outputArgument = process.argv.find((argument) => argument.startsWith('--output='))
  return outputArgument?.slice('--output='.length).trim() || null
}

async function main() {
  const [posts, products] = await Promise.all([
    prisma.post.findMany({
      where: { status: 'published', deleted_at: null },
      select: {
        id: true,
        title: true,
        slug: true,
        excerpt: true,
        content: true,
        featured_image: true,
        featured_image_alt: true,
        seo_title: true,
        meta_description: true,
        canonical_url: true,
        robots_index: true,
        robots_follow: true,
      },
      orderBy: { id: 'asc' },
    }),
    prisma.product.findMany({
      where: { status: 'active' },
      select: {
        id: true,
        name: true,
        slug: true,
        sku: true,
        is_customizable: true,
        short_description: true,
        description: true,
        featured_image: true,
        images: {
          select: { image_url: true, alt_text: true },
          orderBy: { sort_order: 'asc' },
        },
      },
      orderBy: { id: 'asc' },
    }),
  ])
  const report = buildOnPageSeoAudit({
    posts,
    products,
    siteUrl: SITE_URL,
    postTemplateCommercialLinkCount: products.length >= 2 ? 2 : 0,
  })
  const serialized = `${JSON.stringify(report, null, 2)}\n`
  const outputPath = outputPathFromArgs()

  if (outputPath) {
    const resolvedPath = path.resolve(outputPath)
    fs.mkdirSync(path.dirname(resolvedPath), { recursive: true })
    fs.writeFileSync(resolvedPath, serialized, 'utf8')
    console.error(`On-page SEO audit written to ${resolvedPath}`)
  } else {
    process.stdout.write(serialized)
  }

  if (process.argv.includes('--strict') && report.summary.errors > 0) {
    process.exitCode = 1
  }
}

main()
  .catch((error) => {
    console.error(error instanceof Error ? error.message : error)
    process.exitCode = 1
  })
  .finally(async () => {
    await prisma.$disconnect()
  })

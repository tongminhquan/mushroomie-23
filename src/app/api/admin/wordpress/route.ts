import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/auth'
import { logAdminAction } from '@/lib/admin-logger'
import { rateLimiter } from '@/lib/rate-limit'
import {
  WORDPRESS_AUTO_POSTER_LIMITS,
  WordPressAutoPosterError,
  buildAutoPosterPreview,
  clampImageLimit,
  getRequiredWordPressAutoPosterConfig,
  getWordPressAutoPosterConfigStatus,
  normalizeWordPressStatus,
  parseAutoPosterImageZip,
  parseAutoPosterSpreadsheet,
  publishWordPressAutoPosterBatch,
  testWordPressAutoPosterConnection,
} from '@/lib/wordpress-auto-poster'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function GET() {
  try {
    await requireAdmin()
    return NextResponse.json(getWordPressAutoPosterConfigStatus())
  } catch (error) {
    return authOrServerError(error)
  }
}

export async function POST(request: NextRequest) {
  try {
    if (await rateLimiter.isLimited(request, 6, 60_000, 'admin_wordpress_auto_poster')) {
      return rateLimiter.getLimitResponse()
    }

    const session = await requireAdmin()
    const formData = await request.formData()
    const action = String(formData.get('action') || 'preview')

    if (action === 'test') {
      const result = await testWordPressAutoPosterConnection(getRequiredWordPressAutoPosterConfig())
      return NextResponse.json(result)
    }

    if (action !== 'preview' && action !== 'publish') {
      return NextResponse.json({ error: 'Action không hợp lệ' }, { status: 400 })
    }

    const defaultStatus = normalizeWordPressStatus(String(formData.get('defaultStatus') || 'draft'), 'draft')
    const maxImagesPerPost = clampImageLimit(Number(formData.get('maxImagesPerPost') || 2))
    const updateDuplicates = formData.getAll('updateDuplicates').map(String).includes('true')

    const spreadsheetFile = formData.get('spreadsheet')
    if (!(spreadsheetFile instanceof File)) {
      return NextResponse.json({ error: 'Vui lòng chọn file Excel/CSV bài viết' }, { status: 400 })
    }

    const spreadsheet = await readUploadedFile(
      spreadsheetFile,
      WORDPRESS_AUTO_POSTER_LIMITS.maxSpreadsheetBytes,
      'File Excel/CSV',
    )
    const posts = await parseAutoPosterSpreadsheet(spreadsheet, spreadsheetFile.name, defaultStatus)
    const imageZipFile = formData.get('imageZip')
    const imageZip = imageZipFile instanceof File && imageZipFile.size > 0
      ? await readUploadedFile(imageZipFile, WORDPRESS_AUTO_POSTER_LIMITS.maxImageZipBytes, 'File ZIP ảnh')
      : null
    const images = imageZip
      ? await parseAutoPosterImageZip(imageZip, posts.map((post) => post.maBai || '').filter(Boolean), maxImagesPerPost)
      : null

    if (action === 'preview') {
      return NextResponse.json({
        posts: buildAutoPosterPreview(posts, images),
        orphanImages: images?.orphanImages || [],
        extractedImages: images?.extractedCount || 0,
      })
    }

    const results = await publishWordPressAutoPosterBatch({
      posts,
      images,
      config: getRequiredWordPressAutoPosterConfig(),
      options: {
        defaultStatus,
        maxImagesPerPost,
        updateDuplicates,
      },
    })

    await logAdminAction({
      userId: Number(session.user.id),
      action: 'OTHER',
      entity: 'POST',
      details: {
        tool: 'wordpress-auto-poster',
        total: results.length,
        success: results.filter((result) => result.status === 'success').length,
        failed: results.filter((result) => result.status === 'failed').length,
        skipped: results.filter((result) => result.status === 'skipped').length,
      },
      ipAddress: request.headers.get('x-forwarded-for') || undefined,
    })

    return NextResponse.json({
      results,
      orphanImages: images?.orphanImages || [],
      extractedImages: images?.extractedCount || 0,
    })
  } catch (error) {
    if (error instanceof WordPressAutoPosterError) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }
    return authOrServerError(error)
  }
}

async function readUploadedFile(file: File, maxBytes: number, label: string) {
  if (file.size > maxBytes) {
    throw new WordPressAutoPosterError(`${label} vượt giới hạn ${Math.floor(maxBytes / 1024 / 1024)}MB`)
  }

  return Buffer.from(await file.arrayBuffer())
}

function authOrServerError(error: unknown) {
  if (error instanceof Error && error.message === 'UNAUTHORIZED') {
    return NextResponse.json({ error: 'Bạn cần đăng nhập' }, { status: 401 })
  }
  if (error instanceof Error && error.message === 'FORBIDDEN') {
    return NextResponse.json({ error: 'Bạn không có quyền truy cập' }, { status: 403 })
  }
  console.error('WordPress auto poster API error:', error)
  return NextResponse.json({ error: 'Server error' }, { status: 500 })
}

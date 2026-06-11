import { NextResponse } from 'next/server'
import { join } from 'path'
import { readFile, stat } from 'fs/promises'

export const dynamic = 'force-dynamic'

export async function GET(request: Request, { params }: { params: Promise<{ filename: string }> }) {
  try {
    const { filename } = await params
    
    // Security check: prevent directory traversal
    if (filename.includes('/') || filename.includes('..')) {
      return new NextResponse('Invalid filename', { status: 400 })
    }

    const uploadDir = join(process.cwd(), 'public', 'uploads')
    const filePath = join(uploadDir, filename)

    const fileStat = await stat(filePath)
    const file = await readFile(filePath)
    
    // Determine mime type
    let contentType = 'image/webp'
    const lowerName = filename.toLowerCase()
    if (lowerName.endsWith('.png')) contentType = 'image/png'
    else if (lowerName.endsWith('.jpg') || lowerName.endsWith('.jpeg')) contentType = 'image/jpeg'
    else if (lowerName.endsWith('.gif')) contentType = 'image/gif'
    else if (lowerName.endsWith('.avif')) contentType = 'image/avif'

    return new NextResponse(file, {
      headers: {
        'Content-Type': contentType,
        'Content-Length': fileStat.size.toString(),
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    })
  } catch (error) {
    return new NextResponse('File not found', { status: 404 })
  }
}

import { NextResponse } from 'next/server'
import { writeFile, readdir, stat, unlink } from 'fs/promises'
import { join } from 'path'
import fs from 'fs'

export const dynamic = 'force-dynamic'

const uploadDir = join(process.cwd(), 'public', 'uploads')

export async function GET() {
  try {
    // Check if directory exists
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true })
    }

    const files = await readdir(uploadDir)
    const images = []
    
    for (const file of files) {
      if (file.match(/\.(jpg|jpeg|png|gif|webp)$/i)) {
        const fileStat = await stat(join(uploadDir, file))
        images.push({
          id: fileStat.mtimeMs,
          url: `/uploads/${file}`,
          filename: file,
          size: fileStat.size,
          created_at: fileStat.mtime.toISOString(),
        })
      }
    }
    
    // Sort by newest first
    images.sort((a, b) => b.id - a.id)
    
    return NextResponse.json(images)
  } catch (error) {
    console.error('Error reading upload dir:', error)
    return NextResponse.json([])
  }
}

export async function POST(request: Request) {
  try {
    const data = await request.formData()
    const file: File | null = data.get('file') as unknown as File

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    // Secure MIME check
    const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
    if (!allowedMimeTypes.includes(file.type)) {
      return NextResponse.json({ error: 'Invalid file type. Only JPG, PNG, WEBP, GIF are allowed.' }, { status: 400 })
    }

    // Generate unique filename using crypto
    const fileExt = file.name.split('.').pop()?.toLowerCase() || 'bin'
    const allowedExtensions = ['jpg', 'jpeg', 'png', 'webp', 'gif']
    if (!allowedExtensions.includes(fileExt)) {
      return NextResponse.json({ error: 'Invalid file extension.' }, { status: 400 })
    }

    const uniqueSuffix = crypto.randomUUID()
    const filename = `${uniqueSuffix}.${fileExt}`
    
    const path = join(uploadDir, filename)
    
    // Ensure directory exists
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true })
    }

    await writeFile(path, buffer)

    return NextResponse.json({ 
      id: Date.now(),
      url: `/uploads/${filename}`, 
      filename: filename,
      size: file.size
    })
  } catch (error) {
    console.error('Upload error:', error)
    return NextResponse.json({ error: 'Upload failed' }, { status: 500 })
  }
}

export async function DELETE(request: Request) {
  try {
    const url = new URL(request.url)
    const filename = url.searchParams.get('filename')
    
    if (!filename) {
      return NextResponse.json({ error: 'Filename is required' }, { status: 400 })
    }

    // Security check: prevent directory traversal
    if (filename.includes('/') || filename.includes('..')) {
      return NextResponse.json({ error: 'Invalid filename' }, { status: 400 })
    }

    const path = join(uploadDir, filename)
    
    if (fs.existsSync(path)) {
      await unlink(path)
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Delete error:', error)
    return NextResponse.json({ error: 'Delete failed' }, { status: 500 })
  }
}

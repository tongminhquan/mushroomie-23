import { NextResponse } from 'next/server'
import { writeFile, readdir, stat } from 'fs/promises'
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

    // Generate unique filename
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9)
    const originalName = file.name.replace(/[^a-zA-Z0-9.\-_]/g, '')
    const filename = `${uniqueSuffix}-${originalName}`
    
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

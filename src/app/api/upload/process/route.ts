import { NextResponse } from 'next/server'
import { join } from 'path'
import fs from 'fs'
import sharp from 'sharp'

const uploadDir = join(process.cwd(), 'public', 'uploads')

export async function POST(request: Request) {
  try {
    const data = await request.json()
    const { filename, format, quality, cropData, overwrite } = data

    if (!filename) {
      return NextResponse.json({ error: 'Filename is required' }, { status: 400 })
    }

    // Security check: prevent directory traversal
    if (filename.includes('/') || filename.includes('..')) {
      return NextResponse.json({ error: 'Invalid filename' }, { status: 400 })
    }

    const inputPath = join(uploadDir, filename)
    
    if (!fs.existsSync(inputPath)) {
      return NextResponse.json({ error: 'File not found' }, { status: 404 })
    }

    let pipeline = sharp(inputPath)

    // Crop if cropData is provided
    if (cropData && cropData.width && cropData.height) {
      pipeline = pipeline.extract({
        left: Math.round(cropData.x),
        top: Math.round(cropData.y),
        width: Math.round(cropData.width),
        height: Math.round(cropData.height)
      })
    }

    // Format and quality
    const q = parseInt(quality) || 80;
    if (format === 'webp') {
      pipeline = pipeline.webp({ quality: q })
    } else if (format === 'jpeg' || format === 'jpg') {
      pipeline = pipeline.jpeg({ quality: q })
    } else if (format === 'png') {
      pipeline = pipeline.png({ quality: q })
    }

    // Output path
    const parsedName = filename.split('.')
    parsedName.pop() // remove old extension
    const baseName = parsedName.join('.')
    
    let newFilename = ''
    if (overwrite) {
      // Create a temporary file, then we will rename it over the original if format is same, 
      // but format might be different, so it's safer to always create new name.
      newFilename = `${baseName}_edited.${format || 'webp'}`
    } else {
      newFilename = `${baseName}_copy_${Date.now()}.${format || 'webp'}`
    }

    const outputPath = join(uploadDir, newFilename)

    await pipeline.toFile(outputPath)

    const fileStat = fs.statSync(outputPath)

    return NextResponse.json({ 
      id: fileStat.mtimeMs,
      url: `/uploads/${newFilename}`, 
      filename: newFilename,
      size: fileStat.size,
      created_at: fileStat.mtime.toISOString()
    })
  } catch (error) {
    console.error('Process image error:', error)
    return NextResponse.json({ error: 'Process failed' }, { status: 500 })
  }
}

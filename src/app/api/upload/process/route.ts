import { NextResponse } from 'next/server'
import { join } from 'path'
import fs from 'fs'
import sharp from 'sharp'
import { PrismaClient } from '@prisma/client'

const uploadDir = join(process.cwd(), 'public', 'uploads')
const prisma = new PrismaClient()

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
    const oldExt = parsedName.pop()?.toLowerCase() || ''
    const baseName = parsedName.join('.')
    const newExt = format || 'webp'
    
    let newFilename = ''
    if (overwrite) {
      if (oldExt === newExt || (oldExt === 'jpg' && newExt === 'jpeg') || (oldExt === 'jpeg' && newExt === 'jpg')) {
        newFilename = filename
      } else {
        newFilename = `${baseName}.${newExt}`
      }
    } else {
      newFilename = `${crypto.randomUUID()}.${newExt}`
    }

    // Write to a temporary file first because sharp cannot overwrite its input file directly
    const tempFilename = `temp_${crypto.randomUUID()}_${newFilename}`
    const tempOutputPath = join(uploadDir, tempFilename)

    await pipeline.toFile(tempOutputPath)

    const outputPath = join(uploadDir, newFilename)
    
    // Now move temp to output
    if (overwrite && newFilename === filename) {
      if (fs.existsSync(inputPath)) {
        fs.unlinkSync(inputPath)
      }
      fs.renameSync(tempOutputPath, outputPath)
    } else {
      fs.renameSync(tempOutputPath, outputPath)
      // If we are overwriting but the format changed, we also need to delete the old file
      // and update the database references to point to the new extension
      if (overwrite && newFilename !== filename) {
        if (fs.existsSync(inputPath)) {
          try {
             fs.unlinkSync(inputPath)
          } catch(e) { console.error('Failed to delete old file:', e) }
        }
        
        const oldUrl = `/uploads/${filename}`
        const newUrl = `/uploads/${newFilename}`
        
        // Update all possible references in Prisma in parallel
        try {
          await Promise.all([
            prisma.product.updateMany({ where: { featured_image: oldUrl }, data: { featured_image: newUrl } }),
            prisma.productImage.updateMany({ where: { image_url: oldUrl }, data: { image_url: newUrl } }),
            prisma.category.updateMany({ where: { image_url: oldUrl }, data: { image_url: newUrl } }),
            prisma.post.updateMany({ where: { featured_image: oldUrl }, data: { featured_image: newUrl } }),
            prisma.banner.updateMany({ where: { image_url: oldUrl }, data: { image_url: newUrl } }),
            prisma.user.updateMany({ where: { avatar: oldUrl }, data: { avatar: newUrl } })
          ])
        } catch (dbError) {
          console.error('Failed to update DB URLs:', dbError)
        }
      }
    }

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

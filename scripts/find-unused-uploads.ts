import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';

const prisma = new PrismaClient();

function extractUploadFilenames(urlStr: string | null | undefined): string[] {
  if (!urlStr) return [];
  const matches: string[] = [];
  if (urlStr.includes('/uploads/')) {
    try {
      const parts = urlStr.split('/uploads/');
      if (parts.length > 1) {
        matches.push(parts[1].split('?')[0].split('#')[0]);
      }
    } catch (e) {}
  }
  return matches;
}

function extractFromHtml(html: string | null | undefined): string[] {
  if (!html) return [];
  const matches: string[] = [];
  const regex = /\/uploads\/([^"'\s>]+)/g;
  let match;
  while ((match = regex.exec(html)) !== null) {
    matches.push(match[1].split('?')[0].split('#')[0]);
  }
  return matches;
}

async function main() {
  const uploadsDir = path.join(process.cwd(), 'public', 'uploads');
  if (!fs.existsSync(uploadsDir)) {
    console.log('Uploads directory not found!');
    return;
  }

  const allFiles = fs.readdirSync(uploadsDir).filter(f => fs.statSync(path.join(uploadsDir, f)).isFile());
  const usedFiles = new Set<string>();

  // 1. Products (featured_image)
  const products = await prisma.product.findMany();
  products.forEach(p => {
    extractUploadFilenames(p.featured_image).forEach(f => usedFiles.add(f));
  });

  // 2. Categories
  const categories = await prisma.category.findMany();
  categories.forEach((c: any) => {
    extractUploadFilenames(c.image).forEach(f => usedFiles.add(f));
    extractUploadFilenames(c.image_url).forEach(f => usedFiles.add(f));
  });

  // 3. Banners
  const banners = await prisma.banner.findMany();
  banners.forEach((b: any) => {
    extractUploadFilenames(b.image_url).forEach(f => usedFiles.add(f));
    extractUploadFilenames(b.image).forEach(f => usedFiles.add(f));
  });

  // 4. Posts
  const posts = await prisma.post.findMany();
  posts.forEach((p: any) => {
    extractUploadFilenames(p.thumbnail).forEach(f => usedFiles.add(f));
    extractFromHtml(p.content).forEach(f => usedFiles.add(f));
  });

  // 5. Users
  const users = await prisma.user.findMany();
  users.forEach((u: any) => {
    extractUploadFilenames(u.avatar).forEach(f => usedFiles.add(f));
  });

  // 6. Settings
  const settings = await prisma.setting.findMany();
  settings.forEach((s: any) => {
    extractUploadFilenames(s.value).forEach(f => usedFiles.add(f));
    extractFromHtml(s.value).forEach(f => usedFiles.add(f));
  });
  
  // 7. ProductImage
  const productImages = await prisma.productImage.findMany();
  productImages.forEach((img: any) => {
      extractUploadFilenames(img.image_url).forEach(f => usedFiles.add(f));
  });

  const whitelist = ['logo.png', 'logo.webp', 'favicon.ico'];
  const unusedFiles = allFiles.filter(f => !usedFiles.has(f) && !whitelist.includes(f));

  console.log(`Total files in uploads: ${allFiles.length}`);
  console.log(`Total used files: ${usedFiles.size}`);
  console.log(`Total unused files: ${unusedFiles.length}`);

  if (process.argv.includes('--apply')) {
    const today = new Date().toISOString().split('T')[0].replace(/-/g, '');
    const quarantineDir = path.join(process.cwd(), 'backups', `unused-uploads-${today}`);
    if (!fs.existsSync(quarantineDir)) {
      fs.mkdirSync(quarantineDir, { recursive: true });
    }

    let movedCount = 0;
    let savedBytes = 0;
    for (const f of unusedFiles) {
      const oldPath = path.join(uploadsDir, f);
      const newPath = path.join(quarantineDir, f);
      try {
        const stat = fs.statSync(oldPath);
        savedBytes += stat.size;
        fs.renameSync(oldPath, newPath);
        movedCount++;
      } catch (e) {
        console.error(`Failed to move ${f}`, e);
      }
    }
    console.log(`Moved ${movedCount} unused files to ${quarantineDir}`);
    console.log(`Saved ${(savedBytes / 1024 / 1024).toFixed(2)} MB`);
  } else {
    console.log('Unused files (Run with --apply to move to quarantine):');
    unusedFiles.slice(0, 20).forEach(f => console.log(f));
    if (unusedFiles.length > 20) console.log(`...and ${unusedFiles.length - 20} more`);
  }
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

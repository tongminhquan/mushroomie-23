import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  const absolutePathPrefix = '/var/www/mushroomie/public'

  console.log(`Bắt đầu dọn dẹp các đường dẫn tuyệt đối (${absolutePathPrefix}) trong database...`)

  let totalFixed = 0

  // 1. Banner
  const banners = await prisma.banner.findMany({
    where: { image_url: { startsWith: absolutePathPrefix } },
  })
  for (const banner of banners) {
    const fixedUrl = banner.image_url.replace(absolutePathPrefix, '')
    await prisma.banner.update({
      where: { id: banner.id },
      data: { image_url: fixedUrl },
    })
    totalFixed++
    console.log(`[Banner ${banner.id}] ${banner.image_url} -> ${fixedUrl}`)
  }

  // 2. Product
  const products = await prisma.product.findMany({
    where: { featured_image: { startsWith: absolutePathPrefix } },
  })
  for (const p of products) {
    if (p.featured_image) {
      const fixedUrl = p.featured_image.replace(absolutePathPrefix, '')
      await prisma.product.update({
        where: { id: p.id },
        data: { featured_image: fixedUrl },
      })
      totalFixed++
      console.log(`[Product ${p.id}] ${p.featured_image} -> ${fixedUrl}`)
    }
  }

  // 3. ProductImage
  const productImages = await prisma.productImage.findMany({
    where: { image_url: { startsWith: absolutePathPrefix } },
  })
  for (const pi of productImages) {
    const fixedUrl = pi.image_url.replace(absolutePathPrefix, '')
    await prisma.productImage.update({
      where: { id: pi.id },
      data: { image_url: fixedUrl },
    })
    totalFixed++
    console.log(`[ProductImage ${pi.id}] ${pi.image_url} -> ${fixedUrl}`)
  }

  // 4. Category
  const categories = await prisma.category.findMany({
    where: { image_url: { startsWith: absolutePathPrefix } },
  })
  for (const c of categories) {
    if (c.image_url) {
      const fixedUrl = c.image_url.replace(absolutePathPrefix, '')
      await prisma.category.update({
        where: { id: c.id },
        data: { image_url: fixedUrl },
      })
      totalFixed++
      console.log(`[Category ${c.id}] ${c.image_url} -> ${fixedUrl}`)
    }
  }

  // 5. Post (featured_image)
  const posts = await prisma.post.findMany({
    where: { featured_image: { startsWith: absolutePathPrefix } },
  })
  for (const post of posts) {
    if (post.featured_image) {
      const fixedUrl = post.featured_image.replace(absolutePathPrefix, '')
      await prisma.post.update({
        where: { id: post.id },
        data: { featured_image: fixedUrl },
      })
      totalFixed++
      console.log(`[Post ${post.id}] ${post.featured_image} -> ${fixedUrl}`)
    }
  }

  // 6. Post content replacements (might be dangerous, but if we just replace the exact string it's fine)
  const postsContent = await prisma.post.findMany({
    where: { content: { contains: absolutePathPrefix } },
  })
  for (const post of postsContent) {
    if (post.content) {
      // replace all instances
      const fixedContent = post.content.split(absolutePathPrefix).join('')
      await prisma.post.update({
        where: { id: post.id },
        data: { content: fixedContent },
      })
      totalFixed++
      console.log(`[Post Content ${post.id}] replaced absolute paths in content.`)
    }
  }

  // 7. User avatar
  const users = await prisma.user.findMany({
    where: { avatar: { startsWith: absolutePathPrefix } },
  })
  for (const user of users) {
    if (user.avatar) {
      const fixedUrl = user.avatar.replace(absolutePathPrefix, '')
      await prisma.user.update({
        where: { id: user.id },
        data: { avatar: fixedUrl },
      })
      totalFixed++
      console.log(`[User ${user.id}] ${user.avatar} -> ${fixedUrl}`)
    }
  }

  console.log(`Đã sửa tổng cộng ${totalFixed} bản ghi.`)
}

main()
  .catch(e => {
    console.error('Lỗi khi chạy script:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })

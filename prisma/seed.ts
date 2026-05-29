import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'
import 'dotenv/config'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Seeding database...')

  // ─── USERS ────────────────────────────────────────────────
  const adminPassword = await bcrypt.hash('Admin@123', 12)
  const userPassword = await bcrypt.hash('User@123', 12)

  const admin = await prisma.user.upsert({
    where: { email: 'admin@mushroomie.vn' },
    update: {},
    create: {
      name: 'Admin Mushroomie',
      email: 'admin@mushroomie.vn',
      password_hash: adminPassword,
      role: 'admin',
    },
  })

  const user = await prisma.user.upsert({
    where: { email: 'user@mushroomie.vn' },
    update: {},
    create: {
      name: 'Nguyễn Thị Lan',
      email: 'user@mushroomie.vn',
      password_hash: userPassword,
      role: 'user',
    },
  })

  console.log('✅ Users created')

  // ─── CATEGORIES ───────────────────────────────────────────
  const categories = await Promise.all([
    prisma.category.upsert({
      where: { slug: 'vong-tay' },
      update: {},
      create: { name: 'Vòng tay', slug: 'vong-tay', type: 'product', description: 'Vòng tay handmade cá nhân hóa' },
    }),
    prisma.category.upsert({
      where: { slug: 'moc-khoa' },
      update: {},
      create: { name: 'Móc khóa', slug: 'moc-khoa', type: 'product', description: 'Móc khóa nhỏ xinh handmade' },
    }),
    prisma.category.upsert({
      where: { slug: 'charm' },
      update: {},
      create: { name: 'Charm', slug: 'charm', type: 'product', description: 'Charm trang trí đa dạng' },
    }),
    prisma.category.upsert({
      where: { slug: 'phu-kien' },
      update: {},
      create: { name: 'Phụ kiện', slug: 'phu-kien', type: 'product', description: 'Phụ kiện handmade đa dạng' },
    }),
    prisma.category.upsert({
      where: { slug: 'tin-tuc-handmade' },
      update: {},
      create: { name: 'Tin tức Handmade', slug: 'tin-tuc-handmade', type: 'post', description: 'Tin tức và mẹo về handmade' },
    }),
  ])

  console.log('✅ Categories created')

  // ─── PRODUCTS ─────────────────────────────────────────────
  const products = [
    {
      name: 'Vòng tay charm nấm cute',
      slug: 'vong-tay-charm-nam-cute',
      short_description: 'Vòng tay handmade với charm nấm dễ thương, có thể cá nhân hóa màu sắc theo yêu cầu.',
      description: '<p>Vòng tay charm nấm cute được làm thủ công từ dây cước mềm mại, kết hợp với những chiếc charm nấm nhỏ xinh đáng yêu.</p><p>Bạn có thể chọn màu sắc dây và loại charm theo sở thích cá nhân.</p>',
      price: 85000,
      stock: 50,
      is_customizable: true,
      is_featured: true,
      category_id: categories[0].id,
      featured_image: 'https://picsum.photos/seed/mushroom1/600/600',
    },
    {
      name: 'Vòng tay hạt đá tự nhiên',
      slug: 'vong-tay-hat-da-tu-nhien',
      short_description: 'Vòng tay từ hạt đá tự nhiên, mang năng lượng tích cực và may mắn.',
      price: 120000,
      sale_price: 99000,
      stock: 30,
      is_customizable: true,
      is_featured: true,
      category_id: categories[0].id,
      featured_image: 'https://picsum.photos/seed/crystal1/600/600',
    },
    {
      name: 'Móc khóa gấu bông mini',
      slug: 'moc-khoa-gau-bong-mini',
      short_description: 'Móc khóa gấu bông handmade nhỏ xinh, có thể đính kèm vào túi xách hoặc chìa khóa.',
      price: 65000,
      stock: 100,
      is_customizable: false,
      is_featured: true,
      category_id: categories[1].id,
      featured_image: 'https://picsum.photos/seed/bear1/600/600',
    },
    {
      name: 'Charm chữ cái cá nhân hóa',
      slug: 'charm-chu-cai-ca-nhan-hoa',
      short_description: 'Charm chữ cái handmade, tùy chỉnh chữ theo tên hoặc từ ngữ yêu thích.',
      price: 45000,
      stock: 200,
      is_customizable: true,
      is_featured: false,
      category_id: categories[2].id,
      featured_image: 'https://picsum.photos/seed/letter1/600/600',
    },
    {
      name: 'Vòng tay couple đôi',
      slug: 'vong-tay-couple-doi',
      short_description: 'Bộ đôi vòng tay couple, tượng trưng cho tình yêu và sự kết nối. Có thể khắc tên đôi.',
      price: 150000,
      stock: 20,
      is_customizable: true,
      is_featured: true,
      category_id: categories[0].id,
      featured_image: 'https://picsum.photos/seed/couple1/600/600',
    },
    {
      name: 'Móc khóa charm dreamcatcher',
      slug: 'moc-khoa-charm-dreamcatcher',
      short_description: 'Móc khóa dreamcatcher handmade, mang ý nghĩa bắt những giấc mơ đẹp.',
      price: 75000,
      stock: 45,
      is_customizable: false,
      is_featured: false,
      category_id: categories[1].id,
      featured_image: 'https://picsum.photos/seed/dream1/600/600',
    },
    {
      name: 'Set charm trái cây cute',
      slug: 'set-charm-trai-cay-cute',
      short_description: 'Bộ 5 charm trái cây nhỏ xinh để trang trí vòng tay, túi xách hoặc móc khóa.',
      price: 55000,
      stock: 80,
      is_customizable: false,
      is_featured: true,
      category_id: categories[2].id,
      featured_image: 'https://picsum.photos/seed/fruit1/600/600',
    },
    {
      name: 'Vòng tay pearl luxury',
      slug: 'vong-tay-pearl-luxury',
      short_description: 'Vòng tay ngọc trai nhân tạo sang trọng, phù hợp với nhiều phong cách.',
      price: 180000,
      sale_price: 149000,
      stock: 15,
      is_customizable: true,
      is_featured: true,
      category_id: categories[0].id,
      featured_image: 'https://picsum.photos/seed/pearl1/600/600',
    },
  ]

  for (const productData of products) {
    const { featured_image, ...rest } = productData
    await prisma.product.upsert({
      where: { slug: productData.slug },
      update: {},
      create: {
        ...rest,
        featured_image,
        options: productData.is_customizable ? {
          create: [
            {
              option_name: 'Màu sắc dây',
              option_type: 'select',
              option_values: JSON.stringify(['Trắng', 'Đen', 'Hồng', 'Xanh dương', 'Vàng', 'Tím']),
            },
          ],
        } : undefined,
      },
    })
  }

  console.log('✅ Products created')

  // ─── POSTS ────────────────────────────────────────────────
  await prisma.post.upsert({
    where: { slug: 'cach-lam-vong-tay-handmade-don-gian' },
    update: {},
    create: {
      title: 'Cách làm vòng tay handmade đơn giản tại nhà',
      slug: 'cach-lam-vong-tay-handmade-don-gian',
      excerpt: 'Hướng dẫn làm vòng tay handmade cực đơn giản tại nhà với những nguyên liệu dễ tìm. Phù hợp cho người mới bắt đầu!',
      content: '<h2>Nguyên liệu cần chuẩn bị</h2><p>Để làm một chiếc vòng tay handmade đơn giản, bạn cần: dây cước, hạt charm, kéo và dụng cụ kẹp.</p><h2>Các bước thực hiện</h2><p>Bước 1: Đo độ dài dây phù hợp với cổ tay...</p>',
      status: 'published',
      category_id: categories[4].id,
      author_id: admin.id,
      published_at: new Date(),
      featured_image: 'https://picsum.photos/seed/post1/800/400',
      seo_title: 'Cách làm vòng tay handmade tại nhà | Mushroomie',
      meta_description: 'Hướng dẫn làm vòng tay handmade đơn giản tại nhà cho người mới bắt đầu.',
    },
  })

  await prisma.post.upsert({
    where: { slug: 'xu-huong-phu-kien-handmade-2024' },
    update: {},
    create: {
      title: 'Xu hướng phụ kiện handmade hot nhất 2024',
      slug: 'xu-huong-phu-kien-handmade-2024',
      excerpt: 'Cùng Mushroomie khám phá những xu hướng phụ kiện handmade đang được yêu thích nhất trong năm 2024!',
      content: '<p>Năm 2024 chứng kiến sự bùng nổ của phong trào handmade và cá nhân hóa...</p>',
      status: 'published',
      category_id: categories[4].id,
      author_id: admin.id,
      published_at: new Date(),
      featured_image: 'https://picsum.photos/seed/post2/800/400',
      seo_title: 'Xu hướng phụ kiện handmade 2024 | Mushroomie',
      meta_description: 'Khám phá những xu hướng phụ kiện handmade hot nhất 2024.',
    },
  })

  console.log('✅ Posts created')

  // ─── REVIEWS ──────────────────────────────────────────────
  const reviewsData = [
    { name: 'Nguyễn Thu Hà', content: 'Vòng tay đẹp lắm ạ, làm tỉ mỉ và chắc chắn hơn mình nghĩ. Shop giao hàng nhanh, đóng gói cẩn thận. Sẽ ủng hộ tiếp!', rating: 5, is_featured: true },
    { name: 'Trần Minh Tâm', content: 'Mua làm quà sinh nhật cho bạn gái, bạn rất thích. Charm nấm dễ thương quá, handmade rõ ràng. Cảm ơn Mushroomie!', rating: 5, is_featured: true },
    { name: 'Lê Thị Bình', content: 'Sản phẩm ok, giao hàng đúng hẹn. Có thể cá nhân hóa theo yêu cầu, shop tư vấn nhiệt tình. 4 sao vì hơi lâu giao.', rating: 4, is_featured: true },
    { name: 'Phạm Văn Dũng', content: 'Đặt móc khóa charm cho con gái, bé thích lắm. Chất lượng tốt, giá hợp lý. Sẽ quay lại mua thêm!', rating: 5, is_featured: true },
    { name: 'Hoàng Thị Mai', content: 'Mua vòng tay couple, cả hai đều rất ưng. Shop làm theo yêu cầu tốt, có ghi chú riêng theo ý mình. Love it!', rating: 5, is_featured: true },
    { name: 'Vũ Đình Nam', content: 'Tuyệt vời! Mua làm quà 8/3, người nhận rất cảm động. Handmade thật sự khác hàng sản xuất hàng loạt.', rating: 5, is_featured: true },
  ]

  for (const review of reviewsData) {
    await prisma.review.create({ data: { ...review, status: 'approved' } }).catch(() => {})
  }

  console.log('✅ Reviews created')

  console.log('')
  console.log('🎉 Seed completed!')
  console.log('📧 Admin: admin@mushroomie.vn / Admin@123')
  console.log('📧 User:  user@mushroomie.vn / User@123')
}

main()
  .catch((e) => {
    console.error('❌ Seed error:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })

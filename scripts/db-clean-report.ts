import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('--- DATABASE REPORT ---');
  
  const userCount = await prisma.user.count();
  const productCount = await prisma.product.count();
  const categoryCount = await prisma.category.count();
  const orderCount = await prisma.order.count();
  const orderItemCount = await prisma.orderItem.count();
  const postCount = await prisma.post.count();
  const bannerCount = await prisma.banner.count();
  const reviewCount = await prisma.review.count();
  const voucherCount = await prisma.voucher.count();
  const gameScoreCount = await prisma.gameScore.count();
  const adminLogCount = await prisma.adminLog.count();
  const cartCount = await prisma.cart.count();
  
  console.log(`Users: ${userCount}`);
  console.log(`Products: ${productCount}`);
  console.log(`Categories: ${categoryCount}`);
  console.log(`Orders: ${orderCount}`);
  console.log(`OrderItems: ${orderItemCount}`);
  console.log(`Posts: ${postCount}`);
  console.log(`Banners: ${bannerCount}`);
  console.log(`Reviews: ${reviewCount}`);
  console.log(`Vouchers: ${voucherCount}`);
  console.log(`GameScores: ${gameScoreCount}`);
  console.log(`AdminLogs: ${adminLogCount}`);
  console.log(`Carts: ${cartCount}`);

  // Test data counts
  const testProducts = await prisma.product.count({
    where: {
      OR: [
        { name: { contains: 'test' } },
        { name: { contains: 'demo' } }
      ]
    }
  });
  console.log(`Test/Demo Products: ${testProducts}`);

  const testPosts = await prisma.post.count({
    where: {
      OR: [
        { title: { contains: 'test' } },
        { title: { contains: 'demo' } }
      ]
    }
  });
  console.log(`Test/Demo Posts: ${testPosts}`);

  // Draft posts older than 60 days
  const sixtyDaysAgo = new Date();
  sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);
  const oldDrafts = await prisma.post.count({
    where: {
      status: 'draft',
      created_at: { lt: sixtyDaysAgo }
    }
  });
  console.log(`Draft posts older than 60 days: ${oldDrafts}`);

  // Check how many abandoned carts older than 30 days
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const oldCarts = await prisma.cart.count({
    where: {
      updated_at: { lt: thirtyDaysAgo }
    }
  });
  console.log(`Carts older than 30 days: ${oldCarts}`);
  
  console.log('-----------------------');
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    if (!session || !['super_admin', 'admin', 'viewer'].includes((session.user as any).role)) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const range = searchParams.get('range') || '30d'

    let startDate = new Date()
    if (range === '7d') startDate.setDate(startDate.getDate() - 7)
    else if (range === '90d') startDate.setDate(startDate.getDate() - 90)
    else if (range === 'year') startDate.setFullYear(startDate.getFullYear() - 1)
    else startDate.setDate(startDate.getDate() - 30) // default 30d

    const dateFilter = { gte: startDate }

    // 1. Orders & Revenue Summary
    const ordersResult = await prisma.order.findMany({
      where: { created_at: dateFilter },
      select: {
        id: true,
        order_status: true,
        payment_status: true,
        total: true,
        created_at: true,
      }
    })

    let revenue = 0
    let paidOrders = 0
    let pendingOrders = 0
    let cancelledOrders = 0

    const revenueByDayMap: Record<string, { revenue: number; orders: number }> = {}
    const ordersByStatusMap: Record<string, number> = {}

    ordersResult.forEach(order => {
      // Summary
      if (order.order_status !== 'CANCELLED' && (order.payment_status === 'PAID' || order.order_status === 'COMPLETED')) {
        revenue += Number(order.total)
        paidOrders++
      }
      if (order.order_status === 'PENDING_PAYMENT') pendingOrders++
      if (order.order_status === 'CANCELLED') cancelledOrders++

      // Status Chart
      ordersByStatusMap[order.order_status] = (ordersByStatusMap[order.order_status] || 0) + 1

      // Revenue Chart
      const dateKey = order.created_at.toISOString().split('T')[0]
      if (!revenueByDayMap[dateKey]) {
        revenueByDayMap[dateKey] = { revenue: 0, orders: 0 }
      }
      revenueByDayMap[dateKey].orders += 1
      if (order.order_status !== 'CANCELLED' && (order.payment_status === 'PAID' || order.order_status === 'COMPLETED')) {
        revenueByDayMap[dateKey].revenue += Number(order.total)
      }
    })

    const revenueByDay = Object.keys(revenueByDayMap).sort().map(date => ({
      date: date.substring(5, 10).replace('-', '/'), // format MM/DD
      revenue: revenueByDayMap[date].revenue,
      orders: revenueByDayMap[date].orders
    }))

    const statusLabels: Record<string, string> = {
      PENDING_PAYMENT: 'Chờ TT',
      PROCESSING: 'Xử lý',
      MAKING: 'Đang làm',
      PACKING: 'Đóng gói',
      SHIPPING: 'Đang giao',
      COMPLETED: 'Hoàn tất',
      CANCELLED: 'Đã hủy',
    }

    const ordersByStatus = Object.entries(ordersByStatusMap).map(([status, count]) => ({
      status: statusLabels[status] || status,
      count
    }))

    // 2. New Customers
    const newCustomersCount = await prisma.user.count({
      where: { created_at: dateFilter }
    })

    const newCustomersData = await prisma.user.findMany({
      where: { created_at: dateFilter },
      select: { created_at: true }
    })
    const customersByDayMap: Record<string, number> = {}
    newCustomersData.forEach(user => {
      const dateKey = user.created_at.toISOString().split('T')[0]
      customersByDayMap[dateKey] = (customersByDayMap[dateKey] || 0) + 1
    })
    const newCustomersByDay = Object.keys(customersByDayMap).sort().map(date => ({
      date: date.substring(5, 10).replace('-', '/'),
      count: customersByDayMap[date]
    }))

    // 3. Products Summary
    const totalProducts = await prisma.product.count({ where: { status: 'active' } })
    const lowStockProducts = await prisma.product.count({ where: { stock: { lt: 5, gt: 0 } } })
    
    // Top Products
    const orderItems = await prisma.orderItem.findMany({
      where: { order: { created_at: dateFilter } },
      select: { product_name: true, quantity: true, total_price: true }
    })
    const productStats: Record<string, { quantity: number; revenue: number }> = {}
    orderItems.forEach(item => {
      if (!productStats[item.product_name]) productStats[item.product_name] = { quantity: 0, revenue: 0 }
      productStats[item.product_name].quantity += item.quantity
      productStats[item.product_name].revenue += Number(item.total_price)
    })
    const topProducts = Object.entries(productStats)
      .map(([name, stats]) => ({ name, quantity: stats.quantity, revenue: stats.revenue }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5)

    // 4. Voucher Summary
    const vouchersIssued = await prisma.voucher.count({ where: { created_at: dateFilter } })
    const vouchersUsed = await prisma.voucher.count({ where: { status: 'used', used_at: dateFilter } })
    const voucherUsage = [
      { label: 'Đã nhận/Phát hành', count: vouchersIssued },
      { label: 'Đã dùng', count: vouchersUsed }
    ]

    // 5. Webhook Summary
    const webhookFailed = await prisma.paymentWebhookEvent.count({
      where: { created_at: dateFilter, status: 'FAILED' }
    })
    const webhooks = await prisma.paymentWebhookEvent.findMany({
      where: { created_at: dateFilter },
      select: { status: true }
    })
    const webhookStatusMap: Record<string, number> = {}
    webhooks.forEach(w => {
      webhookStatusMap[w.status] = (webhookStatusMap[w.status] || 0) + 1
    })
    const webhookStatus = Object.entries(webhookStatusMap).map(([status, count]) => ({
      status, count
    }))

    // 6. Mini Game
    const games = await prisma.gameScore.findMany({
      where: { created_at: dateFilter },
      select: { game: true }
    })
    const gameMap: Record<string, number> = {}
    games.forEach(g => {
      gameMap[g.game] = (gameMap[g.game] || 0) + 1
    })
    const miniGame = Object.entries(gameMap).map(([game, plays]) => ({
      game, plays
    }))

    return NextResponse.json({
      success: true,
      range,
      summary: {
        revenue,
        orders: ordersResult.length,
        paidOrders,
        pendingOrders,
        cancelledOrders,
        newCustomers: newCustomersCount,
        products: totalProducts,
        lowStockProducts,
        vouchersIssued,
        vouchersUsed,
        webhookFailed
      },
      charts: {
        revenueByDay,
        ordersByStatus,
        topProducts,
        newCustomersByDay,
        voucherUsage,
        webhookStatus,
        miniGame
      }
    }, {
      headers: {
        'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=30'
      }
    })
  } catch (error) {
    console.error('[ADMIN_DASHBOARD_STATS]', error)
    return NextResponse.json({ success: false, error: 'Server error' }, { status: 500 })
  }
}

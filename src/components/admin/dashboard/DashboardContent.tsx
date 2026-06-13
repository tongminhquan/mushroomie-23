"use client"

import React, { useState, useEffect } from "react"
import dynamic from "next/dynamic"
import { ShoppingCart, Package, FileText, MessageSquare, TrendingUp, Users, Ticket, AlertTriangle } from "lucide-react"
import Link from "next/link"

// Dynamic imports for charts to avoid SSR hydration issues and reduce initial bundle
const RevenueTrendChart = dynamic(() => import("./RevenueTrendChart").then(m => m.RevenueTrendChart), { ssr: false })
const OrdersStatusChart = dynamic(() => import("./OrdersStatusChart").then(m => m.OrdersStatusChart), { ssr: false })
const TopProductsChart = dynamic(() => import("./TopProductsChart").then(m => m.TopProductsChart), { ssr: false })
const CustomerTrendChart = dynamic(() => import("./OtherCharts").then(m => m.CustomerTrendChart), { ssr: false })
const VoucherUsageChart = dynamic(() => import("./OtherCharts").then(m => m.VoucherUsageChart), { ssr: false })
const WebhookStatusChart = dynamic(() => import("./OtherCharts").then(m => m.WebhookStatusChart), { ssr: false })
const MiniGameChart = dynamic(() => import("./OtherCharts").then(m => m.MiniGameChart), { ssr: false })

export function DashboardContent() {
  const [range, setRange] = useState("30d")
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  useEffect(() => {
    async function fetchStats() {
      setLoading(true)
      setError(false)
      try {
        const res = await fetch(`/api/admin/dashboard/stats?range=${range}`)
        if (!res.ok) throw new Error("Failed to fetch")
        const json = await res.json()
        if (json.success) {
          setData(json)
        } else {
          setError(true)
        }
      } catch (err) {
        console.error(err)
        setError(true)
      } finally {
        setLoading(false)
      }
    }
    fetchStats()
  }, [range])

  const summary = data?.summary || {}
  const charts = data?.charts || {}

  const formatPrice = (value: number) => {
    return new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND", maximumFractionDigits: 0 }).format(value || 0)
  }

  const formatNum = (value: number) => {
    return new Intl.NumberFormat("vi-VN").format(value || 0)
  }

  const statsCards = [
    { icon: TrendingUp, label: 'Doanh thu', value: formatPrice(summary.revenue), color: 'text-primary', bg: 'bg-primary-light' },
    { icon: ShoppingCart, label: 'Tổng đơn', value: formatNum(summary.orders), color: 'text-blue-600', bg: 'bg-blue-50' },
    { icon: Package, label: 'Chờ xử lý', value: formatNum(summary.pendingOrders), color: 'text-yellow-600', bg: 'bg-yellow-50' },
    { icon: Users, label: 'Khách hàng mới', value: formatNum(summary.newCustomers), color: 'text-green-600', bg: 'bg-green-50' },
    { icon: Ticket, label: 'Voucher đã dùng', value: formatNum(summary.vouchersUsed), color: 'text-purple-600', bg: 'bg-purple-50' },
    { icon: AlertTriangle, label: 'Webhook Lỗi', value: formatNum(summary.webhookFailed), color: 'text-red-600', bg: 'bg-red-50' },
  ]

  return (
    <div className="space-y-6">
      {/* Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-neutral-900 font-heading">Thống kê hoạt động</h2>
        </div>
        <div className="flex items-center gap-2">
          <select 
            className="border-neutral-200 rounded-lg text-sm px-3 py-2 focus:border-primary focus:ring-1 focus:ring-primary outline-none"
            value={range}
            onChange={(e) => setRange(e.target.value)}
            disabled={loading}
          >
            <option value="7d">7 ngày qua</option>
            <option value="30d">30 ngày qua</option>
            <option value="90d">90 ngày qua</option>
            <option value="year">1 năm qua</option>
          </select>
          <button 
            onClick={() => setRange(range)} 
            className="bg-white border border-neutral-200 px-3 py-2 rounded-lg text-sm hover:bg-neutral-50 active:scale-95 transition"
            disabled={loading}
          >
            Làm mới
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {statsCards.map((stat, idx) => {
          const Icon = stat.icon
          return (
            <div key={idx} className="rounded-xl border border-neutral-200 bg-white p-4 shadow-sm relative overflow-hidden">
              {loading && <div className="absolute inset-0 bg-white/50 backdrop-blur-[1px] z-10 animate-pulse" />}
              <div className={`mb-3 flex h-8 w-8 items-center justify-center rounded-lg ${stat.bg} ${stat.color}`}>
                <Icon size={16} />
              </div>
              <div className="text-xl font-bold text-neutral-900 truncate">{error ? '---' : stat.value}</div>
              <div className="text-xs text-neutral-500 mt-1">{stat.label}</div>
            </div>
          )
        })}
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <RevenueTrendChart data={charts.revenueByDay} loading={loading} error={error} />
        <OrdersStatusChart data={charts.ordersByStatus} loading={loading} error={error} />
        <TopProductsChart data={charts.topProducts} loading={loading} error={error} />
        <CustomerTrendChart data={charts.newCustomersByDay} loading={loading} error={error} />
        <VoucherUsageChart data={charts.voucherUsage} loading={loading} error={error} />
        <MiniGameChart data={charts.miniGame} loading={loading} error={error} />
        <WebhookStatusChart data={charts.webhookStatus} loading={loading} error={error} />
      </div>
    </div>
  )
}

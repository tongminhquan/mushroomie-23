"use client"

import React from "react"
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip } from "recharts"
import { ChartCard } from "./ChartCard"

interface RevenueData {
  date: string
  revenue: number
  orders: number
}

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND", maximumFractionDigits: 0 }).format(value)
}

export function RevenueTrendChart({ 
  data, 
  loading, 
  error 
}: { 
  data?: RevenueData[]
  loading?: boolean
  error?: boolean 
}) {
  const empty = !data || data.length === 0

  return (
    <ChartCard
      title="Doanh thu & Đơn hàng"
      description="Biểu đồ doanh thu theo thời gian"
      loading={loading}
      error={error}
      empty={empty}
      className="col-span-full" // Make it full width if placed in a grid
    >
      {!empty && (
        <ResponsiveContainer width="100%" height={300}>
          <AreaChart data={data} margin={{ top: 10, right: 10, left: 20, bottom: 0 }}>
            <defs>
              <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#e41d1d" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="#e41d1d" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
            <XAxis 
              dataKey="date" 
              axisLine={false} 
              tickLine={false} 
              tick={{ fontSize: 12, fill: '#888' }} 
              dy={10} 
            />
            <YAxis 
              yAxisId="left"
              axisLine={false} 
              tickLine={false} 
              tick={{ fontSize: 12, fill: '#888' }}
              tickFormatter={(value) => value >= 1000000 ? `${(value / 1000000).toFixed(1)}tr` : `${value / 1000}k`}
              dx={-10}
            />
            <YAxis 
              yAxisId="right"
              orientation="right"
              axisLine={false} 
              tickLine={false} 
              tick={{ fontSize: 12, fill: '#888' }}
              dx={10}
            />
            <Tooltip 
              formatter={(value: any, name: any) => {
                if (name === "Doanh thu") return [formatCurrency(value), name]
                return [value, name]
              }}
              labelStyle={{ color: '#2b2b2b', fontWeight: 'bold', marginBottom: '4px' }}
              contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
            />
            <Area 
              yAxisId="left"
              type="monotone" 
              dataKey="revenue" 
              name="Doanh thu"
              stroke="#e41d1d" 
              strokeWidth={3}
              fillOpacity={1} 
              fill="url(#colorRevenue)" 
            />
            <Area 
              yAxisId="right"
              type="monotone" 
              dataKey="orders" 
              name="Số đơn"
              stroke="#b9794b" 
              strokeWidth={2}
              fillOpacity={0} 
            />
          </AreaChart>
        </ResponsiveContainer>
      )}
    </ChartCard>
  )
}

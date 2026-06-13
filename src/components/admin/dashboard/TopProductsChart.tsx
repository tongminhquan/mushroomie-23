"use client"

import React from "react"
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Cell } from "recharts"
import { ChartCard } from "./ChartCard"

interface TopProductData {
  name: string
  quantity: number
  revenue: number
}

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND", maximumFractionDigits: 0 }).format(value)
}

export function TopProductsChart({ 
  data, 
  loading, 
  error 
}: { 
  data?: TopProductData[]
  loading?: boolean
  error?: boolean 
}) {
  const empty = !data || data.length === 0

  return (
    <ChartCard
      title="Top sản phẩm"
      description="Sản phẩm bán chạy nhất theo doanh thu"
      loading={loading}
      error={error}
      empty={empty}
    >
      {!empty && (
        <ResponsiveContainer width="100%" height={250}>
          <BarChart data={data} layout="vertical" margin={{ top: 5, right: 30, left: 10, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#f0f0f0" />
            <XAxis type="number" hide />
            <YAxis 
              dataKey="name" 
              type="category" 
              axisLine={false} 
              tickLine={false} 
              tick={{ fontSize: 11, fill: '#2b2b2b' }}
              width={100}
              tickFormatter={(value) => value.length > 15 ? value.substring(0, 15) + '...' : value}
            />
            <Tooltip 
              cursor={{ fill: '#f9fafb' }}
              contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
              formatter={(value: any, name: any) => {
                if (name === "revenue") return [formatCurrency(value), "Doanh thu"]
                return [value, "Đã bán"]
              }}
            />
            <Bar dataKey="revenue" name="revenue" fill="#e41d1d" radius={[0, 4, 4, 0]} barSize={16} />
            <Bar dataKey="quantity" name="quantity" fill="#ffe7a3" radius={[0, 4, 4, 0]} barSize={8} />
          </BarChart>
        </ResponsiveContainer>
      )}
    </ChartCard>
  )
}

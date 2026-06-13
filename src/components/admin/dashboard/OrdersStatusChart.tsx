"use client"

import React from "react"
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Cell } from "recharts"
import { ChartCard } from "./ChartCard"

interface OrderStatusData {
  status: string
  count: number
}

const COLORS = {
  'Hoàn tất': '#10b981',
  'Đã thanh toán': '#10b981',
  'Chờ TT': '#f59e0b',
  'Xử lý': '#3b82f6',
  'Đang làm': '#8b5cf6',
  'Đóng gói': '#f59e0b',
  'Đang giao': '#3b82f6',
  'Đã hủy': '#ef4444',
  'Default': '#b9794b'
}

export function OrdersStatusChart({ 
  data, 
  loading, 
  error 
}: { 
  data?: OrderStatusData[]
  loading?: boolean
  error?: boolean 
}) {
  const empty = !data || data.length === 0

  return (
    <ChartCard
      title="Trạng thái đơn hàng"
      description="Phân bổ đơn hàng theo trạng thái"
      loading={loading}
      error={error}
      empty={empty}
    >
      {!empty && (
        <ResponsiveContainer width="100%" height={250}>
          <BarChart data={data} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#f0f0f0" />
            <XAxis type="number" hide />
            <YAxis 
              dataKey="status" 
              type="category" 
              axisLine={false} 
              tickLine={false} 
              tick={{ fontSize: 12, fill: '#2b2b2b', fontWeight: 500 }}
              width={80}
            />
            <Tooltip 
              cursor={{ fill: '#f9fafb' }}
              contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
              formatter={(value: any) => [`${value} đơn`, 'Số lượng']}
            />
            <Bar dataKey="count" radius={[0, 4, 4, 0]} barSize={24}>
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[entry.status as keyof typeof COLORS] || COLORS['Default']} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      )}
    </ChartCard>
  )
}

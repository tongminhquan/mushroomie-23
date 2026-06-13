"use client"

import React from "react"
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Cell, LineChart, Line, PieChart, Pie, Legend } from "recharts"
import { ChartCard } from "./ChartCard"

// -----------------------------------------------------------------------------
// NEW CUSTOMERS CHART
// -----------------------------------------------------------------------------
export function CustomerTrendChart({ data, loading, error }: { data?: any[], loading?: boolean, error?: boolean }) {
  const empty = !data || data.length === 0
  return (
    <ChartCard title="Khách hàng mới" description="Đăng ký tài khoản theo ngày" loading={loading} error={error} empty={empty}>
      {!empty && (
        <ResponsiveContainer width="100%" height={250}>
          <LineChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
            <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#888' }} dy={10} />
            <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#888' }} dx={-10} allowDecimals={false} />
            <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} formatter={(value: any) => [value, 'Khách hàng']} />
            <Line type="monotone" dataKey="count" stroke="#b9794b" strokeWidth={3} dot={{ r: 4, fill: '#b9794b', strokeWidth: 0 }} activeDot={{ r: 6 }} />
          </LineChart>
        </ResponsiveContainer>
      )}
    </ChartCard>
  )
}

// -----------------------------------------------------------------------------
// VOUCHER CHART
// -----------------------------------------------------------------------------
export function VoucherUsageChart({ data, loading, error }: { data?: any[], loading?: boolean, error?: boolean }) {
  const empty = !data || data.length === 0
  return (
    <ChartCard title="Voucher" description="Tổng quan phát hành và sử dụng" loading={loading} error={error} empty={empty}>
      {!empty && (
        <ResponsiveContainer width="100%" height={250}>
          <BarChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
            <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#2b2b2b' }} dy={10} />
            <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#888' }} dx={-10} allowDecimals={false} />
            <Tooltip cursor={{ fill: '#f9fafb' }} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} formatter={(value: any) => [value, 'Số lượng']} />
            <Bar dataKey="count" radius={[4, 4, 0, 0]} barSize={40}>
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={index === 0 ? '#ffd6d6' : '#e41d1d'} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      )}
    </ChartCard>
  )
}

// -----------------------------------------------------------------------------
// WEBHOOK CHART
// -----------------------------------------------------------------------------
export function WebhookStatusChart({ data, loading, error }: { data?: any[], loading?: boolean, error?: boolean }) {
  const empty = !data || data.length === 0
  const COLORS: Record<string, string> = { PROCESSED: '#10b981', FAILED: '#ef4444', IGNORED: '#f59e0b', RECEIVED: '#3b82f6' }
  return (
    <ChartCard title="Trạng thái Webhook" description="Log thanh toán tự động" loading={loading} error={error} empty={empty}>
      {!empty && (
        <ResponsiveContainer width="100%" height={250}>
          <PieChart>
            <Pie data={data} dataKey="count" nameKey="status" cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5}>
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[entry.status] || '#b9794b'} />
              ))}
            </Pie>
            <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} formatter={(value: any) => [value, 'Events']} />
            <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{ fontSize: '12px' }}/>
          </PieChart>
        </ResponsiveContainer>
      )}
    </ChartCard>
  )
}

// -----------------------------------------------------------------------------
// MINI GAME CHART
// -----------------------------------------------------------------------------
export function MiniGameChart({ data, loading, error }: { data?: any[], loading?: boolean, error?: boolean }) {
  const empty = !data || data.length === 0
  return (
    <ChartCard title="Mini Game" description="Lượt chơi game" loading={loading} error={error} empty={empty}>
      {!empty && (
        <ResponsiveContainer width="100%" height={250}>
          <BarChart data={data} layout="vertical" margin={{ top: 5, right: 30, left: 10, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#f0f0f0" />
            <XAxis type="number" hide />
            <YAxis dataKey="game" type="category" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#2b2b2b' }} width={80} />
            <Tooltip cursor={{ fill: '#f9fafb' }} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} formatter={(value: any) => [value, 'Lượt chơi']} />
            <Bar dataKey="plays" fill="#3b82f6" radius={[0, 4, 4, 0]} barSize={20} />
          </BarChart>
        </ResponsiveContainer>
      )}
    </ChartCard>
  )
}

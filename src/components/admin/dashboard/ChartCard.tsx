"use client"

import React from "react"
import { AlertCircle } from "lucide-react"

export function ChartCard({ 
  title, 
  description, 
  loading, 
  error, 
  empty, 
  children,
  className = ""
}: { 
  title: string
  description?: string
  loading?: boolean
  error?: boolean
  empty?: boolean
  children: React.ReactNode
  className?: string
}) {
  return (
    <div className={`rounded-xl border border-neutral-200 bg-white p-4 sm:p-6 shadow-sm flex flex-col ${className}`}>
      <div className="mb-4">
        <h3 className="font-heading font-bold text-lg text-neutral-900">{title}</h3>
        {description && <p className="text-xs text-neutral-500 mt-1">{description}</p>}
      </div>
      
      <div className="flex-1 flex flex-col justify-center min-h-[250px] relative">
        {loading && (
          <div className="absolute inset-0 flex items-center justify-center bg-white/60 z-10">
            <div className="animate-pulse flex flex-col items-center">
              <div className="h-6 w-6 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
              <span className="mt-2 text-xs text-neutral-500 font-medium">Đang tải...</span>
            </div>
          </div>
        )}

        {error && !loading && (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-danger text-center">
            <AlertCircle size={32} className="mb-2 opacity-50" />
            <p className="text-sm font-semibold">Lỗi tải dữ liệu</p>
            <p className="text-xs text-neutral-500">Vui lòng thử lại sau</p>
          </div>
        )}

        {empty && !loading && !error && (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-neutral-400 text-center">
            <p className="text-sm">Chưa có dữ liệu trong thời gian này</p>
          </div>
        )}

        <div className={`w-full h-full min-h-[250px] transition-opacity duration-300 ${(loading || error || empty) ? 'opacity-0' : 'opacity-100'}`}>
          {children}
        </div>
      </div>
    </div>
  )
}

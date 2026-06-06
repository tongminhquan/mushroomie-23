import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

import { format } from 'date-fns'
import { vi } from 'date-fns/locale'

export function formatPrice(price: number | string): string {
  const num = typeof price === 'string' ? parseFloat(price) : price
  return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".") + " ₫"
}

export function formatDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date
  return format(d, 'dd/MM/yyyy HH:mm', { locale: vi })
}

export function generateSlug(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
}

export function generateOrderCode(): string {
  const prefix = process.env.PAYMENT_PREFIX || 'MSH'
  const timestamp = Date.now().toString(36).toUpperCase()
  const random = Math.random().toString(36).substring(2, 6).toUpperCase()
  return `${prefix}-${timestamp}${random}`
}

export function truncate(str: string, length: number): string {
  if (str.length <= length) return str
  return str.substring(0, length) + '...'
}

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || process.env.PUBLIC_BASE_URL || 'https://mushroomie.io.vn';

export function getPublicImageUrl(pathOrUrl?: string | null, type: 'product' | 'banner' | 'user' = 'product'): string {
  const fallback = type === 'banner' 
    ? '/images/banner-placeholder.png' 
    : type === 'user' 
      ? '/images/avatar-placeholder.png' 
      : '/images/product-placeholder.png';
  
  if (!pathOrUrl || typeof pathOrUrl !== 'string') return fallback;
  
  const value = pathOrUrl.trim();
  if (!value) return fallback;

  // Handle localhost links generated in local DB
  if (value.startsWith('http://localhost') || value.startsWith('https://localhost') || value.startsWith('http://127.0.0.1')) {
    try {
      const url = new URL(value);
      return url.pathname;
    } catch {
      return fallback;
    }
  }
  
  // Convert absolute internal URLs to relative to use Next.js image optimization properly
  if (value.startsWith(SITE_URL)) {
    return value.replace(SITE_URL, '');
  }

  // Already a full absolute remote URL or relative URL
  if (value.startsWith('http')) return value;
  if (value.startsWith('/')) return value;

  return `/${value}`;
}

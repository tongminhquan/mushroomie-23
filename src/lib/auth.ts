import NextAuth from 'next-auth'
import Credentials from 'next-auth/providers/credentials'
import Google from 'next-auth/providers/google'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'
import { z } from 'zod'

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
})

declare module 'next-auth' {
  interface User {
    role?: string
    phone?: string | null
    address?: string | null
  }
  interface Session {
    user: {
      id: string
      name?: string | null
      email?: string | null
      image?: string | null
      role?: string
      phone?: string | null
      address?: string | null
    }
  }
}

const authSecret = process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET

// Ở production runtime, KHÔNG được phép chạy với secret fallback công khai — nếu
// thiếu AUTH_SECRET/NEXTAUTH_SECRET thì JWT sẽ bị ký bằng hằng số ai cũng biết,
// dẫn tới giả mạo phiên/leo quyền. Fail-fast để lộ lỗi cấu hình ngay.
// Bỏ qua trong lúc `next build` (page-data collection chạy với NODE_ENV=production
// nhưng chưa có secret runtime) — chỉ kiểm tra khi server thực sự khởi động/xử lý request.
const isBuildPhase = process.env.NEXT_PHASE === 'phase-production-build'
if (
  process.env.NODE_ENV === 'production' &&
  !isBuildPhase &&
  (!authSecret || authSecret.length < 32)
) {
  throw new Error('AUTH_SECRET (hoặc NEXTAUTH_SECRET) phải được cấu hình tối thiểu 32 ký tự ở môi trường production')
}

export const { handlers, signIn, signOut, auth } = NextAuth({
  // Fallback chỉ dùng cho `next build`/dev khi không có secret (đã chặn ở production phía trên).
  secret: authSecret || 'mushroomie-dev-only-secret-not-for-production',
  theme: { logo: '/logo.webp' },
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
    Credentials({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        const parsed = loginSchema.safeParse(credentials)
        if (!parsed.success) return null

        const user = await prisma.user.findUnique({
          where: { email: parsed.data.email },
        })
        if (!user) return null

        // Tài khoản Google OAuth không có password
        if (!user.password_hash) return null

        const passwordMatch = await bcrypt.compare(parsed.data.password, user.password_hash)
        if (!passwordMatch) return null

        return {
          id: user.id.toString(),
          email: user.email,
          name: user.name,
          role: user.role,
        }
      },
    }),
  ],
  callbacks: {
    async signIn({ user, account, profile }) {
      // Xử lý đăng nhập Social (Google): tạo user mới hoặc cập nhật thông tin Google
      if (account?.provider === 'google') {
        if (!user.email) return false
        try {
          if (profile?.email_verified !== true) return false

          const existingUser = await prisma.user.findUnique({
            where: { email: user.email },
          })

          if (existingUser) {
            if (existingUser.google_id && existingUser.google_id !== account.providerAccountId) return false
            // Legacy password accounts created before OTP enforcement must prove email ownership first.
            if (existingUser.password_hash && !existingUser.is_email_verified) return false

            await prisma.user.update({
              where: { email: user.email },
              data: {
                avatar: user.image || existingUser.avatar,
                google_id: account.providerAccountId,
                is_email_verified: true,
              }
            })
          } else {
            await prisma.user.create({
              data: {
                email: user.email,
                name: user.name || 'Người dùng Google',
                password_hash: '',
                avatar: user.image || null,
                google_id: account.providerAccountId,
                is_email_verified: true,
                role: 'user',
              },
            })
          }
          return true
        } catch (error) {
          console.error(`${account.provider} signIn error:`, error)
          return false
        }
      }
      return true
    },
    async jwt({ token, user, account }) {
      // Credentials: user object được trả về từ authorize()
      if (user && account?.provider === 'credentials') {
        token.id = user.id
        token.role = user.role
      }

      // Social OAuth (Google): lấy id, role, phone, address từ database
      if (account?.provider === 'google' && token.email) {
        const dbUser = await prisma.user.findUnique({
          where: { email: token.email as string },
          select: { id: true, role: true, phone: true, address: true },
        })
        if (dbUser) {
          token.id = dbUser.id.toString()
          token.role = dbUser.role
          token.phone = dbUser.phone
          token.address = dbUser.address
        }
      }

      return token
    },
    async session({ session, token }) {
      if (session?.user?.email) {
        // Fetch fresh user data from DB to ensure role, phone, address are always up-to-date
        const dbUser = await prisma.user.findUnique({
          where: { email: session.user.email },
          select: { id: true, role: true, phone: true, address: true },
        })
        if (dbUser) {
          session.user.id = dbUser.id.toString()
          session.user.role = dbUser.role
          session.user.phone = dbUser.phone
          session.user.address = dbUser.address
        }
      }
      return session
    },
  },
  pages: {
    signIn: '/tai-khoan/dang-nhap',
    signOut: '/',
    error: '/tai-khoan/dang-nhap',
  },
  session: { strategy: 'jwt' },
})

export async function requireAuth() {
  const session = await auth()
  if (!session?.user) throw new Error('UNAUTHORIZED')
  return session
}

export async function requireAdmin() {
  const session = await requireAuth()
  if (!['super_admin', 'admin'].includes(session.user.role as string)) {
    throw new Error('FORBIDDEN')
  }
  return session
}

export async function requireSuperAdmin() {
  const session = await requireAuth()
  if (session.user.role !== 'super_admin') {
    throw new Error('FORBIDDEN')
  }
  return session
}

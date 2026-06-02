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
  }
  interface Session {
    user: {
      id: string
      name?: string | null
      email?: string | null
      image?: string | null
      role?: string
    }
  }
}

export const { handlers, signIn, signOut, auth } = NextAuth({
  secret: process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET || 'mushroomie-secret-key-change-in-production',
  theme: { logo: '/logo.png' },
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
          const existingUser = await prisma.user.findUnique({
            where: { email: user.email },
          })
          if (!existingUser) {
            // Thay vì tạo user ngay, redirect sang trang hoàn tất đăng ký
            const params = new URLSearchParams({
              email: user.email,
              name: user.name || '',
              avatar: user.image || '',
              google_id: account.providerAccountId || ''
            })
            return `/tai-khoan/hoan-tat-dang-ky?${params.toString()}`
          } else {
            // Cập nhật thông tin Google nếu người dùng đã tồn tại
            await prisma.user.update({
              where: { email: user.email },
              data: {
                avatar: user.image || existingUser.avatar,
                google_id: account.providerAccountId,
                is_email_verified: (profile?.email_verified as boolean) ?? existingUser.is_email_verified,
              }
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

      // Social OAuth (Google): lấy id và role từ database
      if (account?.provider === 'google' && token.email) {
        const dbUser = await prisma.user.findUnique({
          where: { email: token.email as string },
          select: { id: true, role: true },
        })
        if (dbUser) {
          token.id = dbUser.id.toString()
          token.role = dbUser.role
        }
      }

      return token
    },
    async session({ session, token }) {
      if (session?.user?.email) {
        // Fetch fresh user data from DB to ensure role is always up-to-date
        const dbUser = await prisma.user.findUnique({
          where: { email: session.user.email },
          select: { id: true, role: true },
        })
        if (dbUser) {
          session.user.id = dbUser.id.toString()
          session.user.role = dbUser.role
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

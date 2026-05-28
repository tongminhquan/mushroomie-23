import { PrismaClient } from '@prisma/client'
import { PrismaMariaDb } from '@prisma/adapter-mariadb'

function parseDatabaseUrl(url: string) {
  try {
    const u = new URL(url)
    return {
      host: u.hostname,
      port: parseInt(u.port || '3306'),
      user: u.username,
      password: decodeURIComponent(u.password),
      database: u.pathname.replace('/', ''),
      allowPublicKeyRetrieval: true,
    }
  } catch {
    return {
      host: 'localhost',
      port: 3306,
      user: 'root',
      password: 'password',
      database: 'mushroomie',
      allowPublicKeyRetrieval: true,
    }
  }
}

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

function createPrismaClient() {
  const dbConfig = parseDatabaseUrl(process.env.DATABASE_URL || '')
  const adapter = new PrismaMariaDb(dbConfig)
  return new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
  })
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient()

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma

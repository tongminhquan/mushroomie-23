import { prisma } from './prisma'

type AdminAction = 'CREATE' | 'UPDATE' | 'DELETE' | 'LOGIN' | 'BULK_IMPORT' | 'OTHER'
type AdminEntity = 'PRODUCT' | 'ORDER' | 'POST' | 'USER' | 'BANNER' | 'CATEGORY' | 'VOUCHER' | 'SETTINGS' | 'SYSTEM'

interface AdminLogPayload {
  userId: number
  action: AdminAction
  entity: AdminEntity
  details?: Record<string, unknown>
  ipAddress?: string
}

export async function logAdminAction(payload: AdminLogPayload) {
  try {
    await prisma.adminLog.create({
      data: {
        user_id: payload.userId,
        action: payload.action,
        entity: payload.entity,
        details: payload.details ? JSON.stringify(payload.details) : null,
        ip_address: payload.ipAddress,
      },
    })
  } catch (error) {
    console.error('Failed to log admin action:', error)
    // We intentionally don't throw to prevent failing the main request if logging fails
  }
}

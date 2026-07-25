import { getAuthErrorStatus } from './auth-errors'

const SAFE_UPLOAD_ERROR_PATTERNS = [
  /^Image file /,
  /^Invalid image /,
  /^Unsupported image format$/,
  /^Unable to optimize image /,
  /^Ảnh .+ vượt giới hạn /,
]

export function getUploadErrorDetails(error: unknown) {
  const authStatus = getAuthErrorStatus(error)
  if (authStatus) {
    return {
      status: authStatus,
      message: authStatus === 401 ? 'Unauthorized' : 'Forbidden',
    }
  }

  if (
    error instanceof Error &&
    SAFE_UPLOAD_ERROR_PATTERNS.some((pattern) => pattern.test(error.message))
  ) {
    return { status: 400, message: error.message }
  }

  return { status: 500, message: 'Upload failed' }
}

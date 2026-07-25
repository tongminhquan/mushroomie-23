export const MAX_QR_IMAGE_BYTES = 2 * 1024 * 1024

const ALLOWED_QR_ORIGIN = 'https://img.vietqr.io'

export function parseAllowedQrUrl(value: string) {
  let url: URL

  try {
    url = new URL(value)
  } catch {
    throw new Error('Invalid QR URL')
  }

  if (
    url.origin !== ALLOWED_QR_ORIGIN ||
    url.protocol !== 'https:' ||
    url.username ||
    url.password
  ) {
    throw new Error('Invalid QR URL')
  }

  return url
}

export async function readResponseBodyWithLimit(
  response: Response,
  maxBytes = MAX_QR_IMAGE_BYTES,
) {
  const contentLength = Number(response.headers.get('content-length'))
  if (Number.isFinite(contentLength) && contentLength > maxBytes) {
    throw new Error('QR image is too large')
  }

  if (!response.body) return new Uint8Array()

  const reader = response.body.getReader()
  const chunks: Uint8Array[] = []
  let totalBytes = 0

  try {
    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      if (!value) continue

      totalBytes += value.byteLength
      if (totalBytes > maxBytes) {
        await reader.cancel()
        throw new Error('QR image is too large')
      }
      chunks.push(value)
    }
  } finally {
    reader.releaseLock()
  }

  const body = new Uint8Array(totalBytes)
  let offset = 0
  for (const chunk of chunks) {
    body.set(chunk, offset)
    offset += chunk.byteLength
  }
  return body
}

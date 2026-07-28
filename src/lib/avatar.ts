const LOCAL_WEBP_AVATAR_PATH = /^\/uploads\/[a-zA-Z0-9][a-zA-Z0-9._-]*\.webp$/

export function isSafeAvatarPath(value: unknown): value is string {
  return typeof value === 'string' && LOCAL_WEBP_AVATAR_PATH.test(value) && !value.includes('..')
}

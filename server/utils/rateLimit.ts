import { createError, getRequestIP, type H3Event } from 'h3'

// Simple in-memory fixed-window rate limiter (single-instance deploy).
const buckets = new Map<string, { count: number; reset: number }>()

function allow(key: string, limit: number, windowMs: number): boolean {
  const now = Date.now()
  const b = buckets.get(key)
  if (!b || b.reset < now) {
    buckets.set(key, { count: 1, reset: now + windowMs })
    return true
  }
  if (b.count >= limit) return false
  b.count++
  return true
}

const WINDOW_MS = 10 * 60 * 1000 // 10 minutes

// Duck-submission policy: 30/10min per authenticated user, 5/10min per anonymous IP.
export function enforceDuckSubmissionLimit(event: H3Event) {
  const user = event.context.user as { id: string } | undefined
  const limit = user ? 30 : 5
  const key = user
    ? `user:${user.id}`
    : `ip:${getRequestIP(event, { xForwardedFor: true }) || 'unknown'}`

  if (!allow(`duck-submission:${key}`, limit, WINDOW_MS)) {
    throw createError({
      statusCode: 429,
      statusMessage: 'Too many submissions. Please try again in a few minutes.',
    })
  }
}

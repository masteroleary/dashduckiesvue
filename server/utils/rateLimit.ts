import { createError, getRequestIP, type H3Event } from 'h3'

// Simple in-memory fixed-window rate limiter (single-instance deploy).
// NOTE: per-process state — move to Postgres/Redis if scaling horizontally.
const buckets = new Map<string, { count: number; reset: number }>()
let lastSweep = Date.now()

function sweep(now: number) {
  if (now - lastSweep < 60_000) return
  lastSweep = now
  for (const [key, b] of buckets) {
    if (b.reset < now) buckets.delete(key)
  }
}

function allow(key: string, limit: number, windowMs: number): boolean {
  const now = Date.now()
  sweep(now)
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
const tooMany = () =>
  createError({ statusCode: 429, statusMessage: 'Too many requests. Please try again in a few minutes.' })

function clientIp(event: H3Event): string {
  return getRequestIP(event, { xForwardedFor: true }) || 'unknown'
}

// Duck-submission policy: 30/10min per authenticated user, 5/10min per anonymous IP.
export function enforceDuckSubmissionLimit(event: H3Event) {
  const user = event.context.user as { id: string } | undefined
  const limit = user ? 30 : 5
  const key = user ? `submit:user:${user.id}` : `submit:ip:${clientIp(event)}`
  if (!allow(key, limit, WINDOW_MS)) throw tooMany()
}

// Sending a code: 5/identifier and 20/IP per 10min (limits SMS/email cost + spam).
export function enforceRequestCodeLimit(event: H3Event, identifier: string) {
  if (!allow(`reqcode:id:${identifier}`, 5, WINDOW_MS)) throw tooMany()
  if (!allow(`reqcode:ip:${clientIp(event)}`, 20, WINDOW_MS)) throw tooMany()
}

// Verifying a code: 8 attempts/identifier and 30/IP per 10min (defeats brute-force
// of the 6-digit code, which expires in 10min).
export function enforceVerifyLimit(event: H3Event, identifier: string) {
  if (!allow(`verify:id:${identifier}`, 8, WINDOW_MS)) throw tooMany()
  if (!allow(`verify:ip:${clientIp(event)}`, 30, WINDOW_MS)) throw tooMany()
}

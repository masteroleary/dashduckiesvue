import { and, eq, isNull } from 'drizzle-orm'
import { useDb } from '../../db'
import { ducks } from '../../db/schema'
import { notifyDuckReport, notifyUnknownCodeReport } from '../../utils/notify'
import { enforceReportLimit } from '../../utils/rateLimit'

// Flag a duck from a scan result. Either `duckId` (a real duck that was never
// registered) or `identifier` (a code that isn't in the system at all).
// Anonymous allowed: whoever scanned it is rarely a member.
export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const duckId = String(body?.duckId || '').trim()
  const identifier = String(body?.identifier || '').trim().slice(0, 100)
  if (!duckId && !identifier) {
    throw createError({ statusCode: 400, statusMessage: 'duckId or identifier is required' })
  }

  enforceReportLimit(event, duckId || `code:${identifier}`)

  const user = event.context.user as { id: string; email?: string | null; phone?: string | null } | undefined
  const note = String(body?.note || '').trim().slice(0, 1000)
  const report = {
    note,
    contact: String(body?.contact || '').trim().slice(0, 200) || user?.email || user?.phone || '',
    ip: getRequestIP(event, { xForwardedFor: true }) || 'unknown',
  }

  let send: Promise<unknown>
  if (duckId) {
    const db = useDb()
    const [duck] = await db
      .select()
      .from(ducks)
      .where(and(eq(ducks.id, duckId), isNull(ducks.deletedAt)))
      .limit(1)
    if (!duck) throw createError({ statusCode: 404, statusMessage: 'Duck not found' })
    send = notifyDuckReport(duck, report)
  } else {
    send = notifyUnknownCodeReport(identifier, report)
  }

  // Awaited, unlike the other admin notifications: the reporter is told we heard
  // them, so that promise has to be true.
  try {
    await send
  } catch (e: any) {
    console.error('[report] notify failed:', e?.message || e)
    throw createError({ statusCode: 502, statusMessage: 'Could not send your report. Please try again.' })
  }

  return { ok: true }
})

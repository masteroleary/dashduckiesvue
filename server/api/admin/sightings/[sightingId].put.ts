import { eq } from 'drizzle-orm'
import { requireAdmin } from '../../../utils/session'
import { useDb } from '../../../db'
import { duckSightings } from '../../../db/schema'

export default defineEventHandler(async (event) => {
  requireAdmin(event)
  const id = Number.parseInt(getRouterParam(event, 'sightingId') as string, 10)
  if (!Number.isInteger(id)) throw createError({ statusCode: 400, statusMessage: 'Invalid sighting id' })
  const body = await readBody(event)
  const db = useDb()

  const set: Record<string, unknown> = {}
  if (body?.address !== undefined) set.address = String(body.address).trim() || null
  if (body?.latitude !== undefined) set.latitude = Number(body.latitude) || 0
  if (body?.longitude !== undefined) set.longitude = Number(body.longitude) || 0
  if (body?.sightingDate) {
    const d = new Date(body.sightingDate)
    if (!Number.isNaN(d.getTime())) set.sightingDate = d
  }

  if (Object.keys(set).length) {
    await db.update(duckSightings).set(set).where(eq(duckSightings.id, id))
  }
  return { message: 'Sighting updated successfully' }
})

import { eq } from 'drizzle-orm'
import { requireAdmin } from '../../../utils/session'
import { useDb } from '../../../db'
import { duckSightings } from '../../../db/schema'

// Remove a sighting outright. A hard delete, unlike ducks and members, which are
// soft-deleted: a sighting is public content on a duck's page, so when it has to
// come down it has to come down for good.
export default defineEventHandler(async (event) => {
  requireAdmin(event)
  const id = Number.parseInt(getRouterParam(event, 'sightingId') as string, 10)
  if (!Number.isInteger(id)) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid sighting id' })
  }

  const db = useDb()
  const [existing] = await db
    .select({ id: duckSightings.id })
    .from(duckSightings)
    .where(eq(duckSightings.id, id))
    .limit(1)
  if (!existing) throw createError({ statusCode: 404, statusMessage: 'Sighting not found' })

  await db.delete(duckSightings).where(eq(duckSightings.id, id))
  return { message: 'Sighting deleted' }
})

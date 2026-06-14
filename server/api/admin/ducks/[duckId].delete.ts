import { eq } from 'drizzle-orm'
import { requireAdmin } from '../../../utils/session'
import { useDb } from '../../../db'
import { ducks } from '../../../db/schema'

// Soft-delete (sets deleted_at; keeps sighting history).
export default defineEventHandler(async (event) => {
  requireAdmin(event)
  const duckId = getRouterParam(event, 'duckId') as string
  const db = useDb()
  await db.update(ducks).set({ deletedAt: new Date() }).where(eq(ducks.id, duckId))
  return { message: 'Duck deleted successfully' }
})

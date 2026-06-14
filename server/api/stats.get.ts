import { and, eq, isNull, ne, isNotNull } from 'drizzle-orm'
import { useDb } from '../db'
import { duckSightings, ducks, users } from '../db/schema'

// Homepage stats bar: ducks in the wild, sightings reported, happy duckers.
export default defineEventHandler(async () => {
  const db = useDb()
  const duckRows = await db
    .select({ id: ducks.id })
    .from(ducks)
    .where(and(isNotNull(ducks.imageUrl), ne(ducks.imageUrl, ''), isNull(ducks.deletedAt)))
  const sightingRows = await db.select({ id: duckSightings.id }).from(duckSightings)
  const userRows = await db.select({ id: users.id }).from(users).where(isNull(users.deletedAt))

  return {
    ducks: duckRows.length,
    sightings: sightingRows.length,
    duckers: userRows.length,
  }
})

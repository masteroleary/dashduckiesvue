import { and, eq, isNull, isNotNull, ne, desc } from 'drizzle-orm'
import { useDb } from '../../db'
import { duckSightings, ducks } from '../../db/schema'
import { requireUser } from '../../utils/session'

// Recent sightings with real coordinates, for the homepage live map (capped).
export default defineEventHandler(async (event) => {
  // Members-only: the map and the community are behind sign-in.
  requireUser(event)
  const db = useDb()
  return await db
    .select({
      id: duckSightings.id,
      duckId: duckSightings.duckId,
      duckName: ducks.name,
      latitude: duckSightings.latitude,
      longitude: duckSightings.longitude,
      address: duckSightings.address,
      sightingDate: duckSightings.sightingDate,
    })
    .from(duckSightings)
    .innerJoin(ducks, eq(duckSightings.duckId, ducks.id))
    .where(
      and(
        isNull(ducks.deletedAt),
        isNotNull(duckSightings.latitude),
        isNotNull(duckSightings.longitude),
        ne(duckSightings.latitude, 0),
        ne(duckSightings.longitude, 0),
      ),
    )
    .orderBy(desc(duckSightings.sightingDate))
    .limit(2000)
})

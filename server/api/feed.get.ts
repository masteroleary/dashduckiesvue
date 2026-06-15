import { and, desc, eq, isNotNull, isNull, ne } from 'drizzle-orm'
import { useDb } from '../db'
import { duckSightings, ducks } from '../db/schema'

// "Latest Activity" feed for /quackertracker: interleave recent sightings (with
// photos) and recently-registered ducks (with photos), newest first.
export default defineEventHandler(async () => {
  const db = useDb()

  const duckTiles = await db
    .select({
      duckId: ducks.id,
      duckName: ducks.name,
      imageUrl: ducks.imageUrl,
      description: ducks.description,
    })
    .from(ducks)
    .where(and(isNotNull(ducks.imageUrl), ne(ducks.imageUrl, ''), isNull(ducks.deletedAt)))
    .orderBy(desc(ducks.createdAt))
    .limit(12)

  const sightingTiles = await db
    .select({
      duckId: duckSightings.duckId,
      duckName: ducks.name,
      imageUrl: duckSightings.imageUrl,
      address: duckSightings.address,
      sightingDate: duckSightings.sightingDate,
    })
    .from(duckSightings)
    .innerJoin(ducks, eq(duckSightings.duckId, ducks.id))
    .where(and(isNotNull(duckSightings.imageUrl), ne(duckSightings.imageUrl, ''), isNull(ducks.deletedAt)))
    .orderBy(desc(duckSightings.sightingDate))
    .limit(12)

  const a = sightingTiles.map((s) => ({
    isSighting: true,
    duckId: s.duckId,
    duckName: s.duckName,
    imageUrl: s.imageUrl,
    address: s.address,
    sightingDate: s.sightingDate as Date | null,
    description: null as string | null,
  }))
  const b = duckTiles.map((d) => ({
    isSighting: false,
    duckId: d.duckId,
    duckName: d.duckName,
    imageUrl: d.imageUrl,
    address: null as string | null,
    sightingDate: null as Date | null,
    description: d.description,
  }))

  const tiles: typeof a = []
  let i = 0
  let j = 0
  while (i < a.length || j < b.length) {
    if (i < a.length) tiles.push(a[i++])
    if (j < b.length) tiles.push(b[j++])
  }
  return tiles
})

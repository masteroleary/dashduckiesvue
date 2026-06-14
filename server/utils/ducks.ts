import { and, asc, count, desc, eq, isNull, isNotNull, ne } from 'drizzle-orm'
import { useDb } from '../db'
import { duckLikes, duckSightings, ducks, users } from '../db/schema'

export async function getActiveDuckById(id: string) {
  const db = useDb()
  const [d] = await db
    .select()
    .from(ducks)
    .where(and(eq(ducks.id, id), isNull(ducks.deletedAt)))
    .limit(1)
  return d ?? null
}

export async function getActiveDuckByQtCode(qtCode: number) {
  const db = useDb()
  const [d] = await db
    .select()
    .from(ducks)
    .where(and(eq(ducks.qtCode, qtCode), isNull(ducks.deletedAt)))
    .limit(1)
  return d ?? null
}

// Sightings that have real coordinates (for maps), oldest first.
export async function getSightingsWithCoords(duckId: string) {
  const db = useDb()
  return await db
    .select({
      id: duckSightings.id,
      duckId: duckSightings.duckId,
      sightingDate: duckSightings.sightingDate,
      latitude: duckSightings.latitude,
      longitude: duckSightings.longitude,
      address: duckSightings.address,
    })
    .from(duckSightings)
    .where(
      and(
        eq(duckSightings.duckId, duckId),
        isNotNull(duckSightings.latitude),
        isNotNull(duckSightings.longitude),
        ne(duckSightings.latitude, 0),
        ne(duckSightings.longitude, 0),
      ),
    )
    .orderBy(asc(duckSightings.sightingDate))
}

// Newest-first sighting history with reporter name and a usable image.
export async function getSightingHistory(duckId: string, fallbackImageUrl: string | null) {
  const db = useDb()
  const rows = await db
    .select({
      nameFirst: users.nameFirst,
      nameLast: users.nameLast,
      sightingDate: duckSightings.sightingDate,
      address: duckSightings.address,
      imageUrl: duckSightings.imageUrl,
    })
    .from(duckSightings)
    .leftJoin(users, eq(duckSightings.userId, users.id))
    .where(eq(duckSightings.duckId, duckId))
    .orderBy(desc(duckSightings.sightingDate))

  return rows.map((r) => ({
    userName: [r.nameFirst, r.nameLast].filter(Boolean).join(' ').trim() || 'Anonymous',
    sightingDate: r.sightingDate,
    address: r.address,
    imageUrl: r.imageUrl || fallbackImageUrl || null,
  }))
}

export async function getLikeCount(duckId: string): Promise<number> {
  const db = useDb()
  const [row] = await db
    .select({ value: count() })
    .from(duckLikes)
    .where(eq(duckLikes.duckId, duckId))
  return row.value
}

export async function getSightingCount(duckId: string): Promise<number> {
  const db = useDb()
  const [row] = await db
    .select({ value: count() })
    .from(duckSightings)
    .where(eq(duckSightings.duckId, duckId))
  return row.value
}

// Public projection of a duck.
export function publicDuck(d: typeof ducks.$inferSelect) {
  return {
    id: d.id,
    qtCode: d.qtCode,
    name: d.name,
    description: d.description,
    imageUrl: d.imageUrl,
  }
}

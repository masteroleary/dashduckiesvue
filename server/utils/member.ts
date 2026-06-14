import { and, desc, eq, inArray, isNull, ne, sql } from 'drizzle-orm'
import { useDb } from '../db'
import { duckSightings, ducks, users } from '../db/schema'

// IDs of ducks whose EARLIEST sighting belongs to this user ("owns" the duck).
export async function getOwnedDuckIds(userId: string): Promise<string[]> {
  const db = useDb()
  const rows = await db.execute(sql`
    select fs.duck_id as id
    from (
      select distinct on (s.duck_id) s.duck_id, s.user_id
      from duck_sightings s
      order by s.duck_id, s.sighting_date asc
    ) fs
    join ducks d on d.id = fs.duck_id
    where d.deleted_at is null and fs.user_id = ${userId}
  `)
  return (rows as unknown as Array<{ id: string }>).map((r) => r.id)
}

export async function getMyDucks(userId: string) {
  const db = useDb()
  const ids = await getOwnedDuckIds(userId)
  if (!ids.length) return []

  const duckRows = await db.select().from(ducks).where(inArray(ducks.id, ids))
  const sightingRows = await db
    .select({
      duckId: duckSightings.duckId,
      sightingDate: duckSightings.sightingDate,
      address: duckSightings.address,
    })
    .from(duckSightings)
    .where(inArray(duckSightings.duckId, ids))
    .orderBy(desc(duckSightings.sightingDate))

  const byDuck = new Map<string, Array<{ sightingDate: Date; address: string | null }>>()
  for (const s of sightingRows) {
    if (!byDuck.has(s.duckId)) byDuck.set(s.duckId, [])
    byDuck.get(s.duckId)!.push({ sightingDate: s.sightingDate, address: s.address })
  }

  return duckRows.map((d) => ({
    id: d.id,
    name: d.name,
    description: d.description,
    imageUrl: d.imageUrl,
    qtCode: d.qtCode,
    sightings: byDuck.get(d.id) ?? [],
  }))
}

export async function getDashboardStats(userId: string) {
  const db = useDb()
  const ownedIds = await getOwnedDuckIds(userId)

  const mySightings = await db
    .select({ duckId: duckSightings.duckId })
    .from(duckSightings)
    .where(eq(duckSightings.userId, userId))
  const myDuckIds = [...new Set(mySightings.map((s) => s.duckId))]

  let totalConnections = 0
  if (myDuckIds.length) {
    const others = await db
      .select({ userId: duckSightings.userId })
      .from(duckSightings)
      .innerJoin(users, eq(duckSightings.userId, users.id))
      .where(
        and(
          inArray(duckSightings.duckId, myDuckIds),
          ne(duckSightings.userId, userId),
          isNull(users.deletedAt),
        ),
      )
    totalConnections = new Set(others.map((o) => o.userId)).size
  }

  return {
    totalDucks: ownedIds.length,
    totalSightings: mySightings.length,
    totalConnections,
  }
}

// Global recent sightings with coordinates (member dashboard map), newest first.
export async function getRecentSightings() {
  const db = useDb()
  return await db
    .select({
      id: duckSightings.id,
      duckId: duckSightings.duckId,
      duckName: ducks.name,
      sightingDate: duckSightings.sightingDate,
      latitude: duckSightings.latitude,
      longitude: duckSightings.longitude,
      address: duckSightings.address,
    })
    .from(duckSightings)
    .innerJoin(ducks, eq(duckSightings.duckId, ducks.id))
    .where(and(ne(duckSightings.latitude, 0), ne(duckSightings.longitude, 0), isNull(ducks.deletedAt)))
    .orderBy(desc(duckSightings.sightingDate))
    .limit(100)
}

// True if the user has at least one sighting on the duck (edit access).
export async function userHasSighting(userId: string, duckId: string): Promise<boolean> {
  const db = useDb()
  const [row] = await db
    .select({ id: duckSightings.id })
    .from(duckSightings)
    .where(and(eq(duckSightings.duckId, duckId), eq(duckSightings.userId, userId)))
    .limit(1)
  return Boolean(row)
}

// True if the user made the EARLIEST sighting on the duck (delete access).
export async function userOwnsDuck(userId: string, duckId: string): Promise<boolean> {
  const db = useDb()
  const [first] = await db
    .select({ userId: duckSightings.userId })
    .from(duckSightings)
    .where(eq(duckSightings.duckId, duckId))
    .orderBy(duckSightings.sightingDate)
    .limit(1)
  return Boolean(first) && first.userId === userId
}

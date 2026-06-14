import { and, count, desc, eq, inArray, isNull, sql } from 'drizzle-orm'
import { useDb } from '../db'
import { duckSightings, ducks, users } from '../db/schema'

export async function getStatistics() {
  const db = useDb()
  const [u] = await db.select({ value: count() }).from(users).where(isNull(users.deletedAt))
  const [d] = await db.select({ value: count() }).from(ducks).where(isNull(ducks.deletedAt))
  const [s] = await db.select({ value: count() }).from(duckSightings)
  const [m] = await db
    .select({ value: count() })
    .from(users)
    .where(and(isNull(users.deletedAt), eq(users.isMember, true)))
  return {
    totalUsers: u.value,
    totalDucks: d.value,
    totalSightings: s.value,
    totalMembers: m.value,
  }
}

function roleRank(isAdmin: boolean, isMember: boolean) {
  if (isAdmin) return 0
  if (isMember) return 1
  return 2
}

export async function getMembers() {
  const db = useDb()
  const us = await db.select().from(users).where(isNull(users.deletedAt))
  const counts = (await db.execute(sql`
    select user_id, count(distinct duck_id) as c
    from duck_sightings where user_id is not null group by user_id
  `)) as unknown as Array<{ user_id: string; c: number }>
  const map = new Map(counts.map((r) => [r.user_id, Number(r.c)]))

  return us
    .map((u) => ({
      id: u.id,
      userName: [u.nameFirst, u.nameLast].filter(Boolean).join(' ').trim() || '(no name)',
      email: u.email,
      phoneNumber: u.phoneNumber,
      roles: [...(u.isAdmin ? ['ADMIN'] : []), ...(u.isMember ? ['MEMBER'] : [])],
      isAdmin: u.isAdmin,
      isMember: u.isMember,
      duckCount: map.get(u.id) || 0,
      lastLogin: u.lastLoginAt,
    }))
    .sort(
      (a, b) =>
        roleRank(a.isAdmin, a.isMember) - roleRank(b.isAdmin, b.isMember) ||
        (a.email || '').localeCompare(b.email || ''),
    )
}

export async function getMemberDetail(userId: string) {
  const db = useDb()
  const [u] = await db.select().from(users).where(eq(users.id, userId)).limit(1)
  if (!u) return null
  const recent = await db
    .select({
      id: duckSightings.id,
      duckId: duckSightings.duckId,
      duckName: ducks.name,
      sightingDate: duckSightings.sightingDate,
      address: duckSightings.address,
    })
    .from(duckSightings)
    .leftJoin(ducks, eq(duckSightings.duckId, ducks.id))
    .where(eq(duckSightings.userId, userId))
    .orderBy(desc(duckSightings.sightingDate))
    .limit(10)
  return {
    id: u.id,
    userName: [u.nameFirst, u.nameLast].filter(Boolean).join(' ').trim() || '(no name)',
    email: u.email,
    phoneNumber: u.phoneNumber,
    isAdmin: u.isAdmin,
    isMember: u.isMember,
    roles: [...(u.isAdmin ? ['ADMIN'] : []), ...(u.isMember ? ['MEMBER'] : [])],
    recentSightings: recent,
  }
}

// Soft-delete a user, plus any duck whose every sighting is from this user or
// already-deleted users (no other active user has sighted it).
export async function deleteMember(userId: string) {
  const db = useDb()
  const result = (await db.execute(sql`
    update ducks set deleted_at = now()
    where deleted_at is null and id in (
      select s.duck_id from duck_sightings s where s.user_id = ${userId}
      except
      select s2.duck_id from duck_sightings s2
        join users u on u.id = s2.user_id
      where s2.user_id <> ${userId} and u.deleted_at is null
    )
    returning id
  `)) as unknown as Array<{ id: string }>
  await db.update(users).set({ deletedAt: new Date() }).where(eq(users.id, userId))
  return { deletedDucks: result.length }
}

export async function getAdminDucks() {
  const db = useDb()
  const rows = await db
    .select()
    .from(ducks)
    .where(isNull(ducks.deletedAt))
    .orderBy(desc(ducks.qtCode))
    .limit(100)
  const counts = (await db.execute(sql`
    select duck_id, count(*) as c, max(sighting_date) as last
    from duck_sightings group by duck_id
  `)) as unknown as Array<{ duck_id: string; c: number; last: string }>
  const map = new Map(counts.map((r) => [r.duck_id, { c: Number(r.c), last: r.last }]))
  return rows.map((d) => ({
    id: d.id,
    name: d.name,
    description: d.description,
    imageUrl: d.imageUrl,
    qtCode: d.qtCode,
    registrationType: d.registrationType,
    sightingsCount: map.get(d.id)?.c || 0,
    lastSighting: map.get(d.id)?.last || null,
    createdAt: d.createdAt,
  }))
}

export async function getAdminDuckDetail(duckId: string) {
  const db = useDb()
  const [duck] = await db.select().from(ducks).where(eq(ducks.id, duckId)).limit(1)
  if (!duck) return null
  const sightings = await db
    .select({
      id: duckSightings.id,
      sightingDate: duckSightings.sightingDate,
      address: duckSightings.address,
      latitude: duckSightings.latitude,
      longitude: duckSightings.longitude,
      imageUrl: duckSightings.imageUrl,
      userId: duckSightings.userId,
    })
    .from(duckSightings)
    .where(eq(duckSightings.duckId, duckId))
    .orderBy(desc(duckSightings.sightingDate))
  return {
    id: duck.id,
    name: duck.name,
    description: duck.description,
    imageUrl: duck.imageUrl,
    qtCode: duck.qtCode,
    registrationType: duck.registrationType,
    createdAt: duck.createdAt,
    sightings,
  }
}

export async function bulkCreateDucks(
  items: Array<{ qtCode: number; name?: string; description?: string; imageUrl?: string }>,
) {
  const db = useDb()
  const valid = items.filter((i) => Number.isInteger(i.qtCode) && i.qtCode > 0).slice(0, 100)
  const qtCodes = valid.map((i) => i.qtCode)
  if (!qtCodes.length) return { created: 0, skipped: 0, skippedQTCodes: [] as number[] }

  const existing = await db
    .select({ qtCode: ducks.qtCode })
    .from(ducks)
    .where(inArray(ducks.qtCode, qtCodes))
  const existingSet = new Set(existing.map((e) => e.qtCode))

  const toCreate = valid.filter((i) => !existingSet.has(i.qtCode))
  if (toCreate.length) {
    await db.insert(ducks).values(
      toCreate.map((i) => ({
        qtCode: i.qtCode,
        name: i.name?.trim() || `Duck ${String(i.qtCode).padStart(6, '0')}`,
        description: i.description?.trim() || null,
        imageUrl: i.imageUrl?.trim() || null,
        registrationType: 'StickerValid' as const,
      })),
    )
  }
  return {
    created: toCreate.length,
    skipped: valid.length - toCreate.length,
    skippedQTCodes: valid.filter((i) => existingSet.has(i.qtCode)).map((i) => i.qtCode),
  }
}

import { and, desc, eq, isNull } from 'drizzle-orm'
import { requireUser } from '../../utils/session'
import { userHasSighting } from '../../utils/member'
import { geocodeAddress } from '../../utils/geocode'
import { useDb } from '../../db'
import { duckSightings, ducks } from '../../db/schema'

// Update a duck you've sighted: name/description, and (if the location changed)
// log a new sighting at the new address with geocoded coordinates.
// NOTE: image replacement is handled in Phase 6 (upload pipeline).
export default defineEventHandler(async (event) => {
  const user = requireUser(event)
  const id = getRouterParam(event, 'id') as string
  const body = await readBody(event)
  const db = useDb()

  const [duck] = await db
    .select()
    .from(ducks)
    .where(and(eq(ducks.id, id), isNull(ducks.deletedAt)))
    .limit(1)
  if (!duck || !(await userHasSighting(user.id, id))) {
    throw createError({ statusCode: 404, statusMessage: 'Duck not found' })
  }

  const name = String(body?.name ?? duck.name ?? '').trim()
  const description = body?.description != null ? String(body.description).trim() : duck.description
  await db.update(ducks).set({ name, description }).where(eq(ducks.id, id))

  const address = body?.address != null ? String(body.address).trim() : null
  if (address) {
    const [latest] = await db
      .select({ address: duckSightings.address })
      .from(duckSightings)
      .where(eq(duckSightings.duckId, id))
      .orderBy(desc(duckSightings.sightingDate))
      .limit(1)
    if (!latest || latest.address !== address) {
      const { lat, lng } = await geocodeAddress(address)
      await db.insert(duckSightings).values({
        duckId: id,
        userId: user.id,
        address,
        latitude: lat,
        longitude: lng,
      })
    }
  }

  return { ok: true }
})

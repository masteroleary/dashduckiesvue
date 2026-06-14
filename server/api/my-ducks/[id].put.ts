import { and, desc, eq, isNull } from 'drizzle-orm'
import { requireUser } from '../../utils/session'
import { userHasSighting } from '../../utils/member'
import { geocodeAddress } from '../../utils/geocode'
import { processAndUpload } from '../../utils/images'
import { readMultipart, validateImage } from '../../utils/upload'
import { useDb } from '../../db'
import { duckSightings, ducks } from '../../db/schema'

// Update a duck you've sighted: name/description, optional new photo, and (if the
// location changed) a new geocoded sighting.
export default defineEventHandler(async (event) => {
  const user = requireUser(event)
  const id = getRouterParam(event, 'id') as string
  const { fields, file } = await readMultipart(event)
  validateImage(file)
  const db = useDb()

  const [duck] = await db
    .select()
    .from(ducks)
    .where(and(eq(ducks.id, id), isNull(ducks.deletedAt)))
    .limit(1)
  if (!duck || !(await userHasSighting(user.id, id))) {
    throw createError({ statusCode: 404, statusMessage: 'Duck not found' })
  }

  const set: Record<string, unknown> = {
    name: (fields.name ?? duck.name ?? '').trim(),
    description: fields.description != null ? fields.description.trim() || null : duck.description,
  }
  if (file) {
    const r = await processAndUpload(file.data as Buffer, 'duck-images', String(duck.qtCode))
    set.imageUrl = r.url
  }
  await db.update(ducks).set(set).where(eq(ducks.id, id))

  const address = fields.address != null ? fields.address.trim() : null
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

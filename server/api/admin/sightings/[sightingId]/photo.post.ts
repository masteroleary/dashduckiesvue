import { eq } from 'drizzle-orm'
import { requireAdmin } from '../../../../utils/session'
import { useDb } from '../../../../db'
import { duckSightings } from '../../../../db/schema'
import { processAndUpload } from '../../../../utils/images'
import { readMultipart, validateImage } from '../../../../utils/upload'

/**
 * Replace or remove a sighting's photo.
 *
 * Send a file to replace it, or the field `remove=true` to clear it. Removal is
 * the point of this endpoint existing: until now there was no way to take down
 * a photo someone had posted to a duck's public page.
 */
export default defineEventHandler(async (event) => {
  requireAdmin(event)
  const id = Number.parseInt(getRouterParam(event, 'sightingId') as string, 10)
  if (!Number.isInteger(id)) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid sighting id' })
  }

  const db = useDb()
  const [sighting] = await db
    .select({ id: duckSightings.id, duckId: duckSightings.duckId })
    .from(duckSightings)
    .where(eq(duckSightings.id, id))
    .limit(1)
  if (!sighting) throw createError({ statusCode: 404, statusMessage: 'Sighting not found' })

  const { fields, file } = await readMultipart(event)

  if (String(fields.remove || '') === 'true') {
    await db.update(duckSightings).set({ imageUrl: null }).where(eq(duckSightings.id, id))
    return { message: 'Photo removed', imageUrl: null }
  }

  validateImage(file)
  if (!file?.data) throw createError({ statusCode: 400, statusMessage: 'No photo provided' })

  // Re-encoding here also strips the original EXIF, including any GPS the
  // camera embedded — same as the public upload path.
  const r = await processAndUpload(file.data, 'sighting-images', String(sighting.duckId))
  await db.update(duckSightings).set({ imageUrl: r.url }).where(eq(duckSightings.id, id))
  return { message: 'Photo replaced', imageUrl: r.url }
})

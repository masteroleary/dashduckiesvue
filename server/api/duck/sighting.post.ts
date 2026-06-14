import { and, eq, isNull } from 'drizzle-orm'
import { useDb } from '../../db'
import { duckSightings, ducks } from '../../db/schema'
import { processAndUpload } from '../../utils/images'
import { geocodeAddress } from '../../utils/geocode'
import { enforceDuckSubmissionLimit } from '../../utils/rateLimit'

// Post a sighting for an existing duck. Anonymous allowed.
export default defineEventHandler(async (event) => {
  enforceDuckSubmissionLimit(event)

  const parts = (await readMultipartFormData(event)) || []
  const fields: Record<string, string> = {}
  let imageBuf: Buffer | null = null
  for (const p of parts) {
    if (p.filename) imageBuf = p.data as Buffer
    else if (p.name) fields[p.name] = p.data.toString('utf-8')
  }

  const duckId = (fields.duckId || '').trim()
  const address = (fields.address || '').trim()
  if (!duckId || !address) {
    throw createError({ statusCode: 400, statusMessage: 'duckId and address are required' })
  }

  const db = useDb()
  const [duck] = await db
    .select()
    .from(ducks)
    .where(and(eq(ducks.id, duckId), isNull(ducks.deletedAt)))
    .limit(1)
  if (!duck) throw createError({ statusCode: 404, statusMessage: 'Duck not found' })

  const user = event.context.user as { id: string } | undefined
  const claimToken = user ? null : globalThis.crypto.randomUUID()

  // Insert first so we have the sighting id for the image path.
  const [sighting] = await db
    .insert(duckSightings)
    .values({
      duckId: duck.id,
      userId: user?.id ?? null,
      claimToken,
      address,
      latitude: 0,
      longitude: 0,
    })
    .returning()

  let imageUrl: string | null = null
  let gps: { lat: number; lng: number } | null = null
  if (imageBuf) {
    const r = await processAndUpload(imageBuf, 'sighting-images', `${duck.qtCode}/${sighting.id}`)
    imageUrl = r.url
    gps = r.gps
  }
  const coords = gps ?? (await geocodeAddress(address))

  await db
    .update(duckSightings)
    .set({ latitude: coords.lat, longitude: coords.lng, imageUrl })
    .where(eq(duckSightings.id, sighting.id))

  // Give the duck a photo if it doesn't have one yet.
  if (!duck.imageUrl && imageUrl) {
    await db.update(ducks).set({ imageUrl }).where(eq(ducks.id, duck.id))
  }

  return { sightingId: sighting.id, claimToken }
})

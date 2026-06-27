import { and, desc, eq, isNull } from 'drizzle-orm'
import { requireUser } from '../../utils/session'
import { userHasSighting } from '../../utils/member'
import { geocodeAddress, reverseGeocode } from '../../utils/geocode'
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

  // Location: prefer explicit pin coordinates (from the map picker); otherwise
  // fall back to geocoding a typed address. A new sighting is logged only if the
  // location actually changed.
  let address = fields.address != null ? fields.address.trim() : null
  const latRaw = fields.lat != null && fields.lat !== '' ? Number(fields.lat) : null
  const lngRaw = fields.lng != null && fields.lng !== '' ? Number(fields.lng) : null
  const hasCoords =
    latRaw != null && lngRaw != null && Number.isFinite(latRaw) && Number.isFinite(lngRaw)

  if (hasCoords || address) {
    const [latest] = await db
      .select({
        address: duckSightings.address,
        latitude: duckSightings.latitude,
        longitude: duckSightings.longitude,
      })
      .from(duckSightings)
      .where(eq(duckSightings.duckId, id))
      .orderBy(desc(duckSightings.sightingDate))
      .limit(1)

    let lat = 0
    let lng = 0
    if (hasCoords) {
      lat = latRaw as number
      lng = lngRaw as number
      if (!address) address = (await reverseGeocode(lat, lng)) || null
    } else if (address) {
      const g = await geocodeAddress(address)
      lat = g.lat
      lng = g.lng
    }

    const movedCoords =
      hasCoords &&
      (latest?.latitude == null ||
        latest?.longitude == null ||
        Math.abs(latest.latitude - lat) > 1e-5 ||
        Math.abs(latest.longitude - lng) > 1e-5)
    // Save when the pin moved OR the address text was edited (e.g. trimming the
    // street) — in the coords case we keep the pin's exact lat/lng either way.
    const addressChanged = address != null && latest?.address !== address

    if (movedCoords || addressChanged) {
      // If only the address changed (pin unchanged), reuse the existing coords.
      if (!hasCoords && !movedCoords && latest?.latitude != null && latest?.longitude != null) {
        lat = latest.latitude
        lng = latest.longitude
      }
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

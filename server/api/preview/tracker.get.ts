import { and, count, desc, eq, isNotNull, isNull, ne } from 'drizzle-orm'
import { useDb } from '../../db'
import { duckSightings, ducks } from '../../db/schema'

/**
 * Public teaser for the signed-out Quacker Tracker page.
 *
 * This endpoint is open on purpose, so what it returns is chosen carefully:
 *
 *  - Duck names, stories and photos are already public — a duck's own page is
 *    open to whoever scans its code — so a handful of them give away nothing new.
 *  - Sighting COORDINATES are the members-only part. Pins here are rounded to
 *    one decimal place (~11 km) and stripped of every label, so the preview map
 *    shows a believable spread of activity without pinpointing where any
 *    particular duck actually is. There is no duck id on a pin, so pins can't be
 *    matched back to a duck either.
 *  - No addresses, no dates, no ids.
 */
const PREVIEW_DUCKS = 6
const PREVIEW_PINS = 60
const STORY_CHARS = 150

// ~11 km of slack — enough for a global map to look right, far too coarse to
// point at a bench, a shop, or a house.
const blur = (n: number) => Math.round(n * 10) / 10

export default defineEventHandler(async () => {
  const db = useDb()

  const recentDucks = await db
    .select({
      name: ducks.name,
      description: ducks.description,
      imageUrl: ducks.imageUrl,
      qtCode: ducks.qtCode,
    })
    .from(ducks)
    .where(and(isNotNull(ducks.imageUrl), ne(ducks.imageUrl, ''), isNull(ducks.deletedAt)))
    .orderBy(desc(ducks.createdAt))
    .limit(PREVIEW_DUCKS)

  const coords = await db
    .select({ latitude: duckSightings.latitude, longitude: duckSightings.longitude })
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
    .limit(600)

  // Round first, then de-duplicate: two sightings from the same neighbourhood
  // collapse into one pin, so the preview can't be used to count activity in a
  // place either.
  const seen = new Set<string>()
  const pins: Array<{ latitude: number; longitude: number }> = []
  for (const c of coords) {
    const latitude = blur(Number(c.latitude))
    const longitude = blur(Number(c.longitude))
    const key = `${latitude},${longitude}`
    if (seen.has(key)) continue
    seen.add(key)
    pins.push({ latitude, longitude })
    if (pins.length >= PREVIEW_PINS) break
  }

  const [duckCount] = await db
    .select({ value: count() })
    .from(ducks)
    .where(and(isNotNull(ducks.imageUrl), ne(ducks.imageUrl, ''), isNull(ducks.deletedAt)))
  const [sightingCount] = await db.select({ value: count() }).from(duckSightings)

  return {
    ducks: recentDucks.map((d) => ({
      name: d.name || `Duck ${d.qtCode}`,
      story:
        d.description && d.description.length > STORY_CHARS
          ? `${d.description.slice(0, STORY_CHARS).trimEnd()}…`
          : d.description,
      imageUrl: d.imageUrl,
    })),
    pins,
    counts: { ducks: duckCount.value, sightings: sightingCount.value },
  }
})

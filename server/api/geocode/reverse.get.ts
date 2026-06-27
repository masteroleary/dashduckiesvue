import { requireUser } from '../../utils/session'
import { reverseGeocode } from '../../utils/geocode'

// Reverse-geocode a pin's coordinates to an address (used by the map picker).
// Auth-gated since it consumes the HERE quota.
export default defineEventHandler(async (event) => {
  requireUser(event)
  const q = getQuery(event)
  const lat = Number(q.lat)
  const lng = Number(q.lng)
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
    throw createError({ statusCode: 400, statusMessage: 'lat and lng are required' })
  }
  return { address: await reverseGeocode(lat, lng) }
})

// Geocode an address string to coordinates via the HERE Geocoding API.
// Returns { lat: 0, lng: 0 } on any failure (matching the old app's fallback).
export async function geocodeAddress(address: string): Promise<{ lat: number; lng: number }> {
  const key = process.env.HERE_API_KEY
  if (!key || !address?.trim()) return { lat: 0, lng: 0 }
  try {
    const res = await $fetch<{ items?: Array<{ position?: { lat: number; lng: number } }> }>(
      'https://geocode.search.hereapi.com/v1/geocode',
      { query: { q: address, apiKey: key, limit: 1 } },
    )
    const pos = res?.items?.[0]?.position
    if (pos && typeof pos.lat === 'number' && typeof pos.lng === 'number') {
      return { lat: pos.lat, lng: pos.lng }
    }
  } catch {
    /* ignore — fall through to 0,0 */
  }
  return { lat: 0, lng: 0 }
}

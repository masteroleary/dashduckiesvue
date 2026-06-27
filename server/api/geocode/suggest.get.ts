import { requireUser } from '../../utils/session'

interface HereItem {
  address?: {
    label?: string
    city?: string
    state?: string
    stateCode?: string
  }
  position?: { lat: number; lng: number }
}

// Derive "City, ST" from a full HERE label like
// "Central Park, New York, NY 10024, United States" when the structured city/
// state fields aren't present in the autosuggest result.
function cityStateFromLabel(label: string): string | null {
  let parts = label
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)
  if (parts.length && /^(United States|USA|US)$/i.test(parts[parts.length - 1])) {
    parts = parts.slice(0, -1)
  }
  if (parts.length < 2) return null
  const stateMatch = parts[parts.length - 1].match(/^([A-Z]{2})\b/)
  if (!stateMatch) return null
  return `${parts[parts.length - 2]}, ${stateMatch[1]}`
}

// Address typeahead via HERE Autosuggest. For each result we return up to two
// options: the full street address and a "City, ST" shortcut (deduped).
export default defineEventHandler(async (event) => {
  requireUser(event)
  const q = getQuery(event)
  const query = String(q.q || '').trim()
  if (query.length < 3) return { suggestions: [] }

  const key = process.env.HERE_API_KEY
  if (!key) return { suggestions: [] }

  const lat = Number(q.lat)
  const lng = Number(q.lng)
  const at = Number.isFinite(lat) && Number.isFinite(lng) ? `${lat},${lng}` : '39.5,-98.35'

  try {
    const res = await $fetch<{ items?: HereItem[] }>(
      'https://autosuggest.search.hereapi.com/v1/autosuggest',
      { query: { q: query, at, apiKey: key, limit: 5 } },
    )
    const out: Array<{ address: string; lat: number; lng: number; kind: 'street' | 'city' }> = []
    const seenCity = new Set<string>()
    for (const it of res.items || []) {
      const a = it.address
      const pos = it.position
      if (!a || !pos) continue
      if (a.label) {
        out.push({ address: a.label, lat: pos.lat, lng: pos.lng, kind: 'street' })
      }
      const region = a.stateCode || a.state
      const cs = a.city && region ? `${a.city}, ${region}` : a.label ? cityStateFromLabel(a.label) : null
      if (cs && !seenCity.has(cs.toLowerCase())) {
        seenCity.add(cs.toLowerCase())
        out.push({ address: cs, lat: pos.lat, lng: pos.lng, kind: 'city' })
      }
    }
    return { suggestions: out.slice(0, 8) }
  } catch {
    return { suggestions: [] }
  }
})

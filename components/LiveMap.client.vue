<script setup lang="ts">
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

interface MapSighting {
  duckId?: string
  latitude: number
  longitude: number
  duckName?: string | null
  address?: string | null
}

const props = withDefaults(
  defineProps<{
    sightings: MapSighting[]
    height?: string
    highlightId?: string | null
    boundaries?: boolean
    tileUrl?: string
    tileAttribution?: string
    markerColors?: Record<string, string>
  }>(),
  { height: '440px', highlightId: null, boundaries: false, tileUrl: '', tileAttribution: '', markerColors: () => ({}) },
)

const el = ref<HTMLDivElement | null>(null)
let map: L.Map | null = null
let resizeObserver: ResizeObserver | null = null
// Markers kept by duck so the activity feed can highlight one on hover.
const markerEntries: { duckId?: string; marker: L.Marker }[] = []

// Enlarge the marker(s) for the hovered duck (see .dd-duck-marker.is-hi below).
function applyHighlight(id: string | null | undefined) {
  for (const { duckId, marker } of markerEntries) {
    const on = id != null && duckId === id
    marker.getElement()?.classList.toggle('is-hi', on)
    marker.setZIndexOffset(on ? 1000 : 0)
  }
}
watch(() => props.highlightId, applyHighlight)

onMounted(async () => {
  // Wait one tick so the template ref is attached. When this client-only
  // component is mounted inside <ClientOnly>, onMounted can fire before `el`
  // is bound — without this the map silently never initializes (blank box).
  await nextTick()
  if (!el.value) return
  map = L.map(el.value, { scrollWheelZoom: false }).setView([39.5, -98.35], 4)
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; OpenStreetMap contributors',
    maxZoom: 19,
  }).addTo(map)

  // Optional crisp US state boundaries — used by the boho tracker map so state
  // lines stay readable over the warm, faded tile wash. Drawn as vectors so
  // their color is independent of the tile filter (US-only, where the ducks are).
  if (props.boundaries) {
    // Colour only the states a duck has been sighted in, using exactly five
    // pastels — orange, yellow, green, purple, pink — and a greedy graph
    // colouring so that no two *touching* visited states share a colour. Every
    // other state stays neutral with a faint outline.
    const COLORS = ['#FBBF7A', '#FBE98D', '#B7E1A1', '#D2B4EB', '#F7BBD6'] // orange, yellow, green, purple, pink

    const pts = props.sightings
      .filter((s) => s.latitude != null && s.longitude != null)
      .map((s) => [s.longitude as number, s.latitude as number] as [number, number])

    const ringsOf = (geom: any): number[][][] =>
      geom.type === 'MultiPolygon' ? geom.coordinates.flat() : geom.type === 'Polygon' ? geom.coordinates : []
    const inRing = (x: number, y: number, ring: number[][]) => {
      let inside = false
      for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
        const xi = ring[i][0], yi = ring[i][1], xj = ring[j][0], yj = ring[j][1]
        if ((yi > y) !== (yj > y) && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) inside = !inside
      }
      return inside
    }
    const contains = (geom: any, x: number, y: number) => {
      const polys = geom.type === 'MultiPolygon' ? geom.coordinates : [geom.coordinates]
      for (const poly of polys) {
        let inside = false
        for (const ring of poly) if (inRing(x, y, ring)) inside = !inside
        if (inside) return true
      }
      return false
    }
    const isVisited = (f: any) => pts.some(([x, y]) => contains(f.geometry, x, y))

    // --- adjacency (do two states share a border?) ---
    const bboxOf = (geom: any) => {
      let a = Infinity, b = Infinity, c = -Infinity, d = -Infinity
      for (const ring of ringsOf(geom)) for (const [x, y] of ring) {
        if (x < a) a = x
        if (y < b) b = y
        if (x > c) c = x
        if (y > d) d = y
      }
      return [a, b, c, d]
    }
    const segDist = (px: number, py: number, ax: number, ay: number, bx: number, by: number) => {
      const dx = bx - ax, dy = by - ay, l2 = dx * dx + dy * dy
      let t = l2 ? ((px - ax) * dx + (py - ay) * dy) / l2 : 0
      t = t < 0 ? 0 : t > 1 ? 1 : t
      return Math.hypot(px - (ax + t * dx), py - (ay + t * dy))
    }
    const THR = 0.06 // ~6km: shared borders read as ~0, gaps are far larger
    const touch = (fa: any, fb: any, ba: number[], bb: number[]) => {
      if (ba[0] - THR > bb[2] || bb[0] - THR > ba[2] || ba[1] - THR > bb[3] || bb[1] - THR > ba[3]) return false
      const rb = ringsOf(fb.geometry)
      for (const ring of ringsOf(fa.geometry)) for (const [px, py] of ring)
        for (const rr of rb) for (let i = 0; i < rr.length - 1; i++)
          if (segDist(px, py, rr[i][0], rr[i][1], rr[i + 1][0], rr[i + 1][1]) < THR) return true
      return false
    }
    const keyOf = (f: any) => String(f?.id ?? f?.properties?.name ?? '')
    const hashOf = (k: string) => {
      let h = 0
      for (let i = 0; i < k.length; i++) h = (h * 31 + k.charCodeAt(i)) >>> 0
      return h
    }

    fetch('https://cdn.jsdelivr.net/gh/PublicaMundi/MappingAPI@master/data/geojson/us-states.json')
      .then((r) => r.json())
      .then((geo) => {
        if (!map) return
        const visited: any[] = geo.features.filter(isVisited)
        const bbox = new Map<string, number[]>(visited.map((f) => [keyOf(f), bboxOf(f.geometry)]))
        const adj = new Map<string, Set<string>>()
        for (let i = 0; i < visited.length; i++) {
          for (let j = i + 1; j < visited.length; j++) {
            const ki = keyOf(visited[i]), kj = keyOf(visited[j])
            if (touch(visited[i], visited[j], bbox.get(ki)!, bbox.get(kj)!)) {
              if (!adj.has(ki)) adj.set(ki, new Set())
              if (!adj.has(kj)) adj.set(kj, new Set())
              adj.get(ki)!.add(kj)
              adj.get(kj)!.add(ki)
            }
          }
        }
        // colour the most-constrained states first; pick from the colours not
        // already used by a neighbour so touching states never match
        const order = [...visited].sort((a, b) => (adj.get(keyOf(b))?.size || 0) - (adj.get(keyOf(a))?.size || 0))
        const colorOf = new Map<string, string>()
        for (const f of order) {
          const k = keyOf(f)
          const used = new Set([...(adj.get(k) || [])].map((n) => colorOf.get(n)).filter(Boolean))
          const pool = COLORS.filter((c) => !used.has(c))
          const choices = pool.length ? pool : COLORS
          colorOf.set(k, choices[hashOf(k) % choices.length])
        }
        L.geoJSON(geo, {
          interactive: false,
          style: (feature: any) => {
            const c = colorOf.get(keyOf(feature))
            return c
              ? { fillColor: c, fillOpacity: 0.82, color: '#ffffff', weight: 1.5, opacity: 1 }
              : { fill: false, color: 'rgba(120,120,135,0.22)', weight: 0.8, opacity: 1 }
          },
        }).addTo(map)
      })
      .catch(() => {})
  }

  const DUCK_PATH = 'M17.406,25.591c0,0 2.059,0.83 1.986,2.891c-0.072,2.062 -6.66,2.957 -6.66,11.094c0,8.137 9.096,14.532 19.217,14.532c10.12,0 23.872,-5.932 23.872,-17.83c0,-19.976 -1.513,-6.134 -17.276,-6.134c-5.235,0 -6.169,-1.787 -5.342,-2.806c3.91,-4.811 5.342,-17.446 -7.42,-17.446c-8.327,0.173 -10.338,6.946 -10.325,8.587c0.008,1.153 -1.204,1.543 -7.308,1.308c-1.536,5.619 9.256,5.804 9.256,5.804Zm3.77,-10.366c1.104,0 2,0.897 2,2c0,1.104 -0.896,2 -2,2c-1.103,0 -2,-0.896 -2,-2c0,-1.103 0.897,-2 2,-2Z'
  // Each duck's pin is filled with its own colour (matches its profile card);
  // pages that don't pass markerColors get the default rubber-duck yellow.
  const duckIcon = (fill: string, stroke: string) =>
    L.divIcon({
      html:
        '<div class="dd-duck-pin"><svg viewBox="0 0 64 64" width="26" height="26" xmlns="http://www.w3.org/2000/svg">' +
        '<g transform="translate(64,0) scale(-1,1)">' +
        `<path fill="${fill}" stroke="${stroke}" stroke-width="1.4" fill-rule="evenodd" d="${DUCK_PATH}"/>` +
        '</g></svg></div>',
      className: 'dd-duck-marker',
      iconSize: [26, 26],
      iconAnchor: [13, 13],
    })

  const points: L.LatLngExpression[] = []
  for (const s of props.sightings) {
    if (s.latitude == null || s.longitude == null) continue
    const custom = s.duckId ? props.markerColors[s.duckId] : undefined
    const marker = L.marker([s.latitude, s.longitude], {
      icon: duckIcon(custom || '#FFDE59', custom ? 'rgba(0,0,0,0.42)' : '#C99A2E'),
    }).addTo(map)
    if (s.duckName || s.address) {
      marker.bindPopup(`<strong>${s.duckName ?? 'Duck'}</strong><br>${s.address ?? ''}`)
    }
    markerEntries.push({ duckId: s.duckId, marker })
    points.push([s.latitude, s.longitude])
  }
  if (points.length) {
    map.fitBounds(L.latLngBounds(points as L.LatLngTuple[]).pad(0.2))
  }
  applyHighlight(props.highlightId)

  // Leaflet measures the container once at init and caches that size. If the
  // layout isn't settled yet (fonts/CSS still loading, hydration, or a briefly
  // zero-height parent), it caches a wrong size and the tiles never paint —
  // the "map is blank sometimes" bug. Re-measure after the first paint, and
  // again whenever the box actually changes size.
  const refresh = () => map?.invalidateSize()
  nextTick(() => requestAnimationFrame(refresh))

  if (typeof ResizeObserver !== 'undefined') {
    resizeObserver = new ResizeObserver(refresh)
    resizeObserver.observe(el.value)
  }
})

onBeforeUnmount(() => {
  resizeObserver?.disconnect()
  resizeObserver = null
  map?.remove()
  map = null
})
</script>

<template>
  <div
    ref="el"
    :style="{ height: props.height, width: '100%', borderRadius: '12px', overflow: 'hidden', zIndex: 0 }"
  />
</template>

<!-- Unscoped: Leaflet builds the marker DOM in JS, so scoped styles wouldn't reach it. -->
<style>
.dd-duck-pin {
  line-height: 0;
  transform-origin: center;
  transition: transform 0.2s cubic-bezier(0.34, 1.56, 0.64, 1);
  filter: drop-shadow(0 2px 3px rgba(0, 0, 0, 0.28));
}
.dd-duck-pin svg { display: block; }
.dd-duck-marker.is-hi { z-index: 1000; }
.dd-duck-marker.is-hi .dd-duck-pin {
  transform: scale(1.9);
  filter: drop-shadow(0 4px 6px rgba(0, 0, 0, 0.35));
}
@media (prefers-reduced-motion: reduce) {
  .dd-duck-pin { transition: none; }
}
</style>

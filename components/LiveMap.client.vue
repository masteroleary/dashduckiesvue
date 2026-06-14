<script setup lang="ts">
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

interface MapSighting {
  latitude: number
  longitude: number
  duckName?: string | null
  address?: string | null
}

const props = withDefaults(
  defineProps<{ sightings: MapSighting[]; height?: string }>(),
  { height: '440px' },
)

const el = ref<HTMLDivElement | null>(null)
let map: L.Map | null = null

onMounted(() => {
  if (!el.value) return
  map = L.map(el.value, { scrollWheelZoom: false }).setView([39.5, -98.35], 4)
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; OpenStreetMap contributors',
    maxZoom: 19,
  }).addTo(map)

  const icon = L.divIcon({
    html: '<div style="font-size:22px;line-height:22px;transform:scaleX(-1)">🦆</div>',
    className: 'dd-duck-marker',
    iconSize: [22, 22],
    iconAnchor: [11, 11],
  })

  const points: L.LatLngExpression[] = []
  for (const s of props.sightings) {
    if (s.latitude == null || s.longitude == null) continue
    const marker = L.marker([s.latitude, s.longitude], { icon }).addTo(map)
    if (s.duckName || s.address) {
      marker.bindPopup(`<strong>${s.duckName ?? 'Duck'}</strong><br>${s.address ?? ''}`)
    }
    points.push([s.latitude, s.longitude])
  }
  if (points.length) {
    map.fitBounds(L.latLngBounds(points as L.LatLngTuple[]).pad(0.2))
  }
})

onBeforeUnmount(() => {
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

<script setup lang="ts">
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

// A drag-to-set location picker: the map pans under a fixed center pin, and the
// pin's coordinate (= map center) is emitted whenever the map stops moving.
const props = withDefaults(
  defineProps<{
    lat?: number | null
    lng?: number | null
    zoom?: number
    height?: string
  }>(),
  { lat: null, lng: null, zoom: 14, height: '260px' },
)

const emit = defineEmits<{ (e: 'change', coords: { lat: number; lng: number }): void }>()

const el = ref<HTMLDivElement | null>(null)
let map: L.Map | null = null
// When we recenter programmatically (e.g. after picking an address), skip the
// resulting moveend emit so the parent doesn't reverse-geocode over the choice.
let suppressNext = false

const hasStart = props.lat != null && props.lng != null
const startLat = props.lat ?? 39.5
const startLng = props.lng ?? -98.35
const startZoom = hasStart ? props.zoom : 4

onMounted(() => {
  if (!el.value) return
  map = L.map(el.value, { zoomControl: true }).setView([startLat, startLng], startZoom)
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; OpenStreetMap contributors',
    maxZoom: 19,
  }).addTo(map)

  map.on('moveend', () => {
    if (!map) return
    if (suppressNext) {
      suppressNext = false
      return
    }
    const c = map.getCenter()
    emit('change', { lat: Number(c.lat.toFixed(6)), lng: Number(c.lng.toFixed(6)) })
  })

  // The map often mounts inside an animating dialog at 0 size — recalc once it settles.
  setTimeout(() => map?.invalidateSize(), 150)
  setTimeout(() => map?.invalidateSize(), 450)
})

onBeforeUnmount(() => {
  map?.remove()
  map = null
})

// Let the parent recenter the map (e.g. after picking an address suggestion)
// without triggering a reverse-geocode of the new center.
function recenter(lat: number, lng: number, zoom = 15) {
  suppressNext = true
  map?.setView([lat, lng], zoom)
}
defineExpose({ recenter })
</script>

<template>
  <div class="mp-wrap" :style="{ height: props.height }">
    <div ref="el" class="mp-map" />
    <div class="mp-pin" aria-hidden="true">
      <svg width="34" height="46" viewBox="0 0 24 32" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path
          d="M12 0C5.7 0 0.5 5.1 0.5 11.5 0.5 20 12 32 12 32S23.5 20 23.5 11.5C23.5 5.1 18.3 0 12 0Z"
          fill="#c0524a"
          stroke="#0c0b0a"
          stroke-width="1.5"
        />
        <circle cx="12" cy="11.5" r="4" fill="#0c0b0a" />
      </svg>
    </div>
    <div class="mp-hint">Drag the map to position the pin</div>
  </div>
</template>

<style scoped>
.mp-wrap {
  position: relative;
  width: 100%;
  border-radius: 12px;
  overflow: hidden;
  border: 1px solid rgba(212, 175, 55, 0.25);
}
.mp-map {
  width: 100%;
  height: 100%;
}
/* fixed pin at the visual center; tip sits exactly on the center point */
.mp-pin {
  position: absolute;
  left: 50%;
  top: 50%;
  transform: translate(-50%, -100%);
  pointer-events: none;
  z-index: 500;
  filter: drop-shadow(0 3px 3px rgba(0, 0, 0, 0.4));
}
.mp-hint {
  position: absolute;
  left: 50%;
  bottom: 8px;
  transform: translateX(-50%);
  z-index: 500;
  pointer-events: none;
  background: rgba(12, 11, 10, 0.78);
  color: #f5efdf;
  font-size: 11px;
  padding: 3px 10px;
  border-radius: 100px;
  white-space: nowrap;
}
</style>

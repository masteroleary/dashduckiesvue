<script setup lang="ts">
useHead({
  title: 'Quacker Tracker — DashDuckies',
  meta: [{ name: 'description', content: "Track your duck's journey on the live DashDuckies map." }],
})

const { data: sightings } = await useFetch('/api/map/sightings')
interface FeedTile {
  isSighting: boolean
  duckId: string
  duckName: string | null
  imageUrl: string | null
  address: string | null
  sightingDate: string | null
  description: string | null
}
const { data: feed } = await useFetch<FeedTile[]>('/api/feed')

function relativeAge(d: string | null) {
  if (!d) return ''
  const days = Math.floor((Date.now() - new Date(d).getTime()) / 86400000)
  if (days <= 0) return 'Today'
  if (days === 1) return '1 day ago'
  if (days <= 30) return `${days} days ago`
  const months = Math.max(1, Math.floor(days / 30))
  return months === 1 ? '1 month ago' : `${months} months ago`
}
</script>

<template>
  <div style="min-height: 100vh; padding-top: 24px">
    <!-- MAP -->
    <div class="dd-map-section" style="padding-bottom: 80px">
      <div class="dd-map-header">
        <div>
          <div class="dd-section-label">Live map</div>
          <h2 class="dd-section-title" style="margin-bottom: 0; max-width: 500px">
            Track your duck's journey
          </h2>
        </div>
      </div>
      <div class="dd-map-container" style="overflow: hidden">
        <ClientOnly>
          <LiveMap :sightings="sightings || []" height="420px" />
        </ClientOnly>
      </div>
    </div>

    <!-- LATEST ACTIVITY -->
    <div v-if="feed && feed.length" class="dd-feed">
      <h3 class="dd-feed-title">Latest Activity</h3>
      <div class="dd-feed-grid">
        <NuxtLink
          v-for="(t, i) in feed"
          :key="i"
          :to="`/quackertracker/${t.duckId}`"
          class="dd-tile"
        >
          <img :src="t.imageUrl || '/sampleducks/viking-duck.png'" :alt="t.duckName || 'Duck'" class="dd-tile-img" />
          <div class="dd-tile-body">
            <p v-if="t.isSighting" class="dd-tile-loc" :title="t.address || ''">📍 {{ t.address }}</p>
            <p v-else class="dd-tile-loc">&nbsp;</p>
            <p class="dd-tile-name" :title="t.duckName || ''">{{ t.duckName }}</p>
            <small v-if="t.isSighting" class="dd-tile-meta">{{ relativeAge(t.sightingDate) }}</small>
            <small v-else-if="t.description" class="dd-tile-meta" :title="t.description">{{ t.description }}</small>
          </div>
        </NuxtLink>
      </div>
    </div>
  </div>
</template>

<style scoped>
.dd-feed {
  max-width: 1400px;
  margin: 0 auto;
  padding: 0 48px 80px;
}
.dd-feed-title {
  font-family: var(--font-display);
  font-weight: 700;
  font-size: 28px;
  margin: 0 0 20px;
  color: var(--dd-black);
}
.dd-feed-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16px;
}
@media (min-width: 600px) {
  .dd-feed-grid { grid-template-columns: repeat(3, 1fr); }
}
@media (min-width: 900px) {
  .dd-feed-grid { grid-template-columns: repeat(4, 1fr); }
}
@media (min-width: 1200px) {
  .dd-feed-grid { grid-template-columns: repeat(5, 1fr); }
}
.dd-tile {
  display: block;
  text-decoration: none;
  color: inherit;
  background: #fff;
  border-radius: 14px;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  transition: transform 0.15s ease, box-shadow 0.15s ease;
  font-family: var(--font-body);
}
.dd-tile:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 14px rgba(0, 0, 0, 0.12);
}
.dd-tile-img {
  width: 100%;
  aspect-ratio: 3 / 4;
  object-fit: cover;
  display: block;
}
.dd-tile-body {
  padding: 8px 10px 12px;
}
.dd-tile-loc {
  font-size: 12px;
  color: var(--dd-gray);
  margin: 0 0 2px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.dd-tile-name {
  font-weight: 600;
  margin: 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.dd-tile-meta {
  color: var(--dd-gray);
  display: block;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
</style>

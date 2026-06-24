<script setup lang="ts">
definePageMeta({ layout: 'app' })

const { user } = useAuth()
const { data: stats } = useFetch('/api/member/dashboard-statistics')
const { data: sightings } = useFetch('/api/member/sightings')

interface MyDuck {
  id: string
  name: string | null
  imageUrl: string | null
  qtCode: number
  sightings: Array<{ sightingDate: string; address: string | null }>
}
const { data: ducks } = useFetch<MyDuck[]>('/api/my-ducks')

const cards = computed(() => [
  { label: 'Ducks tracked', value: stats.value?.totalDucks ?? 0 },
  { label: 'Sightings posted', value: stats.value?.totalSightings ?? 0 },
  { label: 'Connections', value: stats.value?.totalConnections ?? 0 },
])

// Filter tabs (adapted from the handoff's All / Rare / Recent to real data).
type Filter = 'all' | 'recent' | 'seen'
const filter = ref<Filter>('all')
const tabs: Array<{ key: Filter; label: string }> = [
  { key: 'all', label: 'All' },
  { key: 'recent', label: 'Recent' },
  { key: 'seen', label: 'Most seen' },
]

function latest(d: MyDuck) {
  return d.sightings?.[0]?.sightingDate ? new Date(d.sightings[0].sightingDate).getTime() : 0
}

const roster = computed(() => {
  const list = [...(ducks.value || [])]
  if (filter.value === 'recent') list.sort((a, b) => latest(b) - latest(a))
  else if (filter.value === 'seen') list.sort((a, b) => b.sightings.length - a.sightings.length)
  return list
})

const subtitle = computed(() => {
  const d = stats.value?.totalDucks ?? 0
  const s = stats.value?.totalSightings ?? 0
  return `${d} duck${d === 1 ? '' : 's'} tracked · ${s} sighting${s === 1 ? '' : 's'} logged`
})

// "Recent quacks" feed — flatten every duck's sightings, newest first.
function relAge(ts: number) {
  const days = Math.floor((Date.now() - ts) / 86400000)
  if (days <= 0) return 'TODAY'
  if (days === 1) return 'YESTERDAY'
  if (days < 7) return `${days} DAYS AGO`
  if (days < 30) return `${Math.floor(days / 7)} WK AGO`
  return `${Math.floor(days / 30)} MO AGO`
}
const feed = computed(() => {
  const items: Array<{ text: string; ts: number }> = []
  for (const d of ducks.value || []) {
    for (const s of d.sightings || []) {
      if (!s.sightingDate) continue
      items.push({
        text: `${d.name || 'A duck'} spotted${s.address ? ` at ${s.address}` : ''}`,
        ts: new Date(s.sightingDate).getTime(),
      })
    }
  }
  return items.sort((a, b) => b.ts - a.ts).slice(0, 6)
})
</script>

<template>
  <v-container class="py-8 dd-dash">
    <!-- header -->
    <div class="dd-dash-head">
      <div>
        <h1 class="dd-dash-title">Your roster</h1>
        <div class="dd-dash-sub">{{ subtitle }}</div>
        <div class="dd-dash-signed">Signed in as {{ user?.email || user?.phone }}</div>
      </div>
      <div class="dd-dash-tabs">
        <button
          v-for="t in tabs"
          :key="t.key"
          class="dd-tab"
          :class="{ active: filter === t.key }"
          @click="filter = t.key"
        >
          {{ t.label }}
        </button>
      </div>
    </div>

    <!-- stats -->
    <div class="dd-dash-stats">
      <div v-for="c in cards" :key="c.label" class="dd-statcard">
        <div class="dd-statcard-num">{{ c.value }}</div>
        <div class="dd-statcard-label">{{ c.label }}</div>
      </div>
    </div>

    <!-- split: badge grid + recent feed -->
    <div class="dd-dash-split">
      <div>
        <div v-if="roster.length" class="dd-badge-grid">
          <NuxtLink
            v-for="d in roster"
            :key="d.id"
            :to="`/quackertracker/${d.qtCode}`"
            class="dd-badge-cell"
          >
            <OctagonBadge :src="d.imageUrl" :alt="d.name || 'Duck'" variant="photo" />
            <div class="dd-badge-name">{{ d.name || 'Unnamed' }}</div>
          </NuxtLink>
        </div>
        <div v-else class="dd-dash-empty">
          No ducks on your roster yet — find one in the wild and be its first sighting!
        </div>
      </div>

      <div class="dd-feed-card">
        <div class="dd-feed-card-title">Recent quacks</div>
        <div v-if="feed.length" class="dd-feed-list">
          <div v-for="(r, i) in feed" :key="i" class="dd-feed-item">
            <span class="dd-feed-dot" />
            <div>
              <div class="dd-feed-text">{{ r.text }}</div>
              <div class="dd-feed-when">{{ relAge(r.ts) }}</div>
            </div>
          </div>
        </div>
        <div v-else class="dd-feed-empty">No activity yet.</div>
      </div>
    </div>

    <!-- recent sightings map (existing feature) -->
    <h2 class="dd-dash-maph">Recent sightings</h2>
    <ClientOnly>
      <LiveMap :sightings="sightings || []" height="400px" />
      <template #fallback>
        <v-skeleton-loader type="image" height="400" />
      </template>
    </ClientOnly>
  </v-container>
</template>

<style scoped>
.dd-dash { max-width: 1180px; }

.dd-dash-head {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 24px;
  flex-wrap: wrap;
}
.dd-dash-title {
  font-family: var(--font-display);
  font-weight: 600;
  font-size: 30px;
  letter-spacing: -0.01em;
  color: var(--dd-cream);
  margin: 0;
}
.dd-dash-sub { font-size: 14px; color: var(--dd-muted); margin-top: 4px; }
.dd-dash-signed { font-size: 12px; color: var(--dd-faint); margin-top: 2px; }

.dd-dash-tabs { display: flex; gap: 9px; }
.dd-tab {
  font-size: 12.5px;
  font-weight: 600;
  color: var(--dd-text-2);
  background: var(--dd-panel-4);
  border: 1px solid rgba(168, 125, 44, 0.45);
  padding: 6px 16px;
  cursor: pointer;
  clip-path: var(--dd-notch);
  transition: background 0.15s, color 0.15s;
}
.dd-tab:hover { color: var(--dd-cream); }
.dd-tab.active {
  background: var(--dd-bronze);
  color: var(--dd-ink);
  border-color: var(--dd-bronze);
}

.dd-dash-stats {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
  margin-bottom: 30px;
}
.dd-statcard {
  background: var(--dd-panel-3);
  border: var(--dd-hairline);
  border-radius: 14px;
  padding: 18px 20px;
}
.dd-statcard-num {
  font-family: var(--font-display);
  font-weight: 600;
  font-size: 34px;
  line-height: 1;
  color: var(--dd-bronze);
}
.dd-statcard-label { font-size: 13px; color: var(--dd-muted); margin-top: 8px; }

.dd-dash-split {
  display: grid;
  grid-template-columns: 1fr 280px;
  gap: 30px;
  margin-bottom: 40px;
}
.dd-badge-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 22px;
}
.dd-badge-cell {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  text-decoration: none;
}
.dd-badge-name {
  font-family: var(--font-display);
  font-weight: 500;
  font-size: 13px;
  color: #e8e0cb;
  text-align: center;
}
.dd-dash-empty {
  color: var(--dd-muted);
  background: var(--dd-panel-3);
  border: var(--dd-hairline);
  border-radius: 14px;
  padding: 32px;
  text-align: center;
}

.dd-feed-card {
  background: var(--dd-panel-3);
  border: var(--dd-hairline);
  border-radius: 16px;
  padding: 20px 22px;
  align-self: start;
}
.dd-feed-card-title {
  font-family: var(--font-display);
  font-weight: 600;
  font-size: 16px;
  color: var(--dd-cream);
  margin-bottom: 16px;
}
.dd-feed-list { display: flex; flex-direction: column; gap: 16px; }
.dd-feed-item { display: flex; gap: 11px; align-items: flex-start; }
.dd-feed-dot {
  width: 8px; height: 8px;
  border-radius: 50%;
  background: var(--dd-bronze);
  margin-top: 6px;
  flex: none;
}
.dd-feed-text { font-size: 13.5px; color: #e8e0cb; line-height: 1.4; }
.dd-feed-when { font-family: var(--font-mono); font-size: 10.5px; color: var(--dd-faint); margin-top: 3px; }
.dd-feed-empty { font-size: 13px; color: var(--dd-muted); }

.dd-dash-maph {
  font-family: var(--font-display);
  font-weight: 600;
  font-size: 20px;
  letter-spacing: -0.01em;
  color: var(--dd-cream);
  margin: 0 0 16px;
}

@media (max-width: 900px) {
  .dd-dash-split { grid-template-columns: 1fr; }
  .dd-badge-grid { grid-template-columns: repeat(3, 1fr); }
}
@media (max-width: 600px) {
  .dd-dash-stats { grid-template-columns: 1fr; }
  .dd-badge-grid { grid-template-columns: repeat(2, 1fr); }
}
</style>

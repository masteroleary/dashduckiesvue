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

const firstName = computed(() => {
  const n = (user.value?.name || '').trim()
  return n ? n.split(/\s+/)[0] : null
})

const cards = computed(() => [
  { label: 'Ducks on your roster', value: stats.value?.totalDucks ?? 0, icon: 'mdi-duck' },
  { label: 'Sightings posted', value: stats.value?.totalSightings ?? 0, icon: 'mdi-map-marker-radius' },
  { label: 'People who found them', value: stats.value?.totalConnections ?? 0, icon: 'mdi-account-multiple' },
])

type Filter = 'all' | 'recent' | 'seen'
const filter = ref<Filter>('all')
const tabs: Array<{ key: Filter; label: string }> = [
  { key: 'all', label: 'All' },
  { key: 'recent', label: 'Recently seen' },
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

function relAge(ts: number) {
  if (!ts) return 'never seen'
  const days = Math.floor((Date.now() - ts) / 86400000)
  if (days <= 0) return 'today'
  if (days === 1) return 'yesterday'
  if (days < 7) return `${days} days ago`
  if (days < 30) return `${Math.floor(days / 7)} week${Math.floor(days / 7) === 1 ? '' : 's'} ago`
  if (days < 365) return `${Math.floor(days / 30)} month${Math.floor(days / 30) === 1 ? '' : 's'} ago`
  return `${Math.floor(days / 365)} year${Math.floor(days / 365) === 1 ? '' : 's'} ago`
}

function lastPlace(d: MyDuck) {
  return d.sightings?.find((s) => s.address)?.address || null
}

const feed = computed(() => {
  const items: Array<{ name: string; place: string | null; ts: number; img: string | null }> = []
  for (const d of ducks.value || []) {
    for (const s of d.sightings || []) {
      if (!s.sightingDate) continue
      items.push({
        name: d.name || `Duck ${d.qtCode}`,
        place: s.address,
        ts: new Date(s.sightingDate).getTime(),
        img: d.imageUrl,
      })
    }
  }
  return items.sort((a, b) => b.ts - a.ts).slice(0, 6)
})
</script>

<template>
  <v-container class="py-8 dd-dash">
    <!-- Greeting -->
    <div class="d-flex flex-wrap align-center mb-6" style="gap: 16px">
      <div class="flex-grow-1">
        <h1 class="text-h4 font-weight-bold mb-1">
          {{ firstName ? `Welcome back, ${firstName}` : 'Welcome back' }}
        </h1>
        <p class="text-body-2 text-medium-emphasis mb-0">
          Here's where your flock has got to.
        </p>
      </div>
      <v-btn color="primary" variant="flat" prepend-icon="mdi-map" to="/quackertracker">
        Open the map
      </v-btn>
    </div>

    <!-- Numbers -->
    <v-row class="mb-2">
      <v-col v-for="c in cards" :key="c.label" cols="12" sm="4">
        <v-card variant="tonal" color="primary" rounded="lg">
          <v-card-text class="d-flex align-center" style="gap: 14px">
            <v-avatar size="44" color="primary" variant="flat">
              <v-icon :icon="c.icon" size="22" />
            </v-avatar>
            <div>
              <div class="text-h5 font-weight-bold" style="line-height: 1.1">{{ c.value }}</div>
              <div class="text-caption text-medium-emphasis">{{ c.label }}</div>
            </div>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <v-row>
      <!-- Roster -->
      <v-col cols="12" md="8">
        <div class="d-flex flex-wrap align-center mb-3" style="gap: 12px">
          <h2 class="text-h6 font-weight-bold flex-grow-1 mb-0">Your flock</h2>
          <v-btn-toggle
            v-model="filter"
            density="comfortable"
            variant="outlined"
            color="primary"
            divided
            mandatory
          >
            <v-btn v-for="t in tabs" :key="t.key" :value="t.key" size="small" class="text-none">
              {{ t.label }}
            </v-btn>
          </v-btn-toggle>
        </div>

        <v-row v-if="roster.length" dense>
          <v-col v-for="d in roster" :key="d.id" cols="6" sm="4">
            <v-card :to="`/quackertracker/${d.qtCode}`" rounded="lg" class="h-100">
              <v-img :src="d.imageUrl || undefined" :aspect-ratio="1" cover>
                <template #placeholder>
                  <div class="d-flex align-center justify-center h-100 dd-dash-noimg">
                    <v-icon icon="mdi-duck" size="34" class="text-medium-emphasis" />
                  </div>
                </template>
              </v-img>
              <v-card-text class="py-3">
                <div class="text-subtitle-2 font-weight-bold text-truncate">
                  {{ d.name || `Duck ${d.qtCode}` }}
                </div>
                <div class="text-caption text-medium-emphasis d-flex align-center" style="gap: 4px">
                  <v-icon icon="mdi-map-marker" size="13" />
                  <span class="text-truncate">{{ lastPlace(d) || 'Not spotted yet' }}</span>
                </div>
                <div class="text-caption text-disabled mt-1">{{ relAge(latest(d)) }}</div>
              </v-card-text>
            </v-card>
          </v-col>
        </v-row>

        <v-card v-else rounded="lg" class="text-center py-10 px-6">
          <v-icon icon="mdi-duck" size="42" class="text-medium-emphasis mb-3" />
          <div class="text-subtitle-1 font-weight-bold mb-1">No ducks yet</div>
          <p class="text-body-2 text-medium-emphasis mb-4">
            Scan a duck's code and post the first sighting, and it lands here.
          </p>
          <v-btn color="primary" variant="flat" to="/shop">Get your first ducks</v-btn>
        </v-card>
      </v-col>

      <!-- Activity -->
      <v-col cols="12" md="4">
        <h2 class="text-h6 font-weight-bold mb-3">Latest sightings</h2>
        <v-card rounded="lg">
          <v-list v-if="feed.length" lines="two" density="comfortable">
            <v-list-item v-for="(r, i) in feed" :key="i">
              <template #prepend>
                <v-avatar size="38" :image="r.img || undefined">
                  <v-icon v-if="!r.img" icon="mdi-duck" size="18" />
                </v-avatar>
              </template>
              <v-list-item-title class="text-body-2 font-weight-medium">{{ r.name }}</v-list-item-title>
              <v-list-item-subtitle class="text-caption">
                {{ r.place || 'Place not given' }} · {{ relAge(r.ts) }}
              </v-list-item-subtitle>
            </v-list-item>
          </v-list>
          <v-card-text v-else class="text-body-2 text-medium-emphasis">
            Nothing yet. When someone finds one of your ducks, it shows up here.
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <!-- Map -->
    <h2 class="text-h6 font-weight-bold mt-8 mb-3">Where they've been</h2>
    <v-card rounded="lg" class="overflow-hidden">
      <ClientOnly>
        <LiveMap :sightings="sightings || []" height="400px" />
        <template #fallback>
          <v-skeleton-loader type="image" height="400" />
        </template>
      </ClientOnly>
    </v-card>
  </v-container>
</template>

<style scoped>
.dd-dash { max-width: 1180px; }
/* Stand-in behind a duck with no photo. currentColor keeps it correct in both
   themes, rather than pinning a hex that only suits one of them. */
.dd-dash-noimg {
  background: rgba(var(--v-theme-on-surface), 0.06);
}
</style>

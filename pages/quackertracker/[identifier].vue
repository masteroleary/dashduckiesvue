<script setup lang="ts">
const route = useRoute()
const identifier = route.params.identifier as string
const { data, pending } = await useFetch(`/api/scan/${identifier}`)
const duck = computed(() => (data.value && 'duck' in data.value ? data.value.duck : null))

useHead(() => ({
  title: duck.value?.name ? `${duck.value.name} — DashDuckies` : 'Scan — DashDuckies',
  meta: [
    {
      name: 'description',
      content: duck.value?.name
        ? `Follow ${duck.value.name}'s journey across the DashDuckies map.`
        : 'DashDuckies scan result.',
    },
  ],
}))

function fmtDate(d: string | Date) {
  return new Date(d).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })
}
function ordinal(n: number) {
  const s = ['th', 'st', 'nd', 'rd']
  const v = n % 100
  return n + (s[(v - 20) % 10] || s[v] || s[0])
}

const liked = ref(false)
const likeCount = ref(0)
watchEffect(() => {
  if (data.value && 'likeCount' in data.value) likeCount.value = data.value.likeCount
})
async function toggleLike() {
  if (!duck.value) return
  try {
    const res = await $fetch<{ isLiked: boolean; likeCount: number }>(`/api/duck/${duck.value.id}/like`, {
      method: 'POST',
    })
    liked.value = res.isLiked
    likeCount.value = res.likeCount
  } catch (e: any) {
    if (e?.statusCode === 401) navigateTo('/login')
  }
}
</script>

<template>
  <div class="qt-wrap">
    <div v-if="pending" class="qt-center">
      <div class="qt-spinner" />
      <p>Looking up duck…</p>
    </div>

    <!-- Not found -->
    <div v-else-if="data?.state === 'notFound'" class="qt-center">
      <div class="qt-card-dark">
        <div style="font-size: 56px">🛸🦆</div>
        <h2>Invalid QT Code</h2>
        <p>We couldn't find a duck for <strong>{{ identifier }}</strong>. Double-check the code on the sticker.</p>
        <NuxtLink to="/quackertracker" class="dd-btn-primary">Try another code</NuxtLink>
      </div>
    </div>

    <!-- Not registered -->
    <div v-else-if="data?.state === 'notRegistered'" class="qt-center">
      <div class="qt-card-dark">
        <div style="font-size: 56px">🦆</div>
        <h2>Register This Duck</h2>
        <p>This duck hasn't been registered yet. Be the first to give it a name and start its journey!</p>
        <NuxtLink :to="`/duck/register/${data.duck.id}`" class="dd-btn-primary">Upload Photo</NuxtLink>
      </div>
    </div>

    <!-- Registered profile -->
    <template v-else-if="data?.state === 'registered' && duck">
      <h2 class="qt-finder">
        You are the {{ ordinal(data.sightingCount + 1) }} person to find {{ duck.name }}!
      </h2>

      <div class="qt-cta">
        <NuxtLink :to="`/duck/${duck.id}/sighting`" class="dd-btn-primary qt-pulse">📷 Upload your Duck Photo</NuxtLink>
      </div>

      <div class="qt-grid2">
        <div class="qt-card">
          <img v-if="duck.imageUrl" :src="duck.imageUrl" :alt="duck.name || 'Duck'" class="qt-duck-img" />
          <h3>{{ duck.name }}</h3>
          <p v-if="duck.description" class="qt-desc">{{ duck.description }}</p>
          <div class="qt-badges">
            <span class="qt-badge">#{{ duck.qtCode }}</span>
            <span class="qt-badge qt-badge-info">{{ data.sightingCount }} sightings</span>
            <span class="qt-badge qt-badge-like" @click="toggleLike">
              {{ liked ? '❤️' : '🤍' }} {{ likeCount }}
            </span>
          </div>
        </div>

        <div class="qt-card qt-map-card">
          <template v-if="data.sightings && data.sightings.length">
            <h4>Journey Map</h4>
            <ClientOnly><LiveMap :sightings="data.sightings" height="320px" /></ClientOnly>
          </template>
          <div v-else class="qt-center" style="min-height: 320px">
            <p style="color: var(--dd-gray)">Journey map will appear once sightings have location data.</p>
          </div>
        </div>
      </div>

      <template v-if="data.history && data.history.length">
        <h4 class="qt-section-h">Sightings</h4>
        <div class="qt-sightings">
          <div v-for="(s, i) in data.history" :key="i" class="qt-tile">
            <img v-if="s.imageUrl" :src="s.imageUrl" alt="Sighting" class="qt-tile-img" />
            <div v-else class="qt-tile-img qt-tile-placeholder">📷</div>
            <div class="qt-tile-body">
              <div class="qt-tile-loc">📍 {{ s.address || 'Unknown' }}</div>
              <small>{{ s.userName }} · {{ fmtDate(s.sightingDate) }}</small>
            </div>
          </div>
        </div>
      </template>
    </template>
  </div>
</template>

<style scoped>
.qt-wrap {
  max-width: 1100px;
  margin: 0 auto;
  padding: 40px 24px 80px;
  font-family: var(--font-body);
  color: var(--dd-cream);
}
.qt-center {
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
}
.qt-spinner {
  width: 40px;
  height: 40px;
  border: 4px solid rgba(212, 175, 55, 0.18);
  border-top-color: var(--dd-bronze);
  border-radius: 50%;
  animation: qt-spin 0.8s linear infinite;
}
@keyframes qt-spin { to { transform: rotate(360deg); } }
.qt-card-dark {
  background: var(--dd-pitch);
  border: var(--dd-hairline);
  color: var(--dd-cream);
  border-radius: 20px;
  padding: 40px;
  max-width: 480px;
  box-shadow: 0 14px 40px rgba(0, 0, 0, 0.45);
}
.qt-card-dark h2 { font-family: var(--font-display); font-weight: 600; letter-spacing: -0.01em; }
.qt-card-dark p { color: var(--dd-text-2); }
.qt-finder {
  font-family: var(--font-display);
  font-weight: 600;
  letter-spacing: -0.01em;
  text-align: center;
  margin: 0 0 24px;
  color: var(--dd-cream);
}
.qt-cta { text-align: center; margin: 24px 0 40px; }
.qt-pulse { animation: qt-pulse 1.6s ease-in-out infinite; }
@keyframes qt-pulse { 0%,100% { transform: scale(1); } 50% { transform: scale(1.04); } }
.qt-grid2 {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
}
@media (max-width: 760px) { .qt-grid2 { grid-template-columns: 1fr; } }
.qt-card {
  background: var(--dd-pitch);
  border: var(--dd-hairline);
  border-radius: 16px;
  padding: 24px;
  box-shadow: 0 14px 40px rgba(0, 0, 0, 0.4);
  text-align: center;
}
.qt-card h3, .qt-card h4 { font-family: var(--font-display); font-weight: 600; letter-spacing: -0.01em; color: var(--dd-cream); }
.qt-duck-img { max-width: 220px; width: 100%; border-radius: 12px; margin-bottom: 12px; }
.qt-desc { color: var(--dd-muted); }
.qt-badges { display: flex; gap: 8px; justify-content: center; flex-wrap: wrap; margin-top: 12px; }
.qt-badge {
  background: var(--dd-panel-3);
  border: var(--dd-hairline);
  color: var(--dd-text-2);
  border-radius: 100px;
  padding: 6px 14px;
  font-size: 14px;
  font-weight: 600;
}
.qt-badge-info { background: rgba(168, 125, 44, 0.18); border-color: rgba(212, 175, 55, 0.3); color: var(--dd-lamplight); }
.qt-badge-like { background: rgba(192, 82, 74, 0.16); border-color: rgba(192, 82, 74, 0.35); color: #e8a39c; cursor: pointer; }
.qt-map-card { padding: 16px; text-align: left; }
.qt-section-h { font-family: var(--font-display); font-weight: 600; letter-spacing: -0.01em; color: var(--dd-cream); margin: 40px 0 16px; }
.qt-sightings {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
  gap: 16px;
}
.qt-tile { background: var(--dd-pitch); border: var(--dd-hairline); border-radius: 12px; overflow: hidden; box-shadow: 0 2px 10px rgba(0,0,0,0.4); }
.qt-tile-img { width: 100%; height: 160px; object-fit: cover; display: block; }
.qt-tile-placeholder { display: flex; align-items: center; justify-content: center; background: var(--dd-panel-3); font-size: 28px; }
.qt-tile-body { padding: 10px 12px; }
.qt-tile-loc { font-weight: 600; font-size: 14px; color: var(--dd-cream); }
.qt-tile-body small { color: var(--dd-muted); }
</style>

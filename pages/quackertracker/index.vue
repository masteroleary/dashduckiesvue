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

// Which duck is hovered in a card — enlarges its marker on the map.
const hoveredDuckId = ref<string | null>(null)
// The map shows as a small square preview; "View map" opens the full one.
const mapOpen = ref(false)

// Register a duck by typing the number printed on it — send them to that duck's
// page, which shows the register prompt if it isn't registered yet.
const regNumber = ref('')
function registerByNumber() {
  const n = regNumber.value.trim().replace(/[^0-9]/g, '')
  if (n) navigateTo(`/quackertracker/${n}`)
}

// Collapse the activity feed into one card per duck, gathering its name, story
// (description) and most-recent location. Most "complete" ducks come first so
// the two examples we show by default are nice and full.
interface DuckCard {
  duckId: string
  name: string
  story: string | null
  location: string | null
  image: string | null
  order: number // first-appearance rank in the feed (the feed is newest-first)
  ts: number | null // most recent sighting time (ms), for "recently spotted"
}
const ducks = computed<DuckCard[]>(() => {
  const m = new Map<string, DuckCard>()
  for (const t of feed.value || []) {
    let d = m.get(t.duckId)
    if (!d) {
      d = { duckId: t.duckId, name: t.duckName || 'A duck', story: null, location: null, image: null, order: m.size, ts: null }
      m.set(t.duckId, d)
    }
    if (!d.story && t.description) d.story = t.description
    if (!d.location && t.isSighting && t.address) d.location = t.address
    if (!d.image && t.imageUrl) d.image = t.imageUrl
    if (d.name === 'A duck' && t.duckName) d.name = t.duckName
    if (t.sightingDate) {
      const ms = new Date(t.sightingDate).getTime()
      if (!Number.isNaN(ms) && (d.ts == null || ms > d.ts)) d.ts = ms
    }
  }
  return [...m.values()]
})

// Search the flock by name OR location. Pre-fill from the top-nav search (?q=).
const route = useRoute()
const search = ref(String(route.query.q || ''))
const filteredDucks = computed(() => {
  const q = search.value.trim().toLowerCase()
  if (!q) return ducks.value
  return ducks.value.filter(
    (d) => d.name.toLowerCase().includes(q) || (d.location || '').toLowerCase().includes(q),
  )
})

// Sort options for the flock.
type SortKey = 'newest' | 'oldest' | 'az' | 'za' | 'spotted'
const SORTS: { value: SortKey; label: string }[] = [
  { value: 'newest', label: 'Newest first' },
  { value: 'oldest', label: 'Oldest first' },
  { value: 'az', label: 'Name: A → Z' },
  { value: 'za', label: 'Name: Z → A' },
  { value: 'spotted', label: 'Recently spotted' },
]
const sortKey = ref<SortKey>('newest')
const sortedDucks = computed(() => {
  const arr = [...filteredDucks.value]
  const byName = (a: DuckCard, b: DuckCard) => a.name.localeCompare(b.name, undefined, { sensitivity: 'base' })
  switch (sortKey.value) {
    case 'oldest': return arr.sort((a, b) => b.order - a.order)
    case 'az': return arr.sort(byName)
    case 'za': return arr.sort((a, b) => byName(b, a))
    case 'spotted': return arr.sort((a, b) => (b.ts ?? -1) - (a.ts ?? -1) || a.order - b.order)
    default: return arr.sort((a, b) => a.order - b.order) // newest
  }
})

// Show 6 example ducks at first; "View more" reveals 10 at a time.
const START = 6
const shown = ref(START)
watch([search, sortKey], () => { shown.value = START })
const visibleDucks = computed(() => sortedDucks.value.slice(0, shown.value))
const canShowMore = computed(() => sortedDucks.value.length > shown.value)
const moreLabel = computed(() => (shown.value <= START ? 'View more ducks' : 'View next 10'))
function showMore() {
  shown.value += 10
}

// Social-profile card bits: a @handle from the name, plus a per-duck colour used
// for BOTH the profile cover AND that duck's marker on the map.
function handle(name: string) {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '') || 'duck'
}
const DUCK_PALETTE = [
  { cover: 'linear-gradient(120deg, #2CC5BC, #0F766E)', marker: '#17A79E' }, // teal
  { cover: 'linear-gradient(120deg, #ECD286, #A87D2C)', marker: '#D4AF37' }, // gold
  { cover: 'linear-gradient(120deg, #D2B4EB, #7E5BB5)', marker: '#9B6BD6' }, // purple
  { cover: 'linear-gradient(120deg, #F7BBD6, #C77D9E)', marker: '#E97FB0' }, // pink
  { cover: 'linear-gradient(120deg, #8FCDF3, #2E7FC2)', marker: '#4F9FE0' }, // blue
]
function paletteFor(duckId: string) {
  let h = 0
  for (let i = 0; i < duckId.length; i++) h = (h * 31 + duckId.charCodeAt(i)) >>> 0
  return DUCK_PALETTE[h % DUCK_PALETTE.length]
}
function coverStyle(d: DuckCard) {
  return { background: paletteFor(d.duckId).cover }
}

// Arriving from the top-nav search? Jump down to this section.
onMounted(async () => {
  if (search.value) {
    await nextTick()
    document.getElementById('dd-find')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }
})
</script>

<template>
  <div class="dd-qt-dark" style="min-height: 100vh; padding-top: 24px">
    <!-- MAP -->
    <div class="dd-map-section" style="padding-top: 20px; padding-bottom: 56px">
      <div class="dd-maprow">
        <div class="dd-maprow-preview dd-pastel-map">
          <ClientOnly>
            <LiveMap
              :sightings="sightings || []"
              height="300px"
              :highlight-id="hoveredDuckId"
              boundaries
              tile-url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png"
              tile-attribution="&copy; OpenStreetMap contributors &copy; CARTO"
            />
          </ClientOnly>
        </div>
        <div class="dd-maprow-cta">
          <span class="dd-live-badge"><span class="dd-live-dot" />Live map</span>
          <h2 class="dd-maprow-title">See the whole flock on the map</h2>
          <p class="dd-maprow-text">Every DashDuckie that's been spotted, pinned across the world.</p>
          <button type="button" class="dd-viewmap-btn" @click="mapOpen = true">View map →</button>
        </div>
      </div>
    </div>

    <!-- REGISTER A DUCK BY NUMBER -->
    <div class="dd-regbar">
      <div class="dd-regbar-inner">
        <div class="dd-regbar-text">
          <span class="dd-regbar-emoji" aria-hidden="true">🦆</span>
          <div>
            <div class="dd-regbar-title">Got a new duck?</div>
            <div class="dd-regbar-sub">Enter the number printed on your duck to register it.</div>
          </div>
        </div>
        <form class="dd-regbar-form" @submit.prevent="registerByNumber">
          <input
            v-model="regNumber"
            class="dd-regbar-input"
            type="text"
            inputmode="numeric"
            placeholder="Duck #"
            aria-label="Duck number"
          />
          <button type="submit" class="dd-regbar-btn">Register →</button>
        </form>
      </div>
    </div>

    <div v-if="ducks.length" class="dd-gold-divider" aria-hidden="true"></div>

    <!-- FIND A QT: search + example ducks + reveal-10-at-a-time -->
    <div v-if="ducks.length" id="dd-find" class="dd-find">
      <div class="dd-find-head">
        <h3 class="dd-feed-title">QT Profiles</h3>
      </div>

      <div class="dd-find-controls">
        <div class="dd-find-search">
          <svg class="dd-find-search-icon" viewBox="0 0 24 24" aria-hidden="true">
            <circle cx="11" cy="11" r="7" />
            <line x1="16.5" y1="16.5" x2="21" y2="21" />
          </svg>
          <input
            v-model="search"
            type="search"
            class="dd-find-input"
            placeholder="Search by name or location…"
            aria-label="Search ducks by name or location"
          />
          <button v-if="search" type="button" class="dd-find-clear" aria-label="Clear search" @click="search = ''">✕</button>
        </div>
        <div class="dd-find-sort">
          <label class="dd-find-sort-label" for="dd-sort">Sort by</label>
          <div class="dd-find-select-wrap">
            <select id="dd-sort" v-model="sortKey" class="dd-find-select">
              <option v-for="s in SORTS" :key="s.value" :value="s.value">{{ s.label }}</option>
            </select>
            <svg class="dd-find-select-chevron" viewBox="0 0 24 24" aria-hidden="true">
              <path d="M6 9l6 6 6-6" />
            </svg>
          </div>
        </div>
      </div>

      <p v-if="search && !filteredDucks.length" class="dd-feed-empty">
        No ducks match “{{ search }}”. Try a different name or place.
      </p>

      <div class="dd-duck-grid">
        <NuxtLink
          v-for="d in visibleDucks"
          :key="d.duckId"
          :to="`/quackertracker/${d.duckId}`"
          class="dd-qtcard"
          @mouseenter="hoveredDuckId = d.duckId"
          @mouseleave="hoveredDuckId = null"
        >
          <div class="dd-qtcard-cover" :style="coverStyle(d)"></div>
          <div class="dd-qtcard-body">
            <div class="dd-qtcard-avatar">
              <img v-if="d.image" :src="d.image" alt="" />
              <span v-else class="dd-qtcard-coin"><DuckMark color="#16140F" :size="26" /></span>
            </div>
            <div class="dd-qtcard-name">{{ d.name }}</div>
            <div class="dd-qtcard-handle">@{{ handle(d.name) }}</div>
            <div class="dd-qtcard-loc">
              <span class="dd-qtcard-pin" aria-hidden="true">📍</span>
              {{ d.location || 'Roaming free' }}
            </div>
            <p class="dd-qtcard-bio">{{ d.story || 'A brand-new DashDuckie, ready for adventure.' }}</p>
            <div class="dd-qtcard-foot">
              <span class="dd-qtcard-status" :class="d.location ? 'is-spotted' : 'is-new'">
                {{ d.location ? 'On the map' : 'New duck' }}
              </span>
              <span class="dd-qtcard-cta">View profile →</span>
            </div>
          </div>
        </NuxtLink>
      </div>

      <div v-if="canShowMore" class="dd-find-more">
        <button type="button" class="dd-more-btn" @click="showMore">{{ moreLabel }} →</button>
      </div>
    </div>

    <!-- FULL-MAP MODAL (opened by "View map") -->
    <ClientOnly>
      <transition name="dd-mm">
        <div v-if="mapOpen" class="dd-mm-overlay" @click.self="mapOpen = false">
          <div class="dd-mm-panel dd-pastel-map">
            <button type="button" class="dd-mm-close" aria-label="Close map" @click="mapOpen = false">✕</button>
            <LiveMap
              :sightings="sightings || []"
              height="78vh"
              :highlight-id="hoveredDuckId"
              boundaries
              tile-url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png"
              tile-attribution="&copy; OpenStreetMap contributors &copy; CARTO"
            />
          </div>
        </div>
      </transition>
    </ClientOnly>
  </div>
</template>

<style scoped>
/* Black-background dark theme for JUST this page. The site's light look comes
   from .dd-shell overriding the brand tokens to cream; here we re-declare the
   original dark tokens on the page container so all token-based text/cards flip
   to dark. Custom properties inherit, so this reaches every descendant. */
.dd-qt-dark {
  --dd-ink: #0C0B0A;
  --dd-pitch: #16140F;
  --dd-panel-2: #13110C;
  --dd-panel-3: #15120C;
  --dd-panel-4: #100E0A;
  --dd-cream: #F5EFDF;
  --dd-text-2: #CFC7B2;
  --dd-muted: #B8AF98;
  --dd-faint: #7D765F;
  --dd-hairline: 1px solid rgba(212, 175, 55, 0.16);
  --dd-hairline-soft: 1px solid rgba(212, 175, 55, 0.12);
  background:
    radial-gradient(120% 70% at 50% -10%, rgba(168, 125, 44, 0.18), transparent 55%),
    #0C0B0A;
  color: #F5EFDF;
}

/* Gold Jeep decal + centered header + gold flourishes */
.dd-jeep-decal {
  display: flex;
  justify-content: center;
  margin: 4px 0 20px;
}
.dd-jeep-decal svg {
  width: 128px;
  height: auto;
  filter: drop-shadow(0 5px 16px rgba(168, 125, 44, 0.4));
}
.dd-map-header--center { justify-content: center; }
.dd-map-header--center > div {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
}
.dd-gold-rule {
  width: 130px;
  height: 3px;
  margin-top: 18px;
  border-radius: 3px;
  background: linear-gradient(90deg, transparent, #A87D2C, #ECD286, #A87D2C, transparent);
}
.dd-gold-divider {
  max-width: 1120px;
  margin: 0 auto 44px;
  height: 1px;
  background: linear-gradient(90deg, transparent, rgba(212, 175, 55, 0.45), transparent);
}

/* Small square map preview + "View map" CTA */
.dd-maprow {
  display: flex;
  gap: 30px;
  align-items: center;
  flex-wrap: wrap;
}
.dd-maprow-preview {
  flex: none;
  width: 320px;
  max-width: 100%;
  border: 2px solid rgba(212, 175, 55, 0.5);
  border-radius: 18px;
  overflow: hidden;
  background: #FBEFF7;
  box-shadow: 0 14px 34px rgba(0, 0, 0, 0.5), 0 0 0 5px rgba(168, 125, 44, 0.1);
}
.dd-maprow-cta { flex: 1 1 300px; min-width: 260px; }
.dd-maprow-title {
  font-family: var(--font-display);
  font-size: clamp(24px, 3.4vw, 34px);
  letter-spacing: -0.01em;
  color: var(--dd-cream);
  margin: 14px 0 8px;
}
.dd-maprow-text {
  color: var(--dd-muted);
  font-size: 15px;
  line-height: 1.5;
  margin: 0 0 20px;
  max-width: 420px;
}
.dd-viewmap-btn {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 13px 26px;
  background: var(--dd-grad-gold);
  color: #16140F;
  border: none;
  border-radius: 999px;
  font-family: var(--font-display);
  font-weight: 700;
  font-size: 15px;
  cursor: pointer;
  box-shadow: 0 8px 20px rgba(168, 125, 44, 0.3);
  transition: transform 0.15s ease, box-shadow 0.15s ease;
}
.dd-viewmap-btn:hover { transform: translateY(-2px); box-shadow: 0 12px 26px rgba(168, 125, 44, 0.4); }

/* Full-map modal */
.dd-mm-overlay {
  position: fixed;
  inset: 0;
  z-index: 2000;
  background: rgba(6, 6, 8, 0.82);
  backdrop-filter: blur(6px);
  -webkit-backdrop-filter: blur(6px);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
}
.dd-mm-panel {
  position: relative;
  width: min(1100px, 94vw);
  border-radius: 18px;
  overflow: hidden;
  border: 2px solid rgba(212, 175, 55, 0.5);
  background: #FBEFF7;
  box-shadow: 0 30px 80px rgba(0, 0, 0, 0.6);
}
.dd-mm-close {
  position: absolute;
  top: 12px;
  right: 12px;
  z-index: 1200;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  border: none;
  background: rgba(12, 11, 10, 0.86);
  color: #F5EFDF;
  font-size: 15px;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}
.dd-mm-close:hover { background: #000; }
.dd-mm-enter-active,
.dd-mm-leave-active { transition: opacity 0.2s ease; }
.dd-mm-enter-from,
.dd-mm-leave-to { opacity: 0; }

/* Fun, presentable map header: big playful title + a "live" pill above the map. */
.dd-adv-title {
  margin-bottom: 12px;
  max-width: 640px;
}
.dd-live-badge {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 6px 14px 6px 11px;
  border-radius: 999px;
  background: var(--dd-pond-soft);
  color: var(--dd-pond-deep);
  font-family: var(--font-body);
  font-weight: 700;
  font-size: 12px;
  letter-spacing: 0.09em;
  text-transform: uppercase;
}
.dd-live-dot {
  width: 9px;
  height: 9px;
  border-radius: 50%;
  background: var(--dd-pond);
  box-shadow: 0 0 0 0 rgba(27, 158, 151, 0.5);
  animation: dd-live-pulse 1.8s ease-out infinite;
}
@keyframes dd-live-pulse {
  0% { box-shadow: 0 0 0 0 rgba(27, 158, 151, 0.5); }
  70% { box-shadow: 0 0 0 8px rgba(27, 158, 151, 0); }
  100% { box-shadow: 0 0 0 0 rgba(27, 158, 151, 0); }
}
@media (prefers-reduced-motion: reduce) {
  .dd-live-dot { animation: none; }
}
.dd-feed {
  max-width: 1120px;
  margin: 0 auto;
  padding: 0 24px 80px;
}
.dd-feed-head {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 16px;
  flex-wrap: wrap;
  margin: 0 0 20px;
}
.dd-feed-title {
  font-family: var(--font-display);
  font-weight: 600;
  font-size: 28px;
  letter-spacing: -0.01em;
  margin: 0;
  color: var(--dd-cream);
}
.dd-feed-clear {
  font-size: 14px;
  font-weight: 600;
  color: var(--dd-bronze);
  text-decoration: none;
}
.dd-feed-clear:hover { text-decoration: underline; }
.dd-feed-empty {
  color: var(--dd-muted);
  font-size: 15px;
  margin: 0 0 24px;
}
.dd-feed-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 10px;
}
.dd-act {
  display: flex;
  align-items: center;
  gap: 11px;
  min-width: 0;
  padding: 10px 13px;
  background: var(--dd-pitch);
  border: var(--dd-hairline);
  border-radius: 13px;
  box-shadow: 0 3px 10px rgba(60, 45, 15, 0.05);
  text-decoration: none;
  color: var(--dd-cream);
  font-family: var(--font-body);
  transition: transform 0.15s ease, box-shadow 0.15s ease, border-color 0.15s ease;
}
.dd-act:hover {
  transform: translateY(-2px);
  box-shadow: 0 10px 22px rgba(60, 45, 15, 0.1);
  border-color: var(--dd-bronze);
  text-decoration: none;
}
.dd-act-coin {
  flex: none;
  width: 34px;
  height: 34px;
  border-radius: 50%;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}
.dd-act-coin--new {
  background: var(--dd-grad-gold);
  box-shadow: inset 0 1px 2px rgba(255, 255, 255, 0.5), 0 2px 5px rgba(168, 125, 44, 0.3);
}
.dd-act-coin--spot {
  background: linear-gradient(150deg, #7ED8CC, #1B9E97);
  box-shadow: inset 0 1px 2px rgba(255, 255, 255, 0.45), 0 2px 5px rgba(15, 118, 110, 0.28);
}
.dd-act-main { flex: 1; min-width: 0; display: flex; flex-direction: column; }
.dd-act-name {
  font-family: var(--font-display);
  font-weight: 600;
  font-size: 14px;
  line-height: 1.2;
  color: var(--dd-cream);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.dd-act-sub {
  font-size: 11.5px;
  line-height: 1.3;
  color: var(--dd-muted);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.dd-act-link {
  font-size: 11px;
  font-weight: 700;
  color: var(--dd-bronze);
  margin-top: 2px;
}
.dd-act:hover .dd-act-link { text-decoration: underline; }

/* ---- Register a duck by number ---- */
.dd-regbar {
  max-width: 1120px;
  margin: 0 auto 26px;
  padding: 0 24px;
}
.dd-regbar-inner {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 18px;
  flex-wrap: wrap;
  background: var(--dd-pitch);
  border: var(--dd-hairline);
  border-radius: 16px;
  padding: 16px 20px;
}
.dd-regbar-text { display: flex; align-items: center; gap: 14px; min-width: 0; }
.dd-regbar-emoji { font-size: 28px; flex: none; }
.dd-regbar-title { font-family: var(--font-display); font-weight: 600; font-size: 17px; color: var(--dd-cream); }
.dd-regbar-sub { font-size: 13.5px; color: var(--dd-muted); margin-top: 1px; }
.dd-regbar-form { display: flex; gap: 10px; flex: none; }
.dd-regbar-input {
  width: 130px;
  background: var(--dd-panel-3);
  border: var(--dd-hairline);
  border-radius: 12px;
  padding: 11px 14px;
  color: var(--dd-cream);
  font-family: var(--font-body);
  font-size: 15px;
  outline: none;
  transition: border-color 0.15s ease, box-shadow 0.15s ease;
}
.dd-regbar-input::placeholder { color: var(--dd-faint); }
.dd-regbar-input:focus { border-color: var(--dd-bronze); box-shadow: 0 0 0 3px rgba(168, 125, 44, 0.18); }
.dd-regbar-btn {
  background: var(--dd-grad-gold);
  color: #16140f;
  border: none;
  border-radius: 12px;
  padding: 11px 20px;
  font-family: var(--font-display);
  font-weight: 700;
  font-size: 15px;
  cursor: pointer;
  white-space: nowrap;
}
.dd-regbar-btn:hover { filter: brightness(1.04); }

/* ---- Find a duck: search + example cards + reveal-more ---- */
.dd-find {
  max-width: 1120px;
  margin: 0 auto;
  padding: 0 24px 90px;
}
.dd-find-head { margin: 0 0 18px; }
.dd-find-sub {
  margin: 6px 0 0;
  color: var(--dd-muted);
  font-size: 15px;
  max-width: 560px;
}
.dd-find-controls {
  display: flex;
  gap: 14px;
  align-items: flex-end;
  flex-wrap: wrap;
  margin: 0 0 30px;
}
.dd-find-search {
  position: relative;
  flex: 1 1 320px;
  max-width: 540px;
}
.dd-find-search-icon {
  position: absolute;
  left: 16px;
  top: 50%;
  transform: translateY(-50%);
  width: 18px;
  height: 18px;
  fill: none;
  stroke: var(--dd-muted);
  stroke-width: 2;
  stroke-linecap: round;
  pointer-events: none;
}
.dd-find-input {
  width: 100%;
  padding: 14px 44px;
  background: var(--dd-panel-3);
  border: var(--dd-hairline);
  border-radius: 14px;
  color: var(--dd-cream);
  font-family: var(--font-body);
  font-size: 15px;
  outline: none;
  transition: border-color 0.15s ease, box-shadow 0.15s ease;
}
.dd-find-input::placeholder { color: var(--dd-faint); }
.dd-find-input:focus {
  border-color: var(--dd-bronze);
  box-shadow: 0 0 0 3px rgba(168, 125, 44, 0.18);
}
.dd-find-clear {
  position: absolute;
  right: 10px;
  top: 50%;
  transform: translateY(-50%);
  width: 28px;
  height: 28px;
  border: none;
  background: transparent;
  color: var(--dd-muted);
  font-size: 14px;
  line-height: 1;
  cursor: pointer;
  border-radius: 50%;
}
.dd-find-clear:hover { color: var(--dd-cream); background: rgba(255, 255, 255, 0.06); }

.dd-find-sort { display: flex; flex-direction: column; gap: 6px; }
.dd-find-sort-label {
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: var(--dd-muted);
}
.dd-find-select-wrap { position: relative; }
.dd-find-select {
  appearance: none;
  -webkit-appearance: none;
  padding: 14px 40px 14px 16px;
  background: var(--dd-panel-3);
  border: var(--dd-hairline);
  border-radius: 14px;
  color: var(--dd-cream);
  font-family: var(--font-body);
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  outline: none;
  min-width: 190px;
  transition: border-color 0.15s ease, box-shadow 0.15s ease;
}
.dd-find-select:focus { border-color: var(--dd-bronze); box-shadow: 0 0 0 3px rgba(168, 125, 44, 0.18); }
/* best-effort dark styling for the open option list (honored on some browsers) */
.dd-find-select option { background: #16140F; color: var(--dd-cream); }
.dd-find-select-chevron {
  position: absolute;
  right: 13px;
  top: 50%;
  transform: translateY(-50%);
  width: 15px;
  height: 15px;
  fill: none;
  stroke: var(--dd-muted);
  stroke-width: 2;
  stroke-linecap: round;
  stroke-linejoin: round;
  pointer-events: none;
}

.dd-duck-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 16px;
}
.dd-qtcard {
  display: flex;
  flex-direction: column;
  background: var(--dd-pitch);
  border: var(--dd-hairline);
  border-radius: 18px;
  overflow: hidden;
  text-decoration: none;
  color: var(--dd-cream);
  font-family: var(--font-body);
  transition: transform 0.15s ease, box-shadow 0.15s ease, border-color 0.15s ease;
}
.dd-qtcard:hover {
  transform: translateY(-3px);
  border-color: var(--dd-bronze);
  box-shadow: 0 16px 34px rgba(0, 0, 0, 0.45);
  text-decoration: none;
}
.dd-qtcard-cover { height: 76px; }
.dd-qtcard-body {
  flex: 1;
  display: flex;
  flex-direction: column;
  padding: 0 18px 18px;
}
.dd-qtcard-avatar {
  width: 72px;
  height: 72px;
  margin: -38px 0 10px;
  border-radius: 50%;
  border: 3px solid var(--dd-pitch);
  background: var(--dd-pitch);
  overflow: hidden;
  box-shadow: 0 4px 14px rgba(0, 0, 0, 0.45);
}
.dd-qtcard-avatar img { width: 100%; height: 100%; object-fit: cover; display: block; }
.dd-qtcard-coin {
  width: 100%;
  height: 100%;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: var(--dd-grad-gold);
}
.dd-qtcard-name {
  font-family: var(--font-display);
  font-weight: 600;
  font-size: 18px;
  line-height: 1.15;
  color: var(--dd-cream);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.dd-qtcard-handle {
  margin-top: 1px;
  font-size: 13px;
  font-weight: 600;
  color: var(--dd-bronze);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.dd-qtcard-loc {
  margin-top: 7px;
  font-size: 13px;
  color: var(--dd-muted);
  display: inline-flex;
  align-items: center;
  gap: 4px;
  min-width: 0;
}
.dd-qtcard-pin { font-size: 11px; }
.dd-qtcard-bio {
  margin: 10px 0 14px;
  font-size: 13.5px;
  line-height: 1.5;
  color: var(--dd-text-2);
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
.dd-qtcard-foot {
  margin-top: auto;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
}
.dd-qtcard-status {
  flex: none;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.02em;
  padding: 4px 10px;
  border-radius: 999px;
}
.dd-qtcard-status.is-spotted { background: rgba(27, 158, 151, 0.18); color: #7ED8CC; }
.dd-qtcard-status.is-new { background: rgba(168, 125, 44, 0.2); color: #ECD286; }
.dd-qtcard-cta { font-size: 13px; font-weight: 700; color: var(--dd-bronze); }
.dd-qtcard:hover .dd-qtcard-cta { text-decoration: underline; }

.dd-find-more { display: flex; justify-content: center; margin-top: 30px; }
.dd-more-btn {
  padding: 13px 28px;
  background: var(--dd-grad-gold);
  color: #16140F;
  border: none;
  border-radius: 999px;
  font-family: var(--font-display);
  font-weight: 700;
  font-size: 15px;
  cursor: pointer;
  box-shadow: 0 8px 20px rgba(168, 125, 44, 0.3);
  transition: transform 0.15s ease, box-shadow 0.15s ease;
}
.dd-more-btn:hover { transform: translateY(-2px); box-shadow: 0 12px 26px rgba(168, 125, 44, 0.4); }
</style>

<!-- Colorful pastel look for the tracker map. Unscoped: Leaflet builds its
     tiles/panes in JS, so scoped selectors (with data-v attrs) never reach them.
     The .dd-pastel-map class keeps this contained to just the Quacker Tracker map. -->
<style>
.dd-map-container.dd-pastel-map {
  border: 2px solid rgba(212, 175, 55, 0.5);
  background: #FBEFF7;
  box-shadow: 0 18px 46px rgba(0, 0, 0, 0.5), 0 0 0 6px rgba(168, 125, 44, 0.1);
}
/* neutral-light Positron base so the pastel-coloured states pop */
.dd-pastel-map .leaflet-tile-pane {
  filter: saturate(1.02) brightness(1.02);
}
</style>

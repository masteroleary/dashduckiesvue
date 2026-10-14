<script setup lang="ts">
const route = useRoute()
const router = useRouter()
const identifier = route.params.identifier as string

// Fixed back button — go back if we came from within the site, else to the tracker.
function goBack() {
  if (window.history.length > 1) router.back()
  else router.push('/quackertracker')
}
// Admins get inline editing below the page. Resolved during SSR so the panel
// isn't briefly absent on first paint.
const user = await useResolvedUser()

const { data, pending, refresh } = await useFetch(`/api/scan/${identifier}`)
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

// --- social-profile bits ---
const handle = computed(() => (duck.value?.name || 'duck').toLowerCase().replace(/[^a-z0-9]+/g, '') || 'duck')
// Same palette + hashing as the Quacker Tracker cards, so a duck's cover colour
// here matches the profile card you clicked to get here.
// Each colour has the cover gradient + a light tint used for the page background.
const DUCK_PALETTE = [
  { cover: 'linear-gradient(120deg, #2CC5BC, #0F766E)', bg: '#DCF1ED' }, // teal
  { cover: 'linear-gradient(120deg, #ECD286, #A87D2C)', bg: '#F6EDD5' }, // gold
  { cover: 'linear-gradient(120deg, #D2B4EB, #7E5BB5)', bg: '#EFE6F8' }, // purple
  { cover: 'linear-gradient(120deg, #F7BBD6, #C77D9E)', bg: '#FBE8F1' }, // pink
  { cover: 'linear-gradient(120deg, #8FCDF3, #2E7FC2)', bg: '#E4F1FC' }, // blue
]
function paletteFor(id: string) {
  let h = 0
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0
  return DUCK_PALETTE[h % DUCK_PALETTE.length]
}
const coverStyle = computed(() => ({ background: (duck.value ? paletteFor(duck.value.id) : DUCK_PALETTE[0]).cover }))
// Page background: a light tint of this duck's cover colour (dark only while loading).
const bgColor = computed(() => (duck.value ? paletteFor(duck.value.id).bg : '#0C0B0A'))
const history = computed<any[]>(() => ((data.value as any)?.history as any[]) || [])
const bornLocation = computed(() => {
  const arr = history.value.filter((s) => s.address && s.sightingDate)
  if (!arr.length) return history.value.find((s) => s.address)?.address ?? null
  return arr.reduce((a, b) => (new Date(a.sightingDate).getTime() <= new Date(b.sightingDate).getTime() ? a : b)).address
})
const latestLocation = computed(() => {
  const arr = history.value.filter((s) => s.address && s.sightingDate)
  if (!arr.length) return history.value.find((s) => s.address)?.address ?? null
  return arr.reduce((a, b) => (new Date(a.sightingDate).getTime() >= new Date(b.sightingDate).getTime() ? a : b)).address
})
const placesCount = computed(() => new Set(history.value.map((s) => s.address).filter(Boolean)).size)

// A rotating fun duck fact or joke — re-rolled on every visit and via the
// button, so repeat visitors keep seeing new ones. Client-side (onMounted) to
// avoid an SSR hydration mismatch from Math.random.
const DUCK_FACTS = [
  "A duck's quack really does echo — the old 'a quack doesn't echo' myth was busted by scientists.",
  'Ducks have waterproof feathers thanks to an oil they spread over themselves while preening.',
  "A group of ducks is a 'raft' on the water, a 'team' in flight, and a 'waddling' on land.",
  'Ducks can sleep with one eye open, resting half the brain while the other half keeps watch.',
  'Ducklings can walk, swim, and find their own food within hours of hatching.',
  'Ducks see in color and can even pick up some ultraviolet light.',
  'A male duck is a drake, a female is a hen, and a baby is a duckling.',
  'Some ducks migrate thousands of miles and can fly up to 60 miles per hour.',
  "Ducks have no teeth — tiny ridges on their bills strain food from the water instead.",
  "A duck's feet have almost no nerves or blood vessels, so cold water doesn't bother them.",
  'Ducks live on every continent on Earth except Antarctica.',
  'Rubber ducks have been floating in bathtubs since the late 1800s.',
]
const DUCK_JOKES = [
  'Why do ducks make great detectives? They always quack the case.',
  'What do you call a duck that steals? A robber duck.',
  'Where do sick ducks go? To the ducktor.',
  'What time do ducks wake up? At the quack of dawn.',
  "Why did the duck cross the road? To prove he wasn't chicken.",
  'What do you call a duck that loves fireworks? A firequacker.',
  "What's a duck's favorite snack? Quackers and cheese.",
  'What do ducks watch on TV? Duckumentaries.',
  'How do ducks pay for things? With their bills.',
  'What do you call a very smart duck? A wise quacker.',
  'Why are ducks so good at basketball? They love a good slam duck.',
  'What do you get when you cross a duck with fireworks? A boom-quack!',
]
// One fun item per duck — chosen deterministically from the duck's id, so a
// given duck always shows the same one, while different ducks (and every future
// duck) get a different fact or joke.
const FUN_POOL: { kind: 'fact' | 'joke'; text: string }[] = [
  ...DUCK_FACTS.map((text) => ({ kind: 'fact' as const, text })),
  ...DUCK_JOKES.map((text) => ({ kind: 'joke' as const, text })),
]
const funItem = computed(() => {
  const id = duck.value?.id || ''
  let h = 0
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0
  return FUN_POOL[h % FUN_POOL.length]
})
const funKind = computed(() => funItem.value.kind)
const funText = computed(() => funItem.value.text)

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
  <div class="qt-wrap" :style="{ background: bgColor }">
    <button type="button" class="qt-backbtn" aria-label="Back to Quacker Tracker" @click="goBack">
      <span aria-hidden="true">←</span> Back
    </button>

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
        <ReportDuck
          :identifier="identifier"
          prompt="Report a problem"
          note-placeholder="e.g. the code on the sticker won't scan, or it's worn out and hard to read"
        />
      </div>
    </div>

    <!-- Not registered -->
    <div v-else-if="data?.state === 'notRegistered'" class="qt-center">
      <div class="qt-card-dark">
        <div style="font-size: 56px">🦆</div>
        <h2>Register This Duck</h2>
        <p>This duck hasn't been registered yet. Be the first to give it a name and start its journey!</p>
        <NuxtLink :to="`/duck/register/${data.duck.id}`" class="dd-btn-primary">Upload Photo</NuxtLink>

        <ReportDuck :duck-id="data.duck.id" />
      </div>
    </div>

    <!-- Registered → social-media style profile -->
    <template v-else-if="data?.state === 'registered' && duck">
      <div class="qtp">
        <div class="qtp-sheet">
          <div class="qtp-cover" :style="coverStyle"></div>
          <div class="qtp-body">
            <div class="qtp-avatar">
              <img v-if="duck.imageUrl" :src="duck.imageUrl" :alt="duck.name || 'Duck'" />
              <span v-else class="qtp-avatar-coin"><DuckMark color="#16140F" :size="50" /></span>
            </div>
            <div class="qtp-namerow">
              <div class="qtp-idblock">
                <h1 class="qtp-name">{{ duck.name }}</h1>
                <div class="qtp-handle">@{{ handle }}</div>
              </div>
            </div>
            <p v-if="bornLocation" class="qtp-loc">🐣 Born in {{ bornLocation }}</p>
            <p v-if="latestLocation" class="qtp-loc">📍 Last seen in {{ latestLocation }}</p>
            <div class="qtp-stats">
              <div class="qtp-stat"><b>{{ data.sightingCount }}</b><span>Sightings</span></div>
              <div class="qtp-stat"><b>{{ placesCount }}</b><span>Places</span></div>
              <button type="button" class="qtp-like" :class="{ liked }" @click="toggleLike">
                {{ liked ? '❤️' : '🤍' }} {{ likeCount }} Likes
              </button>
            </div>
          </div>

          <div class="qtp-finder">🎉 You're the {{ ordinal(data.sightingCount + 1) }} person to find {{ duck.name }}!</div>

          <section v-if="duck.description" class="qtp-block">
            <h2 class="qtp-h">Bio</h2>
            <p class="qtp-text">{{ duck.description }}</p>
          </section>

          <section v-if="funText" class="qtp-block">
            <div class="qtp-funpost">
              <span class="qtp-funpost-ava">
                <img v-if="duck.imageUrl" :src="duck.imageUrl" :alt="duck.name || 'Duck'" />
                <DuckMark v-else color="#16140F" :size="22" />
              </span>
              <div class="qtp-funpost-body">
                <div class="qtp-funpost-head">
                  <b>{{ duck.name }}</b>
                  <span class="qtp-funpost-tag">{{ funKind === 'joke' ? '😄 dropped a joke' : '💡 shared a fun fact' }}</span>
                </div>
                <p class="qtp-funpost-text">{{ funText }}</p>
              </div>
            </div>
          </section>

          <section v-if="history.length" class="qtp-block">
            <h2 class="qtp-h">Photo feed</h2>
            <div class="qtp-feed">
              <article v-for="(s, i) in history" :key="i" class="qtp-post">
                <div class="qtp-post-head">
                  <span class="qtp-post-ava"><DuckMark color="#16140F" :size="17" /></span>
                  <div class="qtp-post-who">
                    <span class="qtp-post-user">{{ s.userName || 'a_ducker' }}</span>
                    <span class="qtp-post-loc">📍 {{ s.address || 'Somewhere' }}</span>
                  </div>
                  <span class="qtp-post-dots" aria-hidden="true">•••</span>
                </div>
                <img v-if="s.imageUrl" :src="s.imageUrl" class="qtp-post-img" alt="Sighting photo" />
                <div v-else class="qtp-post-img qtp-post-ph">📷</div>
                <div class="qtp-post-actions" aria-hidden="true"><span>🤍</span><span>💬</span><span>↗️</span></div>
                <div class="qtp-post-cap"><b>{{ s.userName || 'a_ducker' }}</b> spotted {{ duck.name }} here 🦆</div>
                <div class="qtp-post-time">{{ fmtDate(s.sightingDate) }}</div>
              </article>
            </div>
          </section>

          <section v-if="data.sightings && data.sightings.length" class="qtp-block">
            <h2 class="qtp-h">Journey map</h2>
            <div class="qtp-map">
              <ClientOnly>
                <LiveMap
                  :sightings="data.sightings"
                  height="360px"
                  tile-url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png"
                  tile-attribution="&copy; OpenStreetMap contributors &copy; CARTO"
                />
              </ClientOnly>
            </div>
          </section>

          <section class="qtp-block">
            <div class="qtp-funpost">
              <span class="qtp-funpost-ava">
                <img v-if="duck.imageUrl" :src="duck.imageUrl" :alt="duck.name || 'Duck'" />
                <DuckMark v-else color="#16140F" :size="22" />
              </span>
              <div class="qtp-funpost-body">
                <div class="qtp-funpost-head">
                  <b>{{ duck.name }}</b>
                  <span class="qtp-funpost-tag">👋 introduction</span>
                </div>
                <p class="qtp-funpost-text">Hi, I'm {{ duck.name }}! I can't wait to travel the world with all my Jeep friends. 🚙🦆</p>
              </div>
            </div>
          </section>

          <section class="qtp-block">
            <div class="qtp-funpost">
              <span class="qtp-funpost-ava">
                <img v-if="duck.imageUrl" :src="duck.imageUrl" :alt="duck.name || 'Duck'" />
                <DuckMark v-else color="#16140F" :size="22" />
              </span>
              <div class="qtp-funpost-body">
                <div class="qtp-funpost-head">
                  <b>{{ duck.name }}</b>
                  <span class="qtp-funpost-tag">🥚 hatch day</span>
                </div>
                <p class="qtp-funpost-text">{{ bornLocation ? `I was born in ${bornLocation}! 🥚` : 'Freshly hatched and ready for adventure! 🥚' }}</p>
              </div>
            </div>
          </section>

        </div>
      </div>

      <!-- Admin-only editing for everything above. Refreshes the page's own data
           after a change, so the public view never lags behind the edit. -->
      <DuckAdminPanel
        v-if="user?.isAdmin && duck"
        :duck-id="duck.id"
        @changed="refresh()"
      />
    </template>
  </div>
</template>

<style scoped>
/* Black theme for the whole page — re-declare the dark brand tokens (the site's
   light look comes from .dd-shell overriding them to cream). */
.qt-wrap {
  min-height: 100vh;
  padding: 34px 20px 90px;
  font-family: var(--font-body);
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
    radial-gradient(120% 55% at 50% -6%, rgba(168, 125, 44, 0.14), transparent 55%),
    #0C0B0A;
  color: var(--dd-cream);
}
/* Fixed back button, pinned top-left below the nav, always visible while scrolling. */
.qt-backbtn {
  position: fixed;
  top: 86px;
  left: 20px;
  z-index: 90;
  display: inline-flex;
  align-items: center;
  gap: 7px;
  padding: 9px 16px 9px 13px;
  border-radius: 999px;
  border: 1px solid rgba(212, 175, 55, 0.45);
  background: rgba(22, 20, 15, 0.72);
  -webkit-backdrop-filter: blur(8px);
  backdrop-filter: blur(8px);
  color: #f5efdf;
  font-family: var(--font-body);
  font-weight: 700;
  font-size: 14px;
  cursor: pointer;
  box-shadow: 0 6px 18px rgba(0, 0, 0, 0.4);
  transition: transform 0.15s ease, background 0.15s ease;
}
.qt-backbtn:hover { transform: translateX(-2px); background: rgba(22, 20, 15, 0.92); }
.qt-backbtn span { font-size: 17px; line-height: 1; }
.qt-center {
  min-height: 62vh;
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
  color: var(--dd-cream);
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


/* ---- profile: one continuous white sheet on the black page ---- */
.qtp { max-width: 780px; margin: 0 auto; }
.qtp-sheet {
  background: #fff;
  border-radius: 22px;
  overflow: hidden;
  box-shadow: 0 18px 50px rgba(40, 30, 20, 0.16);
  color: #1c1813;
  /* light tokens so every child renders dark-on-white */
  --dd-pitch: #fff;
  --dd-panel-3: #f4ecdc;
  --dd-cream: #1c1813;
  --dd-text-2: #4b4436;
  --dd-muted: #6f6553;
  --dd-faint: #9a8f78;
}
.qtp-cover { height: 190px; }
.qtp-body { padding: 0 26px 22px; }
.qtp-avatar {
  width: 132px;
  height: 132px;
  margin: -68px 0 12px;
  border-radius: 50%;
  border: 4px solid #fff;
  background: #fff;
  overflow: hidden;
  box-shadow: 0 8px 22px rgba(0, 0, 0, 0.28);
}
.qtp-avatar img { width: 100%; height: 100%; object-fit: cover; display: block; }
.qtp-avatar-coin { width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; background: var(--dd-grad-gold); }
.qtp-name {
  font-family: var(--font-display);
  font-weight: 600;
  font-size: clamp(24px, 4vw, 32px);
  letter-spacing: 0.01em;
  text-transform: uppercase;
  color: #1c1813;
  margin: 0;
}
.qtp-handle { font-size: 14px; font-weight: 600; color: var(--dd-bronze); margin-top: 3px; }
.qtp-loc { color: var(--dd-muted); font-size: 14px; margin: 12px 0 0; }
.qtp-loc + .qtp-loc { margin-top: 5px; }
.qtp-stats { display: flex; align-items: center; gap: 28px; margin-top: 18px; padding-top: 16px; border-top: 1px solid rgba(28, 24, 19, 0.09); }
.qtp-stat { display: flex; flex-direction: column; gap: 2px; }
.qtp-stat b { font-family: var(--font-display); font-weight: 700; font-size: 21px; color: #1c1813; }
.qtp-stat span { font-size: 12px; color: var(--dd-muted); text-transform: uppercase; letter-spacing: 0.05em; }
.qtp-like {
  margin-left: auto;
  display: inline-flex;
  align-items: center;
  gap: 7px;
  padding: 9px 15px;
  border-radius: 999px;
  background: #f4ecdc;
  border: 1px solid rgba(168, 125, 44, 0.28);
  color: #1c1813;
  font-family: var(--font-body);
  font-weight: 700;
  font-size: 14px;
  cursor: pointer;
  transition: border-color 0.15s, transform 0.15s;
}
.qtp-like:hover { transform: translateY(-1px); border-color: var(--dd-bronze); }
.qtp-like.liked { background: rgba(192, 82, 74, 0.12); border-color: rgba(192, 82, 74, 0.4); color: #b03b33; }

.qtp-finder {
  background: rgba(168, 125, 44, 0.1);
  border-top: 1px solid rgba(28, 24, 19, 0.09);
  color: #8a6a1e;
  padding: 13px 26px;
  font-weight: 600;
  text-align: center;
  font-size: 14px;
}

/* Every section is a block inside the sheet, joined by a thin divider. */
.qtp-block { padding: 22px 26px; border-top: 1px solid rgba(28, 24, 19, 0.09); }
.qtp-h { font-family: var(--font-display); font-weight: 600; font-size: 18px; color: #1c1813; margin: 0 0 12px; letter-spacing: 0.01em; }
.qtp-h-row { display: flex; align-items: center; justify-content: space-between; gap: 12px; margin: 0 0 12px; flex-wrap: wrap; }
.qtp-h-row .qtp-h { margin: 0; }
.qtp-text { color: var(--dd-text-2); font-size: 15px; line-height: 1.6; margin: 0; white-space: pre-wrap; }

.qtp-fun-btn {
  background: #f4ecdc;
  border: 1px solid rgba(168, 125, 44, 0.28);
  color: #1c1813;
  border-radius: 999px;
  padding: 7px 15px;
  font-family: var(--font-body);
  font-weight: 700;
  font-size: 13px;
  cursor: pointer;
  transition: border-color 0.15s, transform 0.15s;
}
.qtp-fun-btn:hover { border-color: var(--dd-bronze); transform: translateY(-1px); }
/* Fun fact/joke styled as a post written by the duck itself. */
.qtp-funpost { display: flex; gap: 12px; }
.qtp-funpost-ava {
  width: 42px;
  height: 42px;
  border-radius: 50%;
  flex: none;
  overflow: hidden;
  background: var(--dd-grad-gold);
  display: flex;
  align-items: center;
  justify-content: center;
}
.qtp-funpost-ava img { width: 100%; height: 100%; object-fit: cover; display: block; }
.qtp-funpost-body { min-width: 0; flex: 1; }
.qtp-funpost-head { display: flex; align-items: baseline; gap: 8px; flex-wrap: wrap; }
.qtp-funpost-head b { font-size: 15px; font-weight: 700; color: #1c1813; }
.qtp-funpost-tag { font-size: 12.5px; color: var(--dd-muted); }
.qtp-funpost-text { margin: 5px 0 0; font-size: 15px; line-height: 1.55; color: var(--dd-text-2); }

.qtp-map { border: 1px solid rgba(168, 125, 44, 0.3); border-radius: 14px; overflow: hidden; background: #FBEFF7; }

/* Photo feed as connected feed items (no separate cards). */
.qtp-feed { display: flex; flex-direction: column; }
.qtp-post { padding-top: 20px; margin-top: 20px; border-top: 1px solid rgba(28, 24, 19, 0.09); }
.qtp-post:first-child { padding-top: 0; margin-top: 0; border-top: none; }
.qtp-post-head { display: flex; align-items: center; gap: 10px; margin-bottom: 10px; }
.qtp-post-ava {
  width: 34px;
  height: 34px;
  border-radius: 50%;
  flex: none;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: var(--dd-grad-gold);
}
.qtp-post-who { min-width: 0; flex: 1; display: flex; flex-direction: column; }
.qtp-post-user { font-weight: 700; font-size: 14px; color: #1c1813; }
.qtp-post-loc { font-size: 12px; color: var(--dd-muted); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.qtp-post-dots { color: var(--dd-muted); font-weight: 700; letter-spacing: 1px; }
.qtp-post-img { width: 100%; aspect-ratio: 1 / 1; object-fit: cover; display: block; border-radius: 12px; }
.qtp-post-ph { display: flex; align-items: center; justify-content: center; background: #f4ecdc; font-size: 44px; }
.qtp-post-actions { display: flex; gap: 16px; padding: 12px 0 4px; font-size: 20px; }
.qtp-post-cap { font-size: 14px; color: var(--dd-text-2); line-height: 1.5; }
.qtp-post-cap b { color: #1c1813; font-weight: 700; }
.qtp-post-time { padding-top: 6px; font-size: 11px; color: var(--dd-faint); text-transform: uppercase; letter-spacing: 0.05em; }

.qtp-back { max-width: 780px; margin: 24px auto 0; text-align: center; }
.qtp-backlink { color: var(--dd-bronze); font-weight: 600; text-decoration: none; }
.qtp-backlink:hover { text-decoration: underline; }
</style>

<script setup lang="ts">
const year = new Date().getFullYear()

const menuOpen = ref(false)

const menuLinks = [
  { label: 'Home', to: '/' },
  { label: 'Quacker Tracker', to: '/quackertracker' },
  { label: 'How It Works', to: '/#how' },
  { label: 'Shop', to: '/#shop' },
  { label: 'Stickers', to: '/stickers' },
  { label: 'Forum', to: '/forum' },
  { label: 'Contact', to: '/contact' },
  { label: 'Terms', to: '/terms' },
]

// Inline tabs shown on wider screens (the logo covers Home).
const tabLinks = [
  { label: 'Quacker Tracker', to: '/quackertracker' },
  { label: 'How It Works', to: '/#how' },
  { label: 'Shop', to: '/#shop' },
  { label: 'Stickers', to: '/stickers' },
  { label: 'Forum', to: '/forum' },
  { label: 'Contact', to: '/contact' },
  { label: 'Terms', to: '/terms' },
  { label: 'Login', to: '/login' },
]

/* ---- Site search over public content ---- */
const searchOpen = ref(false)
const query = ref('')
const searchInput = ref<HTMLInputElement | null>(null)

// Public pages / sections anyone can view (logged out).
const searchPages = [
  { title: 'Home', sub: 'Live map & your duck’s journey', to: '/', keywords: 'home landing map live sightings track journey duck' },
  { title: 'Quacker Tracker', sub: 'Live map & latest activity', to: '/quackertracker', keywords: 'quacker tracker map ducks sightings live activity feed find' },
  { title: 'How It Works', sub: 'Scan, report, track', to: '/#how', keywords: 'how it works scan qr code report sighting steps guide' },
  { title: 'Shop', sub: 'Get your ducks', to: '/#shop', keywords: 'shop buy ducks store subscription merch' },
  { title: 'Stickers', sub: 'DashDuckies stickers', to: '/stickers', keywords: 'stickers merch swag' },
  { title: 'Forum', sub: 'Jeep Talk community', to: '/forum', keywords: 'forum jeep talk community discussion posts threads comments' },
  { title: 'Contact', sub: 'Email & socials', to: '/contact', keywords: 'contact email facebook instagram support help social get in touch' },
  { title: 'Terms', sub: 'Terms & conditions', to: '/terms', keywords: 'terms conditions legal privacy policy' },
  { title: 'Login / Join', sub: 'Sign in to your roster', to: '/login', keywords: 'login sign in join register account roster member' },
]

// Ducks come from the public activity feed, loaded the first time search opens.
const ducks = ref<{ name: string; to: string; img: string | null }[]>([])
let ducksLoaded = false
async function loadDucks() {
  if (ducksLoaded) return
  ducksLoaded = true
  try {
    const feed = await $fetch<any[]>('/api/feed')
    const seen = new Set<string>()
    ducks.value = (feed || [])
      .filter((t) => t.duckId && !seen.has(t.duckId) && seen.add(t.duckId))
      .map((t) => ({ name: t.duckName || 'Duck', to: `/quackertracker/${t.duckId}`, img: t.imageUrl || null }))
  } catch {
    /* feed unavailable — pages are still searchable */
  }
}

const pageResults = computed(() => {
  const q = query.value.trim().toLowerCase()
  if (!q) return []
  return searchPages.filter((p) => `${p.title} ${p.sub} ${p.keywords}`.toLowerCase().includes(q)).slice(0, 6)
})
const duckResults = computed(() => {
  const q = query.value.trim().toLowerCase()
  if (!q) return []
  return ducks.value.filter((d) => d.name.toLowerCase().includes(q)).slice(0, 8)
})
const hasResults = computed(() => pageResults.value.length > 0 || duckResults.value.length > 0)
const firstResult = computed(() => pageResults.value[0]?.to || duckResults.value[0]?.to || null)

function openSearch() {
  searchOpen.value = true
  loadDucks()
}
function goFirst() {
  if (!firstResult.value) return
  const to = firstResult.value
  searchOpen.value = false
  navigateTo(to)
}

const route = useRoute()
// The Quacker Tracker tab uses a black theme, so its nav bar goes dark too.
const darkNav = computed(() => route.path.startsWith('/quackertracker'))
// Close overlays on navigation.
watch(() => route.fullPath, () => {
  menuOpen.value = false
  searchOpen.value = false
})

function onKey(e: KeyboardEvent) {
  if (e.key === 'Escape') {
    menuOpen.value = false
    searchOpen.value = false
  }
}

// Lock body scroll while any overlay is open; focus the field when search opens.
watch([menuOpen, searchOpen], async ([m, s]) => {
  if (import.meta.client) document.body.style.overflow = m || s ? 'hidden' : ''
  if (s) {
    await nextTick()
    searchInput.value?.focus()
  } else {
    query.value = ''
  }
})

onMounted(() => window.addEventListener('keydown', onKey))
onBeforeUnmount(() => {
  window.removeEventListener('keydown', onKey)
  if (import.meta.client) document.body.style.overflow = ''
})
</script>

<template>
  <div class="dd-shell">
    <!-- Shared gold gradient for the nav symbols -->
    <svg width="0" height="0" style="position: absolute" aria-hidden="true">
      <defs>
        <linearGradient id="dd-gold-stroke" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stop-color="#ECD286" />
          <stop offset="1" stop-color="#A87D2C" />
        </linearGradient>
      </defs>
    </svg>

    <!-- NAVIGATION -->
    <nav class="dd-nav" :class="{ 'dd-nav--dark': darkNav }">
      <button
        type="button"
        class="dd-menu-btn"
        aria-label="Open menu"
        :aria-expanded="menuOpen"
        @click="menuOpen = true"
      >
        <span class="dd-menu-burger" aria-hidden="true"><span></span><span></span><span></span></span>
        <span class="dd-menu-btn-text">Menu</span>
      </button>

      <NuxtLink to="/" class="dd-nav-logo">
        <span class="duck-icon"><DuckMark :size="20" color="#16140F" /></span>
        DashDuckies
      </NuxtLink>

      <ul class="dd-nav-tabs">
        <li v-for="tab in tabLinks" :key="tab.to">
          <NuxtLink :to="tab.to">{{ tab.label }}</NuxtLink>
        </li>
      </ul>

      <div class="dd-nav-right">
        <button type="button" class="dd-nav-search-btn" aria-label="Search" @click="openSearch">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="url(#dd-gold-stroke)"
            stroke-width="2.75"
            stroke-linecap="round"
            stroke-linejoin="round"
            aria-hidden="true"
          >
            <circle cx="11" cy="11" r="7" />
            <path d="m21 21-4.3-4.3" />
          </svg>
        </button>
        <NuxtLink to="/cart" class="dd-nav-cart-btn" aria-label="Cart">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="url(#dd-gold-stroke)"
            stroke-width="2.5"
            stroke-linecap="round"
            stroke-linejoin="round"
            aria-hidden="true"
          >
            <circle cx="8" cy="21" r="1" />
            <circle cx="19" cy="21" r="1" />
            <path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12" />
          </svg>
        </NuxtLink>
      </div>
    </nav>

    <!-- SLIDE-OUT SIDEBAR MENU -->
    <transition name="dd-drawer">
      <div v-if="menuOpen" class="dd-drawer-root">
        <div class="dd-drawer-scrim" @click="menuOpen = false"></div>
        <aside class="dd-drawer" role="dialog" aria-modal="true" aria-label="Site menu">
          <div class="dd-drawer-head">
            <button type="button" class="dd-drawer-close" aria-label="Close menu" @click="menuOpen = false">✕</button>
            <NuxtLink to="/" class="dd-drawer-brand" @click="menuOpen = false">
              <DuckMark :size="38" color="#16140F" />
              <span>DashDuckies</span>
            </NuxtLink>
          </div>

          <nav class="dd-drawer-nav">
            <NuxtLink
              v-for="(link, i) in menuLinks"
              :key="link.to"
              :to="link.to"
              class="dd-drawer-link"
              :style="{ '--i': i }"
              @click="menuOpen = false"
            >
              <span class="dd-drawer-link-dash" aria-hidden="true"></span>
              <span class="dd-drawer-link-text">{{ link.label }}</span>
              <span class="dd-drawer-link-arrow" aria-hidden="true">→</span>
            </NuxtLink>
            <NuxtLink to="/login" class="dd-drawer-cta" @click="menuOpen = false">Login / Join Now</NuxtLink>
          </nav>
        </aside>
      </div>
    </transition>

    <!-- SITE SEARCH OVERLAY -->
    <transition name="dd-search">
      <div v-if="searchOpen" class="dd-search-root">
        <div class="dd-search-scrim" @click="searchOpen = false"></div>
        <div class="dd-search-panel" role="dialog" aria-modal="true" aria-label="Search DashDuckies">
          <div class="dd-search-inputwrap">
            <svg
              class="dd-search-input-icon"
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
              aria-hidden="true"
            >
              <circle cx="11" cy="11" r="7" />
              <path d="m21 21-4.3-4.3" />
            </svg>
            <input
              ref="searchInput"
              v-model="query"
              type="search"
              placeholder="Search DashDuckies…"
              aria-label="Search"
              @keyup.enter="goFirst"
            />
            <button type="button" class="dd-search-close" aria-label="Close search" @click="searchOpen = false">Esc</button>
          </div>

          <div class="dd-search-results">
            <template v-if="query.trim()">
              <div v-if="pageResults.length" class="dd-search-group">
                <p class="dd-search-group-label">Pages</p>
                <NuxtLink v-for="p in pageResults" :key="p.to" :to="p.to" class="dd-search-item" @click="searchOpen = false">
                  <span class="dd-search-item-icon">📄</span>
                  <span class="dd-search-item-main">
                    <span class="dd-search-item-title">{{ p.title }}</span>
                    <span class="dd-search-item-sub">{{ p.sub }}</span>
                  </span>
                </NuxtLink>
              </div>

              <div v-if="duckResults.length" class="dd-search-group">
                <p class="dd-search-group-label">Ducks</p>
                <NuxtLink v-for="d in duckResults" :key="d.to" :to="d.to" class="dd-search-item" @click="searchOpen = false">
                  <img v-if="d.img" :src="d.img" class="dd-search-item-thumb" alt="" />
                  <span v-else class="dd-search-item-icon">🦆</span>
                  <span class="dd-search-item-main">
                    <span class="dd-search-item-title">{{ d.name }}</span>
                    <span class="dd-search-item-sub">View tracker</span>
                  </span>
                </NuxtLink>
              </div>

              <p v-if="!hasResults" class="dd-search-empty">No results for “{{ query }}”.</p>
            </template>
            <p v-else class="dd-search-hint">Search pages, ducks, and more across DashDuckies.</p>
          </div>
        </div>
      </div>
    </transition>

    <!-- PAGE BODY -->
    <div class="dd-body">
      <slot />
    </div>

    <!-- FOOTER -->
    <footer class="dd-footer">
      <NuxtLink to="/" class="dd-footer-logo">
        <span class="dd-footer-coin"><DuckMark :size="15" color="#16140F" /></span>
        DashDuckies
      </NuxtLink>
      <ul class="dd-footer-links">
        <li><NuxtLink to="/quackertracker">Quacker Tracker</NuxtLink></li>
        <li><NuxtLink to="/#how">How It Works</NuxtLink></li>
        <li><NuxtLink to="/#shop">Shop</NuxtLink></li>
        <li><NuxtLink to="/stickers">Stickers</NuxtLink></li>
        <li><NuxtLink to="/contact">Contact</NuxtLink></li>
        <li><NuxtLink to="/terms">Terms</NuxtLink></li>
      </ul>
      <div class="dd-footer-copy">Find 'em · Badge 'em · Keep 'em · © {{ year }}</div>
    </footer>
  </div>
</template>

<style>
/* Sticky-footer shell so short pages keep the footer at the bottom. */
.dd-shell {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  background: var(--dd-ink);
  font-family: var(--font-body);
  color: var(--dd-cream);
}
.dd-body {
  flex: 1 0 auto;
  padding-top: 72px;
}
</style>

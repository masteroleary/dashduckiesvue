<script setup lang="ts">
const year = new Date().getFullYear()

const menuOpen = ref(false)

/* ---- Who's signed in (drives the nav's profile button) ---- */
// Resolved here in the LAYOUT, not left to the page. The nav is rendered before
// the page's own setup runs, so resolving it page-side meant every signed-in
// visitor got a flash of the "Login" button before it swapped to their profile.
const user = await useResolvedUser()
const { resolved, fetchMe, logout } = useAuth()
// Net for any route that arrives without auth state resolved.
onMounted(() => { if (!resolved.value) fetchMe().catch(() => {}) })

const accountOpen = ref(false)
const displayName = computed(() => {
  const u = user.value
  if (!u) return ''
  return u.name || u.email || u.phone || 'Your account'
})
// No avatar image reaches the browser (the session carries a name, not a photo),
// so the circle holds initials instead of loading something that isn't there.
const initials = computed(() => {
  const u = user.value
  if (!u) return ''
  const fromName = (u.name || '').trim()
  if (fromName) {
    const parts = fromName.split(/\s+/).filter(Boolean)
    return ((parts[0]?.[0] || '') + (parts[1]?.[0] || '')).toUpperCase()
  }
  return (u.email || u.phone || '?').replace(/[^a-zA-Z0-9]/g, '').slice(0, 2).toUpperCase()
})

const accountLinks = computed(() => [
  { label: 'My dashboard', to: '/app' },
  { label: 'My ducks', to: '/app/ducks' },
  { label: 'Subscription', to: '/app/subscription' },
  { label: 'Account settings', to: '/app/account' },
  ...(user.value?.isAdmin ? [{ label: 'Admin', to: '/app/admin' }] : []),
])

async function onSignOut() {
  accountOpen.value = false
  await logout()
  await navigateTo('/')
}

// Close the menu on an outside click or Escape, like any other menu of this kind.
function onDocClick(e: MouseEvent) {
  if (!(e.target as HTMLElement)?.closest?.('.dd-account')) accountOpen.value = false
}
function onDocKey(e: KeyboardEvent) {
  if (e.key === 'Escape') accountOpen.value = false
}
onMounted(() => {
  document.addEventListener('click', onDocClick)
  document.addEventListener('keydown', onDocKey)
})
onBeforeUnmount(() => {
  document.removeEventListener('click', onDocClick)
  document.removeEventListener('keydown', onDocKey)
})

// Shop is a group here rather than seven separate rows, so the drawer stays a
// short list you can take in at a glance. It opens in place when tapped.
const menuLinks = [
  { label: 'Home', to: '/' },
  { label: 'Quacker Tracker', to: '/quackertracker' },
  {
    label: 'Shop',
    to: '/shop',
    children: [
      { label: 'Shop All', to: '/shop' },
      { label: 'Subscription Box', to: '/subscription' },
      { label: 'Single Ducks', to: '/ducks' },
      { label: 'Stickers', to: '/stickers' },
      { label: 'Merch', to: '/merch' },
      { label: 'Gift Cards', to: '/gift-cards' },
    ],
  },
  { label: 'Forum', to: '/forum' },
  { label: 'About Us', to: '/about' },
  { label: 'Contact', to: '/contact' },
  { label: 'Terms', to: '/terms' },
]
const shopOpen = ref(false)
// Reset the group each time the drawer is closed, so it always opens tidy.
watch(menuOpen, (open) => { if (!open) shopOpen.value = false })

// Inline tabs shown on wider screens (the logo covers Home).
const tabLinks = [
  { label: 'Quacker Tracker', to: '/quackertracker' },
  // Shop opens a submenu; Stickers moved under it rather than sitting alongside.
  {
    label: 'Shop',
    to: '/shop',
    children: [
      { label: 'Subscription Box', to: '/subscription' },
      { label: 'Single Ducks', to: '/ducks' },
      { label: 'Stickers', to: '/stickers' },
      { label: 'Merch', to: '/merch' },
      { label: 'Gift Cards', to: '/gift-cards' },
    ],
  },
  { label: 'Forum', to: '/forum' },
  { label: 'About Us', to: '/about' },
  { label: 'Contact', to: '/contact' },
  { label: 'Terms', to: '/terms' },
]

/* ---- Site search over public content ---- */
const searchOpen = ref(false)
const query = ref('')
const searchInput = ref<HTMLInputElement | null>(null)

// Public pages / sections anyone can view (logged out).
const searchPages = [
  { title: 'Home', sub: 'Sightings map & your duck’s journey', to: '/', keywords: 'home landing map live sightings track journey duck' },
  { title: 'Quacker Tracker', sub: 'Sightings map & latest activity', to: '/quackertracker', keywords: 'quacker tracker map ducks sightings live activity feed find' },
  { title: 'How It Works', sub: 'Scan, report, track', to: '/#how', keywords: 'how it works scan qr code report sighting steps guide' },
  { title: 'Shop', sub: 'Everything you can buy', to: '/shop', keywords: 'shop buy ducks store subscription merch stickers gift cards purchase' },
  { title: 'Stickers', sub: 'DashDuckies stickers', to: '/stickers', keywords: 'stickers merch swag' },
  { title: 'Forum', sub: 'Jeep Talk community', to: '/forum', keywords: 'forum jeep talk community discussion posts threads comments' },
  { title: 'About Us', sub: 'Who we are and how it works', to: '/about', keywords: 'about us story who we are company mission qr code how it works tracking privacy' },
  { title: 'Contact', sub: 'Email & socials', to: '/contact', keywords: 'contact email facebook instagram support help social get in touch' },
  { title: 'Terms', sub: 'Terms & conditions', to: '/terms', keywords: 'terms conditions legal' },
  { title: 'Privacy Policy', sub: 'What we collect and why', to: '/privacy', keywords: 'privacy policy data location tracking gdpr personal information' },
  { title: 'Login / Join', sub: 'Sign in to your roster', to: '/login', keywords: 'login sign in join register account roster member' },
]

// Ducks come from the activity feed, loaded the first time search opens. The
// feed is members-only, so this quietly returns nothing for signed-out visitors
// and search falls back to pages alone.
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

      <NuxtLink to="/" class="dd-nav-logo" aria-label="DashDuckies home">
        <BrandMark :size="23" />
      </NuxtLink>

      <ul class="dd-nav-tabs">
        <li v-for="tab in tabLinks" :key="tab.to" :class="{ 'dd-tab-parent': tab.children }">
          <NuxtLink :to="tab.to">
            <span :class="{ 'qt-brand': tab.label === 'Quacker Tracker' }">{{ tab.label }}</span>
            <svg v-if="tab.children" class="dd-tab-caret" viewBox="0 0 24 24" aria-hidden="true">
              <path d="M6 9l6 6 6-6" />
            </svg>
          </NuxtLink>
          <ul v-if="tab.children" class="dd-tab-menu">
            <li v-for="child in tab.children" :key="child.to">
              <NuxtLink :to="child.to">{{ child.label }}</NuxtLink>
            </li>
          </ul>
        </li>
      </ul>

      <div class="dd-nav-right">
        <NuxtLink v-if="!user" to="/login" class="dd-nav-login">Login</NuxtLink>

        <div v-else class="dd-account">
          <button
            type="button"
            class="dd-account-btn"
            :aria-expanded="accountOpen"
            aria-haspopup="true"
            @click="accountOpen = !accountOpen"
          >
            <span class="dd-account-avatar" aria-hidden="true">{{ initials }}</span>
            <span class="dd-account-name">{{ displayName }}</span>
            <svg class="dd-account-caret" viewBox="0 0 24 24" aria-hidden="true">
              <path d="M6 9l6 6 6-6" />
            </svg>
          </button>

          <div v-if="accountOpen" class="dd-account-menu">
            <div class="dd-account-head">
              <b>{{ displayName }}</b>
              <span v-if="user.isAdmin" class="dd-account-tag">Admin</span>
            </div>
            <NuxtLink
              v-for="link in accountLinks"
              :key="link.to"
              :to="link.to"
              class="dd-account-link"
              @click="accountOpen = false"
            >
              {{ link.label }}
            </NuxtLink>
            <button type="button" class="dd-account-link dd-account-signout" @click="onSignOut">
              Sign out
            </button>
          </div>
        </div>
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
            <NuxtLink to="/" class="dd-drawer-brand" aria-label="DashDuckies home" @click="menuOpen = false">
              <BrandMark :size="23" duck-color="#16140F" />
            </NuxtLink>
          </div>

          <nav class="dd-drawer-nav">
            <template v-for="(link, i) in menuLinks" :key="link.to">
              <!-- Group: opens in place instead of navigating -->
              <button
                v-if="link.children"
                type="button"
                class="dd-drawer-link dd-drawer-group"
                :class="{ 'is-open': shopOpen }"
                :style="{ '--i': i }"
                :aria-expanded="shopOpen"
                @click="shopOpen = !shopOpen"
              >
                <span class="dd-drawer-link-dash" aria-hidden="true"></span>
                <span class="dd-drawer-link-text">{{ link.label }}</span>
                <svg class="dd-drawer-caret" viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M6 9l6 6 6-6" />
                </svg>
              </button>

              <NuxtLink
                v-else
                :to="link.to"
                class="dd-drawer-link"
                :style="{ '--i': i }"
                @click="menuOpen = false"
              >
                <span class="dd-drawer-link-dash" aria-hidden="true"></span>
                <span class="dd-drawer-link-text" :class="{ 'qt-brand': link.label === 'Quacker Tracker' }">{{ link.label }}</span>
                <span class="dd-drawer-link-arrow" aria-hidden="true">→</span>
              </NuxtLink>

              <div v-if="link.children && shopOpen" class="dd-drawer-sub">
                <NuxtLink
                  v-for="child in link.children"
                  :key="child.to"
                  :to="child.to"
                  class="dd-drawer-sublink"
                  @click="menuOpen = false"
                >
                  {{ child.label }}
                </NuxtLink>
              </div>
            </template>
            <template v-if="user">
              <NuxtLink to="/app" class="dd-drawer-cta" @click="menuOpen = false">
                My account ({{ displayName }})
              </NuxtLink>
              <button type="button" class="dd-drawer-signout" @click="menuOpen = false; onSignOut()">
                Sign out
              </button>
            </template>
            <NuxtLink v-else to="/login" class="dd-drawer-cta" @click="menuOpen = false">Login / Join Now</NuxtLink>
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
                    <span class="dd-search-item-title" :class="{ 'qt-brand': p.title === 'Quacker Tracker' }">{{ p.title }}</span>
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
      <NuxtLink to="/" class="dd-footer-logo" aria-label="DashDuckies home">
        <BrandMark :size="18" />
      </NuxtLink>
      <ul class="dd-footer-links">
        <li><NuxtLink to="/quackertracker"><span class="qt-brand">Quacker Tracker</span></NuxtLink></li>
        <li><NuxtLink to="/shop">Shop</NuxtLink></li>
        <li><NuxtLink to="/stickers">Stickers</NuxtLink></li>
        <li><NuxtLink to="/about">About Us</NuxtLink></li>
        <li><NuxtLink to="/contact">Contact</NuxtLink></li>
        <li><NuxtLink to="/terms">Terms</NuxtLink></li>
        <li><NuxtLink to="/privacy">Privacy</NuxtLink></li>
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

<script setup lang="ts">
useHead({
  title: 'Dash Duckies — Track Rubber Ducks Around the World',
  meta: [
    {
      name: 'description',
      content:
        'Scan, register, and follow rubber ducks as they travel the globe. See live sightings on the map and join the Dash Duckies community.',
    },
    { property: 'og:title', content: 'DashDuckies — Track rubber ducks around the world' },
    { property: 'og:image', content: '/ducks-on-board.png' },
  ],
})

const { data: stats } = await useFetch('/api/stats')
const { data: sightings } = await useFetch('/api/map/sightings')

const steps = [
  {
    img: '/images/step1.jpg',
    title: 'Scan the QR Code',
    text: "Every DashDuckie has a unique QR code on the bottom. Just scan it with your phone to get started — no app needed.",
  },
  {
    img: '/images/step2.jpg',
    title: 'Report the Sighting',
    text: 'Log in and tell us where you found your feathered friend. Add a photo, leave a message, and mark your discovery on the map.',
  },
  {
    img: '/images/step3.jpg',
    title: 'Track its Journey',
    text: "Watch your duck travel the world in real time. Follow every sighting on an interactive map and see how far it's gone.",
  },
]
</script>

<template>
  <div class="home-page">
    <!-- MAP SECTION -->
    <div class="dd-map-section">
      <div class="dd-map-header">
        <div>
          <div class="dd-section-label">Live map</div>
          <h2 class="dd-section-title" style="margin-bottom: 0; max-width: 340px">
            Track your duck's journey
          </h2>
        </div>
        <NuxtLink to="/quackertracker" class="dd-btn-ghost" style="margin-bottom: 8px">View full map</NuxtLink>
      </div>
      <div class="dd-map-container" style="overflow: hidden">
        <ClientOnly>
          <LiveMap :sightings="sightings || []" height="420px" />
        </ClientOnly>
        <div class="dd-map-cta-card" style="position: absolute; left: 24px; bottom: 24px; z-index: 500">
          <strong>🦆 Your duck is out there.</strong>
          <p>Scan a QR code to add your sighting to the global DashDuckies map.</p>
          <NuxtLink to="/quackertracker" class="dd-btn-primary" style="font-size: 13px; padding: 12px 24px">
            Track Ducks
          </NuxtLink>
        </div>
      </div>
    </div>

    <!-- STATS BAR -->
    <div class="dd-stats-bar">
      <div class="dd-stat">
        <div class="dd-stat-num">{{ stats?.ducks ?? 0 }}+</div>
        <div class="dd-stat-label">Ducks in the wild</div>
      </div>
      <div class="dd-stat">
        <div class="dd-stat-num">{{ stats?.sightings ?? 0 }}</div>
        <div class="dd-stat-label">Sightings reported</div>
      </div>
      <div class="dd-stat">
        <div class="dd-stat-num">{{ stats?.duckers ?? 0 }}+</div>
        <div class="dd-stat-label">Happy duckers</div>
      </div>
    </div>

    <!-- HOW IT WORKS -->
    <section class="dd-section" id="how">
      <div class="dd-section-label">How it works</div>
      <h2 class="dd-section-title">Simple. Fun. Connected.</h2>
      <div class="dd-steps-grid">
        <div v-for="s in steps" :key="s.title" class="dd-step-card">
          <img :src="s.img" :alt="s.title" class="dd-step-image" />
          <div class="dd-step-title">{{ s.title }}</div>
          <p class="dd-step-desc">{{ s.text }}</p>
        </div>
      </div>
    </section>

    <!-- SHOP -->
    <div class="dd-shop-section" id="shop">
      <div class="dd-shop-inner">
        <div class="dd-shop-text">
          <div class="dd-section-label">Get your ducks</div>
          <h2 class="dd-shop-title">Start a flock. Share the fun.</h2>
          <p class="dd-shop-sub">
            Choose a subscription to get two fresh ducks every month, or hand-pick your favorites from
            the shop. Every duck comes ready to roam.
          </p>
          <div class="dd-shop-options">
            <a href="#" class="dd-shop-option" @click.prevent>
              <span class="dd-coming-soon-badge">Coming Soon</span>
              <div class="dd-shop-option-left">
                <span class="dd-shop-option-icon">📦</span>
                <div>
                  <div class="dd-shop-option-label">Subscription Boxes</div>
                  <div class="dd-shop-option-desc">2 original ducks delivered monthly</div>
                </div>
              </div>
              <span class="dd-shop-arrow">→</span>
            </a>
            <a href="#" class="dd-shop-option" @click.prevent>
              <span class="dd-coming-soon-badge">Coming Soon</span>
              <div class="dd-shop-option-left">
                <span class="dd-shop-option-icon">🛒</span>
                <div>
                  <div class="dd-shop-option-label">Individual Ducks</div>
                  <div class="dd-shop-option-desc">Pick your favorites from our collection</div>
                </div>
              </div>
              <span class="dd-shop-arrow">→</span>
            </a>
            <NuxtLink to="/stickers" class="dd-shop-option">
              <div class="dd-shop-option-left">
                <span class="dd-shop-option-icon">🏷️</span>
                <div>
                  <div class="dd-shop-option-label">Quacker Tracker Stickers</div>
                  <div class="dd-shop-option-desc">Get your own ducks on the map!</div>
                </div>
              </div>
              <span class="dd-shop-arrow">→</span>
            </NuxtLink>
          </div>
        </div>
        <div class="dd-shop-visual">
          <img src="/ducks-on-board.png" alt="DashDuckies on board" class="dd-shop-hero-img" />
        </div>
      </div>
    </div>

    <NewsletterDialog />
  </div>
</template>

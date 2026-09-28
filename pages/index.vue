<script setup lang="ts">
useHead({
  title: 'DashDuckies — A monthly duck club with a story to tell',
  meta: [
    {
      name: 'description',
      content:
        'Get brand-new rubber ducks every month, each with a QR code. Set them loose and follow their journey around the world on the live DashDuckies map.',
    },
    { property: 'og:title', content: 'DashDuckies — Send a little duck on a big adventure' },
    { property: 'og:image', content: '/ducks-on-board.png' },
  ],
})

const { data: stats } = await useFetch('/api/stats')
const { data: sightings } = await useFetch('/api/map/sightings')

// "How it works" popup
const howOpen = ref(false)
function onHowKey(e: KeyboardEvent) {
  if (e.key === 'Escape') howOpen.value = false
}
watch(howOpen, (open) => {
  if (import.meta.client) document.body.style.overflow = open ? 'hidden' : ''
})
onMounted(() => window.addEventListener('keydown', onHowKey))
onBeforeUnmount(() => {
  window.removeEventListener('keydown', onHowKey)
  if (import.meta.client) document.body.style.overflow = ''
})
</script>

<template>
  <div class="home-page">
    <!-- HERO -->
    <header class="dd-hp-hero">
      <div class="dd-hp-hero-copy">
        <span class="dd-hp-pill">🦆 Monthly duck club</span>
        <h1>Send a duckie on a <span class="hl">big adventure</span></h1>
        <p class="dd-hp-sub">
          Two brand-new DashDuckies land on your doorstep every month — each with a secret QR code.
          Set them loose and watch them travel the world, one sighting at a time.
        </p>
        <div class="dd-hp-cta-row">
          <NuxtLink to="/#shop" class="dd-hp-btn dd-hp-btn-primary">Start your flock →</NuxtLink>
          <button type="button" class="dd-hp-btn dd-hp-btn-ghost" @click="howOpen = true">How it works</button>
        </div>
        <p class="dd-hp-trust">★★★★★ &nbsp;{{ stats?.ducks ?? 0 }}+ ducks in the wild · new ducks every month</p>
      </div>

      <div class="dd-hp-hero-visual">
        <div class="dd-hp-stage">
          <img
            src="/images/adventure-duck.jpg"
            alt="A DashDuckies rubber duck in a beanie and sunglasses on a desk with a globe, world map, compass and national-park travel patches"
            class="dd-hp-photo"
          />
        </div>
      </div>
    </header>

    <!-- PROMOS: Quacker Tracker (left) + QR Stickers (right) -->
    <section class="dd-promos">
      <NuxtLink to="/quackertracker" class="dd-promo dd-promo-tracker">
        <div class="dd-promo-map" aria-hidden="true">
          <svg class="dd-promo-mapsvg" viewBox="0 0 400 200" preserveAspectRatio="xMidYMid slice">
            <rect width="400" height="200" fill="#EFE8D6" />
            <!-- water -->
            <path d="M-20 172 C 70 148 130 128 215 136 S 360 158 430 138 L 430 220 L -20 220 Z" fill="#A6D3E4" />
            <!-- park -->
            <path d="M300 22 q 62 -6 72 34 q 6 40 -46 44 q -54 2 -48 -40 q 4 -34 22 -38 z" fill="#C8E1A6" />
            <!-- city blocks -->
            <g fill="#E7DCC0">
              <rect x="16" y="16" width="32" height="26" rx="3" />
              <rect x="16" y="70" width="32" height="30" rx="3" />
              <rect x="150" y="14" width="54" height="30" rx="3" />
              <rect x="250" y="96" width="44" height="26" rx="3" />
            </g>
            <!-- roads: casing, then white on top -->
            <g fill="none" stroke-linecap="round">
              <g stroke="#E2D9C4">
                <path d="M-10 54 C 100 44 180 74 252 64 S 420 50 430 56" stroke-width="10" />
                <path d="M60 -10 C 70 60 92 120 82 210" stroke-width="10" />
                <path d="M224 -10 C 214 70 232 130 242 210" stroke-width="9" />
                <path d="M-10 130 C 90 120 170 140 250 132 S 420 120 430 128" stroke-width="8" />
              </g>
              <g stroke="#fff">
                <path d="M-10 54 C 100 44 180 74 252 64 S 420 50 430 56" stroke-width="6" />
                <path d="M60 -10 C 70 60 92 120 82 210" stroke-width="6" />
                <path d="M224 -10 C 214 70 232 130 242 210" stroke-width="5" />
                <path d="M-10 130 C 90 120 170 140 250 132 S 420 120 430 128" stroke-width="4.5" />
              </g>
            </g>
            <!-- the duck's route (dashes march toward the destination) -->
            <path class="dd-map-route" d="M78 76 C 118 100 158 124 198 116 C 244 108 282 82 316 74" fill="none" stroke="#A87D2C" stroke-width="2.8" stroke-linecap="round" stroke-dasharray="6 6" />
            <!-- destination city (pulses) -->
            <circle class="dd-map-pulse" cx="316" cy="74" r="6" fill="#0F766E" />
            <circle cx="316" cy="74" r="4.5" fill="#A87D2C" stroke="#fff" stroke-width="2" />
            <!-- ducks parked on the route -->
            <text class="dd-map-duck" x="78" y="76" text-anchor="middle" dominant-baseline="central" font-size="20">🦆</text>
            <text class="dd-map-duck" x="198" y="116" text-anchor="middle" dominant-baseline="central" font-size="20">🦆</text>
            <!-- a duck traveling to the new city -->
            <g class="dd-map-traveler">
              <text class="dd-map-duck" text-anchor="middle" dominant-baseline="central" font-size="20">🦆</text>
              <animateMotion dur="3.8s" repeatCount="indefinite" path="M198 116 C 244 108 282 82 316 74" calcMode="spline" keyPoints="0;1" keyTimes="0;1" keySplines="0.42 0 0.2 1" />
              <animate attributeName="opacity" dur="3.8s" repeatCount="indefinite" values="0;1;1;0" keyTimes="0;0.14;0.82;1" />
            </g>
          </svg>
        </div>
        <p class="dd-promo-eyebrow dd-promo-eyebrow--teal">Live map</p>
        <h3 class="dd-promo-title">Quacker Tracker</h3>
        <p class="dd-promo-text">See where every duck is right now — and follow the whole flock as it roams the world, pin by pin.</p>
        <span class="dd-promo-link">Open the tracker →</span>
      </NuxtLink>

      <div class="dd-promo dd-promo-stickers">
        <div class="dd-promo-stage" aria-hidden="true">
          <div class="dd-promo-sticker">
            <svg viewBox="0 0 100 100" class="dd-qr-svg" aria-hidden="true">
              <rect width="100" height="100" rx="8" fill="#fff" />
              <g fill="#16140F">
                <rect x="10" y="10" width="24" height="24" rx="4" />
                <rect x="66" y="10" width="24" height="24" rx="4" />
                <rect x="10" y="66" width="24" height="24" rx="4" />
              </g>
              <g fill="#fff">
                <rect x="15" y="15" width="14" height="14" rx="2.5" />
                <rect x="71" y="15" width="14" height="14" rx="2.5" />
                <rect x="15" y="71" width="14" height="14" rx="2.5" />
              </g>
              <g fill="#16140F">
                <rect x="19" y="19" width="6" height="6" rx="1.5" />
                <rect x="75" y="19" width="6" height="6" rx="1.5" />
                <rect x="19" y="75" width="6" height="6" rx="1.5" />
                <rect x="42" y="12" width="5" height="5" /><rect x="50" y="12" width="5" height="5" />
                <rect x="42" y="20" width="5" height="5" /><rect x="57" y="18" width="5" height="5" />
                <rect x="12" y="42" width="5" height="5" /><rect x="20" y="42" width="5" height="5" />
                <rect x="12" y="50" width="5" height="5" /><rect x="18" y="57" width="5" height="5" />
                <rect x="42" y="42" width="5" height="5" /><rect x="50" y="42" width="5" height="5" />
                <rect x="58" y="42" width="5" height="5" /><rect x="42" y="50" width="5" height="5" />
                <rect x="50" y="58" width="5" height="5" /><rect x="66" y="50" width="5" height="5" />
                <rect x="74" y="42" width="5" height="5" /><rect x="82" y="50" width="5" height="5" />
                <rect x="66" y="66" width="5" height="5" /><rect x="75" y="74" width="5" height="5" />
                <rect x="82" y="66" width="5" height="5" /><rect x="50" y="74" width="5" height="5" />
                <rect x="42" y="82" width="5" height="5" /><rect x="66" y="82" width="5" height="5" />
                <rect x="82" y="82" width="5" height="5" />
              </g>
            </svg>
            <span class="dd-qr-scan">🦆 Scan me</span>
          </div>
        </div>
        <p class="dd-promo-eyebrow">QR Stickers</p>
        <h3 class="dd-promo-title">Give your duckie a name and story</h3>
        <p class="dd-promo-text">Peel-and-stick QR codes made just for your ducks — scan to tell your duck's story, snap photos along the way, and watch them travel the world and tell their new stories.</p>
        <NuxtLink to="/stickers" class="dd-hp-btn dd-hp-btn-primary">Purchase now →</NuxtLink>
      </div>
    </section>

    <!-- HOW IT WORKS -->
    <section id="how" class="dd-hp-how">
      <p class="dd-hp-eyebrow">How it works</p>
      <h2>Three steps to a globe-trotting duck</h2>
      <div class="dd-hp-steps">
        <article class="dd-hp-step">
          <img
            src="/images/step1.jpg"
            alt="The underside of a gold DashDuckies rubber duck, showing its round Quacker Tracker QR code sticker"
            class="dd-hp-step-photo"
          />
          <h3>Scan the QR code</h3>
          <p>Point your phone's camera at the code on any duckie. (Get duckies through a subscription,
            or purchase duckie stickers for your own ducks.)</p>
        </article>
        <article class="dd-hp-step">
          <img
            src="/images/step2.jpg"
            alt="A man outdoors beside a jeep taking a selfie while holding up a small yellow DashDuckies duck"
            class="dd-hp-step-photo"
          />
          <h3>Post a sighting</h3>
          <p>Add a photo and where you spotted it, then send the duck on its way to the next finder.</p>
        </article>
        <article class="dd-hp-step">
          <img
            src="/images/step3.jpg"
            alt="A map of North America dotted with yellow duck pins marking cities where ducks have been scanned"
            class="dd-hp-step-photo"
          />
          <h3>Watch your ducks travel</h3>
          <p>Every sighting drops a fresh pin on the live map — follow your ducks from city to city.</p>
        </article>
      </div>
    </section>

    <!-- SUBSCRIPTION -->
    <section id="shop" class="dd-hp-boxsec">
      <div class="dd-hp-boxvis">
        <img
          src="/images/subscription-box.jpg"
          alt="A delighted young girl and her dad unboxing a DashDuckies subscription box, lifting out a purple rubber duck"
          class="dd-hp-boxphoto"
        />
      </div>
      <div class="dd-hp-boxcopy">
        <p class="dd-hp-eyebrow dd-hp-eyebrow--teal">The subscription</p>
        <h2>A fresh flock, every single month</h2>
        <p>
          Each DashDuckies box is packed with <b>two collectible ducks</b> — every one with its own
          name, personality, and trackable QR code. New themes drop monthly, so no two boxes are ever
          the same.
        </p>
        <ul class="dd-hp-ticks">
          <li>Two brand-new ducks each month</li>
          <li>Unique QR code on every duck</li>
          <li>Cancel or skip anytime</li>
        </ul>
        <NuxtLink to="/cart" class="dd-hp-btn dd-hp-btn-primary">See this month's box →</NuxtLink>
      </div>
    </section>

    <!-- LIVE TRACKING -->
    <section class="dd-hp-track">
      <div class="dd-hp-track-copy">
        <p class="dd-hp-eyebrow">Live tracking</p>
        <h2>Follow every waddle, in real time</h2>
        <p>
          Whenever someone finds your duck and scans its code, a new sighting lands on the global
          map. Watch your little traveler hop from city to city.
        </p>
        <NuxtLink to="/quackertracker" class="dd-hp-btn dd-hp-btn-ghost">Explore the live map →</NuxtLink>
      </div>
      <div class="dd-hp-track-map">
        <span class="dd-hp-chip"><i></i>Live map</span>
        <ClientOnly>
          <LiveMap :sightings="sightings || []" height="320px" />
        </ClientOnly>
      </div>
    </section>

    <!-- TESTIMONIAL -->
    <section class="dd-hp-quote">
      <p class="dd-hp-quote-mark">“</p>
      <blockquote>
        My duck made it from Orlando to Las Vegas in three weeks — my kids check the map every single
        morning to see where he's off to next.
      </blockquote>
      <p class="dd-hp-quote-by">— A DashDuckies ducker</p>
    </section>

    <!-- FINAL CTA -->
    <section class="dd-hp-final">
      <h2>Ready to start your flock?</h2>
      <p>Your first duck is waiting. Join the club and send it out into the world this month.</p>
      <NuxtLink to="/cart" class="dd-hp-btn dd-hp-btn-dark">Start your subscription →</NuxtLink>
    </section>

    <!-- HOW IT WORKS POPUP -->
    <transition name="dd-how">
      <div v-if="howOpen" class="dd-how-overlay" @click.self="howOpen = false">
        <div class="dd-how-modal" role="dialog" aria-modal="true" aria-labelledby="dd-how-title">
          <button type="button" class="dd-how-close" aria-label="Close" @click="howOpen = false">✕</button>
          <p class="dd-how-eyebrow">How it works</p>
          <h2 id="dd-how-title" class="dd-how-title">From your doorstep to the world</h2>
          <p class="dd-how-intro">Here's the whole adventure, start to finish:</p>
          <ol class="dd-how-steps">
            <li>
              <span class="dd-how-num">1</span>
              <div>
                <h3>Join the club</h3>
                <p>Get <strong>two fresh ducks</strong> on your doorstep every month — or grab <NuxtLink to="/stickers" @click="howOpen = false">QR stickers</NuxtLink> for ducks you already own.</p>
              </div>
            </li>
            <li>
              <span class="dd-how-num">2</span>
              <div>
                <h3>Find the QR code</h3>
                <p>Every duck hides a <strong>secret QR code</strong> on its bottom — its passport to the map.</p>
              </div>
            </li>
            <li>
              <span class="dd-how-num">3</span>
              <div>
                <h3>Set it loose</h3>
                <p>Leave it somewhere fun for a stranger to find, or gift it to a friend.</p>
              </div>
            </li>
            <li>
              <span class="dd-how-num">4</span>
              <div>
                <h3>Get it scanned</h3>
                <p>Whoever finds it scans the code (no app needed) and logs where they spotted it.</p>
              </div>
            </li>
            <li>
              <span class="dd-how-num">5</span>
              <div>
                <h3>Watch it roam</h3>
                <p>Every scan drops a pin on your <strong>live map</strong> — follow your duck city to city!</p>
              </div>
            </li>
          </ol>
          <div class="dd-how-actions">
            <NuxtLink to="/#shop" class="dd-hp-btn dd-hp-btn-primary" @click="howOpen = false">Start your flock →</NuxtLink>
          </div>
        </div>
      </div>
    </transition>
  </div>
</template>

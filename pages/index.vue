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

// The map preview is members-only, like /quackertracker itself, so the session
// has to resolve during SSR too. Stats are plain counts and stay public.
const user = await useResolvedUser()

const { data: stats } = await useFetch('/api/stats')
const { data: sightings } = await useFetch('/api/map/sightings', {
  immediate: Boolean(user.value),
  default: () => [],
})

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
          <NuxtLink to="/shop" class="dd-hp-btn dd-hp-btn-primary">Start your flock →</NuxtLink>
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

    <!-- PROMOS: Quacker Tracker (left) + Shop (right) -->
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
        <p class="dd-promo-eyebrow dd-promo-eyebrow--teal">Sightings map</p>
        <h3 class="dd-promo-title"><span class="qt-brand">Quacker Tracker</span></h3>
        <p class="dd-promo-text">See where every duck is right now — and follow the whole flock as it roams the world, pin by pin.</p>
        <span class="dd-promo-link">Open the tracker →</span>
      </NuxtLink>

      <NuxtLink to="/subscription" class="dd-promo dd-promo-sub">
        <span class="dd-promo-ribbon">New ducks every month</span>
        <div class="dd-promo-boxart" aria-hidden="true">
          <CoolDuck :size="132" />
        </div>
        <p class="dd-promo-eyebrow dd-promo-eyebrow--gold">Subscription Box</p>
        <h3 class="dd-promo-title"><span class="dd-promo-hl">Not just a duck</span></h3>
        <p class="dd-promo-text">
          Each one is <span class="dd-promo-pop">a little work of art</span> —
          <strong>individually styled by hand, one at a time.</strong>
          Accessories, colours, character. No two ever the same.
        </p>
        <span class="dd-promo-link">See what's in the box →</span>
      </NuxtLink>

      <div class="dd-promo dd-promo-shop dd-promo-wide">
        <div class="shop-band">
          <div>
            <p class="dd-promo-eyebrow">Shop</p>
            <h3 class="dd-promo-title">Everything for your flock</h3>
            <p class="dd-promo-text">Subscriptions, single ducks, stickers, merch and gift cards.</p>
          </div>
          <NuxtLink to="/shop" class="dd-hp-btn dd-hp-btn-primary">Browse the shop →</NuxtLink>
        </div>
      </div>
    </section>

    <!-- HOW IT WORKS -->
    <section id="how" class="dd-hp-how">
      <p class="dd-hp-eyebrow">3 Steps</p>
      <h2>Scan. Post. Follow.</h2>
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
          <p>Every sighting drops a fresh pin on the map — follow your ducks from city to city.</p>
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
        <p class="dd-hp-eyebrow">The map</p>
        <h2>Follow every waddle, sighting by sighting</h2>
        <p>
          Whenever someone finds your duck and scans its code, a new sighting lands on the global
          map. Watch your little traveler hop from city to city.
        </p>
        <p class="dd-hp-note">
          The map only moves when someone chooses to post a sighting — there's no tracking in
          between, and no location is ever shared on its own.
        </p>
        <NuxtLink to="/quackertracker" class="dd-hp-btn dd-hp-btn-ghost">Explore the map →</NuxtLink>
      </div>
      <div class="dd-hp-track-map">
        <span class="dd-hp-chip"><i></i>Sightings map</span>
        <ClientOnly v-if="user">
          <LiveMap :sightings="sightings || []" height="320px" />
        </ClientOnly>
        <div v-else class="dd-hp-maplock">
          <span class="dd-hp-maplock-icon" aria-hidden="true">🔒</span>
          <p class="dd-hp-maplock-title">The map is for members</p>
          <p class="dd-hp-maplock-text">Sign in to see every duck that's been spotted, and where.</p>
          <NuxtLink to="/quackertracker" class="dd-hp-btn dd-hp-btn-primary">Sign in to see the map →</NuxtLink>
        </div>
      </div>
    </section>

    <!-- SOCIAL MEDIA FOR DUCKS -->
    <section class="dd-hp-social">
      <div class="dd-hp-social-copy">
        <p class="dd-hp-eyebrow">What is <span class="qt-brand">Quacker Tracker</span>?</p>
        <h2>Social media — for ducks</h2>
        <p class="dd-hp-social-lede">
          The ducks have the profiles, not you.
        </p>
        <p>
          Every DashDuckie gets its own page: a name, a story, and a photo. Then it goes out into the
          world. Whoever finds it scans the code on its base, reads how far it has already come, and
          posts the next chapter — a photo and the place they found it.
        </p>
        <ul class="dd-hp-social-list">
          <li>
            <span class="dd-hp-social-icon" aria-hidden="true">🪪</span>
            <span><b>A profile for every duck</b> — its name, its story, and everywhere it has been.</span>
          </li>
          <li>
            <span class="dd-hp-social-icon" aria-hidden="true">➕</span>
            <span><b>Follow the ones you like</b> — yours, or somebody else's that caught your eye.</span>
          </li>
          <li>
            <span class="dd-hp-social-icon" aria-hidden="true">📰</span>
            <span><b>A feed of new sightings</b> — the latest finds from across the whole flock.</span>
          </li>
          <li>
            <span class="dd-hp-social-icon" aria-hidden="true">🔔</span>
            <span><b>A nudge when yours turns up</b> — we tell you the moment someone posts one.</span>
          </li>
        </ul>
        <p class="dd-hp-note">
          The only thing with a profile is a rubber duck. Nobody's movements are followed — a post
          happens because a person chose to make one.
        </p>
        <NuxtLink to="/quackertracker" class="dd-hp-btn dd-hp-btn-primary">See <span class="qt-brand">Quacker Tracker</span> →</NuxtLink>
      </div>

      <!-- Illustrative only: this is what a duck's page looks like, not a real duck. -->
      <div class="dd-hp-social-card" aria-hidden="true">
        <span class="dd-hp-social-tag">Example profile</span>
        <div class="dd-hp-social-head">
          <span class="dd-hp-social-avatar"><DuckMark :size="34" color="#FFC61A" /></span>
          <span class="dd-hp-social-who">
            <b>Captain Waddles</b>
            <i>Duck #1042</i>
          </span>
          <span class="dd-hp-social-follow">Following</span>
        </div>
        <p class="dd-hp-social-story">
          "Started out on a kitchen windowsill. Packed for the airport in a coat pocket and hasn't
          been home since."
        </p>
        <div class="dd-hp-social-post">
          <span class="dd-hp-social-pin" aria-hidden="true">📍</span>
          <span>
            <b>Spotted on a harbour wall</b>
            <i>Posted by whoever found it</i>
          </span>
        </div>
        <div class="dd-hp-social-post">
          <span class="dd-hp-social-pin" aria-hidden="true">📍</span>
          <span>
            <b>Left in a hostel lobby</b>
            <i>Posted by whoever found it</i>
          </span>
        </div>
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
                <p>Every scan drops a pin on your <strong>map</strong> — follow your duck city to city!</p>
              </div>
            </li>
          </ol>
          <div class="dd-how-actions">
            <NuxtLink to="/shop" class="dd-hp-btn dd-hp-btn-primary" @click="howOpen = false">Start your flock →</NuxtLink>
          </div>
        </div>
      </div>
    </transition>
  </div>
</template>

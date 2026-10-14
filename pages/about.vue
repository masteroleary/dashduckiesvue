<script setup lang="ts">
useHead({
  title: 'About Us — DashDuckies',
  meta: [
    {
      name: 'description',
      content:
        'DashDuckies gives every rubber duck a name, a story and a QR code — so you can follow it around the world as people find it and post where they saw it.',
    },
  ],
})

// Same live counts the homepage uses, straight from the database.
const { data: stats } = await useFetch('/api/stats')

const beliefs = [
  {
    icon: '🗺️',
    title: 'The map is made by people',
    text:
      'A pin only appears when someone finds a duck and chooses to post about it. Nothing is tracked in between — no signal, no chip, no following anyone around.',
  },
  {
    icon: '✍️',
    title: 'Every duck has a story',
    text:
      'You name each duck and write where it came from before you set it loose. Whoever finds it reads that story on their phone, then adds the next chapter.',
  },
  {
    icon: '🌍',
    title: 'The best part is letting go',
    text:
      'Leave a duck on a park bench, a hotel lobby, a hiking trail. Where it turns up next is completely out of your hands — that is the whole point.',
  },
  {
    icon: '🤝',
    title: 'Anyone can join in',
    text:
      'Finders never need an account or an app. They point a phone camera at the code, and they are in.',
  },
]

const journey = [
  { step: 'A duck goes out', text: 'You name it, write its story, and leave it somewhere out in the world.' },
  { step: 'Someone finds it', text: 'They point their phone camera at the code on its base and read who it is.' },
  { step: 'They post a sighting', text: 'A photo and a place. That drops a pin on the map and lets you know.' },
  { step: 'It keeps going', text: 'They leave it for the next person, and the trail grows a little longer.' },
]
</script>

<template>
  <div class="about-page">
    <!-- HEADER -->
    <h1 class="about-title">
      <span class="about-title-word">About&nbsp;Us</span>
      <DuckMark class="about-title-duck" :size="46" color="#FFC61A" />
    </h1>
    <p class="about-sub">A rubber duck, a QR code, and a world full of people willing to say “I found this.”</p>

    <!-- INTRO -->
    <section class="about-hero">
      <div>
        <h2 class="about-h2">What we do</h2>
        <p class="about-lede">
          DashDuckies makes collectible rubber ducks that can be followed around the world.
        </p>
        <p class="about-text">
          Every duck carries its own <span class="qt-brand">Quacker Tracker</span> code. Before you set one
          loose, you give it a name and a short story. Then you leave it somewhere — a café windowsill,
          a summit cairn, the seat pocket on a flight.
        </p>
        <p class="about-text">
          Whoever picks it up points their phone camera at the code, reads who the duck is and where it
          has already been, and posts where they found it. A pin lands on the map, you get a message, and
          the duck carries on without you. Some travel a few streets. Some cross oceans.
        </p>
      </div>
      <img
        src="/images/flock.jpg"
        alt="A group of DashDuckies rubber ducks together"
        class="about-photo"
      />
    </section>

    <!-- HOW A DUCK TRAVELS -->
    <h2 class="about-h2 about-h2--center">How a duck travels</h2>
    <ol class="about-journey">
      <li v-for="(j, i) in journey" :key="j.step">
        <span class="about-journey-num">{{ i + 1 }}</span>
        <span class="about-journey-main">
          <strong>{{ j.step }}</strong>
          <span>{{ j.text }}</span>
        </span>
      </li>
    </ol>

    <!-- WHAT WE BELIEVE -->
    <h2 class="about-h2 about-h2--center">What we care about</h2>
    <div class="about-grid">
      <article v-for="b in beliefs" :key="b.title" class="about-card">
        <span class="about-card-icon" aria-hidden="true">{{ b.icon }}</span>
        <h3>{{ b.title }}</h3>
        <p>{{ b.text }}</p>
      </article>
    </div>

    <!-- NUMBERS -->
    <section class="about-numbers">
      <div>
        <b>{{ stats?.ducks ?? 0 }}</b>
        <span>ducks out in the world</span>
      </div>
      <div>
        <b>{{ stats?.sightings ?? 0 }}</b>
        <span>sightings posted</span>
      </div>
      <div>
        <b>{{ stats?.duckers ?? 0 }}</b>
        <span>duckers signed up</span>
      </div>
    </section>

    <!-- PRIVACY -->
    <section class="about-note">
      <h2 class="about-h2">A word about tracking</h2>
      <p class="about-text">
        We call it a tracker, but nothing is being tracked. There is no chip, no signal and no device
        inside a DashDuckie — just a printed code. The map fills in only when a person decides to scan a
        duck and post about it, and it shows the duck's journey, not yours. You can read exactly what we
        collect in our <NuxtLink to="/privacy">Privacy Policy</NuxtLink>.
      </p>
    </section>

    <!-- WHERE TO START -->
    <h2 class="about-h2 about-h2--center">Where to start</h2>
    <div class="about-links">
      <NuxtLink to="/subscription" class="about-link">
        <strong>Get the subscription box</strong>
        <span>Two hand-styled ducks every month</span>
      </NuxtLink>
      <NuxtLink to="/stickers" class="about-link">
        <strong>Badge ducks you already own</strong>
        <span>QR stickers for your own flock</span>
      </NuxtLink>
      <NuxtLink to="/quackertracker" class="about-link">
        <strong>See the map</strong>
        <span>Every sighting posted — free account needed</span>
      </NuxtLink>
    </div>

    <!-- CONTACT -->
    <section class="about-cta">
      <h2>Come and say hello</h2>
      <p>Questions, ideas, or a duck that turned up somewhere unbelievable — we would love to hear it.</p>
      <NuxtLink to="/contact" class="about-cta-btn">Get in touch →</NuxtLink>
    </section>
  </div>
</template>

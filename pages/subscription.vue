<script setup lang="ts">
useHead({
  title: 'The Subscription Box — DashDuckies',
  meta: [
    {
      name: 'description',
      content:
        'Two collectible ducks every month, each with its own name and trackable QR code. Skip or cancel anytime.',
    },
  ],
})

// Placeholder pricing until checkout is live. `save` is against the monthly rate.
const plans = [
  { name: 'Monthly', price: 18, per: 'billed monthly', save: '', featured: false },
  { name: '6 months', price: 16, per: 'billed every 6 months', save: 'Save 11%', featured: true },
  { name: '12 months', price: 14, per: 'billed yearly', save: 'Save 22%', featured: false },
]

const inTheBox = [
  { emoji: '🦆', name: 'Two ducks', text: 'Hand-styled characters, never the same twice.' },
  { emoji: '🏷️', name: 'A QR code on each', text: 'Its passport to the map.' },
  { emoji: '📋', name: 'Simple directions', text: 'How to name each duck, add its story, and set it loose.' },
  { emoji: '🎁', name: 'A free gift', text: 'A little something extra in your very first box.' },
]

const faqs = [
  { q: 'Can I skip a month or cancel?', a: 'Yes, and there\'s no fee. Skip or cancel any time before your cutoff date — you\'ll find it in your subscription portal. Miss it and that month\'s box is already packed, so it ships as normal and your change takes effect from the next one. Skipping simply shifts your next box along.' },
  { q: 'What happens after I set a duck loose?', a: 'Whoever finds it scans the code and chooses to post a sighting. That drops a pin on the map and notifies you — the map only updates when someone posts, so nothing is tracked in between.' },
  { q: 'Do I have to give my ducks away?', a: 'Not at all. Plenty of people keep their flock and release only a few. Every duck is trackable either way.' },
  { q: 'What if nobody finds my duck?', a: "There's no time limit. A duck can sit quiet for months, then suddenly appear three countries away." },
  { q: 'Where do you ship?', a: "We're working out shipping regions now — get in touch and tell us where you are." },
]
</script>

<template>
  <div class="shop-page">
    <h1 class="shop-title">
      <span class="shop-title-word">Subscription</span>
      <DuckMark class="shop-title-duck" :size="46" color="#FFC61A" />
    </h1>
    <p class="shop-sub">Two ducks a month — and a map that shows you where they go.</p>

    <div class="shop-hero">
      <div>
        <ul class="shop-ticks">
          <li>Two hand-styled ducks, new every month</li>
          <li>Name each duck and write its story</li>
          <li>A unique <span class="qt-brand">Quacker Tracker</span> code on each</li>
          <li>Follow every sighting on the map</li>
          <li>Skip or cancel anytime</li>
        </ul>
        <NuxtLink to="/contact" class="dd-btn-primary">Ask about joining</NuxtLink>
      </div>
      <img
        src="/images/subscription-box.jpg"
        alt="A delighted young girl and her dad unboxing a DashDuckies subscription box, lifting out a purple rubber duck"
        class="shop-hero-photo"
      />
    </div>

    <section class="shop-band">
      <h2>Name them. Then let them go.</h2>
      <p>
        Create a name and story for every duck before you set it loose. After that it's out of your
        hands: someone finds it, scans it, and adds the next chapter from wherever they happen to be
        standing.
      </p>
    </section>

    <h2 class="shop-section-title">Plans</h2>
    <p class="shop-section-sub">Same two ducks a month — longer plans just cost less.</p>
    <div class="shop-grid plan-grid">
      <article v-for="p in plans" :key="p.name" class="shop-card" :class="{ 'is-featured': p.featured }">
        <span v-if="p.featured" class="shop-ribbon">Most popular</span>
        <h3 class="shop-card-name">{{ p.name }}</h3>
        <p class="shop-plan-price">${{ p.price }}<span style="font-size: 15px; color: var(--dd-muted)">/mo</span></p>
        <p class="shop-plan-per">{{ p.per }}</p>
        <div class="shop-card-foot">
          <span v-if="p.save" class="plan-save">{{ p.save }}</span>
          <span class="shop-tag">Coming soon</span>
        </div>
      </article>
    </div>

    <h2 class="shop-section-title">What's in the box</h2>
    <ul class="box-list">
      <li v-for="i in inTheBox" :key="i.name">
        <span class="box-list-emoji" aria-hidden="true">{{ i.emoji }}</span>
        <span><b>{{ i.name }}</b>{{ i.text }}</span>
      </li>
    </ul>

    <h2 class="shop-section-title">Questions</h2>
    <div class="shop-faq">
      <details v-for="f in faqs" :key="f.q">
        <summary>{{ f.q }}</summary>
        <p>{{ f.a }}</p>
      </details>
    </div>

    <p class="shop-footnote">
      Sign-ups aren't open through the site yet —
      <NuxtLink to="/contact">get in touch</NuxtLink> and we'll save you a spot.
    </p>
  </div>
</template>

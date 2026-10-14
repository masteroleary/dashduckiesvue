<script setup lang="ts">
useHead({
  title: 'Single Ducks — DashDuckies',
  meta: [
    {
      name: 'description',
      content: 'Buy individual DashDuckies ducks without a subscription — each with its own QR code.',
    },
  ],
})

// Placeholder line-up. Every duck ships with its own Quacker Tracker code.
const ducks = [
  { emoji: '🦆', name: 'Classic Yellow', text: 'The original. Where every flock starts.', price: 'From $12' },
  { emoji: '🕶️', name: 'Adventure Duck', text: 'Sunglasses, beanie and a taste for road trips.', price: 'From $14' },
  { emoji: '🏖️', name: 'Beach Duck', text: 'Straw hat, shell necklace, permanently on holiday.', price: 'From $14' },
  { emoji: '🎩', name: 'Fancy Duck', text: 'Top hat and monocle. Frightfully well travelled.', price: 'From $14' },
  { emoji: '👻', name: 'Mystery Duck', text: "We pick, you don't find out until it lands.", price: 'From $10' },
  { emoji: '🦆', name: 'Starter 3-Pack', text: 'Three ducks, three codes — enough to start a flock.', price: 'From $32' },
]
</script>

<template>
  <div class="shop-page">
    <div class="shop-head">
      <p class="shop-eyebrow">Shop</p>
      <h1 class="shop-heading">Single ducks</h1>
      <p class="shop-sub">
        Not ready for a subscription? Buy ducks one at a time. Every duck arrives with its own
        <span class="qt-brand">Quacker Tracker</span> code, so it can be scanned and followed the
        moment you set it loose.
      </p>
    </div>

    <div class="shop-notice">
      <span aria-hidden="true">🦆</span>
      <p>
        <b>Single ducks aren't orderable yet.</b> For now, ducks arrive through the monthly box —
        or grab a sticker pack and turn a duck you already own into a trackable one.
      </p>
    </div>

    <div class="shop-grid">
      <article v-for="d in ducks" :key="d.name" class="shop-card">
        <div class="shop-thumb" aria-hidden="true">{{ d.emoji }}</div>
        <h2 class="shop-card-name">{{ d.name }}</h2>
        <p class="shop-card-text">{{ d.text }}</p>
        <div class="shop-card-foot">
          <span class="shop-price">{{ d.price }}</span>
          <span class="shop-tag">Coming soon</span>
        </div>
      </article>
    </div>

    <div class="shop-cta">
      <p>Want a duck today? The monthly box is the fastest way to get one.</p>
      <NuxtLink to="/subscription" class="dd-btn-primary">See the subscription</NuxtLink>
    </div>
  </div>
</template>

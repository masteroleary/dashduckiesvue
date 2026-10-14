<script setup lang="ts">
useHead({
  title: 'Merch — DashDuckies',
  meta: [
    {
      name: 'description',
      content: 'DashDuckies merch — tees, hoodies, caps and more for duck hunters everywhere.',
    },
  ],
})

// Placeholder line-up until real products and photography exist. Swap `emoji`
// for a photo and set `price` once the store is live.
const products = [
  { emoji: '👕', name: 'Logo Tee', text: 'Soft cotton tee with the DashDuckies duck on the chest.', price: 'From $24' },
  { emoji: '🧥', name: 'Duck Hunter Hoodie', text: 'Heavyweight hoodie for cold-weather duck drops.', price: 'From $48' },
  { emoji: '🧢', name: 'Embroidered Cap', text: 'Six-panel cap with a stitched duck mark.', price: 'From $22' },
  { emoji: '👜', name: 'Tote Bag', text: 'Canvas tote big enough for a whole flock.', price: 'From $18' },
  { emoji: '📌', name: 'Enamel Pin Set', text: 'Three pins — duck, QR tag and map pin.', price: 'From $12' },
  { emoji: '☕', name: 'Quacker Mug', text: 'Ceramic mug that says what you are.', price: 'From $16' },
]
</script>

<template>
  <div class="shop-page">
    <div class="shop-head">
      <p class="shop-eyebrow">Shop</p>
      <h1 class="shop-heading">DashDuckies merch</h1>
      <p class="shop-sub">
        Wear the flock. Tees, hoodies and bits and pieces for anyone who's ever left a duck
        somewhere unexpected.
      </p>
    </div>

    <div class="shop-notice">
      <span aria-hidden="true">🦆</span>
      <p>
        <b>Merch is on its way.</b> These are the first designs we're working on — nothing's
        orderable just yet. Tell us what you'd actually wear and we'll make that first.
      </p>
    </div>

    <div class="shop-grid">
      <article v-for="p in products" :key="p.name" class="shop-card">
        <div class="shop-thumb" aria-hidden="true">{{ p.emoji }}</div>
        <h2 class="shop-card-name">{{ p.name }}</h2>
        <p class="shop-card-text">{{ p.text }}</p>
        <div class="shop-card-foot">
          <span class="shop-price">{{ p.price }}</span>
          <span class="shop-tag">Coming soon</span>
        </div>
      </article>
    </div>

    <div class="shop-cta">
      <p>Want something specific? Tell us and we'll put it on the list.</p>
      <NuxtLink to="/contact" class="dd-btn-primary">Get in touch</NuxtLink>
    </div>
  </div>
</template>

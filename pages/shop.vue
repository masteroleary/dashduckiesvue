<script setup lang="ts">
useHead({
  title: 'Shop — DashDuckies',
  meta: [
    {
      name: 'description',
      content:
        'The DashDuckies shop — the monthly subscription box, single ducks, QR stickers, merch and e-gift cards.',
    },
  ],
})

// Everything that can be bought, in the order we want people to consider it.
const categories = [
  {
    to: '/subscription',
    emoji: '📦',
    name: 'Subscription Box',
    text: 'Two ducks every month, each individually styled by hand and ready to follow on the map.',
    tag: 'Most popular',
    featured: true,
  },
  {
    to: '/ducks',
    emoji: '🦆',
    name: 'Single Ducks',
    text: 'Pick a duck outright, no subscription. Each one arrives with its own code.',
    tag: '',
    featured: false,
  },
  {
    to: '/stickers',
    emoji: '🏷️',
    name: 'QR Stickers',
    text: "Badge ducks you already own, so they can be scanned and followed too.",
    tag: '',
    featured: false,
  },
  {
    to: '/merch',
    emoji: '👕',
    name: 'Merch',
    text: 'Tees, hoodies, caps and bits and pieces for anyone who leaves ducks about.',
    tag: '',
    featured: false,
  },
  {
    to: '/gift-cards',
    emoji: '🎁',
    name: 'E-Gift Cards',
    text: 'Any amount, or a prepaid run of the subscription. Sent straight to their inbox.',
    tag: '',
    featured: false,
  },
]
</script>

<template>
  <div class="shop-page">
    <h1 class="shop-title">
      <span class="shop-title-word">Shop</span>
      <DuckMark class="shop-title-duck" :size="46" color="#FFC61A" />
    </h1>
    <p class="shop-sub shop-lede">Pick where to start. Everything here comes with a code, so it can be followed.</p>

    <div class="shop-grid shop-grid--cats">
      <NuxtLink
        v-for="cat in categories"
        :key="cat.to"
        :to="cat.to"
        class="shop-card shop-card--link"
        :class="{ 'is-featured': cat.featured }"
      >
        <span v-if="cat.tag" class="shop-ribbon">{{ cat.tag }}</span>
        <div class="shop-thumb" aria-hidden="true">{{ cat.emoji }}</div>
        <h2 class="shop-card-name">{{ cat.name }}</h2>
        <p class="shop-card-text">{{ cat.text }}</p>
        <span class="shop-card-go">Take a look →</span>
      </NuxtLink>
    </div>

    <div class="shop-notice shop-notice--foot">
      <span aria-hidden="true">🦆</span>
      <p>
        <b>Not sure where to begin?</b> Most people start with the subscription box — two new ducks a
        month, and you can skip or cancel whenever you like. Or
        <NuxtLink to="/contact">get in touch</NuxtLink> and we'll help you pick.
      </p>
    </div>
  </div>
</template>

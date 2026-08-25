<script setup lang="ts">
useHead({
  title: 'Your Cart — DashDuckies',
  meta: [{ name: 'description', content: 'Your DashDuckies cart.' }],
})
</script>

<template>
  <div class="dd-form-page">
    <h1 class="dd-form-heading">Your cart</h1>
    <p class="dd-form-sub">Add ducks and merch here, then check out.</p>

    <div class="dd-form-card" style="text-align: center">
      <div style="font-size: 44px; margin-bottom: 10px">🛒</div>
      <p style="font-family: var(--font-display); font-weight: 600; font-size: 20px; margin: 0 0 8px">
        Your cart is empty
      </p>
      <p style="color: var(--dd-muted); line-height: 1.6; margin: 0 auto 24px; max-width: 40ch">
        The DashDuckies shop is coming soon. Once it opens, the ducks and merch you add will show up
        here — ready to check out.
      </p>
      <NuxtLink to="/#shop" class="dd-btn-primary">Browse the shop</NuxtLink>
    </div>
  </div>
</template>

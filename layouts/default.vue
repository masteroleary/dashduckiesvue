<script setup lang="ts">
const year = new Date().getFullYear()
</script>

<template>
  <div class="dd-shell">
    <!-- NAVIGATION -->
    <nav class="dd-nav">
      <NuxtLink to="/" class="dd-nav-logo">
        <span class="duck-icon"><DuckMark :size="30" color="#a87d2c" /></span>
        DashDuckies
      </NuxtLink>
      <ul class="dd-nav-links">
        <li><NuxtLink to="/quackertracker">Quacker Tracker</NuxtLink></li>
        <li><NuxtLink to="/contact">Contact</NuxtLink></li>
        <li><NuxtLink to="/login" class="dd-nav-cta">Login</NuxtLink></li>
      </ul>
    </nav>

    <!-- PAGE BODY -->
    <div class="dd-body">
      <slot />
    </div>

    <!-- FOOTER -->
    <footer class="dd-footer">
      <NuxtLink to="/" class="dd-footer-logo">
        <DuckMark :size="20" color="#a87d2c" />
        DashDuckies
      </NuxtLink>
      <ul class="dd-footer-links">
        <li><NuxtLink to="/quackertracker">Quacker Tracker</NuxtLink></li>
        <li><NuxtLink to="/#how">How It Works</NuxtLink></li>
        <li><NuxtLink to="/#shop">Shop</NuxtLink></li>
        <li><NuxtLink to="/stickers">Stickers</NuxtLink></li>
        <li><NuxtLink to="/contact">Contact</NuxtLink></li>
        <li><NuxtLink to="/terms">Terms</NuxtLink></li>
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

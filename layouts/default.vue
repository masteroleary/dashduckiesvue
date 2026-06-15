<script setup lang="ts">
const year = new Date().getFullYear()
</script>

<template>
  <div class="dd-shell">
    <!-- NAVIGATION -->
    <nav class="dd-nav">
      <NuxtLink to="/" class="dd-nav-logo">
        <span class="duck-icon">
          <svg
            width="32"
            height="32"
            viewBox="0 0 64 64"
            xmlns="http://www.w3.org/2000/svg"
            transform="matrix(-1, 0, 0, 1, 0, 0)"
            style="background: var(--dd-yellow); border-radius: 50%; padding: 4px"
          >
            <path
              d="M17.406,25.591c0,0 2.059,0.83 1.986,2.891c-0.072,2.062 -6.66,2.957 -6.66,11.094c0,8.137 9.096,14.532 19.217,14.532c10.12,0 23.872,-5.932 23.872,-17.83c0,-19.976 -1.513,-6.134 -17.276,-6.134c-5.235,0 -6.169,-1.787 -5.342,-2.806c3.91,-4.811 5.342,-17.446 -7.42,-17.446c-8.327,0.173 -10.338,6.946 -10.325,8.587c0.008,1.153 -1.204,1.543 -7.308,1.308c-1.536,5.619 9.256,5.804 9.256,5.804Zm3.77,-10.366c1.104,0 2,0.897 2,2c0,1.104 -0.896,2 -2,2c-1.103,0 -2,-0.896 -2,-2c0,-1.103 0.897,-2 2,-2Z"
              fill="white"
            />
          </svg>
        </span>
        DashDuckies
      </NuxtLink>
      <ul class="dd-nav-links">
        <li><NuxtLink to="/quackertracker">Quacker Tracker</NuxtLink></li>
        <li><NuxtLink to="/contact">Contact</NuxtLink></li>
        <li><NuxtLink to="/login">Login</NuxtLink></li>
      </ul>
    </nav>

    <!-- PAGE BODY -->
    <div class="dd-body">
      <slot />
    </div>

    <!-- FOOTER -->
    <footer class="dd-footer">
      <NuxtLink to="/" class="dd-footer-logo">
        <svg
          width="20"
          height="20"
          viewBox="0 0 64 64"
          xmlns="http://www.w3.org/2000/svg"
          transform="matrix(-1, 0, 0, 1, 0, 0)"
        >
          <path
            d="M17.406,25.591c0,0 2.059,0.83 1.986,2.891c-0.072,2.062 -6.66,2.957 -6.66,11.094c0,8.137 9.096,14.532 19.217,14.532c10.12,0 23.872,-5.932 23.872,-17.83c0,-19.976 -1.513,-6.134 -17.276,-6.134c-5.235,0 -6.169,-1.787 -5.342,-2.806c3.91,-4.811 5.342,-17.446 -7.42,-17.446c-8.327,0.173 -10.338,6.946 -10.325,8.587c0.008,1.153 -1.204,1.543 -7.308,1.308c-1.536,5.619 9.256,5.804 9.256,5.804Zm3.77,-10.366c1.104,0 2,0.897 2,2c0,1.104 -0.896,2 -2,2c-1.103,0 -2,-0.896 -2,-2c0,-1.103 0.897,-2 2,-2Z"
            fill="currentColor"
          />
        </svg>
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
      <div class="dd-footer-copy">© {{ year }} DashDuckies</div>
    </footer>
  </div>
</template>

<style>
/* Sticky-footer shell so short pages keep the footer at the bottom. */
.dd-shell {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  background: var(--dd-white);
  font-family: var(--font-body);
  color: var(--dd-black);
}
.dd-body {
  flex: 1 0 auto;
  padding-top: 72px;
}
</style>

<script setup lang="ts">
useHead({
  title: 'Quacker Tracker Stickers — DashDuckies',
  meta: [
    {
      name: 'description',
      content:
        'Get your own QR code stickers to turn any duck into a trackable DashDuckie.',
    },
  ],
})
</script>

<template>
  <section class="stickers-section">
    <div class="stickers-card">
      <div class="stickers-image-side">
        <img src="/images/stickers.jpg" alt="DashDuckies Stickers" class="stickers-photo" />
      </div>
      <div class="stickers-info-side">
        <h1 class="stickers-heading">Get Your Own Stickers</h1>
        <p class="stickers-text">
          Want to slap some stickers on your own homemade ducks? We've got you covered! Our QR code
          stickers let you turn any duck into a trackable DashDuckie.
        </p>
        <p class="stickers-text">
          Contact us and we'll send you a pack of stickers so your ducks can join the adventure.
        </p>
        <div class="stickers-email-row">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="var(--dd-yellow)"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <rect x="2" y="4" width="20" height="16" rx="2" />
            <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
          </svg>
          <a href="mailto:info@dashduckies.com" class="stickers-email">info@dashduckies.com</a>
        </div>
      </div>
    </div>
  </section>
</template>

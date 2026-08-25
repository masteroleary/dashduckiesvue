<script setup lang="ts">
useHead({
  title: 'Contact — DashDuckies',
  meta: [{ name: 'description', content: 'Get in touch with the DashDuckies team.' }],
})

const { data: info } = await useFetch<{ name: string | null; profileImageUrl: string | null; email: string }>(
  '/api/contact',
)
const email = computed(() => info.value?.email || 'info@dashduckies.com')
</script>

<template>
  <section class="contact-section">
    <div class="contact-card">
      <div class="contact-image-side">
        <img v-if="info?.profileImageUrl" :src="info.profileImageUrl" alt="DashDuckies Admin" class="contact-avatar" />
        <div v-else class="contact-avatar-placeholder">
          <svg
            width="80"
            height="80"
            viewBox="0 0 64 64"
            xmlns="http://www.w3.org/2000/svg"
            transform="matrix(-1, 0, 0, 1, 0, 0)"
          >
            <path
              d="M17.406,25.591c0,0 2.059,0.83 1.986,2.891c-0.072,2.062 -6.66,2.957 -6.66,11.094c0,8.137 9.096,14.532 19.217,14.532c10.12,0 23.872,-5.932 23.872,-17.83c0,-19.976 -1.513,-6.134 -17.276,-6.134c-5.235,0 -6.169,-1.787 -5.342,-2.806c3.91,-4.811 5.342,-17.446 -7.42,-17.446c-8.327,0.173 -10.338,6.946 -10.325,8.587c0.008,1.153 -1.204,1.543 -7.308,1.308c-1.536,5.619 9.256,5.804 9.256,5.804Zm3.77,-10.366c1.104,0 2,0.897 2,2c0,1.104 -0.896,2 -2,2c-1.103,0 -2,-0.896 -2,-2c0,-1.103 0.897,-2 2,-2Z"
              fill="#0c0b0a"
            />
          </svg>
        </div>
        <p v-if="info?.name" class="contact-admin-name">{{ info.name }}</p>
      </div>
      <div class="contact-info-side">
        <h1 class="contact-heading">Get In Touch</h1>
        <p class="contact-subtext">Have questions about DashDuckies? We'd love to hear from you.</p>
        <div class="contact-email-row">
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
          <a :href="`mailto:${email}`" class="contact-email">{{ email }}</a>
        </div>
        <div class="contact-email-row">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="#1877F2"
            aria-hidden="true"
          >
            <path
              d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"
            />
          </svg>
          <a
            href="https://www.facebook.com/dashduckies"
            target="_blank"
            rel="noopener"
            class="contact-email"
          >facebook.com/dashduckies</a>
        </div>
        <div class="contact-email-row">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="url(#ig-gradient)"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
            aria-hidden="true"
          >
            <defs>
              <linearGradient id="ig-gradient" x1="0" y1="1" x2="1" y2="0">
                <stop offset="0" stop-color="#FEDA75" />
                <stop offset="0.25" stop-color="#FA7E1E" />
                <stop offset="0.5" stop-color="#D62976" />
                <stop offset="0.75" stop-color="#962FBF" />
                <stop offset="1" stop-color="#4F5BD5" />
              </linearGradient>
            </defs>
            <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
            <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
            <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
          </svg>
          <a
            href="https://www.instagram.com/dashduckiesceo"
            target="_blank"
            rel="noopener"
            class="contact-email"
          >instagram.com/dashduckiesceo</a>
        </div>
      </div>
    </div>
  </section>
</template>

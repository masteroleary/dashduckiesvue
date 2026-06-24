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
      </div>
    </div>
  </section>
</template>

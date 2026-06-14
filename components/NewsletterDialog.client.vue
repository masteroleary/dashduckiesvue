<script setup lang="ts">
// Delayed (5s) discount popup, shown once per browser.
const open = ref(false)
const email = ref('')
const submitting = ref(false)
const discountCode = ref('')
const error = ref('')
const KEY = 'dd_seen_newsletter'

onMounted(() => {
  if (localStorage.getItem(KEY)) return
  setTimeout(() => {
    if (!localStorage.getItem(KEY)) open.value = true
  }, 5000)
})

function dismiss() {
  open.value = false
  localStorage.setItem(KEY, '1')
}

async function subscribe() {
  error.value = ''
  submitting.value = true
  try {
    const res = await $fetch<{ discountCode: string }>('/api/newsletter/subscribe', {
      method: 'POST',
      body: { email: email.value },
    })
    discountCode.value = res.discountCode
    localStorage.setItem(KEY, '1')
  } catch (e: any) {
    error.value = e?.data?.statusMessage || 'Could not subscribe. Try again.'
  } finally {
    submitting.value = false
  }
}
</script>

<template>
  <v-dialog v-model="open" max-width="440">
    <v-card>
      <v-card-title>Get 10% off 🦆</v-card-title>
      <v-card-text>
        <template v-if="discountCode">
          <v-alert type="success" variant="tonal">
            You're in! Use code <strong>{{ discountCode }}</strong> for 10% off.
          </v-alert>
        </template>
        <template v-else>
          <p class="text-medium-emphasis mb-4">
            Join the flock — subscribe for news and a welcome discount code.
          </p>
          <v-alert v-if="error" type="error" variant="tonal" density="compact" class="mb-3">
            {{ error }}
          </v-alert>
          <v-text-field v-model="email" label="Email" variant="outlined" hide-details @keyup.enter="subscribe" />
        </template>
      </v-card-text>
      <v-card-actions>
        <v-btn variant="text" @click="dismiss">{{ discountCode ? 'Close' : 'No thanks' }}</v-btn>
        <v-spacer />
        <v-btn v-if="!discountCode" color="primary" :loading="submitting" @click="subscribe">Subscribe</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

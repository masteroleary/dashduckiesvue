<script setup lang="ts">
// Delayed (5s) discount popup, shown once per browser. Plain markup (no Vuetify).
const open = ref(false)
const email = ref('')
const submitting = ref(false)
const discountCode = ref('')
const error = ref('')
const KEY = 'hasSeenDiscountDialog'

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
  <div v-if="open" class="dd-modal-overlay" @click.self="dismiss">
    <div class="dd-modal">
      <div class="dd-modal-head">
        <span>Special Offer</span>
        <button class="dd-modal-close" aria-label="Close" @click="dismiss">×</button>
      </div>
      <div class="dd-modal-body">
        <template v-if="discountCode">
          <h3 style="color: var(--dd-accent); margin: 0 0 8px">Thanks!</h3>
          <p>Your discount code is: <strong>{{ discountCode }}</strong></p>
        </template>
        <template v-else>
          <h3 style="margin: 0 0 8px">Get 10% Off Your First Order!</h3>
          <p style="color: var(--dd-text-2)">
            Subscribe to our newsletter and receive a 10% discount code for your first DashDuckies
            purchase. Plus, stay updated on new duck releases and exclusive offers!
          </p>
          <p v-if="error" style="color: var(--dd-accent); font-size: 14px">{{ error }}</p>
          <input
            v-model="email"
            type="email"
            class="dd-input"
            placeholder="Email Address"
            @keyup.enter="subscribe"
          />
        </template>
      </div>
      <div v-if="!discountCode" class="dd-modal-actions">
        <button class="dd-btn-ghost" @click="dismiss">No Thanks</button>
        <button class="dd-btn-primary" :disabled="submitting" @click="subscribe">
          {{ submitting ? 'Subscribing…' : 'Get My 10% Off' }}
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.dd-modal-overlay {
  position: fixed;
  inset: 0;
  z-index: 1300;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 16px;
}
.dd-modal {
  background: var(--dd-pitch);
  border: var(--dd-hairline);
  border-radius: 16px;
  max-width: 460px;
  width: 100%;
  color: var(--dd-cream);
  box-shadow: 0 30px 70px rgba(0, 0, 0, 0.6);
  font-family: var(--font-body);
  overflow: hidden;
}
.dd-modal h3 { font-family: var(--font-display); font-weight: 600; letter-spacing: -0.01em; color: var(--dd-cream); }
.dd-modal-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 24px 0;
  font-family: var(--font-mono);
  font-weight: 500;
  font-size: 12px;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  color: var(--dd-bronze);
}
.dd-modal-close {
  border: none;
  background: none;
  font-size: 26px;
  line-height: 1;
  cursor: pointer;
  color: var(--dd-muted);
}
.dd-modal-body {
  padding: 12px 24px 20px;
}
.dd-input {
  width: 100%;
  margin-top: 12px;
  padding: 12px 16px;
  background: var(--dd-panel-3);
  border: 1px solid rgba(212, 175, 55, 0.2);
  border-radius: 10px;
  font-size: 15px;
  font-family: var(--font-body);
  color: var(--dd-cream);
  box-sizing: border-box;
}
.dd-input::placeholder { color: var(--dd-faint); }
.dd-input:focus { outline: none; border-color: var(--dd-bronze); }
.dd-modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  padding: 0 24px 24px;
}
</style>

<script setup lang="ts">
const props = defineProps<{
  claimToken?: string | null
  viewHref: string
  duckName?: string | null
}>()

const email = ref('')
const submitting = ref(false)
const done = ref(false)
const discountCode = ref('')
const error = ref('')

async function follow() {
  error.value = ''
  if (!email.value.trim()) {
    error.value = 'Enter your email to follow along.'
    return
  }
  submitting.value = true
  try {
    const res = await $fetch<{ ok: boolean; discountCode?: string }>('/api/duck/follow', {
      method: 'POST',
      body: { email: email.value, claimToken: props.claimToken || undefined },
    })
    discountCode.value = res.discountCode || ''
    done.value = true
    if (import.meta.client) localStorage.removeItem('dd_claim_token')
  } catch (e: any) {
    error.value = e?.data?.statusMessage || 'Could not save. Try again.'
  } finally {
    submitting.value = false
  }
}
</script>

<template>
  <div class="follow-box">
    <template v-if="done">
      <div class="follow-emoji">🎉</div>
      <h3 class="follow-h">You're following {{ duckName || 'this duck' }}!</h3>
      <p class="follow-sub">We'll email you when it gets re-ducked.</p>
      <p v-if="discountCode" class="follow-perk">
        A little thank-you: <strong>{{ discountCode }}</strong> for 10% off 🎁
      </p>
      <NuxtLink :to="viewHref" class="dd-btn-primary">See its journey →</NuxtLink>
    </template>

    <template v-else>
      <h3 class="follow-h">Get updates if someone finds your duck 🐥</h3>
      <p class="follow-sub">
        Track your duck's journey across the country. <strong>Optional</strong> — no account needed.
      </p>
      <p v-if="error" class="dd-form-error">{{ error }}</p>
      <div class="follow-row">
        <input
          v-model="email"
          type="email"
          class="dd-field follow-input"
          placeholder="you@email.com"
          @keyup.enter="follow"
        />
        <button class="dd-btn-primary" :disabled="submitting" @click="follow">
          {{ submitting ? '…' : 'Notify me 🔔' }}
        </button>
      </div>
      <p class="follow-trust">🔒 We never spam. Only duck updates. Unsubscribe anytime.</p>
      <NuxtLink :to="viewHref" class="follow-skip">No thanks — just show me the duck →</NuxtLink>
    </template>
  </div>
</template>

<style scoped>
.follow-box {
  background: var(--dd-yellow-light, #fff4b8);
  border-radius: 16px;
  padding: 24px;
  text-align: center;
  font-family: var(--font-body);
  margin-top: 24px;
}
.follow-emoji { font-size: 40px; }
.follow-h { font-family: var(--font-display); margin: 4px 0 8px; }
.follow-sub { color: var(--dd-gray); margin: 0 0 16px; }
.follow-perk { margin: 8px 0 16px; }
.follow-row {
  display: flex;
  gap: 10px;
  max-width: 420px;
  margin: 0 auto 10px;
}
.follow-input { flex: 1; background: #fff; }
.follow-trust { font-size: 13px; color: var(--dd-gray); margin: 8px 0; }
.follow-skip {
  display: inline-block;
  margin-top: 6px;
  color: var(--dd-gray);
  font-size: 14px;
}
</style>

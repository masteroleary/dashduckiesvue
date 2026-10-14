<script setup lang="ts">
/**
 * Shown to signed-out visitors in place of a members-only page: an explainer of
 * what they're missing, then sign-in right here so they don't lose their place.
 *
 * This is the *presentation* of the gate only — the pages it fronts must also
 * have their API endpoints behind `requireUser`, or the data is still readable.
 */
withDefaults(
  defineProps<{
    eyebrow: string
    title: string
    lede: string
    points: Array<{ icon: string; title: string; text: string }>
    /** Use the pale-on-black palette (the Quacker Tracker pages run dark). */
    dark?: boolean
  }>(),
  { dark: false },
)

const emit = defineEmits<{ (e: 'signed-in'): void }>()

const { requestCode, verifyCode } = useAuth()

const step = ref<'identifier' | 'code'>('identifier')
const identifier = ref('')
const code = ref('')
const loading = ref(false)
const error = ref('')

async function onRequestCode() {
  if (!identifier.value.trim()) return
  error.value = ''
  loading.value = true
  try {
    await requestCode(identifier.value)
    step.value = 'code'
  } catch (e: any) {
    error.value = e?.data?.statusMessage || 'Could not send a code. Check the address and try again.'
  } finally {
    loading.value = false
  }
}

async function onVerify() {
  if (!code.value.trim()) return
  error.value = ''
  loading.value = true
  try {
    await verifyCode(identifier.value, code.value)
    // useAuth has set `user`, so the page swaps itself in; it just needs to
    // re-request the data it couldn't load while signed out.
    emit('signed-in')
  } catch (e: any) {
    error.value = e?.data?.statusMessage || 'Invalid or expired code.'
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="gate" :class="{ 'gate--dark': dark }">
    <section class="gate-intro">
      <p class="gate-eyebrow">{{ eyebrow }}</p>
      <h1 class="gate-title">{{ title }}</h1>
      <p class="gate-lede">{{ lede }}</p>

      <div class="gate-points">
        <article v-for="p in points" :key="p.title" class="gate-point">
          <span class="gate-point-icon" aria-hidden="true">{{ p.icon }}</span>
          <div>
            <h2>{{ p.title }}</h2>
            <p>{{ p.text }}</p>
          </div>
        </article>
      </div>

      <!-- Optional taste of what's behind the gate. -->
      <slot name="preview" />
    </section>

    <section class="gate-auth">
      <div class="gate-card">
        <span class="gate-lock" aria-hidden="true">🔒</span>
        <h2 class="gate-card-title">Members only</h2>
        <p class="gate-card-sub">
          Sign in to see it. No password — we send a 6-digit code to your email or phone.
        </p>

        <form v-if="step === 'identifier'" class="gate-form" @submit.prevent="onRequestCode">
          <label class="gate-label" for="gate-id">Email or mobile number</label>
          <input
            id="gate-id"
            v-model="identifier"
            class="gate-input"
            type="text"
            autocomplete="email"
            placeholder="you@example.com"
            :disabled="loading"
          />
          <button type="submit" class="gate-btn" :disabled="loading || !identifier.trim()">
            {{ loading ? 'Sending…' : 'Send my code →' }}
          </button>
        </form>

        <form v-else class="gate-form" @submit.prevent="onVerify">
          <label class="gate-label" for="gate-code">Enter the 6-digit code</label>
          <input
            id="gate-code"
            v-model="code"
            class="gate-input gate-input-code"
            type="text"
            inputmode="numeric"
            autocomplete="one-time-code"
            maxlength="6"
            placeholder="000000"
            :disabled="loading"
          />
          <button type="submit" class="gate-btn" :disabled="loading || !code.trim()">
            {{ loading ? 'Checking…' : 'Unlock →' }}
          </button>
          <button type="button" class="gate-back" @click="step = 'identifier'">
            ← Use a different address
          </button>
        </form>

        <p v-if="error" class="gate-error">{{ error }}</p>

        <p class="gate-foot">
          New here? <NuxtLink to="/login?mode=join">Create a free account</NuxtLink> — it takes a minute.
        </p>
      </div>
    </section>
  </div>
</template>

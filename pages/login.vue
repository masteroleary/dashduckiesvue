<script setup lang="ts">
// Public, light-themed sign-in page. Uses the default layout, so it gets the
// top nav + footer like every other public page. On success it hands off to
// the member app (/app). Passwordless: email/phone -> 6-digit code.
const { user, fetchMe, requestCode, verifyCode } = useAuth()

useHead({
  title: 'Sign in — DashDuckies',
  meta: [{ name: 'description', content: 'Sign in to your DashDuckies roster to track your ducks.' }],
})

// Pre-fill from the query (e.g. after registering a duck we send them here as
// /login?id=<their email or phone>&mode=join).
const route = useRoute()
const step = ref<'identifier' | 'code'>('identifier')
const mode = ref<'signin' | 'join'>(route.query.mode === 'join' ? 'join' : 'signin')
const identifier = ref(route.query.id ? String(route.query.id) : '')
const code = ref('')
const loading = ref(false)
const error = ref('')
const devHint = ref(false)

const heading = computed(() => (mode.value === 'join' ? 'Join DashDuckies' : 'Sign in to your roster'))
const subtitle = computed(() =>
  mode.value === 'join'
    ? "Create your roster — we'll email or text you a code to get started."
    : 'Track your ducks, log sightings, and manage your flock.',
)

// If they already have a valid session, skip the form and go to the app.
onMounted(async () => {
  if (user.value) {
    navigateTo('/app')
    return
  }
  try {
    const me = await fetchMe()
    if (me) navigateTo('/app')
  } catch {
    /* not signed in — show the form */
  }
})

async function onRequestCode() {
  if (!identifier.value.trim()) return
  error.value = ''
  loading.value = true
  try {
    const res = await requestCode(identifier.value)
    devHint.value = res.dev
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
    await navigateTo('/app')
  } catch (e: any) {
    error.value = e?.data?.statusMessage || 'Invalid or expired code.'
  } finally {
    loading.value = false
  }
}

function reset() {
  step.value = 'identifier'
  code.value = ''
  error.value = ''
  devHint.value = false
}

function setMode(m: 'signin' | 'join') {
  mode.value = m
  reset()
}
</script>

<template>
  <div class="dd-form-page">
    <div class="dd-login-head">
      <DuckMark :size="42" color="#a87d2c" />
      <h1 class="dd-form-heading">{{ heading }}</h1>
      <p class="dd-form-sub">{{ subtitle }}</p>
    </div>

    <div class="dd-form-card">
      <p v-if="error" class="dd-form-error" style="margin-bottom: 16px">{{ error }}</p>

      <template v-if="step === 'identifier'">
        <p class="dd-form-sub" style="margin-bottom: 16px">
          Enter your email or phone number and we'll send you a code.
        </p>
        <label class="dd-label" for="dd-identifier">Email or phone (+1…)</label>
        <input
          id="dd-identifier"
          v-model="identifier"
          class="dd-field"
          type="text"
          autocomplete="username"
          placeholder="you@example.com"
          @keyup.enter="onRequestCode"
        />
        <div class="dd-form-actions">
          <button type="button" class="dd-btn-primary" :disabled="loading" @click="onRequestCode">
            {{ loading ? 'Sending…' : 'Send code' }}
          </button>
        </div>
      </template>

      <template v-else>
        <p class="dd-form-sub" style="margin-bottom: 16px">
          Enter the code we sent to <strong>{{ identifier }}</strong>.
        </p>
        <div v-if="devHint" class="dd-form-note">Dev account — use code <strong>000000</strong>.</div>
        <label class="dd-label" for="dd-code">6-digit code</label>
        <input
          id="dd-code"
          v-model="code"
          class="dd-field"
          type="text"
          inputmode="numeric"
          autocomplete="one-time-code"
          placeholder="000000"
          @keyup.enter="onVerify"
        />
        <div class="dd-login-actions">
          <button type="button" class="dd-login-alt" @click="reset">← Use a different address</button>
          <button type="button" class="dd-btn-primary" :disabled="loading" @click="onVerify">
            {{ loading ? 'Verifying…' : 'Verify & sign in' }}
          </button>
        </div>
      </template>
    </div>

    <div v-if="step === 'identifier'" class="dd-join-row">
      <template v-if="mode === 'signin'">
        <span>New to DashDuckies?</span>
        <button type="button" class="dd-join-btn" @click="setMode('join')">Join Now</button>
      </template>
      <template v-else>
        <span>Already have an account?</span>
        <button type="button" class="dd-login-alt" @click="setMode('signin')">Sign in</button>
      </template>
    </div>
  </div>
</template>

<style scoped>
.dd-login-head {
  text-align: center;
  margin-bottom: 24px;
}
.dd-login-head .dd-form-heading {
  margin-top: 12px;
  margin-bottom: 6px;
}
.dd-login-actions {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-top: 20px;
}
.dd-login-alt {
  background: none;
  border: none;
  padding: 0;
  cursor: pointer;
  font-family: var(--font-body);
  font-size: 14px;
  color: var(--dd-muted);
  transition: color 0.2s;
}
.dd-login-alt:hover {
  color: var(--dd-bronze);
}
.dd-join-row {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  margin-top: 22px;
  color: var(--dd-muted);
  font-size: 14px;
}
.dd-join-btn {
  display: inline-flex;
  align-items: center;
  padding: 9px 20px;
  font-family: var(--font-body);
  font-weight: 700;
  font-size: 14px;
  color: #1f8f45;
  background: transparent;
  border: 1.5px solid #2ea44f;
  border-radius: 10px;
  cursor: pointer;
  transition: background 0.2s, color 0.2s;
}
.dd-join-btn:hover {
  background: rgba(46, 164, 79, 0.12);
}
</style>

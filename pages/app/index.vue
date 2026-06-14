<script setup lang="ts">
// Client-only SPA (ssr: false). Authenticated app shell with passwordless login.
const { user, fetchMe, requestCode, verifyCode, logout } = useAuth()

const step = ref<'identifier' | 'code'>('identifier')
const identifier = ref('')
const code = ref('')
const loading = ref(false)
const error = ref('')
const devHint = ref(false)

onMounted(async () => {
  try {
    await fetchMe()
  } catch {
    /* not logged in */
  }
})

async function onRequestCode() {
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
  error.value = ''
  loading.value = true
  try {
    await verifyCode(identifier.value, code.value)
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
</script>

<template>
  <v-container class="py-12">
    <v-row justify="center">
      <v-col cols="12" sm="8" md="5">
        <!-- Logged in -->
        <template v-if="user">
          <v-card>
            <v-card-title class="d-flex align-center">
              <span>Welcome back 🦆</span>
              <v-spacer />
              <v-chip v-if="user.isAdmin" color="deep-purple" size="small" class="mr-1">admin</v-chip>
              <v-chip v-if="user.isMember" color="primary" size="small">member</v-chip>
            </v-card-title>
            <v-card-text>
              <div class="text-medium-emphasis mb-2">You are signed in as:</div>
              <div><strong>{{ user.email || user.phone }}</strong></div>
              <div class="text-caption mt-4">User ID: {{ user.id }}</div>
            </v-card-text>
            <v-card-actions>
              <v-btn color="error" variant="text" @click="logout">Sign out</v-btn>
            </v-card-actions>
          </v-card>
        </template>

        <!-- Login -->
        <template v-else>
          <v-card>
            <v-card-title>Sign in to Dash Duckies</v-card-title>
            <v-card-text>
              <v-alert v-if="error" type="error" variant="tonal" density="compact" class="mb-4">
                {{ error }}
              </v-alert>

              <template v-if="step === 'identifier'">
                <p class="text-medium-emphasis mb-4">
                  Enter your email or phone number and we'll send you a code.
                </p>
                <v-text-field
                  v-model="identifier"
                  label="Email or phone (+1...)"
                  variant="outlined"
                  autofocus
                  @keyup.enter="onRequestCode"
                />
                <v-btn block color="primary" :loading="loading" @click="onRequestCode">
                  Send code
                </v-btn>
              </template>

              <template v-else>
                <p class="text-medium-emphasis mb-4">
                  Enter the code we sent to <strong>{{ identifier }}</strong>.
                </p>
                <v-alert v-if="devHint" type="info" variant="tonal" density="compact" class="mb-4">
                  Dev account — use code <strong>000000</strong>.
                </v-alert>
                <v-text-field
                  v-model="code"
                  label="6-digit code"
                  variant="outlined"
                  autofocus
                  @keyup.enter="onVerify"
                />
                <v-btn block color="primary" :loading="loading" class="mb-2" @click="onVerify">
                  Verify &amp; sign in
                </v-btn>
                <v-btn block variant="text" @click="reset">Use a different address</v-btn>
              </template>
            </v-card-text>
          </v-card>
        </template>
      </v-col>
    </v-row>
  </v-container>
</template>

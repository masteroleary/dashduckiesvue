<script setup lang="ts">
// Passwordless login (email/phone -> code). On success, useAuth state updates
// and the surrounding app layout swaps to the member shell.
const { requestCode, verifyCode } = useAuth()

const step = ref<'identifier' | 'code'>('identifier')
const identifier = ref('')
const code = ref('')
const loading = ref(false)
const error = ref('')
const devHint = ref(false)

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
              <v-btn block color="primary" :loading="loading" @click="onRequestCode">Send code</v-btn>
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
      </v-col>
    </v-row>
  </v-container>
</template>

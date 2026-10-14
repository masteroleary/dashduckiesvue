<script setup lang="ts">
definePageMeta({ layout: 'app' })

interface SubView {
  subscription: null | {
    id: string
    plan: string
    planLabel: string
    status: 'active' | 'cancelled'
    skipNextShipment: boolean
    startedAt: string
    cancelledAt: string | null
  }
  nextShipDate?: string
  cutoffDate?: string
  canChangeNextBox?: boolean
  daysUntilCutoff?: number
}

const { data, refresh, pending } = await useFetch<SubView>('/api/subscription')
const sub = computed(() => data.value?.subscription ?? null)
const busy = ref(false)
const error = ref('')
const notice = ref('')
const confirmCancel = ref(false)

function fmt(d?: string | null) {
  if (!d) return '—'
  return new Date(d).toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })
}

async function call(url: string, body?: Record<string, unknown>) {
  if (busy.value) return
  busy.value = true
  error.value = ''
  notice.value = ''
  try {
    return await $fetch(url, { method: 'POST', body })
  } catch (e: any) {
    error.value = e?.data?.statusMessage || e?.statusMessage || 'Something went wrong. Please try again.'
  } finally {
    busy.value = false
    await refresh()
  }
}

async function toggleSkip() {
  const skip = !sub.value?.skipNextShipment
  const r: any = await call('/api/subscription/skip', { skip })
  if (r?.ok) notice.value = skip ? 'Your next box is skipped.' : 'Your next box is back on.'
}

async function cancel() {
  const r: any = await call('/api/subscription/cancel')
  confirmCancel.value = false
  if (r?.ok) {
    notice.value = r.finalBoxStillShips
      ? `Cancelled. Your final box was already packed and still ships on ${fmt(r.finalBoxDate)}.`
      : 'Cancelled. No further boxes will be sent.'
  }
}

async function resume() {
  const r: any = await call('/api/subscription/resume')
  if (r?.ok) notice.value = 'Welcome back — your subscription is active again.'
}
</script>

<template>
  <v-container class="py-6" style="max-width: 780px">
    <h1 class="text-h5 font-weight-bold mb-1">Subscription</h1>
    <p class="text-medium-emphasis mb-6">Your box plan, your dates, and the controls to change them.</p>

    <v-alert v-if="error" type="error" variant="tonal" class="mb-4">{{ error }}</v-alert>
    <v-alert v-if="notice" type="success" variant="tonal" class="mb-4">{{ notice }}</v-alert>

    <v-skeleton-loader v-if="pending" type="card" />

    <!-- No subscription yet -->
    <v-card v-else-if="!sub" variant="outlined" class="pa-6 text-center">
      <div class="text-h6 mb-2">No subscription yet</div>
      <p class="text-medium-emphasis mb-4">
        Sign-ups aren't open through the site yet — get in touch and we'll set one up for you.
      </p>
      <v-btn color="primary" to="/contact">Get in touch</v-btn>
    </v-card>

    <template v-else>
      <v-card variant="outlined" class="pa-5 mb-4">
        <div class="d-flex align-center justify-space-between flex-wrap ga-3 mb-4">
          <div>
            <div class="text-caption text-medium-emphasis">Your plan</div>
            <div class="text-h6">{{ sub.planLabel }}</div>
          </div>
          <v-chip :color="sub.status === 'active' ? 'success' : 'error'" variant="flat" size="small">
            {{ sub.status === 'active' ? 'Active' : 'Cancelled' }}
          </v-chip>
        </div>

        <v-divider class="mb-4" />

        <v-row dense>
          <v-col cols="12" sm="6">
            <div class="text-caption text-medium-emphasis">
              {{ sub.skipNextShipment ? 'Next box after your skip' : 'Next box ships' }}
            </div>
            <div class="text-body-1 font-weight-medium">{{ fmt(data?.nextShipDate) }}</div>
          </v-col>
          <v-col cols="12" sm="6">
            <div class="text-caption text-medium-emphasis">Change by (cutoff)</div>
            <div class="text-body-1 font-weight-medium">{{ fmt(data?.cutoffDate) }}</div>
          </v-col>
        </v-row>

        <v-alert
          :type="data?.canChangeNextBox ? 'info' : 'warning'"
          variant="tonal"
          density="comfortable"
          class="mt-4"
        >
          <template v-if="data?.canChangeNextBox">
            You have {{ data?.daysUntilCutoff }}
            {{ data?.daysUntilCutoff === 1 ? 'day' : 'days' }} left to skip or cancel this box.
          </template>
          <template v-else>
            The cutoff has passed, so this box is already packed and on its way. Changes you make now
            apply from the following box.
          </template>
        </v-alert>
      </v-card>

      <!-- Active: skip / cancel -->
      <v-card v-if="sub.status === 'active'" variant="outlined" class="pa-5">
        <div class="text-subtitle-1 font-weight-bold mb-3">Make a change</div>

        <div class="d-flex align-center justify-space-between flex-wrap ga-3 mb-4">
          <div>
            <div class="font-weight-medium">
              {{ sub.skipNextShipment ? 'Next box is skipped' : 'Skip the next box' }}
            </div>
            <div class="text-caption text-medium-emphasis">
              {{ sub.skipNextShipment
                ? 'Your subscription stays active — it just resumes the month after.'
                : 'Pause one month without cancelling.' }}
            </div>
          </div>
          <v-btn
            :disabled="busy || !data?.canChangeNextBox"
            :loading="busy"
            :color="sub.skipNextShipment ? 'primary' : undefined"
            :variant="sub.skipNextShipment ? 'flat' : 'outlined'"
            @click="toggleSkip"
          >
            {{ sub.skipNextShipment ? 'Un-skip this box' : 'Skip this box' }}
          </v-btn>
        </div>

        <v-divider class="mb-4" />

        <div class="d-flex align-center justify-space-between flex-wrap ga-3">
          <div>
            <div class="font-weight-medium">Cancel subscription</div>
            <div class="text-caption text-medium-emphasis">No fee. You can restart any time.</div>
          </div>
          <v-btn v-if="!confirmCancel" color="error" variant="outlined" :disabled="busy" @click="confirmCancel = true">
            Cancel
          </v-btn>
          <div v-else class="d-flex ga-2">
            <v-btn variant="text" :disabled="busy" @click="confirmCancel = false">Keep it</v-btn>
            <v-btn color="error" :loading="busy" @click="cancel">Yes, cancel</v-btn>
          </div>
        </div>
      </v-card>

      <!-- Cancelled: offer to restart -->
      <v-card v-else variant="outlined" class="pa-5 text-center">
        <p class="text-medium-emphasis mb-4">
          Cancelled on {{ fmt(sub.cancelledAt) }}. Your ducks and their journeys stay on the map.
        </p>
        <v-btn color="primary" :loading="busy" @click="resume">Restart my subscription</v-btn>
      </v-card>
    </template>
  </v-container>
</template>

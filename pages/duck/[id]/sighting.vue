<script setup lang="ts">
const route = useRoute()
const duckId = route.params.id as string
const { user, fetchMe } = useAuth()

const { data: duck } = await useFetch<{ id: string; qtCode: number; name: string | null }>(
  `/api/duck/${duckId}`,
)

const step = ref<'form' | 'success'>('form')
const claimToken = ref<string | null>(null)
const form = reactive({ address: '' })
const file = ref<File | null>(null)
const submitting = ref(false)
const error = ref('')

onMounted(() => {
  fetchMe().catch(() => {})
})

function onFile(e: Event) {
  file.value = (e.target as HTMLInputElement).files?.[0] || null
}

async function submit() {
  error.value = ''
  if (!form.address.trim()) {
    error.value = 'Please tell us where you spotted it.'
    return
  }
  submitting.value = true
  try {
    const fd = new FormData()
    fd.append('duckId', duckId)
    fd.append('address', form.address)
    if (file.value) fd.append('image', file.value)
    const res = await $fetch<{ sightingId: number; claimToken: string | null }>('/api/duck/sighting', {
      method: 'POST',
      body: fd,
    })
    claimToken.value = res.claimToken
    if (res.claimToken && import.meta.client) localStorage.setItem('dd_claim_token', res.claimToken)
    step.value = 'success'
  } catch (e: any) {
    error.value = e?.data?.statusMessage || 'Could not post your sighting.'
  } finally {
    submitting.value = false
  }
}
</script>

<template>
  <div class="dd-form-page">
    <template v-if="step === 'form'">
      <h1 class="dd-form-heading">Spotted a duck<span v-if="duck?.name">: {{ duck.name }}</span>?</h1>
      <p class="dd-form-sub">Snap a photo, drop a location, and put it on the map. No account needed.</p>
      <p v-if="error" class="dd-form-error">{{ error }}</p>

      <div class="dd-form-card">
        <label class="dd-label">Where did you spot it?</label>
        <input v-model="form.address" class="dd-field" type="text" placeholder="City, State or place" />
        <label class="dd-label">Photo (optional)</label>
        <input class="dd-field" type="file" accept="image/*" @change="onFile" />
        <div class="dd-form-actions">
          <button class="dd-btn-primary" :disabled="submitting" @click="submit">
            {{ submitting ? 'Posting…' : '📸 Post sighting instantly' }}
          </button>
        </div>
      </div>
    </template>

    <template v-else>
      <div class="post-success">
        <div class="post-success-anim">🛻 💛 🦆</div>
        <h1 class="dd-form-heading">Your duck is on the move!</h1>
        <p class="dd-form-sub">Your sighting is live on the map.</p>

        <FollowPrompt
          v-if="!user"
          :claim-token="claimToken"
          :view-href="`/quackertracker/${duck?.qtCode}`"
          :duck-name="duck?.name"
        />
        <div v-else style="margin-top: 16px">
          <NuxtLink :to="`/quackertracker/${duck?.qtCode}`" class="dd-btn-primary">See its journey →</NuxtLink>
        </div>
      </div>
    </template>
  </div>
</template>

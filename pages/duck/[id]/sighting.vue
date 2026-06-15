<script setup lang="ts">
const route = useRoute()
const duckId = route.params.id as string
const { user, fetchMe } = useAuth()

const { data: duck } = await useFetch<{ id: string; qtCode: number; name: string | null }>(
  `/api/duck/${duckId}`,
)

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
    if (res.claimToken && import.meta.client) localStorage.setItem('dd_claim_token', res.claimToken)
    await navigateTo(`/quackertracker/${duck.value!.qtCode}`)
  } catch (e: any) {
    error.value = e?.data?.statusMessage || 'Could not post your sighting.'
  } finally {
    submitting.value = false
  }
}
</script>

<template>
  <div class="dd-form-page">
    <h1 class="dd-form-heading">Post a sighting<span v-if="duck?.name"> of {{ duck.name }}</span></h1>
    <p class="dd-form-sub">Snap a photo and tell us where you spotted this duck.</p>

    <p v-if="!user" class="dd-form-note">
      You can post as a guest — <NuxtLink to="/login">sign in</NuxtLink> afterwards to save it to your account.
    </p>
    <p v-if="error" class="dd-form-error">{{ error }}</p>

    <div class="dd-form-card">
      <label class="dd-label">Where did you spot it?</label>
      <input v-model="form.address" class="dd-field" type="text" />
      <label class="dd-label">Photo (optional)</label>
      <input class="dd-field" type="file" accept="image/*" @change="onFile" />
      <div class="dd-form-actions">
        <button class="dd-btn-primary" :disabled="submitting" @click="submit">
          {{ submitting ? 'Posting…' : 'Post sighting' }}
        </button>
      </div>
    </div>
  </div>
</template>

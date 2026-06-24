<script setup lang="ts">
const route = useRoute()
const duckId = route.params.id as string
const { user, fetchMe } = useAuth()

const { data: duck } = await useFetch<{ id: string; qtCode: number; name: string | null }>(
  `/api/duck/${duckId}`,
)

const step = ref<'form' | 'success'>('form')
const claimToken = ref<string | null>(null)
const registeredName = ref('')
const form = reactive({ name: '', description: '', address: '' })
const file = ref<File | null>(null)
const submitting = ref(false)
const error = ref('')

onMounted(() => {
  fetchMe().catch(() => {})
  if (duck.value?.name) form.name = duck.value.name
})

function onFile(e: Event) {
  file.value = (e.target as HTMLInputElement).files?.[0] || null
}

async function submit() {
  error.value = ''
  if (!form.name.trim() || !form.address.trim()) {
    error.value = 'Please enter a name and where you found it.'
    return
  }
  submitting.value = true
  try {
    const fd = new FormData()
    fd.append('qtCode', String(duck.value!.qtCode))
    fd.append('name', form.name)
    fd.append('description', form.description)
    fd.append('address', form.address)
    if (file.value) fd.append('image', file.value)
    const res = await $fetch<{ duckId: string; claimToken: string | null }>('/api/duck/register', {
      method: 'POST',
      body: fd,
    })
    claimToken.value = res.claimToken
    registeredName.value = form.name
    if (res.claimToken && import.meta.client) localStorage.setItem('dd_claim_token', res.claimToken)
    step.value = 'success'
  } catch (e: any) {
    error.value = e?.data?.statusMessage || 'Could not register the duck.'
  } finally {
    submitting.value = false
  }
}
</script>

<template>
  <div class="dd-form-page">
    <template v-if="step === 'form'">
      <h1 class="dd-form-heading">Name your duck 🦆</h1>
      <p class="dd-form-sub">Give your found duck a name and drop it on the map. No account needed.</p>
      <p v-if="error" class="dd-form-error">{{ error }}</p>

      <div class="dd-form-card">
        <label class="dd-label">Duck name</label>
        <input v-model="form.name" class="dd-field" type="text" />
        <label class="dd-label">Description (optional)</label>
        <textarea v-model="form.description" class="dd-field" rows="2" />
        <label class="dd-label">Where did you find it?</label>
        <input v-model="form.address" class="dd-field" type="text" placeholder="City, State or place" />
        <label class="dd-label">Photo (optional)</label>
        <input class="dd-field" type="file" accept="image/*" @change="onFile" />
        <div class="dd-form-actions">
          <button class="dd-btn-primary" :disabled="submitting" @click="submit">
            {{ submitting ? 'Registering…' : '📸 Put it on the map' }}
          </button>
        </div>
      </div>
    </template>

    <template v-else>
      <div class="post-success">
        <div class="post-success-anim">🦆 💛 🗺️</div>
        <h1 class="dd-form-heading">{{ registeredName }} is on the map!</h1>
        <p class="dd-form-sub">Your duck is registered and ready to roam.</p>

        <FollowPrompt
          v-if="!user"
          :claim-token="claimToken"
          :view-href="`/quackertracker/${duck?.qtCode}`"
          :duck-name="registeredName"
        />
        <div v-else style="margin-top: 16px">
          <NuxtLink :to="`/quackertracker/${duck?.qtCode}`" class="dd-btn-primary">See its journey →</NuxtLink>
        </div>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
const route = useRoute()
const duckId = route.params.id as string
const { user, fetchMe } = useAuth()

const { data: duck } = await useFetch<{ id: string; qtCode: number; name: string | null }>(
  `/api/duck/${duckId}`,
)

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
    if (res.claimToken && import.meta.client) localStorage.setItem('dd_claim_token', res.claimToken)
    await navigateTo(`/quackertracker/${duck.value!.qtCode}`)
  } catch (e: any) {
    error.value = e?.data?.statusMessage || 'Could not register the duck.'
  } finally {
    submitting.value = false
  }
}
</script>

<template>
  <div class="dd-form-page">
    <h1 class="dd-form-heading">Register this duck</h1>
    <p class="dd-form-sub">Give your found duck a name and tell us where you found it to start its journey.</p>

    <p v-if="!user" class="dd-form-note">
      You can register as a guest — <NuxtLink to="/login">sign in</NuxtLink> afterwards to save it to your account.
    </p>
    <p v-if="error" class="dd-form-error">{{ error }}</p>

    <div class="dd-form-card">
      <label class="dd-label">Duck name</label>
      <input v-model="form.name" class="dd-field" type="text" />
      <label class="dd-label">Description (optional)</label>
      <textarea v-model="form.description" class="dd-field" rows="2" />
      <label class="dd-label">Where did you find it?</label>
      <input v-model="form.address" class="dd-field" type="text" />
      <label class="dd-label">Photo (optional)</label>
      <input class="dd-field" type="file" accept="image/*" @change="onFile" />
      <div class="dd-form-actions">
        <button class="dd-btn-primary" :disabled="submitting" @click="submit">
          {{ submitting ? 'Registering…' : 'Register duck' }}
        </button>
      </div>
    </div>
  </div>
</template>

<style>
.dd-form-page {
  max-width: 640px;
  margin: 0 auto;
  padding: 48px 24px 80px;
  font-family: var(--font-body);
  color: var(--dd-black);
}
.dd-form-heading { font-family: var(--font-display); font-weight: 700; font-size: 34px; margin: 0 0 8px; }
.dd-form-sub { color: var(--dd-gray); margin: 0 0 24px; }
.dd-form-note {
  background: var(--dd-yellow-light);
  border-radius: 10px;
  padding: 12px 16px;
  margin-bottom: 16px;
}
.dd-form-error { color: var(--dd-accent); font-weight: 600; }
.dd-form-card { background: #fff; border-radius: 16px; padding: 24px; box-shadow: 0 2px 12px rgba(0,0,0,0.08); }
.dd-label { display: block; font-weight: 600; margin: 14px 0 6px; }
.dd-field {
  width: 100%;
  padding: 12px 14px;
  border: 1px solid #d8d6cf;
  border-radius: 10px;
  font-size: 15px;
  font-family: var(--font-body);
  box-sizing: border-box;
}
textarea.dd-field { resize: vertical; }
.dd-form-actions { display: flex; justify-content: flex-end; margin-top: 20px; }
.dd-btn-primary[disabled] { opacity: 0.6; cursor: default; }
</style>

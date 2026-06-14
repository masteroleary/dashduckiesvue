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
    if (res.claimToken && import.meta.client) {
      localStorage.setItem('dd_claim_token', res.claimToken)
    }
    await navigateTo(`/quackertracker/${duck.value!.qtCode}`)
  } catch (e: any) {
    error.value = e?.data?.statusMessage || 'Could not register the duck.'
  } finally {
    submitting.value = false
  }
}
</script>

<template>
  <v-container class="py-12">
    <v-row justify="center">
      <v-col cols="12" md="7">
        <h1 class="text-h4 font-weight-bold mb-2">Register this duck</h1>
        <p class="text-medium-emphasis mb-6">
          Give your found duck a name and tell us where you found it to start its journey.
        </p>

        <v-alert v-if="!user" type="info" variant="tonal" density="compact" class="mb-4">
          You can register as a guest — <NuxtLink to="/app">sign in</NuxtLink> afterwards to save it to
          your account.
        </v-alert>
        <v-alert v-if="error" type="error" variant="tonal" density="compact" class="mb-4">
          {{ error }}
        </v-alert>

        <v-card class="pa-4">
          <v-text-field v-model="form.name" label="Duck name" variant="outlined" />
          <v-textarea v-model="form.description" label="Description (optional)" variant="outlined" rows="2" />
          <v-text-field v-model="form.address" label="Where did you find it?" variant="outlined" />
          <v-file-input
            v-model="file"
            label="Photo (optional)"
            accept="image/*"
            variant="outlined"
            prepend-icon="mdi-camera"
          />
          <div class="d-flex justify-end">
            <v-btn color="primary" :loading="submitting" @click="submit">Register duck</v-btn>
          </div>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

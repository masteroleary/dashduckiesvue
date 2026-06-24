<script setup lang="ts">
definePageMeta({ layout: 'app' })

interface Account {
  nameFirst: string
  nameLast: string
  email: string
  phoneNumber: string
  profileImageUrl: string
  addressStreet1: string
  addressStreet2: string
  addressCity: string
  addressState: string
  addressStateAbbr: string
  addressZip: string
  addressCountryAbbr: string
}

const { data } = await useFetch<Account>('/api/member/account')
const form = reactive<Account>({
  nameFirst: '', nameLast: '', email: '', phoneNumber: '', profileImageUrl: '',
  addressStreet1: '', addressStreet2: '', addressCity: '', addressState: '',
  addressStateAbbr: '', addressZip: '', addressCountryAbbr: '',
})
watchEffect(() => {
  if (data.value) Object.assign(form, data.value)
})

const saving = ref(false)
const saved = ref(false)
const error = ref('')

const avatarFile = ref<File | null>(null)
const uploadingAvatar = ref(false)
async function uploadAvatar() {
  if (!avatarFile.value) return
  uploadingAvatar.value = true
  try {
    const fd = new FormData()
    fd.append('image', avatarFile.value)
    const res = await $fetch<{ profileImageUrl: string }>('/api/member/account/profile-image', {
      method: 'POST',
      body: fd,
    })
    form.profileImageUrl = res.profileImageUrl
    avatarFile.value = null
  } catch (e: any) {
    error.value = e?.data?.statusMessage || 'Could not upload image.'
  } finally {
    uploadingAvatar.value = false
  }
}

async function save() {
  saving.value = true
  saved.value = false
  error.value = ''
  try {
    const updated = await $fetch<Account>('/api/member/account', { method: 'PUT', body: { ...form } })
    Object.assign(form, updated)
    saved.value = true
  } catch (e: any) {
    error.value = e?.data?.statusMessage || 'Could not save your account.'
  } finally {
    saving.value = false
  }
}
</script>

<template>
  <v-container class="py-8">
    <h1 class="text-h4 font-weight-bold mb-6">Account</h1>

    <v-row justify="center">
      <v-col cols="12" md="8">
        <v-alert v-if="saved" type="success" variant="tonal" density="compact" class="mb-4">
          Account saved.
        </v-alert>
        <v-alert v-if="error" type="error" variant="tonal" density="compact" class="mb-4">
          {{ error }}
        </v-alert>

        <v-card class="pa-4">
          <div class="d-flex align-center mb-4 ga-4">
            <v-avatar size="72" color="surface-bright">
              <v-img v-if="form.profileImageUrl" :src="form.profileImageUrl" />
              <v-icon v-else icon="mdi-account" size="40" />
            </v-avatar>
            <div class="flex-grow-1">
              <v-file-input
                v-model="avatarFile"
                label="Profile photo"
                accept="image/*"
                variant="outlined"
                density="compact"
                hide-details
                prepend-icon="mdi-camera"
              />
            </div>
            <v-btn :loading="uploadingAvatar" :disabled="!avatarFile" @click="uploadAvatar">Upload</v-btn>
          </div>
          <v-divider class="mb-4" />
          <v-row>
            <v-col cols="12" sm="6"><v-text-field v-model="form.nameFirst" label="First name" variant="outlined" /></v-col>
            <v-col cols="12" sm="6"><v-text-field v-model="form.nameLast" label="Last name" variant="outlined" /></v-col>
            <v-col cols="12" sm="6"><v-text-field v-model="form.email" label="Email" variant="outlined" /></v-col>
            <v-col cols="12" sm="6"><v-text-field v-model="form.phoneNumber" label="Phone" variant="outlined" /></v-col>
            <v-col cols="12"><v-text-field v-model="form.addressStreet1" label="Address line 1" variant="outlined" /></v-col>
            <v-col cols="12"><v-text-field v-model="form.addressStreet2" label="Address line 2" variant="outlined" /></v-col>
            <v-col cols="12" sm="6"><v-text-field v-model="form.addressCity" label="City" variant="outlined" /></v-col>
            <v-col cols="12" sm="3"><v-text-field v-model="form.addressStateAbbr" label="State" variant="outlined" /></v-col>
            <v-col cols="12" sm="3"><v-text-field v-model="form.addressZip" label="ZIP" variant="outlined" /></v-col>
          </v-row>
          <div class="d-flex justify-end mt-2">
            <v-btn color="primary" :loading="saving" @click="save">Save changes</v-btn>
          </div>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<script setup lang="ts">
definePageMeta({ layout: 'app' })

interface MyDuck {
  id: string
  name: string | null
  description: string | null
  imageUrl: string | null
  qtCode: number
  sightings: Array<{ sightingDate: string; address: string | null }>
}

const { data: ducks, pending, refresh } = useFetch<MyDuck[]>('/api/my-ducks')

// Edit dialog
const editing = ref<MyDuck | null>(null)
const form = reactive({ name: '', description: '', address: '' })
const editFile = ref<File | null>(null)
const saving = ref(false)
const errorMsg = ref('')

function openEdit(d: MyDuck) {
  editing.value = d
  form.name = d.name || ''
  form.description = d.description || ''
  form.address = d.sightings?.[0]?.address || ''
  editFile.value = null
  errorMsg.value = ''
}

async function save() {
  if (!editing.value) return
  saving.value = true
  errorMsg.value = ''
  try {
    const fd = new FormData()
    fd.append('name', form.name)
    fd.append('description', form.description)
    fd.append('address', form.address)
    if (editFile.value) fd.append('image', editFile.value)
    await $fetch(`/api/my-ducks/${editing.value.id}`, { method: 'PUT', body: fd })
    editing.value = null
    await refresh()
  } catch (e: any) {
    errorMsg.value = e?.data?.statusMessage || 'Could not save changes.'
  } finally {
    saving.value = false
  }
}

const deleting = ref<MyDuck | null>(null)
const removing = ref(false)
async function confirmDelete() {
  if (!deleting.value) return
  removing.value = true
  try {
    await $fetch(`/api/my-ducks/${deleting.value.id}`, { method: 'DELETE' })
    deleting.value = null
    await refresh()
  } finally {
    removing.value = false
  }
}

function fmtDate(d: string) {
  return new Date(d).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })
}
</script>

<template>
  <v-container class="py-8">
    <h1 class="text-h4 font-weight-bold mb-6">My Ducks</h1>

    <div v-if="pending" class="text-center py-12">
      <v-progress-circular indeterminate color="primary" />
    </div>

    <v-alert v-else-if="!ducks || !ducks.length" type="info" variant="tonal">
      You haven't discovered any ducks yet. Find one in the wild and be its first sighting!
    </v-alert>

    <v-row v-else>
      <v-col v-for="d in ducks" :key="d.id" cols="12" sm="6" md="4">
        <v-card height="100%">
          <v-img :src="d.imageUrl || '/sampleducks/viking-duck.png'" height="180" cover />
          <v-card-title>{{ d.name }}</v-card-title>
          <v-card-subtitle>QT {{ d.qtCode }} · {{ d.sightings.length }} sightings</v-card-subtitle>
          <v-card-text>
            <div v-if="d.sightings[0]" class="text-caption text-medium-emphasis">
              Last seen {{ d.sightings[0].address }} · {{ fmtDate(d.sightings[0].sightingDate) }}
            </div>
          </v-card-text>
          <v-card-actions>
            <v-btn variant="text" color="primary" @click="openEdit(d)">Edit</v-btn>
            <v-spacer />
            <v-btn variant="text" color="error" @click="deleting = d">Delete</v-btn>
          </v-card-actions>
        </v-card>
      </v-col>
    </v-row>

    <!-- Edit dialog -->
    <v-dialog :model-value="!!editing" max-width="500" @update:model-value="editing = null">
      <v-card>
        <v-card-title>Edit duck</v-card-title>
        <v-card-text>
          <v-alert v-if="errorMsg" type="error" variant="tonal" density="compact" class="mb-3">
            {{ errorMsg }}
          </v-alert>
          <v-text-field v-model="form.name" label="Name" variant="outlined" />
          <v-textarea v-model="form.description" label="Description" variant="outlined" rows="2" />
          <v-text-field v-model="form.address" label="Current location" variant="outlined" />
          <v-file-input
            v-model="editFile"
            label="Replace photo (optional)"
            accept="image/*"
            variant="outlined"
            prepend-icon="mdi-camera"
          />
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn variant="text" @click="editing = null">Cancel</v-btn>
          <v-btn color="primary" :loading="saving" @click="save">Save</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Delete confirm -->
    <v-dialog :model-value="!!deleting" max-width="420" @update:model-value="deleting = null">
      <v-card>
        <v-card-title>Delete duck?</v-card-title>
        <v-card-text>This removes <strong>{{ deleting?.name }}</strong> from your ducks.</v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn variant="text" @click="deleting = null">Cancel</v-btn>
          <v-btn color="error" :loading="removing" @click="confirmDelete">Delete</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-container>
</template>

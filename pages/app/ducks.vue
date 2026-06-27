<script setup lang="ts">
definePageMeta({ layout: 'app' })

interface MyDuck {
  id: string
  name: string | null
  description: string | null
  imageUrl: string | null
  qtCode: number
  sightings: Array<{
    sightingDate: string
    address: string | null
    latitude: number | null
    longitude: number | null
  }>
}

const { data: ducks, pending, refresh } = useFetch<MyDuck[]>('/api/my-ducks')

// Edit dialog
const editing = ref<MyDuck | null>(null)
const form = reactive({
  name: '',
  description: '',
  address: '',
  lat: null as number | null,
  lng: null as number | null,
})
const editFile = ref<File | null>(null)
const saving = ref(false)
const errorMsg = ref('')
const locating = ref(false)

function openEdit(d: MyDuck) {
  const s = d.sightings?.[0]
  const hasLoc = !!s && s.latitude != null && s.longitude != null && (s.latitude !== 0 || s.longitude !== 0)
  form.name = d.name || ''
  form.description = d.description || ''
  form.address = s?.address || ''
  form.lat = hasLoc ? (s!.latitude as number) : null
  form.lng = hasLoc ? (s!.longitude as number) : null
  editFile.value = null
  errorMsg.value = ''
  pendingPick.value = null
  editing.value = d
}

// Map drag -> capture the pin (map center) coords + reverse-geocode the address.
async function onMapChange(coords: { lat: number; lng: number }) {
  pendingPick.value = null
  form.lat = coords.lat
  form.lng = coords.lng
  locating.value = true
  try {
    const res = await $fetch<{ address: string }>('/api/geocode/reverse', {
      query: { lat: coords.lat, lng: coords.lng },
    })
    if (res.address) form.address = res.address
  } catch {
    /* keep whatever address we had */
  } finally {
    locating.value = false
  }
}

const mapPicker = ref<{ recenter: (lat: number, lng: number, zoom?: number) => void } | null>(null)
// Picking a suggestion stashes its coords; the map only moves when the user
// hits "Update Map to Address".
const pendingPick = ref<{ lat: number; lng: number } | null>(null)
function onAddressPick(p: { address: string; lat: number; lng: number }) {
  form.address = p.address
  pendingPick.value = { lat: p.lat, lng: p.lng }
}
function applyPickToMap() {
  if (!pendingPick.value) return
  form.lat = pendingPick.value.lat
  form.lng = pendingPick.value.lng
  mapPicker.value?.recenter(pendingPick.value.lat, pendingPick.value.lng)
  pendingPick.value = null
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
    if (form.lat != null && form.lng != null) {
      fd.append('lat', String(form.lat))
      fd.append('lng', String(form.lng))
    }
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
          <AddressAutocomplete
            v-model="form.address"
            label="Location"
            :lat="form.lat"
            :lng="form.lng"
            :loading="locating"
            @pick="onAddressPick"
          />
          <div class="d-flex align-center flex-wrap mt-2 mb-2" style="gap: 10px">
            <v-btn
              v-if="pendingPick"
              size="small"
              color="primary"
              variant="flat"
              prepend-icon="mdi-map-marker-check"
              @click="applyPickToMap"
            >
              Update Map to Address
            </v-btn>
            <span class="text-caption text-medium-emphasis">
              Drag the map to drop the pin — its lat/lng are what get saved.
            </span>
          </div>
          <MapPicker
            ref="mapPicker"
            :key="editing?.id"
            :lat="form.lat"
            :lng="form.lng"
            height="240px"
            class="mb-4"
            @change="onMapChange"
          />
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

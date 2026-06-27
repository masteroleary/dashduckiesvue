<script setup lang="ts">
definePageMeta({ layout: 'app' })
const { user } = useAuth()

interface AdminDuck {
  id: string
  name: string | null
  description: string | null
  imageUrl: string | null
  qtCode: number
  sightingsCount: number
  lastSighting: string | null
}

const { data: ducks, refresh } = useFetch<AdminDuck[]>('/api/admin/ducks')

// Bulk create
const bulkOpen = ref(false)
const bulk = reactive({ start: 100011, count: 5 })
const bulkBusy = ref(false)
const bulkResult = ref('')
async function createBulk() {
  bulkBusy.value = true
  bulkResult.value = ''
  try {
    const items = Array.from({ length: Math.min(100, Math.max(1, bulk.count)) }, (_, i) => ({
      qtCode: bulk.start + i,
    }))
    const res = await $fetch<{ created: number; skipped: number }>('/api/admin/ducks/bulk', {
      method: 'POST',
      body: items,
    })
    bulkResult.value = `Created ${res.created}, skipped ${res.skipped}.`
    await refresh()
  } catch (e: any) {
    bulkResult.value = e?.data?.statusMessage || 'Bulk create failed.'
  } finally {
    bulkBusy.value = false
  }
}

// Edit
const editing = ref<AdminDuck | null>(null)
const form = reactive({ name: '', description: '' })
const editFile = ref<File | null>(null)
const savingEdit = ref(false)
function openEdit(d: AdminDuck) {
  editing.value = d
  form.name = d.name || ''
  form.description = d.description || ''
  editFile.value = null
}
async function saveEdit() {
  if (!editing.value) return
  savingEdit.value = true
  try {
    const fd = new FormData()
    fd.append('name', form.name)
    fd.append('description', form.description)
    if (editFile.value) fd.append('image', editFile.value)
    await $fetch(`/api/admin/ducks/${editing.value.id}`, { method: 'PUT', body: fd })
    editing.value = null
    await refresh()
  } finally {
    savingEdit.value = false
  }
}

// Delete
const deleting = ref<AdminDuck | null>(null)
const removing = ref(false)
async function del() {
  if (!deleting.value) return
  removing.value = true
  try {
    await $fetch(`/api/admin/ducks/${deleting.value.id}`, { method: 'DELETE' })
    deleting.value = null
    await refresh()
  } finally {
    removing.value = false
  }
}

// Sightings viewer + editor
interface AdminSighting {
  id: number
  sightingDate: string
  address: string | null
  latitude: number
  longitude: number
}
const sightingsDuck = ref<AdminDuck | null>(null)
const detail = ref<{ sightings: AdminSighting[] } | null>(null)
const loadingDetail = ref(false)
async function openSightings(d: AdminDuck) {
  sightingsDuck.value = d
  detail.value = null
  loadingDetail.value = true
  try {
    detail.value = await $fetch(`/api/admin/ducks/${d.id}`)
  } finally {
    loadingDetail.value = false
  }
}

const editingSighting = ref<AdminSighting | null>(null)
const sForm = reactive({ address: '', latitude: 0, longitude: 0, sightingDate: '' })
const savingSighting = ref(false)
const locatingSighting = ref(false)
function openSightingEdit(s: AdminSighting) {
  sForm.address = s.address || ''
  sForm.latitude = s.latitude || 0
  sForm.longitude = s.longitude || 0
  sForm.sightingDate = s.sightingDate ? new Date(s.sightingDate).toISOString().slice(0, 10) : ''
  sPendingPick.value = null
  editingSighting.value = s
}
// Map drag -> set the sighting's lat/lng (and reverse-geocode the address).
async function onSightingMapChange(coords: { lat: number; lng: number }) {
  sPendingPick.value = null
  sForm.latitude = coords.lat
  sForm.longitude = coords.lng
  locatingSighting.value = true
  try {
    const res = await $fetch<{ address: string }>('/api/geocode/reverse', {
      query: { lat: coords.lat, lng: coords.lng },
    })
    if (res.address) sForm.address = res.address
  } catch {
    /* keep existing address */
  } finally {
    locatingSighting.value = false
  }
}
const sMapPicker = ref<{ recenter: (lat: number, lng: number, zoom?: number) => void } | null>(null)
const sPendingPick = ref<{ lat: number; lng: number } | null>(null)
function onSightingAddressPick(p: { address: string; lat: number; lng: number }) {
  sForm.address = p.address
  sPendingPick.value = { lat: p.lat, lng: p.lng }
}
function applySightingPickToMap() {
  if (!sPendingPick.value) return
  sForm.latitude = sPendingPick.value.lat
  sForm.longitude = sPendingPick.value.lng
  sMapPicker.value?.recenter(sPendingPick.value.lat, sPendingPick.value.lng)
  sPendingPick.value = null
}
async function saveSighting() {
  if (!editingSighting.value) return
  savingSighting.value = true
  try {
    await $fetch(`/api/admin/sightings/${editingSighting.value.id}`, { method: 'PUT', body: { ...sForm } })
    editingSighting.value = null
    if (sightingsDuck.value) await openSightings(sightingsDuck.value)
  } finally {
    savingSighting.value = false
  }
}
function fmtDate(d: string) {
  return new Date(d).toLocaleDateString()
}
</script>

<template>
  <v-container class="py-8">
    <div class="d-flex align-center mb-6">
      <h1 class="text-h4 font-weight-bold">Admin · Ducks</h1>
      <v-spacer />
      <v-btn v-if="user?.isAdmin" color="primary" prepend-icon="mdi-plus" @click="bulkOpen = true">
        Bulk create
      </v-btn>
    </div>
    <v-alert v-if="user && !user.isAdmin" type="error" variant="tonal">Admins only.</v-alert>

    <v-card v-else>
      <v-table>
        <thead>
          <tr>
            <th></th>
            <th>Name</th>
            <th class="text-center">QT</th>
            <th class="text-center">Sightings</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="d in ducks" :key="d.id">
            <td>
              <v-avatar size="40" rounded>
                <v-img v-if="d.imageUrl" :src="d.imageUrl" />
                <v-icon v-else icon="mdi-duck" />
              </v-avatar>
            </td>
            <td>{{ d.name || '(unregistered)' }}</td>
            <td class="text-center">{{ d.qtCode }}</td>
            <td class="text-center">{{ d.sightingsCount }}</td>
            <td class="text-no-wrap">
              <v-btn icon="mdi-map-marker" size="small" variant="text" @click="openSightings(d)" />
              <v-btn icon="mdi-pencil" size="small" variant="text" @click="openEdit(d)" />
              <v-btn icon="mdi-delete" size="small" variant="text" color="error" @click="deleting = d" />
            </td>
          </tr>
        </tbody>
      </v-table>
    </v-card>

    <!-- Bulk create -->
    <v-dialog v-model="bulkOpen" max-width="460">
      <v-card>
        <v-card-title>Bulk create ducks</v-card-title>
        <v-card-text>
          <p class="text-medium-emphasis mb-4">
            Creates sticker ducks with sequential QT codes (max 100).
          </p>
          <v-row>
            <v-col cols="6"><v-text-field v-model.number="bulk.start" label="Start QT code" type="number" variant="outlined" /></v-col>
            <v-col cols="6"><v-text-field v-model.number="bulk.count" label="Count" type="number" variant="outlined" /></v-col>
          </v-row>
          <v-alert v-if="bulkResult" type="info" variant="tonal" density="compact">{{ bulkResult }}</v-alert>
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn variant="text" @click="bulkOpen = false">Close</v-btn>
          <v-btn color="primary" :loading="bulkBusy" @click="createBulk">Create</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Edit -->
    <v-dialog :model-value="!!editing" max-width="500" @update:model-value="editing = null">
      <v-card>
        <v-card-title>Edit duck</v-card-title>
        <v-card-text>
          <v-text-field v-model="form.name" label="Name" variant="outlined" />
          <v-textarea v-model="form.description" label="Description" variant="outlined" rows="2" />
          <v-file-input v-model="editFile" label="Replace photo" accept="image/*" variant="outlined" prepend-icon="mdi-camera" />
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn variant="text" @click="editing = null">Cancel</v-btn>
          <v-btn color="primary" :loading="savingEdit" @click="saveEdit">Save</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Delete -->
    <v-dialog :model-value="!!deleting" max-width="420" @update:model-value="deleting = null">
      <v-card>
        <v-card-title>Delete duck?</v-card-title>
        <v-card-text>Soft-deletes <strong>{{ deleting?.name || deleting?.qtCode }}</strong>.</v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn variant="text" @click="deleting = null">Cancel</v-btn>
          <v-btn color="error" :loading="removing" @click="del">Delete</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Sightings list -->
    <v-dialog :model-value="!!sightingsDuck" max-width="680" @update:model-value="sightingsDuck = null">
      <v-card>
        <v-card-title>Sightings — {{ sightingsDuck?.name || sightingsDuck?.qtCode }}</v-card-title>
        <v-card-text>
          <div v-if="loadingDetail" class="text-center py-6"><v-progress-circular indeterminate /></div>
          <v-table v-else-if="detail && detail.sightings.length">
            <thead>
              <tr><th>Date</th><th>Address</th><th class="text-right">Lat</th><th class="text-right">Lng</th><th></th></tr>
            </thead>
            <tbody>
              <tr v-for="s in detail.sightings" :key="s.id">
                <td>{{ fmtDate(s.sightingDate) }}</td>
                <td>{{ s.address || '—' }}</td>
                <td class="text-right">{{ s.latitude?.toFixed?.(3) }}</td>
                <td class="text-right">{{ s.longitude?.toFixed?.(3) }}</td>
                <td><v-btn icon="mdi-pencil" size="x-small" variant="text" @click="openSightingEdit(s)" /></td>
              </tr>
            </tbody>
          </v-table>
          <div v-else class="text-medium-emphasis py-4">No sightings yet.</div>
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn variant="text" @click="sightingsDuck = null">Close</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Sighting edit -->
    <v-dialog :model-value="!!editingSighting" max-width="460" @update:model-value="editingSighting = null">
      <v-card>
        <v-card-title>Edit sighting</v-card-title>
        <v-card-text>
          <AddressAutocomplete
            v-model="sForm.address"
            label="Address"
            :lat="sForm.latitude || null"
            :lng="sForm.longitude || null"
            :loading="locatingSighting"
            @pick="onSightingAddressPick"
          />
          <div class="d-flex align-center flex-wrap mt-2 mb-2" style="gap: 10px">
            <v-btn
              v-if="sPendingPick"
              size="small"
              color="primary"
              variant="flat"
              prepend-icon="mdi-map-marker-check"
              @click="applySightingPickToMap"
            >
              Update Map to Address
            </v-btn>
            <span class="text-caption text-medium-emphasis">
              Drag the map, or edit lat/lng directly.
            </span>
          </div>
          <MapPicker
            ref="sMapPicker"
            :key="editingSighting?.id"
            :lat="sForm.latitude || null"
            :lng="sForm.longitude || null"
            height="220px"
            class="mb-4"
            @change="onSightingMapChange"
          />
          <v-row>
            <v-col cols="6"><v-text-field v-model.number="sForm.latitude" label="Latitude" type="number" variant="outlined" /></v-col>
            <v-col cols="6"><v-text-field v-model.number="sForm.longitude" label="Longitude" type="number" variant="outlined" /></v-col>
          </v-row>
          <v-text-field v-model="sForm.sightingDate" label="Date" type="date" variant="outlined" />
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn variant="text" @click="editingSighting = null">Cancel</v-btn>
          <v-btn color="primary" :loading="savingSighting" @click="saveSighting">Save</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-container>
</template>

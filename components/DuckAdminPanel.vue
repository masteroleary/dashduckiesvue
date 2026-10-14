<script setup lang="ts">
/**
 * Admin editing, shown inline on a duck's own page and only to admins.
 *
 * The page itself is public and read-only; this panel is the single place an
 * admin can change everything that page displays — the duck, and every sighting
 * posted to it, including taking a photo or a whole sighting down.
 */
const props = defineProps<{ duckId: string }>()
const emit = defineEmits<{ (e: 'changed'): void }>()

interface AdminSighting {
  id: number
  sightingDate: string
  address: string | null
  latitude: number | null
  longitude: number | null
  imageUrl: string | null
  userId: string | null
}
interface AdminDuckDetail {
  id: string
  name: string | null
  description: string | null
  imageUrl: string | null
  qtCode: number
  sightings: AdminSighting[]
}

const open = ref(false)
const detail = ref<AdminDuckDetail | null>(null)
const loading = ref(false)
const note = ref('')
const problem = ref('')

async function load() {
  loading.value = true
  problem.value = ''
  try {
    detail.value = await $fetch<AdminDuckDetail>(`/api/admin/ducks/${props.duckId}`)
    duckForm.name = detail.value.name || ''
    duckForm.description = detail.value.description || ''
  } catch (e: any) {
    problem.value = e?.data?.statusMessage || 'Could not load this duck.'
  } finally {
    loading.value = false
  }
}
async function toggle() {
  open.value = !open.value
  if (open.value && !detail.value) await load()
}

// Anything that changed on the server needs the public page refreshed too, or
// the admin sees their edit in this panel but the old value above it.
function done(msg: string) {
  note.value = msg
  emit('changed')
  setTimeout(() => { if (note.value === msg) note.value = '' }, 4000)
}

/* ---- the duck itself ---- */
const duckForm = reactive({ name: '', description: '' })
const duckPhoto = ref<File | null>(null)
const savingDuck = ref(false)

async function saveDuck() {
  savingDuck.value = true
  problem.value = ''
  try {
    const fd = new FormData()
    fd.append('name', duckForm.name)
    fd.append('description', duckForm.description)
    if (duckPhoto.value) fd.append('file', duckPhoto.value)
    await $fetch(`/api/admin/ducks/${props.duckId}`, { method: 'PUT', body: fd })
    duckPhoto.value = null
    await load()
    done('Duck saved.')
  } catch (e: any) {
    problem.value = e?.data?.statusMessage || 'Could not save the duck.'
  } finally {
    savingDuck.value = false
  }
}

/* ---- one sighting at a time ---- */
const editingId = ref<number | null>(null)
const sForm = reactive({ address: '', latitude: 0, longitude: 0, sightingDate: '' })
const savingSighting = ref(false)
const busyPhoto = ref<number | null>(null)
const confirmDelete = ref<number | null>(null)

// <input type="datetime-local"> wants "YYYY-MM-DDTHH:mm" in local time.
function toLocalInput(iso: string) {
  const d = new Date(iso)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

function editSighting(s: AdminSighting) {
  editingId.value = s.id
  sForm.address = s.address || ''
  sForm.latitude = s.latitude ?? 0
  sForm.longitude = s.longitude ?? 0
  sForm.sightingDate = toLocalInput(s.sightingDate)
}
function onAddressPick(p: { address: string; lat: number; lng: number }) {
  sForm.address = p.address
  sForm.latitude = p.lat
  sForm.longitude = p.lng
}

async function saveSighting() {
  if (editingId.value == null) return
  savingSighting.value = true
  problem.value = ''
  try {
    await $fetch(`/api/admin/sightings/${editingId.value}`, {
      method: 'PUT',
      body: {
        address: sForm.address,
        latitude: sForm.latitude,
        longitude: sForm.longitude,
        sightingDate: sForm.sightingDate ? new Date(sForm.sightingDate).toISOString() : undefined,
      },
    })
    editingId.value = null
    await load()
    done('Sighting updated.')
  } catch (e: any) {
    problem.value = e?.data?.statusMessage || 'Could not update the sighting.'
  } finally {
    savingSighting.value = false
  }
}

async function replacePhoto(s: AdminSighting, ev: Event) {
  const file = (ev.target as HTMLInputElement).files?.[0]
  if (!file) return
  busyPhoto.value = s.id
  problem.value = ''
  try {
    const fd = new FormData()
    fd.append('file', file)
    await $fetch(`/api/admin/sightings/${s.id}/photo`, { method: 'POST', body: fd })
    await load()
    done('Photo replaced.')
  } catch (e: any) {
    problem.value = e?.data?.statusMessage || 'Could not replace the photo.'
  } finally {
    busyPhoto.value = null
    ;(ev.target as HTMLInputElement).value = ''
  }
}

async function removePhoto(s: AdminSighting) {
  busyPhoto.value = s.id
  problem.value = ''
  try {
    const fd = new FormData()
    fd.append('remove', 'true')
    await $fetch(`/api/admin/sightings/${s.id}/photo`, { method: 'POST', body: fd })
    await load()
    done('Photo removed.')
  } catch (e: any) {
    problem.value = e?.data?.statusMessage || 'Could not remove the photo.'
  } finally {
    busyPhoto.value = null
  }
}

async function deleteSighting(s: AdminSighting) {
  problem.value = ''
  try {
    await $fetch(`/api/admin/sightings/${s.id}`, { method: 'DELETE' })
    confirmDelete.value = null
    await load()
    done('Sighting deleted.')
  } catch (e: any) {
    problem.value = e?.data?.statusMessage || 'Could not delete the sighting.'
  }
}

function fmt(iso: string) {
  return new Date(iso).toLocaleString()
}
</script>

<template>
  <section class="dap">
    <button type="button" class="dap-toggle" :aria-expanded="open" @click="toggle">
      <span class="dap-badge">Admin</span>
      <span class="dap-toggle-text">Edit this duck and its sightings</span>
      <span class="dap-chev" :class="{ 'is-open': open }" aria-hidden="true">▾</span>
    </button>

    <div v-if="open" class="dap-body">
      <p v-if="loading" class="dap-muted">Loading…</p>
      <p v-if="problem" class="dap-error">{{ problem }}</p>
      <p v-if="note" class="dap-note">{{ note }}</p>

      <template v-if="detail">
        <!-- the duck -->
        <div class="dap-card">
          <h3 class="dap-h">The duck</h3>
          <p class="dap-code">QT code <b>{{ detail.qtCode }}</b> — permanent, can't be changed</p>

          <label class="dap-label" for="dap-name">Name</label>
          <input id="dap-name" v-model="duckForm.name" class="dap-input" maxlength="80" />

          <label class="dap-label" for="dap-desc">Story</label>
          <textarea id="dap-desc" v-model="duckForm.description" class="dap-input" rows="3" maxlength="2000" />

          <label class="dap-label" for="dap-photo">Replace photo</label>
          <input
            id="dap-photo"
            type="file"
            accept="image/*"
            class="dap-file"
            @change="duckPhoto = ($event.target as HTMLInputElement).files?.[0] || null"
          />

          <button type="button" class="dap-btn" :disabled="savingDuck" @click="saveDuck">
            {{ savingDuck ? 'Saving…' : 'Save duck' }}
          </button>
        </div>

        <!-- its sightings -->
        <div class="dap-card">
          <h3 class="dap-h">Sightings ({{ detail.sightings.length }})</h3>
          <p v-if="!detail.sightings.length" class="dap-muted">Nobody has posted a sighting yet.</p>

          <div v-for="s in detail.sightings" :key="s.id" class="dap-sighting">
            <div class="dap-sighting-head">
              <img v-if="s.imageUrl" :src="s.imageUrl" class="dap-thumb" alt="" />
              <span v-else class="dap-thumb dap-thumb--none" aria-hidden="true">🦆</span>
              <div class="dap-sighting-main">
                <b>{{ s.address || 'No place given' }}</b>
                <span>{{ fmt(s.sightingDate) }}{{ s.userId ? '' : ' · posted anonymously' }}</span>
              </div>
            </div>

            <div class="dap-sighting-actions">
              <button type="button" class="dap-mini" @click="editSighting(s)">Edit place & date</button>
              <label class="dap-mini">
                {{ busyPhoto === s.id ? 'Working…' : 'Replace photo' }}
                <input type="file" accept="image/*" hidden @change="replacePhoto(s, $event)" />
              </label>
              <button
                v-if="s.imageUrl"
                type="button"
                class="dap-mini"
                :disabled="busyPhoto === s.id"
                @click="removePhoto(s)"
              >
                Remove photo
              </button>
              <button type="button" class="dap-mini dap-mini--danger" @click="confirmDelete = s.id">
                Delete sighting
              </button>
            </div>

            <!-- editing place & date -->
            <div v-if="editingId === s.id" class="dap-edit">
              <label class="dap-label">Place</label>
              <AddressAutocomplete
                v-model="sForm.address"
                :lat="sForm.latitude"
                :lng="sForm.longitude"
                label=""
                @pick="onAddressPick"
              />
              <p class="dap-muted dap-coords">
                Map position: {{ sForm.latitude || 0 }}, {{ sForm.longitude || 0 }}
                <span v-if="!sForm.latitude && !sForm.longitude"> — pick a suggestion to set it</span>
              </p>

              <label class="dap-label" for="dap-date">Date &amp; time</label>
              <input id="dap-date" v-model="sForm.sightingDate" type="datetime-local" class="dap-input" />

              <div class="dap-row">
                <button type="button" class="dap-btn" :disabled="savingSighting" @click="saveSighting">
                  {{ savingSighting ? 'Saving…' : 'Save sighting' }}
                </button>
                <button type="button" class="dap-mini" @click="editingId = null">Cancel</button>
              </div>
            </div>

            <!-- deleting, two-step -->
            <div v-if="confirmDelete === s.id" class="dap-confirm">
              <p>Delete this sighting for good? It will disappear from the map and this page.</p>
              <div class="dap-row">
                <button type="button" class="dap-btn dap-btn--danger" @click="deleteSighting(s)">
                  Yes, delete it
                </button>
                <button type="button" class="dap-mini" @click="confirmDelete = null">Keep it</button>
              </div>
            </div>
          </div>
        </div>
      </template>
    </div>
  </section>
</template>

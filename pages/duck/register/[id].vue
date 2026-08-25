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

// The email they entered to follow their duck — used as the default when they
// go to sign in / sign up to view all their ducks.
const followEmail = ref('')
const signinHref = computed(() =>
  followEmail.value.trim()
    ? `/login?id=${encodeURIComponent(followEmail.value.trim())}&mode=join`
    : '/login?mode=join',
)

onMounted(() => {
  fetchMe().catch(() => {})
  // Leave the name blank on this "Name your duck" screen so the example
  // placeholder ("e.g. Duck Norris") always shows.
})

function onFile(e: Event) {
  file.value = (e.target as HTMLInputElement).files?.[0] || null
}

// "Choose for me" — fill in a fun name + story for people who don't want to type.
const RANDOM_NAMES = [
  'Duck Norris', 'Sir Quacks-a-Lot', 'Waddle Wonka', 'Quackie Chan', 'Duckleberry Finn',
  'Mac Duckle', 'Admiral Featherbottom', 'Quackzilla', 'Sir Paddlington', 'Duck Vader',
  'Puddles McGee', 'Bill Nye the Duck Guy', 'Duck Skywalker', 'Quackly Cooper', 'Waddlesworth',
  'Captain Quackbeard', 'Feathers McGraw', 'Beak Wayne', 'Sir Splashington', 'Duckasso',
  'Mighty Quack', 'Marshmallow', 'Duckington III', 'Quacktastic', 'General Waddington',
]
const RANDOM_DESCRIPTIONS = [
  'Tiny daredevil, big attitude — found him riding shotgun on my Jeep, ready for adventure! 🦆',
  'Off-road legend with zero fear and a love for muddy trails. Found him on my Jeep dash!',
  'Half explorer, half troublemaker — hitched a ride on my Jeep and never looked back.',
  'Lives for sunsets and dirt roads. Found perched on my Jeep, plotting his next trip.',
  'Fearless, fluffy, and always down for a road trip. Found riding on my Jeep like he owns it.',
  'A pint-sized wanderer who collects trails and puddles. Found him on my Jeep, ready to roll.',
  'Certified trail boss with a need for speed. Found riding my Jeep hood like an ornament.',
  'Small but mighty — has conquered more back roads than most humans. Found on my Jeep!',
  'Professional co-pilot, part-time snack thief. Found buckled into my Jeep, ready to navigate.',
  'Born to be wild, built for the trail. Found soaking up the sun on my Jeep dashboard.',
  'King of the cup holder and master of the open road. Found cruising in my Jeep.',
  'Adventure is his middle name. Found this brave little duck perched on my Jeep.',
  'Mud, mountains, and mayhem — his three favorite things. Found riding along in my Jeep.',
  'Loves top-down drives and trail dust. Found riding shotgun in my Jeep, wind in his feathers.',
  'A little legend with big dreams and muddy boots. Found holding down my Jeep passenger seat.',
]
// "Choose for me" cycles through every option before any repeats — each click
// gives a fresh answer until the whole list is used up, then it starts over.
const usedNames: string[] = []
const usedDescs: string[] = []
function pickNext(list: string[], used: string[], current: string) {
  let pool = list.filter((x) => !used.includes(x))
  if (!pool.length) {
    used.length = 0
    if (current) used.push(current) // don't immediately repeat the current one
    pool = list.filter((x) => !used.includes(x))
  }
  const pick = pool[Math.floor(Math.random() * pool.length)]
  used.push(pick)
  return pick
}
function pickRandomName() {
  form.name = pickNext(RANDOM_NAMES, usedNames, form.name)
}
function pickRandomDescription() {
  form.description = pickNext(RANDOM_DESCRIPTIONS, usedDescs, form.description)
}

// Address typeahead for "where did you find it?" — queries /api/geocode/suggest
// (same API the member edit dialog uses) and shows a dropdown of matches.
interface AddrSug { address: string; lat: number; lng: number; kind: 'street' | 'city' }
const addrSuggestions = ref<AddrSug[]>([])
const addrOpen = ref(false)
let addrTimer: ReturnType<typeof setTimeout> | null = null
function onAddressInput() {
  if (addrTimer) clearTimeout(addrTimer)
  const q = form.address.trim()
  if (q.length < 3) {
    addrSuggestions.value = []
    addrOpen.value = false
    return
  }
  addrTimer = setTimeout(async () => {
    try {
      const res = await $fetch<{ suggestions: AddrSug[] }>('/api/geocode/suggest', { query: { q } })
      addrSuggestions.value = res.suggestions || []
      addrOpen.value = addrSuggestions.value.length > 0
    } catch {
      addrSuggestions.value = []
      addrOpen.value = false
    }
  }, 300)
}
function pickAddress(s: AddrSug) {
  form.address = s.address
  addrSuggestions.value = []
  addrOpen.value = false
}
function onAddressBlur() {
  setTimeout(() => (addrOpen.value = false), 160)
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
    // Logged-in members land on "My Ducks" with a congrats banner; anonymous
    // finders keep the inline success + follow prompt (they have no My Ducks page).
    if (user.value) {
      await navigateTo(`/app/ducks?registered=${encodeURIComponent(form.name)}`)
      return
    }
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
        <input v-model="form.name" class="dd-field" type="text" placeholder="e.g. Duck Norris" />
        <div class="dd-random-row">
          <button type="button" class="dd-random-btn" @click="pickRandomName">🎲 Choose for me</button>
        </div>
        <label class="dd-label">Description (optional)</label>
        <textarea
          v-model="form.description"
          class="dd-field"
          rows="2"
          placeholder="e.g. Tiny daredevil, big attitude — found him riding shotgun on my Jeep, ready for adventure! 🦆"
        />
        <div class="dd-random-row">
          <button type="button" class="dd-random-btn" @click="pickRandomDescription">🎲 Choose for me</button>
        </div>
        <label class="dd-label">Where did you find it?</label>
        <div class="dd-ac">
          <input
            v-model="form.address"
            class="dd-field"
            type="text"
            autocomplete="off"
            placeholder="Start typing a city or address…"
            @input="onAddressInput"
            @focus="addrOpen = addrSuggestions.length > 0"
            @blur="onAddressBlur"
          />
          <div v-if="addrOpen" class="dd-ac-menu">
            <button
              v-for="(s, i) in addrSuggestions"
              :key="i"
              type="button"
              class="dd-ac-item"
              @mousedown.prevent
              @click="pickAddress(s)"
            >
              <span class="dd-ac-ico">{{ s.kind === 'city' ? '🏙️' : '📍' }}</span>
              <span class="dd-ac-text">
                <span class="dd-ac-addr">{{ s.address }}</span>
                <span class="dd-ac-kind">{{ s.kind === 'city' ? 'City & state' : 'Street address' }}</span>
              </span>
            </button>
          </div>
        </div>
        <label class="dd-label">Photo (optional)</label>
        <input class="dd-field" type="file" accept="image/*" @change="onFile" />
        <div class="dd-form-actions">
          <button class="dd-btn-primary dd-map-btn" :disabled="submitting" @click="submit">
            <template v-if="submitting">Registering…</template>
            <template v-else>Put this duck on the map <span class="dd-map-arrow" aria-hidden="true">→</span></template>
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
          @email="followEmail = $event"
        />
        <div v-if="!user" class="dd-signin-area">
          <h3 class="dd-signin-h">Want to see all your ducks in one place? 🦆</h3>
          <p class="dd-signin-sub">
            Sign in or create a free account — we'll start you off with the email or phone you used here.
          </p>
          <NuxtLink :to="signinHref" class="dd-btn-primary">Sign in or sign up →</NuxtLink>
        </div>
        <div v-else style="margin-top: 16px">
          <NuxtLink :to="`/quackertracker/${duck?.qtCode}`" class="dd-btn-primary">See its journey →</NuxtLink>
        </div>
      </div>
    </template>
  </div>
</template>

<style scoped>
/* Light-gold "Put it on the map" submit button */
.dd-map-btn {
  background: linear-gradient(150deg, #f6e8b4, #e6ce86);
  color: #16140f;
  box-shadow: 0 8px 20px rgba(200, 170, 90, 0.28);
}
.dd-map-btn:hover { filter: brightness(1.02); }
.dd-map-arrow { color: #2ea44f; font-weight: 800; margin-left: 3px; }

/* "Pick random" helper button under name + description */
.dd-random-row { margin: 2px 0 8px; }
.dd-random-btn {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  background: var(--dd-grad-gold);
  border: none;
  border-radius: 999px;
  padding: 9px 16px;
  font-family: var(--font-body);
  font-weight: 700;
  font-size: 14px;
  color: #16140f;
  cursor: pointer;
  box-shadow: 0 4px 12px rgba(168, 125, 44, 0.28);
  transition: transform 0.15s ease, box-shadow 0.15s ease, filter 0.15s ease;
}
.dd-random-btn:hover { transform: translateY(-1px); box-shadow: 0 8px 18px rgba(168, 125, 44, 0.36); filter: brightness(1.03); }

/* Address typeahead dropdown for "where did you find it?" */
.dd-ac { position: relative; }
.dd-ac-menu {
  position: absolute;
  top: calc(100% + 4px);
  left: 0;
  right: 0;
  z-index: 50;
  background: var(--dd-pitch);
  border: var(--dd-hairline);
  border-radius: 12px;
  box-shadow: 0 16px 40px rgba(60, 45, 15, 0.16);
  max-height: 260px;
  overflow-y: auto;
  padding: 5px;
}
.dd-ac-item {
  display: flex;
  align-items: center;
  gap: 10px;
  width: 100%;
  text-align: left;
  background: none;
  border: none;
  cursor: pointer;
  padding: 9px 11px;
  border-radius: 9px;
  color: var(--dd-cream);
  font-family: var(--font-body);
}
.dd-ac-item:hover { background: var(--dd-panel-3); }
.dd-ac-ico { font-size: 16px; flex: none; }
.dd-ac-text { display: flex; flex-direction: column; min-width: 0; }
.dd-ac-addr { font-size: 14px; line-height: 1.3; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.dd-ac-kind { font-size: 11.5px; color: var(--dd-muted); }

.dd-signin-area {
  margin-top: 20px;
  padding: 24px;
  border: var(--dd-hairline);
  border-radius: 16px;
  background: var(--dd-panel-2);
  text-align: center;
}
.dd-signin-h {
  font-family: var(--font-display);
  font-weight: 600;
  font-size: 18px;
  color: var(--dd-cream);
  margin: 0 0 6px;
}
.dd-signin-sub {
  color: var(--dd-text-2);
  font-size: 14px;
  margin: 0 auto 16px;
  max-width: 420px;
  line-height: 1.5;
}
</style>


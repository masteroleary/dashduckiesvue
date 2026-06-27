<script setup lang="ts">
// Address typeahead: as you type it queries /api/geocode/suggest and shows two
// kinds of options per place — the full street address and a "City, ST" shortcut.
// Picking one emits the chosen text + coords; the field stays freely editable.
interface Sug {
  address: string
  lat: number
  lng: number
  kind: 'street' | 'city'
}

const props = withDefaults(
  defineProps<{
    modelValue: string
    lat?: number | null
    lng?: number | null
    label?: string
    loading?: boolean
  }>(),
  { lat: null, lng: null, label: 'Location', loading: false },
)

const emit = defineEmits<{
  (e: 'update:modelValue', v: string): void
  (e: 'pick', p: { address: string; lat: number; lng: number }): void
}>()

const items = ref<Sug[]>([])
const open = ref(false)
const fetching = ref(false)
let timer: ReturnType<typeof setTimeout> | null = null
let blurTimer: ReturnType<typeof setTimeout> | null = null

function onInput(v: string) {
  emit('update:modelValue', v)
  if (timer) clearTimeout(timer)
  const q = (v || '').trim()
  if (q.length < 3) {
    items.value = []
    open.value = false
    return
  }
  timer = setTimeout(() => doFetch(q), 300)
}

async function doFetch(q: string) {
  fetching.value = true
  try {
    const res = await $fetch<{ suggestions: Sug[] }>('/api/geocode/suggest', {
      query: { q, lat: props.lat ?? '', lng: props.lng ?? '' },
    })
    items.value = res.suggestions || []
    open.value = items.value.length > 0
  } catch {
    items.value = []
    open.value = false
  } finally {
    fetching.value = false
  }
}

function choose(it: Sug) {
  emit('update:modelValue', it.address)
  emit('pick', { address: it.address, lat: it.lat, lng: it.lng })
  items.value = []
  open.value = false
}

function onFocus() {
  if (items.value.length) open.value = true
}
function onBlur() {
  blurTimer = setTimeout(() => (open.value = false), 160)
}

onBeforeUnmount(() => {
  if (timer) clearTimeout(timer)
  if (blurTimer) clearTimeout(blurTimer)
})
</script>

<template>
  <div class="ac">
    <v-text-field
      :model-value="modelValue"
      :label="label"
      :loading="loading || fetching"
      variant="outlined"
      autocomplete="off"
      hide-details
      @update:model-value="onInput"
      @focus="onFocus"
      @blur="onBlur"
    />
    <div v-if="open" class="ac-menu">
      <button
        v-for="(it, i) in items"
        :key="i"
        type="button"
        class="ac-item"
        @mousedown.prevent
        @click="choose(it)"
      >
        <span class="ac-ico">{{ it.kind === 'city' ? '🏙️' : '📍' }}</span>
        <span class="ac-text">
          <span class="ac-addr">{{ it.address }}</span>
          <span class="ac-kind">{{ it.kind === 'city' ? 'City & state' : 'Street address' }}</span>
        </span>
      </button>
    </div>
  </div>
</template>

<style scoped>
.ac {
  position: relative;
}
.ac-menu {
  position: absolute;
  top: calc(100% + 2px);
  left: 0;
  right: 0;
  z-index: 1500;
  background: var(--dd-pitch, #100e0a);
  border: 1px solid rgba(212, 175, 55, 0.3);
  border-radius: 10px;
  box-shadow: 0 16px 40px rgba(0, 0, 0, 0.55);
  max-height: 260px;
  overflow-y: auto;
  padding: 4px;
}
.ac-item {
  display: flex;
  align-items: center;
  gap: 10px;
  width: 100%;
  text-align: left;
  background: none;
  border: none;
  cursor: pointer;
  padding: 8px 10px;
  border-radius: 8px;
  color: var(--dd-cream, #f5efdf);
}
.ac-item:hover {
  background: rgba(168, 125, 44, 0.18);
}
.ac-ico {
  font-size: 16px;
  flex: none;
}
.ac-text {
  display: flex;
  flex-direction: column;
  min-width: 0;
}
.ac-addr {
  font-size: 13.5px;
  line-height: 1.3;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.ac-kind {
  font-size: 11px;
  color: var(--dd-muted, #9a8f78);
}
</style>

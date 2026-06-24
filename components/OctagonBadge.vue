<script setup lang="ts">
// The signature DashDuckies octagon "duck badge": a gold-gradient frame, a thin
// black inset, then the duck's photo (or the duck mark as a fallback/icon),
// all clipped to the same octagon.
//
// variant:
//   'photo' (default) – stretched 2:1 octagon holding an <img>
//   'hero'            – large square regular-octagon crest with the duck mark
//   'icon'            – small square regular-octagon app-icon with the duck mark
//
// Requires <OctagonDefs> mounted somewhere on the page for the 'photo' clip.
const props = withDefaults(
  defineProps<{
    src?: string | null
    alt?: string
    variant?: 'photo' | 'hero' | 'icon'
    /** aspect-ratio for photo variant (width/height). Default 2 */
    ratio?: number
    /** fixed pixel size for hero/icon variants */
    size?: number | string
    /** gold frame thickness */
    frame?: number
  }>(),
  {
    src: null,
    alt: '',
    variant: 'photo',
    ratio: 2,
    size: 0,
    frame: 0,
  },
)

const isPhoto = computed(() => props.variant === 'photo')
// regular octagon polygon (square shapes)
const OCT_POLY =
  'polygon(29% 0%, 71% 0%, 100% 29%, 100% 71%, 71% 100%, 29% 100%, 0% 71%, 0% 29%)'

const clipPath = computed(() => (isPhoto.value ? 'url(#octR)' : OCT_POLY))

const framePad = computed(() => {
  if (props.frame) return `${props.frame}px`
  return props.variant === 'hero' ? '8px' : isPhoto.value ? '5px' : '4px'
})
const insetPad = computed(() => (props.variant === 'hero' ? '5px' : isPhoto.value ? '4px' : '3px'))

const rootStyle = computed(() => {
  const s: Record<string, string> = {
    clipPath: clipPath.value,
    padding: framePad.value,
  }
  if (props.size) {
    const px = typeof props.size === 'number' ? `${props.size}px` : props.size
    s.width = px
    s.height = px
  } else if (isPhoto.value) {
    s.width = '100%'
    s.aspectRatio = String(props.ratio)
  }
  return s
})

const duckSize = computed(() => {
  if (props.variant === 'hero') return 150
  if (props.variant === 'icon') return 28
  return 40
})
</script>

<template>
  <div class="dd-octbadge" :style="rootStyle">
    <div class="dd-octbadge-inset" :style="{ clipPath, padding: insetPad }">
      <img
        v-if="isPhoto && src"
        :src="src"
        :alt="alt"
        :style="{ clipPath }"
        class="dd-octbadge-img"
      />
      <div v-else class="dd-octbadge-fill" :style="{ clipPath }">
        <DuckMark :size="duckSize" color="#a87d2c" />
      </div>
    </div>
  </div>
</template>

<style scoped>
.dd-octbadge {
  background: linear-gradient(150deg, #ecd286, #a87d2c);
  filter: drop-shadow(0 14px 24px rgba(0, 0, 0, 0.5));
}
.dd-octbadge-inset {
  width: 100%;
  height: 100%;
  background: #0c0b0a;
}
.dd-octbadge-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}
.dd-octbadge-fill {
  width: 100%;
  height: 100%;
  background: radial-gradient(circle at 50% 38%, #1d1a12, #100e0a);
  display: flex;
  align-items: center;
  justify-content: center;
}
</style>

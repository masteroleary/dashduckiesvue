<script setup lang="ts">
/**
 * The DashDuckies wordmark.
 *
 * Three ideas, all pulled from the name itself:
 *  1. The duck leans forward with dashes streaking off behind it — it is mid-dash.
 *  2. The two capital D's are orange, so the DD monogram lives inside the word
 *     instead of needing a separate badge. It survives at any size, which a
 *     drawn-in letter would not.
 *  3. It's set in a fat, glossy, inflated face — letters shaped like the product.
 *
 * One component for all three places it appears, so the brand can only ever
 * change in one file.
 */
withDefaults(
  defineProps<{
    /** Wordmark size in px; the duck and streaks scale from it. */
    size?: number
    /** Duck body colour — yellow on pale backgrounds, ink on gold ones. */
    duckColor?: string
  }>(),
  { size: 24, duckColor: '#FFC61A' },
)
</script>

<template>
  <span class="bm" :style="{ '--bm-size': `${size}px` }">
    <span class="bm-duck">
      <span class="bm-streaks" aria-hidden="true"><i /><i /><i /></span>
      <DuckMark class="bm-duck-svg" :size="Math.round(size * 1.4)" :color="duckColor" />
    </span>
    <span class="bm-word">
      <span class="bm-d">D</span>ash<span class="bm-d">D</span>uckies
    </span>
  </span>
</template>

<script setup lang="ts">
// Defines the stretched/rounded-octagon clipPath (id="octR") used by photo
// badges via `clip-path: url(#octR)`. Mount this ONCE near the app root so the
// reference resolves anywhere on the page.
</script>

<template>
  <svg width="0" height="0" style="position: absolute" aria-hidden="true">
    <defs>
      <clipPath id="octR" clipPathUnits="objectBoundingBox">
        <path
          d="M 0.13 0 L 0.87 0 Q 0.91 0 0.93 0.04 L 0.98 0.14 Q 1 0.18 1 0.225 L 1 0.775 Q 1 0.82 0.98 0.86 L 0.93 0.96 Q 0.91 1 0.87 1 L 0.13 1 Q 0.09 1 0.07 0.96 L 0.02 0.86 Q 0 0.82 0 0.775 L 0 0.225 Q 0 0.18 0.02 0.14 L 0.07 0.04 Q 0.09 0 0.13 0 Z"
        />
      </clipPath>
    </defs>
  </svg>
</template>

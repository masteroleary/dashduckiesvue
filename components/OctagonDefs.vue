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
          d="M 0.185 0 L 0.815 0 Q 0.855 0 0.88 0.05 L 0.975 0.24 Q 1 0.29 1 0.34 L 1 0.66 Q 1 0.71 0.975 0.76 L 0.88 0.95 Q 0.855 1 0.815 1 L 0.185 1 Q 0.145 1 0.12 0.95 L 0.025 0.76 Q 0 0.71 0 0.66 L 0 0.34 Q 0 0.29 0.025 0.24 L 0.12 0.05 Q 0.145 0 0.185 0 Z"
        />
      </clipPath>
    </defs>
  </svg>
</template>

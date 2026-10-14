<script setup lang="ts">
/**
 * One styled duck — sun hat, sunglasses, beach shirt — for the subscription promo.
 *
 * Accessories are absolutely-positioned overlays on the brand DuckMark, the same
 * technique DuckBoxArt uses. Placements come from measurements of the mark, not
 * from eyeballing:
 *   - the eye sits at 63.8% across / 26.9% down, so the lens is placed to land
 *     its centre there, and the hat brim is set to rest just above it
 *   - the shirt is drawn in the duck's OWN 64x64 space (like DuckBoxArt's gems),
 *     so its neckline can follow the measured neck line — 39.8%-72.8% across,
 *     head/body join 40%-47% down — and its hem stays inside the body, x 8-51,
 *     y 28-54
 */
withDefaults(defineProps<{ size?: number }>(), { size: 128 })
</script>

<template>
  <div class="cd">
    <span class="cd-duck">
      <DuckMark :size="size" color="#4FA3D9" />

      <!-- One wing, kept simple: a single folded shape with one outline. Drawn in
           the duck's own 64x64 space, so it stays inside the body (x 8-51, y 28-54). -->
      <svg class="cd-wings" viewBox="0 0 64 64" aria-hidden="true">
        <path
          class="cd-wing"
          d="M39 34 C31 31.8 20 34.6 15.4 40.8 C20 45.6 31 46 37 42.2 C40.4 39.8 41.2 36 39 34 Z"
          fill="#3B8CC4"
          stroke="#2F79AC"
          stroke-width="0.7"
          stroke-linejoin="round"
        />
      </svg>

      <!-- Shell necklace. Beads are plotted along the curve, not scattered by eye. -->
      <svg class="cd-necklace" viewBox="0 0 24 14" aria-hidden="true">
        <path d="M3 2.5 Q12 12.5 21 2.5" fill="none" stroke="#E7D3AE" stroke-width="0.7" stroke-linecap="round" />
        <g fill="#FFF6E4" stroke="#DCC49C" stroke-width="0.32">
          <circle cx="4.08" cy="3.63" r="0.95" />
          <circle cx="6.06" cy="5.32" r="1.05" />
          <circle cx="8.04" cy="6.53" r="1.05" />
          <circle cx="10.02" cy="7.26" r="1.15" />
          <circle cx="13.98" cy="7.26" r="1.15" />
          <circle cx="15.96" cy="6.53" r="1.05" />
          <circle cx="17.94" cy="5.32" r="1.05" />
          <circle cx="19.92" cy="3.63" r="0.95" />
        </g>
        <!-- scalloped shell at the lowest point of the strand (12, 7.5) -->
        <path
          d="M9.7 11.5 Q9.7 7.6 12 7.6 Q14.3 7.6 14.3 11.5 Z"
          fill="#FFF1D6"
          stroke="#DCC49C"
          stroke-width="0.4"
          stroke-linejoin="round"
        />
        <g stroke="#E0C79A" stroke-width="0.34" stroke-linecap="round">
          <path d="M12 8 L12 11.4" />
          <path d="M10.85 8.45 L10.5 11.45" />
          <path d="M13.15 8.45 L13.5 11.45" />
        </g>
      </svg>

      <!-- Sunglasses. A swept wayfarer shape rather than a rounded box: straight
           brow bar, lens tapering toward the back, tinted with a gradient, with a
           hinge, a temple arm following the head, and a bridge crossing the beak. -->
      <svg class="cd-shades" viewBox="0 0 40 20" aria-hidden="true">
        <defs>
          <linearGradient id="cdLensTint" x1="0" y1="0" x2="0.35" y2="1">
            <stop offset="0" stop-color="#3A4149" />
            <stop offset="0.45" stop-color="#1B1F25" />
            <stop offset="1" stop-color="#0C0E11" />
          </linearGradient>
        </defs>
        <!-- temple arm, emerging from under the brim and staying on the head -->
        <path d="M-8 9.2 C0 7.9 8 6.1 15.2 5" fill="none" stroke="#141210" stroke-width="1.6" stroke-linecap="round" />
        <rect x="14" y="3.4" width="2.8" height="3" rx="1" fill="#141210" />
        <!-- lens -->
        <path
          d="M15.6 4.6 L35.8 3.3 C38.5 3.1 39.5 6 38.4 9.3 C37.1 13.2 33.8 15.9 29.3 16.1
             C22.8 16.3 17.3 12.7 15.6 8.3 C15 6.7 15 5.2 15.6 4.6 Z"
          fill="url(#cdLensTint)"
          stroke="#141210"
          stroke-width="1.4"
          stroke-linejoin="round"
        />
        <!-- brow bar and the bridge heading across to the far lens -->
        <path d="M15.2 4.2 L36.2 2.8" fill="none" stroke="#141210" stroke-width="1.8" stroke-linecap="round" />
        <path d="M36.6 3.2 C40.4 2.8 44.2 3.4 46 4.6" fill="none" stroke="#141210" stroke-width="1.5" stroke-linecap="round" />
        <!-- reflections: two slim streaks, not one blob -->
        <g fill="#FFFFFF">
          <path d="M19.6 6.2 L23.4 5.8 L20.2 12.4 L17.8 10.2 Z" opacity="0.26" />
          <path d="M25 5.6 L26.8 5.4 L23.6 13.4 L22.2 12.4 Z" opacity="0.16" />
        </g>
        <!-- light catching the bottom rim -->
        <path d="M18.5 12.6 C22.5 15.2 27.5 15.6 31.5 14.2" fill="none" stroke="#FFFFFF" stroke-width="0.6" opacity="0.18" stroke-linecap="round" />
      </svg>

      <!-- Wide straw sun hat. The crown is three-quarters as tall as it is wide,
           which is what keeps it from looking squashed, while its base still sits
           below the top of the head so it reads as worn. The brim is a flattened
           ellipse (we see the duck side-on) and reaches past the viewBox. -->
      <svg class="cd-hat" viewBox="0 0 30 20" aria-hidden="true">
        <!-- crown -->
        <path d="M7 13.2 Q6.4 1.2 15 1.2 Q23.6 1.2 23 13.2 Z" fill="#E8C77A" />
        <g stroke="#D3A85C" stroke-width="0.34" opacity="0.8" fill="none">
          <path d="M6.9 10.4 Q15 12.6 23.1 10.4" />
          <path d="M6.6 7.2 Q15 9.4 23.4 7.2" />
          <path d="M7.2 4.2 Q15 6.2 22.8 4.2" />
        </g>
        <!-- coral band round the base of the crown -->
        <path d="M7.05 11.6 Q15 13.8 22.95 11.6 L23 9.3 Q15 11.5 7 9.3 Z" fill="#F2795F" />
        <!-- brim: shaded underside, then the top face -->
        <ellipse cx="15" cy="13.7" rx="16" ry="1.9" fill="#C99C50" />
        <ellipse cx="15" cy="13.2" rx="16" ry="1.9" fill="#F0D391" />
        <path d="M-1 13.2 Q15 15.6 31 13.2" fill="none" stroke="#D3A85C" stroke-width="0.3" opacity="0.7" />
      </svg>

    </span>
  </div>
</template>

<style scoped>
.cd { display: flex; align-items: center; justify-content: center; }
.cd-duck {
  position: relative;
  display: inline-block;
  line-height: 0;
  filter: drop-shadow(0 6px 10px rgba(30, 60, 90, 0.26));
  animation: cd-bob 3.2s ease-in-out infinite;
}
.cd-hat,
.cd-shades,
.cd-necklace,
.cd-wings {
  position: absolute;
  height: auto;
  overflow: visible;
}
/* The placement already proven on DuckBoxArt's necklace, measured off the neck:
   it runs 39.8%-72.8% across, with the head/body join at 40%-47% down. */
.cd-necklace { left: 40%; top: 37%; width: 33%; }
/* Lens centred on the eye (63.8% across, 26.9% down) and sized to 42% of the
   head's width — the head is 43.8%-76.0% across at that height. The first pass
   made the lens 83% of the head, which is why it looked like a mask. The arm and
   bridge run past the viewBox to reach the head's edges (overflow is visible). */
.cd-shades { left: 48.81%; top: 21.65%; width: 22%; }
/* Traced off the silhouette: brim centred on the head at 59.7% across, with the
   crown's base at 19.3% down so it sits INTO the head rather than above it. */
.cd-hat { left: 35.95%; top: -1.6%; width: 47.5%; }
/* Same box as the duck, so wing coordinates are the duck's coordinates. */
.cd-wings { left: 0; top: 0; width: 100%; }
/* A slow, shallow flap, pivoting at the wing's shoulder. */
.cd-wing {
  transform-box: fill-box;
  transform-origin: 92% 14%;
  animation: cd-flap 3.2s ease-in-out infinite;
}
@keyframes cd-flap {
  0%, 100% { transform: rotate(0deg); }
  50% { transform: rotate(-4deg); }
}

@keyframes cd-bob {
  0%, 100% { transform: translateY(0) rotate(-1.5deg); }
  50% { transform: translateY(-6px) rotate(1.5deg); }
}
@media (prefers-reduced-motion: reduce) {
  .cd-duck, .cd-wing { animation: none; }
}
</style>

<script setup lang="ts">
// An open subscription box with a line of ducks waddling out of it. The box is
// SVG; the ducks are the brand DuckMark, positioned over it so they can waddle
// independently.
defineProps<{ ducks?: number }>()

// Two ducks, matching what the box actually contains — a third would imply the
// wrong thing. Each gets its own delay so they don't waddle in lockstep.
const line = [
  { left: '55%', bottom: '21%', size: 38, delay: '0s', color: '#E97FB0', crown: true, gems: true },
  { left: '78%', bottom: '8%', size: 46, delay: '0.4s', color: '#57B85A', hat: true, bowtie: true },
]
</script>

<template>
  <div class="dba">
    <div class="dba-stage">
      <svg class="dba-box" viewBox="0 0 160 120" aria-hidden="true">
        <!-- open flaps -->
        <path d="M18 46 L6 24 L44 18 L54 40 Z" fill="#C98B3E" />
        <path d="M86 40 L96 18 L134 24 L122 46 Z" fill="#C98B3E" />
        <!-- box body -->
        <path d="M18 44 H122 L114 112 H26 Z" fill="#E0A45C" />
        <!-- shaded right face -->
        <path d="M70 44 H122 L114 112 H70 Z" fill="#CE9049" />
        <!-- tape strip -->
        <rect x="62" y="44" width="16" height="68" fill="#F0C089" opacity="0.7" />
        <!-- front rim -->
        <path d="M18 44 H122 L120 54 H20 Z" fill="#B87F3C" />
      </svg>

      <span
        v-for="(d, i) in line"
        :key="i"
        class="dba-duck"
        :style="{ left: d.left, bottom: d.bottom, animationDelay: d.delay }"
      >
        <DuckMark :size="d.size" :color="d.color" />
        <!-- Sized and placed as a share of the duck, so it rides the head at any scale. -->
        <!-- Diamonds studded across the body. Drawn in the duck's own 64x64 space,
             so each gem lands inside the silhouette (body spans x 8-51, y 28-54). -->
        <svg v-if="d.gems" class="dba-gems" viewBox="0 0 64 64" aria-hidden="true">
          <g fill="#FFFDF5" stroke="rgba(255,255,255,0.9)" stroke-width="0.4" stroke-linejoin="round">
            <path class="dba-gem" d="M24 38.4 L25.8 41 L24 43.6 L22.2 41 Z" style="animation-delay: 0s" />
            <path class="dba-gem" d="M32 41.8 L34.2 45 L32 48.2 L29.8 45 Z" style="animation-delay: 0.5s" />
            <path class="dba-gem" d="M28 35.6 L29.4 37.6 L28 39.6 L26.6 37.6 Z" style="animation-delay: 1s" />
            <path class="dba-gem" d="M37 37.9 L38.5 40 L37 42.1 L35.5 40 Z" style="animation-delay: 1.5s" />
          </g>
          <!-- Glints that flash over each stone, offset so they fire in turn. -->
          <g fill="#FFFFFF">
            <path class="dba-spark" d="M24,36.4 Q24.736,40.264 28.6,41 Q24.736,41.736 24,45.6 Q23.264,41.736 19.4,41 Q23.264,40.264 24,36.4 Z" style="animation-delay: 0s" />
            <path class="dba-spark" d="M32,39.4 Q32.896,44.104 37.6,45 Q32.896,45.896 32,50.6 Q31.104,45.896 26.4,45 Q31.104,44.104 32,39.4 Z" style="animation-delay: 0.6s" />
            <path class="dba-spark" d="M28,33.800000000000004 Q28.608,36.992000000000004 31.8,37.6 Q28.608,38.208 28,41.4 Q27.392,38.208 24.2,37.6 Q27.392,36.992000000000004 28,33.800000000000004 Z" style="animation-delay: 1.2s" />
            <path class="dba-spark" d="M37,36.0 Q37.64,39.36 41.0,40 Q37.64,40.64 37,44.0 Q36.36,40.64 33.0,40 Q36.36,39.36 37,36.0 Z" style="animation-delay: 1.8s" />
          </g>
        </svg>
        <svg v-if="d.crown" class="dba-crown" viewBox="0 0 24 16" aria-hidden="true">
          <path
            d="M3 13.2 L3 4.4 L8 8.6 L12 2.4 L16 8.6 L21 4.4 L21 13.2 Z"
            fill="#F2B705"
            stroke="#C08A07"
            stroke-width="0.7"
            stroke-linejoin="round"
          />
          <circle cx="12" cy="2.2" r="1.4" fill="#FFF3C4" />
        </svg>
        <!-- Pearls on the chest, just below where the head meets the body. -->
        <svg v-if="d.crown" class="dba-necklace" viewBox="0 0 24 14" aria-hidden="true">
          <path d="M3 2.5 Q12 12.5 21 2.5" fill="none" stroke="#FFF3C4" stroke-width="1.7" stroke-linecap="round" />
          <circle cx="12" cy="9.4" r="2.2" fill="#F2B705" stroke="#C08A07" stroke-width="0.5" />
        </svg>
        <!-- Black with an orange knot, picking up the hat's band. -->
        <svg v-if="d.bowtie" class="dba-bowtie" viewBox="0 0 24 14" aria-hidden="true">
          <path d="M2 2.4 L10.4 7 L2 11.6 Z" fill="#2A2420" />
          <path d="M22 2.4 L13.6 7 L22 11.6 Z" fill="#2A2420" />
          <rect x="9.5" y="4.5" width="5" height="5" rx="1.5" fill="#E8792B" />
        </svg>
        <svg v-if="d.hat" class="dba-hat" viewBox="0 0 24 20" aria-hidden="true">
          <g transform="rotate(-12 12 14)">
            <rect x="3" y="13" width="18" height="2.8" rx="1.4" fill="#2A2420" />
            <rect x="7" y="2.5" width="10" height="11" rx="1.6" fill="#2A2420" />
            <rect x="7" y="8.4" width="10" height="2.7" fill="#E8792B" />
          </g>
        </svg>
      </span>
    </div>
    <p v-if="ducks" class="dba-caption">{{ ducks }} ducks on their way</p>
  </div>
</template>

<style scoped>
.dba { display: flex; flex-direction: column; align-items: center; gap: 10px; padding: 8px 0; }
.dba-stage { position: relative; width: 100%; max-width: 280px; aspect-ratio: 5 / 3; }
.dba-box { position: absolute; left: 0; bottom: 0; width: 62%; height: auto; }

.dba-duck {
  position: absolute;
  display: inline-block;
  line-height: 0;
  filter: drop-shadow(0 2px 2px rgba(0, 0, 0, 0.22));
  animation: dba-waddle 1.6s ease-in-out infinite;
}
/* The duck mark's head sits around 60% across and 15% down its box. */
.dba-hat,
.dba-crown,
.dba-necklace,
.dba-bowtie,
.dba-gems {
  position: absolute;
  height: auto;
  overflow: visible;
}
.dba-hat { left: 37%; top: -13%; width: 45%; }
/* Same box as the duck itself, so gem coordinates map straight onto it. */
.dba-gems { left: 0; top: 0; width: 100%; }
.dba-gem {
  transform-box: fill-box;
  transform-origin: center;
  animation: dba-twinkle 2.4s ease-in-out infinite;
}
@keyframes dba-twinkle {
  0%, 100% { opacity: 0.7; transform: scale(0.9); }
  50% { opacity: 1; transform: scale(1.08); }
}
/* The glint: a quick flare that grows, turns and vanishes, idle the rest of the
   cycle so the sparkles fire one at a time rather than shimmering constantly. */
.dba-spark {
  transform-box: fill-box;
  transform-origin: center;
  opacity: 0;
  animation: dba-sparkle 2.4s ease-in-out infinite;
}
@keyframes dba-sparkle {
  0%, 62%, 100% { opacity: 0; transform: scale(0.2) rotate(0deg); }
  74% { opacity: 1; transform: scale(1) rotate(35deg); }
  88% { opacity: 0; transform: scale(0.35) rotate(65deg); }
}
.dba-crown { left: 38%; top: -7%; width: 43%; }
/* Measured off the duck outline: the neck runs from 39.8% to 72.8% across, and
   the head/body joins sit at 40%-47% down. The chain's ends land on that line
   and the pendant hangs just under it. */
.dba-necklace { left: 40%; top: 37%; width: 33%; }
.dba-bowtie { left: 43%; top: 33%; width: 27%; }
/* A short rock side to side — a waddle, not a march. */
@keyframes dba-waddle {
  0%, 100% { transform: rotate(-7deg) translateY(0); }
  50% { transform: rotate(7deg) translateY(-3px); }
}

.dba-caption {
  margin: 0;
  font-size: 13px;
  font-weight: 600;
  color: var(--dd-muted);
}

@media (prefers-reduced-motion: reduce) {
  .dba-duck,
  .dba-gem,
  .dba-spark { animation: none; }
}
</style>

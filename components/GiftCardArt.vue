<script setup lang="ts">
// A gift-card mock-up that previews the amount the visitor has picked. Drawn in
// CSS rather than shipped as an image, so it stays crisp and always shows the
// live figure.
defineProps<{ amount?: number | null }>()
</script>

<template>
  <div class="gca">
    <div class="gca-card">
      <span class="gca-shine" aria-hidden="true"></span>
      <div class="gca-top">
        <DuckMark :size="24" color="#3A2C06" />
        <span class="gca-brand">DashDuckies</span>
      </div>
      <p class="gca-label">E-Gift Card</p>
      <p class="gca-amount">{{ amount == null ? '$—' : `$${amount}` }}</p>
      <p class="gca-foot">Sent by email · ducks, stickers &amp; merch</p>
    </div>
  </div>
</template>

<style scoped>
.gca { display: flex; justify-content: center; padding: 14px 0 6px; }
.gca-card {
  position: relative;
  overflow: hidden;
  width: 100%;
  max-width: 236px;
  aspect-ratio: 8 / 5;
  padding: 15px 17px;
  border-radius: 16px;
  background: linear-gradient(135deg, #FFE066 0%, #FFC61A 55%, #F2B705 100%);
  box-shadow: 0 16px 34px rgba(242, 183, 5, 0.34), inset 0 1px 0 rgba(255, 255, 255, 0.6);
  transform: rotate(-3deg);
  transition: transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
}
.gca-card:hover { transform: rotate(0deg) translateY(-3px); }

/* Light sweeping across the card, the way a real foil card catches it. */
.gca-shine {
  position: absolute;
  top: -60%;
  left: -40%;
  width: 40%;
  height: 220%;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.55), transparent);
  transform: rotate(18deg);
  animation: gca-sweep 4.5s ease-in-out infinite;
}
@keyframes gca-sweep {
  0%, 62% { left: -40%; }
  100% { left: 120%; }
}

.gca-top { display: flex; align-items: center; gap: 8px; }
.gca-brand {
  font-family: var(--font-logo);
  font-weight: 400; /* the wordmark face ships one weight and is already fat */
  font-size: 13.5px;
  color: #3A2C06;
  letter-spacing: -0.01em;
}
.gca-label {
  margin: 12px 0 0;
  font-family: var(--font-mono);
  font-size: 10px;
  letter-spacing: 0.22em;
  text-transform: uppercase;
  color: rgba(58, 44, 6, 0.72);
}
.gca-amount {
  margin: 2px 0 0;
  font-family: var(--font-display);
  font-weight: 700;
  font-size: 33px;
  line-height: 1;
  color: #2A2004;
}
.gca-foot {
  position: absolute;
  left: 17px;
  bottom: 13px;
  margin: 0;
  font-size: 10px;
  font-weight: 600;
  color: rgba(58, 44, 6, 0.66);
}

@media (prefers-reduced-motion: reduce) {
  .gca-shine { animation: none; }
  .gca-card { transition: none; }
}
</style>

<script setup lang="ts">
/**
 * The taste of Quacker Tracker shown to signed-out visitors.
 *
 * Everything here comes from /api/preview/tracker, which is deliberately
 * limited: real duck names and stories (already public on each duck's page),
 * and map pins that have been rounded to ~11 km and stripped of every label.
 * Nothing on this component identifies where a given duck actually is.
 */
const { data } = await useFetch('/api/preview/tracker', {
  default: () => ({ ducks: [], pins: [], counts: { ducks: 0, sightings: 0 } }),
})
</script>

<template>
  <section class="tp">
    <header class="tp-head">
      <h2 class="tp-title">A look inside</h2>
      <p class="tp-note">
        {{ data.counts.ducks }} ducks · {{ data.counts.sightings }} sightings so far
      </p>
    </header>

    <!-- Map: pins only. No names, no places, no popups. -->
    <div class="tp-map">
      <ClientOnly>
        <LiveMap :sightings="data.pins" height="230px" />
        <template #fallback><div class="tp-map-wait" /></template>
      </ClientOnly>
      <span class="tp-map-tag">Approximate — sign in for the real map</span>
    </div>

    <!-- Ducks: names and stories, which are public on each duck's own page. -->
    <div v-if="data.ducks.length" class="tp-ducks">
      <article v-for="d in data.ducks" :key="d.name" class="tp-duck">
        <img v-if="d.imageUrl" :src="d.imageUrl" :alt="d.name" class="tp-duck-img" loading="lazy" />
        <span v-else class="tp-duck-img tp-duck-img--none" aria-hidden="true">🦆</span>
        <div class="tp-duck-main">
          <h3>{{ d.name }}</h3>
          <p v-if="d.story">{{ d.story }}</p>
          <p v-else class="tp-duck-nostory">This one hasn't told its story yet.</p>
        </div>
      </article>
      <p class="tp-more">…and every sighting, photo and journey behind the sign-in.</p>
    </div>
  </section>
</template>

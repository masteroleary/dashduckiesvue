<script setup lang="ts">
const route = useRoute()
const identifier = route.params.identifier as string

const { data, pending } = await useFetch(`/api/scan/${identifier}`)

const duck = computed(() => (data.value && 'duck' in data.value ? data.value.duck : null))

useHead(() => ({
  title: duck.value?.name ? `${duck.value.name} — Dash Duckies` : 'Scan — Dash Duckies',
  meta: [
    {
      name: 'description',
      content: duck.value?.name
        ? `Follow ${duck.value.name}'s journey across the Dash Duckies map.`
        : 'Dash Duckies scan result.',
    },
  ],
}))

function fmtDate(d: string | Date) {
  return new Date(d).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })
}
</script>

<template>
  <v-container class="py-12">
    <div v-if="pending" class="text-center py-16">
      <v-progress-circular indeterminate color="primary" size="48" />
    </div>

    <!-- Not found -->
    <v-row v-else-if="data?.state === 'notFound'" justify="center">
      <v-col cols="12" md="6" class="text-center">
        <div style="font-size: 64px">🛸🦆</div>
        <h1 class="text-h4 font-weight-bold mt-4 mb-2">Invalid code</h1>
        <p class="text-medium-emphasis mb-6">
          We couldn't find a duck for <strong>{{ identifier }}</strong>. Double-check the code on the sticker.
        </p>
        <v-btn color="primary" to="/quackertracker">Try another code</v-btn>
      </v-col>
    </v-row>

    <!-- Not registered yet -->
    <v-row v-else-if="data?.state === 'notRegistered'" justify="center">
      <v-col cols="12" md="6" class="text-center">
        <div style="font-size: 64px">🦆</div>
        <h1 class="text-h4 font-weight-bold mt-4 mb-2">Register this duck</h1>
        <p class="text-medium-emphasis mb-6">
          This duck hasn't been registered yet. Be the first to give it a name and start its journey!
        </p>
        <!-- Register requires sign-in; full register flow lands in a later phase. -->
        <v-btn color="primary" :to="`/app`">Sign in to register</v-btn>
      </v-col>
    </v-row>

    <!-- Registered duck profile -->
    <template v-else-if="data?.state === 'registered' && duck">
      <v-row justify="center">
        <v-col cols="12" md="9">
          <v-card class="mb-8">
            <v-row no-gutters>
              <v-col cols="12" sm="5">
                <v-img
                  :src="duck.imageUrl || '/sampleducks/viking-duck.png'"
                  height="260"
                  cover
                />
              </v-col>
              <v-col cols="12" sm="7">
                <div class="pa-6">
                  <h1 class="text-h4 font-weight-bold mb-2">{{ duck.name }}</h1>
                  <p v-if="duck.description" class="text-medium-emphasis mb-4">{{ duck.description }}</p>
                  <div class="d-flex ga-2 flex-wrap mb-4">
                    <v-chip color="primary" variant="tonal" prepend-icon="mdi-qrcode">
                      QT {{ duck.qtCode }}
                    </v-chip>
                    <v-chip color="primary" variant="tonal" prepend-icon="mdi-map-marker">
                      {{ data.sightingCount }} sightings
                    </v-chip>
                    <v-chip color="pink" variant="tonal" prepend-icon="mdi-heart">
                      {{ data.likeCount }} likes
                    </v-chip>
                  </div>
                  <v-btn color="primary" to="/app">Sign in to post a sighting</v-btn>
                </div>
              </v-col>
            </v-row>
          </v-card>

          <!-- Journey map -->
          <template v-if="data.sightings && data.sightings.length">
            <h2 class="text-h5 font-weight-bold mb-4">Journey</h2>
            <ClientOnly>
              <LiveMap :sightings="data.sightings" height="380px" />
              <template #fallback>
                <v-skeleton-loader type="image" height="380" />
              </template>
            </ClientOnly>
          </template>

          <!-- Sighting history -->
          <template v-if="data.history && data.history.length">
            <h2 class="text-h5 font-weight-bold mt-8 mb-4">Sightings</h2>
            <v-row>
              <v-col v-for="(s, i) in data.history" :key="i" cols="12" sm="6" md="4">
                <v-card height="100%">
                  <v-img v-if="s.imageUrl" :src="s.imageUrl" height="160" cover />
                  <v-card-text>
                    <div class="font-weight-bold">{{ s.address || 'Unknown location' }}</div>
                    <div class="text-caption text-medium-emphasis">
                      {{ s.userName }} · {{ fmtDate(s.sightingDate) }}
                    </div>
                  </v-card-text>
                </v-card>
              </v-col>
            </v-row>
          </template>
        </v-col>
      </v-row>
    </template>
  </v-container>
</template>

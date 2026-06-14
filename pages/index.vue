<script setup lang="ts">
// Public, server-rendered (SSR) landing page — crawlable for SEO.
useHead({
  title: 'Dash Duckies — Track Rubber Ducks Around the World',
  meta: [
    {
      name: 'description',
      content:
        'Scan, register, and follow rubber ducks as they travel the globe. Join the Dash Duckies community.',
    },
  ],
})

// Hits our Nitro server route to prove SSR data-fetching works end to end.
const { data: health } = await useFetch('/api/health')
</script>

<template>
  <v-container class="py-12">
    <v-row justify="center">
      <v-col cols="12" md="8" class="text-center">
        <h1 class="text-h3 font-weight-bold mb-4">Dash Duckies 🦆</h1>
        <p class="text-h6 text-medium-emphasis mb-8">
          The global rubber-duck tracking platform. This page is server-rendered for SEO.
        </p>
        <v-btn color="primary" size="large" to="/app">Enter the app</v-btn>

        <v-alert
          v-if="health"
          type="success"
          variant="tonal"
          class="mt-10 text-left mx-auto"
          max-width="420"
        >
          API health: <strong>{{ health.status }}</strong> · {{ health.service }}
        </v-alert>
      </v-col>
    </v-row>
  </v-container>
</template>

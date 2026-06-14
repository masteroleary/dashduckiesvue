<script setup lang="ts">
// This route is client-only (ssr: false via routeRules in nuxt.config).
// It will become the authenticated SPA shell (member + admin areas).
const renderedOnClient = import.meta.client
</script>

<template>
  <v-container class="py-12">
    <v-row justify="center">
      <v-col cols="12" md="8">
        <h1 class="text-h4 font-weight-bold mb-2">App (client-only SPA)</h1>
        <p class="text-medium-emphasis mb-6">
          This area renders client-side only and will host the member dashboard and admin tools.
        </p>
        <v-card variant="tonal" color="primary">
          <v-card-text>
            Rendered on the client:
            <strong>{{ renderedOnClient ? 'yes ✅' : 'no' }}</strong>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<script setup lang="ts">
definePageMeta({ layout: 'app' })

const { user } = useAuth()
const { data: stats } = useFetch('/api/member/dashboard-statistics')
const { data: sightings } = useFetch('/api/member/sightings')

const cards = computed(() => [
  { label: 'Ducks discovered', value: stats.value?.totalDucks ?? 0, icon: 'mdi-duck' },
  { label: 'Sightings posted', value: stats.value?.totalSightings ?? 0, icon: 'mdi-map-marker' },
  { label: 'Connections', value: stats.value?.totalConnections ?? 0, icon: 'mdi-account-group' },
])
</script>

<template>
  <v-container class="py-8">
    <h1 class="text-h4 font-weight-bold mb-1">Dashboard</h1>
    <p class="text-medium-emphasis mb-6">Signed in as {{ user?.email || user?.phone }}</p>

    <v-row class="mb-2">
      <v-col v-for="c in cards" :key="c.label" cols="12" sm="4">
        <v-card variant="tonal" color="primary" class="pa-4">
          <div class="d-flex align-center">
            <v-icon :icon="c.icon" size="40" class="mr-4" />
            <div>
              <div class="text-h4 font-weight-bold">{{ c.value }}</div>
              <div class="text-subtitle-2">{{ c.label }}</div>
            </div>
          </div>
        </v-card>
      </v-col>
    </v-row>

    <h2 class="text-h6 font-weight-bold mt-8 mb-4">Recent sightings</h2>
    <ClientOnly>
      <LiveMap :sightings="sightings || []" height="400px" />
      <template #fallback>
        <v-skeleton-loader type="image" height="400" />
      </template>
    </ClientOnly>
  </v-container>
</template>

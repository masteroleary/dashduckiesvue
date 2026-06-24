<script setup lang="ts">
definePageMeta({ layout: 'app' })
const { user } = useAuth()
const { data: stats } = useFetch('/api/admin/statistics')

const cards = computed(() => [
  { label: 'Users', value: stats.value?.totalUsers ?? 0, icon: 'mdi-account' },
  { label: 'Members', value: stats.value?.totalMembers ?? 0, icon: 'mdi-account-star' },
  { label: 'Ducks', value: stats.value?.totalDucks ?? 0, icon: 'mdi-duck' },
  { label: 'Sightings', value: stats.value?.totalSightings ?? 0, icon: 'mdi-map-marker' },
])
</script>

<template>
  <v-container class="py-8">
    <h1 class="text-h4 font-weight-bold mb-6">Admin · Statistics</h1>
    <v-alert v-if="user && !user.isAdmin" type="error" variant="tonal">Admins only.</v-alert>
    <v-row v-else>
      <v-col v-for="c in cards" :key="c.label" cols="6" md="3">
        <v-card variant="tonal" color="primary" class="pa-4 text-center">
          <v-icon :icon="c.icon" size="36" class="mb-2" />
          <div class="text-h4 font-weight-bold">{{ c.value }}</div>
          <div class="text-subtitle-2">{{ c.label }}</div>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

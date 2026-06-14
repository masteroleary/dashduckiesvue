<script setup lang="ts">
useHead({
  title: 'Contact — Dash Duckies',
  meta: [{ name: 'description', content: 'Get in touch with the Dash Duckies team.' }],
})

const { data: info } = await useFetch<{ name: string | null; profileImageUrl: string | null; email: string }>(
  '/api/contact',
)
const email = computed(() => info.value?.email || 'info@dashduckies.com')
</script>

<template>
  <v-container class="py-12">
    <v-row justify="center">
      <v-col cols="12" md="7">
        <h1 class="text-h3 font-weight-bold mb-4">Get in touch</h1>
        <p class="text-h6 font-weight-regular text-medium-emphasis mb-8">
          Have questions about Dash Duckies, stickers, or a duck you found? We'd love to hear from you.
        </p>

        <v-card class="pa-6">
          <div v-if="info?.name" class="d-flex align-center mb-6">
            <v-avatar size="64" color="grey-lighten-2" class="mr-4">
              <v-img v-if="info.profileImageUrl" :src="info.profileImageUrl" />
              <v-icon v-else icon="mdi-account" size="36" />
            </v-avatar>
            <div>
              <div class="text-caption text-medium-emphasis">Your host</div>
              <div class="text-h6 font-weight-bold">{{ info.name }}</div>
            </div>
          </div>

          <div class="d-flex align-center">
            <v-icon icon="mdi-email-outline" size="40" color="primary" class="mr-4" />
            <div>
              <div class="text-caption text-medium-emphasis">Email us</div>
              <a :href="`mailto:${email}`" class="text-h6 text-decoration-none text-primary">{{ email }}</a>
            </div>
          </div>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

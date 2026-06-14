<script setup lang="ts">
useHead({
  title: 'Terms of Service — Dash Duckies',
  meta: [{ name: 'description', content: 'Dash Duckies terms of service.' }],
})

const sections = [
  { h: '1. Acceptance of Terms', p: 'By accessing or using Dash Duckies you agree to be bound by these Terms of Service. If you do not agree, please do not use the service.' },
  { h: '2. Eligibility', p: 'You must be able to form a binding contract to use Dash Duckies. By using the service you represent that you meet this requirement.' },
  { h: '3. Registration & Accounts', p: 'Some features require an account, created by verifying your email or phone number. You are responsible for activity that occurs under your account.' },
  { h: '4. Service Description', p: 'Dash Duckies lets you register rubber ducks, log sightings with photos and locations, and follow ducks as they travel. Content you submit may be displayed publicly on duck profiles and maps.' },
  { h: '5. User Conduct', p: 'You agree not to upload unlawful, harmful, or infringing content, and not to misuse, disrupt, or attempt to gain unauthorized access to the service.' },
  { h: '6. Content', p: 'You retain ownership of content you submit, and grant Dash Duckies a license to host and display it as part of operating the service.' },
  { h: '7. Changes', p: 'We may update these terms from time to time. Continued use of the service after changes constitutes acceptance of the updated terms.' },
]
</script>

<template>
  <v-container class="py-12">
    <v-row justify="center">
      <v-col cols="12" md="8">
        <h1 class="text-h3 font-weight-bold mb-2">Terms of Service</h1>
        <p class="text-caption text-medium-emphasis mb-8">Last updated: March 2, 2026</p>
        <div v-for="s in sections" :key="s.h" class="mb-6">
          <h2 class="text-h6 font-weight-bold mb-2">{{ s.h }}</h2>
          <p class="text-body-1 text-medium-emphasis">{{ s.p }}</p>
        </div>
      </v-col>
    </v-row>
  </v-container>
</template>

<script setup lang="ts">
useHead({
  title: 'Scan a Duck — Dash Duckies',
  meta: [{ name: 'description', content: 'Enter a Quacker Tracker code to look up a duck.' }],
})

const code = ref('')
function go() {
  const c = code.value.trim()
  if (c) navigateTo(`/quackertracker/${encodeURIComponent(c)}`)
}
</script>

<template>
  <v-container class="py-12">
    <v-row justify="center">
      <v-col cols="12" md="6" class="text-center">
        <v-icon icon="mdi-qrcode-scan" size="64" color="primary" class="mb-4" />
        <h1 class="text-h4 font-weight-bold mb-2">Find a duck</h1>
        <p class="text-medium-emphasis mb-6">
          Scanning a Quacker Tracker code takes you straight to a duck. You can also enter its code below.
        </p>
        <div class="d-flex flex-column flex-sm-row ga-3 justify-center">
          <v-text-field
            v-model="code"
            label="Quacker Tracker code"
            variant="outlined"
            density="comfortable"
            hide-details
            style="max-width: 320px"
            @keyup.enter="go"
          />
          <v-btn color="primary" size="large" @click="go">Look up</v-btn>
        </div>
      </v-col>
    </v-row>
  </v-container>
</template>

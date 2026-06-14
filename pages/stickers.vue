<script setup lang="ts">
useHead({
  title: 'Quacker Tracker Stickers — Dash Duckies',
  meta: [
    {
      name: 'description',
      content:
        'Add your own rubber ducks to the global Dash Duckies network with Quacker Tracker QR stickers.',
    },
  ],
})
</script>

<template>
  <v-container class="py-12">
    <v-row justify="center">
      <v-col cols="12" md="8">
        <h1 class="text-h3 font-weight-bold mb-4">Get your own stickers</h1>
        <p class="text-h6 font-weight-regular text-medium-emphasis mb-6">
          Quacker Tracker stickers are QR codes you attach to your own ducks, instantly joining them to
          the global Dash Duckies network. Anyone who finds your duck can scan it and add a sighting.
        </p>
        <v-img src="/images/stickers.jpg" height="280" cover eager class="rounded-lg mb-6" />
        <v-card variant="tonal" color="primary" class="pa-6 mb-6">
          <div class="d-flex align-center">
            <v-icon icon="mdi-qrcode" size="64" class="mr-6" />
            <div>
              <div class="text-h6 font-weight-bold">DIY duck tracking</div>
              <div class="text-medium-emphasis">
                Peel, stick, and let your duck start its journey around the world.
              </div>
            </div>
          </div>
        </v-card>
        <v-btn color="primary" size="large" href="mailto:info@dashduckies.com?subject=Quacker%20Tracker%20Stickers">
          Email us to order
        </v-btn>
      </v-col>
    </v-row>
  </v-container>
</template>

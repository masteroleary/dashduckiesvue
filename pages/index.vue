<script setup lang="ts">
// Public, server-rendered homepage (SEO). The map hydrates client-side.
useHead({
  title: 'Dash Duckies — Track Rubber Ducks Around the World',
  meta: [
    {
      name: 'description',
      content:
        'Scan, register, and follow rubber ducks as they travel the globe. See live sightings on the map and join the Dash Duckies community.',
    },
  ],
})

const { data: stats } = await useFetch('/api/stats')
const { data: sightings } = await useFetch('/api/map/sightings')

const steps = [
  { img: '/images/step1.jpg', title: 'Find a duck', text: 'Spot a Dash Duck in the wild and scan its Quacker Tracker code.' },
  { img: '/images/step2.jpg', title: 'Post a photo', text: 'Snap a photo and log where you found it to add to its journey.' },
  { img: '/images/step3.jpg', title: 'Pass it on', text: 'Leave the duck for the next person to discover and keep it travelling.' },
]

// Newsletter
const email = ref('')
const subscribing = ref(false)
const discountCode = ref('')
const subError = ref('')
async function subscribe() {
  subError.value = ''
  subscribing.value = true
  try {
    const res = await $fetch<{ discountCode: string }>('/api/newsletter/subscribe', {
      method: 'POST',
      body: { email: email.value },
    })
    discountCode.value = res.discountCode
  } catch (e: any) {
    subError.value = e?.data?.statusMessage || 'Could not subscribe. Try again.'
  } finally {
    subscribing.value = false
  }
}
</script>

<template>
  <div>
    <!-- Hero -->
    <v-img
      src="/hero-banner.png"
      cover
      eager
      height="460"
      gradient="to bottom, rgba(0,0,0,0.55), rgba(0,0,0,0.65)"
    >
      <v-container class="d-flex flex-column justify-center align-center text-center text-white" style="height: 100%">
        <h1 class="text-h3 text-md-h2 font-weight-bold mb-4">Track your duck's journey 🦆</h1>
        <p class="text-h6 font-weight-regular mb-8" style="max-width: 640px; opacity: 0.95">
          Rubber ducks are travelling the world. Scan one, log your sighting, and watch where it goes next.
        </p>
        <v-btn size="x-large" color="primary" to="/quackertracker">Scan a duck</v-btn>
      </v-container>
    </v-img>

    <!-- Live map -->
    <v-container class="py-12">
      <h2 class="text-h4 font-weight-bold text-center mb-6">Live sightings</h2>
      <ClientOnly>
        <LiveMap :sightings="sightings || []" />
        <template #fallback>
          <v-skeleton-loader type="image" height="440" />
        </template>
      </ClientOnly>
    </v-container>

    <!-- Stats -->
    <v-sheet color="grey-lighten-4" class="py-12">
      <v-container>
        <v-row>
          <v-col cols="12" sm="4" class="text-center">
            <div class="text-h3 font-weight-bold text-primary">{{ stats?.ducks ?? 0 }}+</div>
            <div class="text-subtitle-1">Ducks in the wild</div>
          </v-col>
          <v-col cols="12" sm="4" class="text-center">
            <div class="text-h3 font-weight-bold text-primary">{{ stats?.sightings ?? 0 }}</div>
            <div class="text-subtitle-1">Sightings reported</div>
          </v-col>
          <v-col cols="12" sm="4" class="text-center">
            <div class="text-h3 font-weight-bold text-primary">{{ stats?.duckers ?? 0 }}+</div>
            <div class="text-subtitle-1">Happy duckers</div>
          </v-col>
        </v-row>
      </v-container>
    </v-sheet>

    <!-- How it works -->
    <v-container class="py-12">
      <h2 class="text-h4 font-weight-bold text-center mb-8">How it works</h2>
      <v-row>
        <v-col v-for="s in steps" :key="s.title" cols="12" md="4">
          <v-card height="100%" class="text-center">
            <v-img :src="s.img" height="180" cover eager />
            <v-card-title>{{ s.title }}</v-card-title>
            <v-card-text>{{ s.text }}</v-card-text>
          </v-card>
        </v-col>
      </v-row>
    </v-container>

    <!-- Shop -->
    <v-sheet color="grey-lighten-4" class="py-12">
      <v-container>
        <h2 class="text-h4 font-weight-bold text-center mb-8">Shop</h2>
        <v-row>
          <v-col cols="12" md="4">
            <v-card height="100%" class="pa-4 text-center">
              <v-card-title>Subscription boxes</v-card-title>
              <v-card-text>Two ducks delivered to your door every month.</v-card-text>
              <v-chip color="grey">Coming soon</v-chip>
            </v-card>
          </v-col>
          <v-col cols="12" md="4">
            <v-card height="100%" class="pa-4 text-center">
              <v-card-title>Individual ducks</v-card-title>
              <v-card-text>Pick your favourite characters and send them travelling.</v-card-text>
              <v-chip color="grey">Coming soon</v-chip>
            </v-card>
          </v-col>
          <v-col cols="12" md="4">
            <v-card height="100%" class="pa-4 text-center">
              <v-card-title>Quacker Tracker stickers</v-card-title>
              <v-card-text>Add your own ducks to the global network with QR stickers.</v-card-text>
              <v-btn color="primary" to="/stickers">Get stickers</v-btn>
            </v-card>
          </v-col>
        </v-row>
      </v-container>
    </v-sheet>

    <!-- Newsletter -->
    <v-container class="py-12">
      <v-row justify="center">
        <v-col cols="12" md="7" class="text-center">
          <h2 class="text-h4 font-weight-bold mb-2">Get 10% off</h2>
          <p class="text-medium-emphasis mb-6">
            Join the flock — subscribe for news and a welcome discount code.
          </p>

          <template v-if="discountCode">
            <v-alert type="success" variant="tonal">
              You're in! Use code <strong>{{ discountCode }}</strong> for 10% off.
            </v-alert>
          </template>
          <template v-else>
            <v-alert v-if="subError" type="error" variant="tonal" density="compact" class="mb-4">
              {{ subError }}
            </v-alert>
            <div class="d-flex flex-column flex-sm-row ga-3 justify-center">
              <v-text-field
                v-model="email"
                label="Email"
                variant="outlined"
                density="comfortable"
                hide-details
                style="max-width: 360px"
                @keyup.enter="subscribe"
              />
              <v-btn color="primary" size="large" :loading="subscribing" @click="subscribe">
                Subscribe
              </v-btn>
            </div>
          </template>
        </v-col>
      </v-row>
    </v-container>
  </div>
</template>

<script setup lang="ts">
const nav = [
  { title: 'Home', to: '/' },
  { title: 'Scan', to: '/quackertracker' },
  { title: 'Stickers', to: '/stickers' },
  { title: 'Contact', to: '/contact' },
]
const drawer = ref(false)
const year = new Date().getFullYear()
</script>

<template>
  <v-app>
    <v-app-bar color="primary" flat>
      <v-app-bar-nav-icon class="d-sm-none" @click="drawer = !drawer" />
      <v-app-bar-title>
        <NuxtLink to="/" class="text-white text-decoration-none font-weight-bold">
          Dash Duckies 🦆
        </NuxtLink>
      </v-app-bar-title>
      <template #append>
        <div class="d-none d-sm-flex">
          <v-btn v-for="item in nav" :key="item.to" variant="text" :to="item.to">
            {{ item.title }}
          </v-btn>
        </div>
        <v-btn variant="flat" color="white" class="text-primary ml-2" to="/app">Sign in</v-btn>
      </template>
    </v-app-bar>

    <v-navigation-drawer v-model="drawer" temporary>
      <v-list>
        <v-list-item v-for="item in nav" :key="item.to" :to="item.to" :title="item.title" />
        <v-list-item to="/app" title="Sign in" />
      </v-list>
    </v-navigation-drawer>

    <v-main>
      <slot />
    </v-main>

    <v-footer color="grey-darken-4" class="d-flex flex-column">
      <div class="d-flex w-100 align-center px-4 flex-wrap">
        <strong>Dash Duckies 🦆</strong>
        <v-spacer />
        <NuxtLink to="/terms" class="text-grey-lighten-1 text-decoration-none mr-4">Terms</NuxtLink>
        <NuxtLink to="/contact" class="text-grey-lighten-1 text-decoration-none">Contact</NuxtLink>
      </div>
      <div class="px-4 py-2 text-caption text-grey">© {{ year }} Dash Duckies — track rubber ducks around the world.</div>
    </v-footer>
  </v-app>
</template>

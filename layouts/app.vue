<script setup lang="ts">
// Vuetify's full styles load ONLY here (the /app layout), not on public pages
// (moduleOptions.styles: 'none' in nuxt.config). Keeps the public bundle lean;
// /app is client-only + behind login, so the one-time CSS load is fine.
import 'vuetify/dist/vuetify.min.css'

// Member app shell (client-only routes). Gates on auth: shows the login card
// until signed in, then renders the member nav + page.
const { user, fetchMe, logout } = useAuth()
const ready = ref(false)
const drawer = ref(true)

const nav = computed(() => [
  { title: 'Dashboard', to: '/app', icon: 'mdi-view-dashboard', exact: true },
  { title: 'My Ducks', to: '/app/ducks', icon: 'mdi-duck', exact: false },
  { title: 'Account', to: '/app/account', icon: 'mdi-account', exact: false },
  ...(user.value?.isAdmin
    ? [
        { title: 'Admin · Stats', to: '/app/admin', icon: 'mdi-shield-crown', exact: true },
        { title: 'Admin · Members', to: '/app/admin/members', icon: 'mdi-account-group', exact: false },
        { title: 'Admin · Ducks', to: '/app/admin/ducks', icon: 'mdi-format-list-bulleted', exact: false },
      ]
    : []),
])

onMounted(async () => {
  try {
    await fetchMe()
  } catch {
    /* not signed in */
  } finally {
    ready.value = true
  }
})

async function onLogout() {
  await logout()
  await navigateTo('/app')
}
</script>

<template>
  <v-app>
    <template v-if="!ready">
      <v-main>
        <div class="d-flex justify-center align-center" style="height: 60vh">
          <v-progress-circular indeterminate color="primary" size="48" />
        </div>
      </v-main>
    </template>

    <template v-else-if="!user">
      <v-main>
        <LoginCard />
      </v-main>
    </template>

    <template v-else>
      <v-app-bar color="black" flat>
        <v-app-bar-nav-icon @click="drawer = !drawer" />
        <v-app-bar-title>
          <NuxtLink to="/" class="d-inline-flex align-center text-decoration-none">
            <img src="/logo.webp" alt="Dash Duckies" height="36" />
          </NuxtLink>
        </v-app-bar-title>
        <template #append>
          <v-btn variant="text" @click="onLogout">Sign out</v-btn>
        </template>
      </v-app-bar>

      <v-navigation-drawer v-model="drawer">
        <v-list nav>
          <v-list-item
            v-for="item in nav"
            :key="item.to"
            :to="item.to"
            :title="item.title"
            :prepend-icon="item.icon"
            :exact="item.exact"
          />
        </v-list>
      </v-navigation-drawer>

      <v-main>
        <slot />
      </v-main>
    </template>
  </v-app>
</template>

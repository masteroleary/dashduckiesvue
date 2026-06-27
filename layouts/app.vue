<script setup lang="ts">
// Vuetify's full styles load ONLY here (the /app layout), not on public pages
// (moduleOptions.styles: 'none' in nuxt.config). Keeps the public bundle lean;
// /app is client-only + behind login, so the one-time CSS load is fine.
import 'vuetify/dist/vuetify.min.css'

// Member app shell (client-only routes). Gates on auth: shows the login card
// until signed in, then renders the member nav + page.
const { user, impersonating, fetchMe, logout, stopImpersonate } = useAuth()
const ready = ref(false)
const drawer = ref(true)
const returning = ref(false)

const nav = computed(() => [
  { title: 'Dashboard', to: '/app', icon: 'mdi-view-dashboard', exact: true },
  { title: 'My Ducks', to: '/app/ducks', icon: 'mdi-duck', exact: false },
  { title: 'Account', to: '/app/account', icon: 'mdi-account', exact: false },
  ...(user.value?.isAdmin
    ? [
        { title: 'Admin · Stats', to: '/app/admin', icon: 'mdi-chart-box', exact: true },
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
  // "Sign out" while impersonating returns to the admin account rather than
  // ending the session entirely — matching the admin's mental model.
  if (impersonating.value) {
    await onReturnToAdmin()
    return
  }
  await logout()
  await navigateTo('/app')
}

async function onReturnToAdmin() {
  returning.value = true
  try {
    await stopImpersonate()
    await navigateTo('/app/admin/members')
  } finally {
    returning.value = false
  }
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
      <v-app-bar color="#0d0b07" flat class="dd-app-bar">
        <v-app-bar-nav-icon @click="drawer = !drawer" />
        <v-app-bar-title>
          <NuxtLink to="/" class="d-inline-flex align-center text-decoration-none dd-app-wordmark">
            <DuckMark :size="24" color="#a87d2c" />
            <span class="ml-2">DashDuckies</span>
          </NuxtLink>
        </v-app-bar-title>
        <template #append>
          <div class="dd-app-avatar mr-3" />
          <v-btn variant="text" color="primary" @click="onLogout">
            {{ impersonating ? 'Exit & return to admin' : 'Sign out' }}
          </v-btn>
        </template>
      </v-app-bar>

      <v-banner
        v-if="impersonating"
        color="warning"
        bg-color="#2a2008"
        lines="one"
        icon="mdi-account-eye"
        sticky
        class="dd-impersonate-banner"
      >
        <v-banner-text>
          Viewing as <strong>{{ user?.name || user?.email || user?.phone }}</strong>
        </v-banner-text>
        <template #actions>
          <v-btn
            variant="flat"
            color="warning"
            size="small"
            :loading="returning"
            @click="onReturnToAdmin"
          >
            Return to your admin account
          </v-btn>
        </template>
      </v-banner>

      <v-navigation-drawer v-model="drawer" color="#100e0a">
        <v-list nav class="px-3">
          <v-list-item
            v-for="item in nav"
            :key="item.to"
            :to="item.to"
            :title="item.title"
            :prepend-icon="item.icon"
            :exact="item.exact"
            color="primary"
          />
        </v-list>
      </v-navigation-drawer>

      <v-main>
        <slot />
      </v-main>
    </template>
  </v-app>
</template>

<style scoped>
.dd-app-bar {
  border-bottom: 1px solid rgba(212, 175, 55, 0.14);
}
.dd-app-wordmark {
  font-family: 'Fredoka', system-ui, sans-serif;
  font-weight: 600;
  font-size: 18px;
  letter-spacing: -0.01em;
  color: #f5efdf;
}
.dd-app-avatar {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: linear-gradient(150deg, #ecd286, #a87d2c);
}
/* Selected nav item: solid bronze background with white text/icon. */
:deep(.v-navigation-drawer .v-list-item--active) {
  background-color: #a87d2c;
  color: #fff;
}
:deep(.v-navigation-drawer .v-list-item--active .v-list-item__overlay) {
  opacity: 0;
}
:deep(.v-navigation-drawer .v-list-item--active .v-icon) {
  color: #fff;
}
</style>

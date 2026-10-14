<script setup lang="ts">
// Vuetify's full styles load ONLY here (the /app layout), not on public pages
// (moduleOptions.styles: 'none' in nuxt.config). Keeps the public bundle lean;
// /app is client-only + behind login, so the one-time CSS load is fine.
import 'vuetify/dist/vuetify.min.css'
import { useTheme } from 'vuetify'

// Member app shell (client-only routes). Gates on auth: shows the login card
// until signed in, then renders the member nav + page.
const { user, impersonating, fetchMe, logout, stopImpersonate } = useAuth()
const ready = ref(false)
const drawer = ref(true)
const returning = ref(false)

// Admins work in day mode — long stretches in the admin tables are easier to
// read on a light background. Members keep the brand's dark look. Driven off
// the role rather than the route so it doesn't flip between admin pages and
// the dashboard mid-session. Note an admin who is impersonating a member is
// still an admin at work, so the light theme stays on.
const theme = useTheme()
const dayMode = computed(() => Boolean(user.value?.isAdmin))
watch(dayMode, (light) => { theme.global.name.value = light ? 'light' : 'dark' }, { immediate: true })

// Bars and the drawer were hard-coded near-black; they now follow the theme.
const barColor = computed(() => (dayMode.value ? '#FFFFFF' : '#0d0b07'))
const drawerColor = computed(() => (dayMode.value ? '#FBF9F4' : '#100e0a'))
const bannerBg = computed(() => (dayMode.value ? '#FFF6DF' : '#2a2008'))

const nav = computed(() => [
  { title: 'Dashboard', to: '/app', icon: 'mdi-view-dashboard', exact: true },
  { title: 'My Ducks', to: '/app/ducks', icon: 'mdi-duck', exact: false },
  { title: 'Subscription', to: '/app/subscription', icon: 'mdi-package-variant-closed', exact: false },
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
    // Sign-in now lives on the public, light-themed /login page (with the top
    // nav). Send logged-out visitors there instead of an in-app login card.
    if (!user.value) navigateTo('/login')
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
  await navigateTo('/login')
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
  <v-app :class="{ 'dd-app--day': dayMode }">
    <template v-if="!ready || !user">
      <v-main>
        <div class="d-flex justify-center align-center" style="height: 60vh">
          <v-progress-circular indeterminate color="primary" size="48" />
        </div>
      </v-main>
    </template>

    <template v-else>
      <v-app-bar :color="barColor" flat class="dd-app-bar" :class="{ 'dd-app-bar--day': dayMode }">
        <v-app-bar-nav-icon @click="drawer = !drawer" />
        <v-app-bar-title>
          <NuxtLink to="/" class="d-inline-flex align-center text-decoration-none dd-app-wordmark" aria-label="DashDuckies home">
            <BrandMark :size="20" />
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
        :bg-color="bannerBg"
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

      <v-navigation-drawer v-model="drawer" :color="drawerColor">
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
  color: #f5efdf;
}
/* Day mode: a warm hairline reads on white, and the wordmark goes to ink. */
.dd-app-bar--day {
  border-bottom: 1px solid rgba(168, 125, 44, 0.3);
}
.dd-app-bar--day .dd-app-wordmark {
  color: #1c1813;
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
/* Day mode uses the deeper orange instead: white on the bronze is only 3.73:1,
   which is under the mark for the nav label, while this one holds 5.79:1. */
.dd-app--day :deep(.v-navigation-drawer .v-list-item--active) {
  background-color: #a24e02;
}
:deep(.v-navigation-drawer .v-list-item--active .v-list-item__overlay) {
  opacity: 0;
}
:deep(.v-navigation-drawer .v-list-item--active .v-icon) {
  color: #fff;
}
</style>

<template>
  <v-app>
    <v-app-bar color="primary" flat>
      <v-app-bar-title>
        <NuxtLink to="/" class="text-white text-decoration-none">Dash Duckies 🦆</NuxtLink>
      </v-app-bar-title>
      <template #append>
        <v-btn variant="text" to="/">Home</v-btn>
        <v-btn variant="text" to="/app">App</v-btn>
      </template>
    </v-app-bar>

    <v-main>
      <slot />
    </v-main>
  </v-app>
</template>

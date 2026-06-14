// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-01-01',
  devtools: { enabled: true },

  modules: ['vuetify-nuxt-module'],

  // SSR on by default (for SEO). The authenticated app is a client-only SPA.
  ssr: true,
  routeRules: {
    // /app/** renders client-side only (non-SSR SPA), per project requirements.
    '/app/**': { ssr: false },
  },

  // Server-side only secrets are under the top level; `public` is exposed to the client.
  runtimeConfig: {
    databaseUrl: process.env.DATABASE_URL,
    jwtSecret: process.env.JWT_SECRET,
    public: {
      appName: 'Dash Duckies',
    },
  },

  vuetify: {
    moduleOptions: {
      // styles handled by sass-embedded; keep defaults
    },
    vuetifyOptions: {
      theme: {
        defaultTheme: 'light',
      },
    },
  },
})

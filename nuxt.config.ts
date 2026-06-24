// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-01-01',
  devtools: { enabled: true },

  modules: ['vuetify-nuxt-module'],

  nitro: {
    // Pre-compress static assets (JS/CSS/etc.) at build time; the server then
    // serves .br/.gz with Content-Encoding when the client accepts it.
    compressPublicAssets: { gzip: true, brotli: true },
  },

  // Old public design system + page styles (ported from the Blazor app).
  css: [
    '~/assets/css/dd-design.css',
    '~/assets/css/pages/quackertracker.css',
    '~/assets/css/pages/duck-profile.css',
    '~/assets/css/pages/stickers.css',
    '~/assets/css/pages/contact.css',
    '~/assets/css/pages/terms.css',
  ],

  // SSR on by default (for SEO). The authenticated app is a client-only SPA.
  ssr: true,
  routeRules: {
    // /app/** renders client-side only (non-SSR SPA), per project requirements.
    '/app/**': { ssr: false },
    // Old site linked sign-in as /login; keep that URL working.
    '/login': { redirect: '/app' },
    // Cache static brand/demo images (not content-hashed, so a 30-day max-age).
    '/images/**': { headers: { 'cache-control': 'public, max-age=2592000' } },
    '/sampleducks/**': { headers: { 'cache-control': 'public, max-age=2592000' } },
    '/logo.png': { headers: { 'cache-control': 'public, max-age=2592000' } },
    '/hero-banner.png': { headers: { 'cache-control': 'public, max-age=2592000' } },
    '/ducks-on-board.png': { headers: { 'cache-control': 'public, max-age=2592000' } },
    '/duck-map.png': { headers: { 'cache-control': 'public, max-age=2592000' } },
    '/favicon.svg': { headers: { 'cache-control': 'public, max-age=2592000' } },
    // Fully-static content pages -> prerender to static HTML (cached + compressed).
    '/terms': { prerender: true },
    '/stickers': { prerender: true },
  },

  // Server-side only secrets are under the top level; `public` is exposed to the client.
  runtimeConfig: {
    databaseUrl: process.env.DATABASE_URL,
    jwtSecret: process.env.JWT_SECRET,
    public: {
      appName: 'Dash Duckies',
    },
  },

  app: {
    head: {
      link: [
        { rel: 'icon', type: 'image/svg+xml', href: '/favicon.svg' },
        { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
        { rel: 'preconnect', href: 'https://fonts.gstatic.com', crossorigin: '' },
        {
          rel: 'stylesheet',
          href: 'https://fonts.googleapis.com/css2?family=Fredoka:wght@400;500;600;700&family=Hanken+Grotesk:wght@400;500;600;700;800&display=swap',
        },
      ],
    },
  },

  vuetify: {
    moduleOptions: {
      // Don't inject Vuetify's global styles app-wide; they're imported only in
      // the /app layout (layouts/app.vue) so public pages stay Vuetify-free.
      styles: 'none',
    },
    vuetifyOptions: {
      // DashDuckies brand: dark, bronze-gold "minted-coin" identity.
      theme: {
        defaultTheme: 'dark',
        themes: {
          dark: {
            dark: true,
            colors: {
              primary: '#A87D2C', // bronze
              secondary: '#9C947F', // muted
              success: '#5C8A4A',
              info: '#A87D2C',
              warning: '#D4AF37', // gold
              error: '#C0524A',
              background: '#0C0B0A', // ink
              surface: '#16140F', // pitch
              'surface-bright': '#15120C',
              'on-background': '#F5EFDF',
              'on-surface': '#F5EFDF',
            },
          },
        },
      },
    },
  },
})

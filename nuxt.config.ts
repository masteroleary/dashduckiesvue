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
          href: 'https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,300;0,9..144,700;0,9..144,900;1,9..144,700&family=DM+Sans:ital,wght@0,300;0,400;0,500;1,300&display=swap',
        },
      ],
    },
  },

  vuetify: {
    moduleOptions: {
      // styles handled by sass-embedded; keep defaults
    },
    vuetifyOptions: {
      // Brand palette ported from the old MudBlazor CustomTheme.
      theme: {
        defaultTheme: 'light',
        themes: {
          light: {
            dark: false,
            colors: {
              primary: '#1b6ec2',
              secondary: '#6c757d',
              success: '#198754',
              info: '#0dcaf0',
              warning: '#ffc107',
              error: '#dc3545',
              background: '#f8f9fa',
              surface: '#ffffff',
            },
          },
        },
      },
    },
  },
})

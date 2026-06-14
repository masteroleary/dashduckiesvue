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

  app: {
    head: {
      link: [{ rel: 'icon', type: 'image/svg+xml', href: '/favicon.svg' }],
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

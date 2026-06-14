// Simple Nitro server route. Proves the server layer works (and SSR can call it).
export default defineEventHandler(() => {
  return {
    status: 'ok',
    service: 'dashduckies',
  }
})

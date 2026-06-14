// Returns the current user (populated by server/middleware/auth.ts) or null.
export default defineEventHandler((event) => {
  return { user: event.context.user ?? null }
})

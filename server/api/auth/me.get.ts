// Returns the current user (populated by server/middleware/auth.ts) or null,
// plus whether this session is an admin impersonating that user.
export default defineEventHandler((event) => {
  return {
    user: event.context.user ?? null,
    impersonating: Boolean(event.context.impersonating),
  }
})

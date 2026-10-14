import type { AuthUser } from './useAuth'

/**
 * Resolve the signed-in user during SSR as well as on the client.
 *
 * `useAuth().fetchMe()` runs in `onMounted`, which is fine for pages that only
 * *enhance* themselves for members. Pages that are gated need the answer before
 * the first paint, otherwise guests see the real page flash past before the
 * sign-in panel replaces it. `useRequestFetch` forwards the incoming request's
 * cookies, so the session cookie reaches /api/auth/me during SSR too.
 *
 * Must be called at the top of `setup()`, before any other `await`.
 */
export async function useResolvedUser() {
  const { user, impersonating, resolved } = useAuth()
  const authFetch = useRequestFetch()

  const { data } = await useAsyncData('auth-me', () =>
    authFetch<{ user: AuthUser | null; impersonating?: boolean }>('/api/auth/me'),
  )

  user.value = data.value?.user ?? null
  impersonating.value = Boolean(data.value?.impersonating)
  resolved.value = true
  return user
}

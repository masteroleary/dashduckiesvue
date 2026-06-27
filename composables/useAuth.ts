export interface AuthUser {
  id: string
  email: string | null
  phone: string | null
  name?: string | null
  isAdmin: boolean
  isMember: boolean
}

export function useAuth() {
  // Shared, SSR-safe reactive auth state.
  const user = useState<AuthUser | null>('auth-user', () => null)
  // True when an admin is impersonating the current user.
  const impersonating = useState<boolean>('auth-impersonating', () => false)

  async function fetchMe() {
    const { user: u, impersonating: imp } = await $fetch<{
      user: AuthUser | null
      impersonating?: boolean
    }>('/api/auth/me')
    user.value = u
    impersonating.value = Boolean(imp)
    return u
  }

  async function requestCode(identifier: string) {
    return await $fetch<{ ok: boolean; dev: boolean }>('/api/auth/request-code', {
      method: 'POST',
      body: { identifier },
    })
  }

  async function verifyCode(identifier: string, code: string) {
    // Carry any anonymous submission claim token so it's attributed on login.
    const claimToken = import.meta.client
      ? localStorage.getItem('dd_claim_token') || undefined
      : undefined
    const res = await $fetch<{ ok: boolean; user: AuthUser }>('/api/auth/verify-code', {
      method: 'POST',
      body: { identifier, code, claimToken },
    })
    if (claimToken && import.meta.client) localStorage.removeItem('dd_claim_token')
    user.value = res.user
    return res
  }

  async function logout() {
    await $fetch('/api/auth/logout', { method: 'POST' })
    user.value = null
    impersonating.value = false
  }

  // Admin-only: become the given user while keeping the admin session stashed.
  async function impersonate(userId: string) {
    await $fetch('/api/admin/impersonate', { method: 'POST', body: { userId } })
    await fetchMe()
  }

  // Restore the stashed admin session after impersonating.
  async function stopImpersonate() {
    await $fetch('/api/auth/stop-impersonate', { method: 'POST' })
    await fetchMe()
  }

  return {
    user,
    impersonating,
    fetchMe,
    requestCode,
    verifyCode,
    logout,
    impersonate,
    stopImpersonate,
  }
}

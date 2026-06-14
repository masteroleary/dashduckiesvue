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

  async function fetchMe() {
    const { user: u } = await $fetch<{ user: AuthUser | null }>('/api/auth/me')
    user.value = u
    return u
  }

  async function requestCode(identifier: string) {
    return await $fetch<{ ok: boolean; dev: boolean }>('/api/auth/request-code', {
      method: 'POST',
      body: { identifier },
    })
  }

  async function verifyCode(identifier: string, code: string) {
    const res = await $fetch<{ ok: boolean; user: AuthUser }>('/api/auth/verify-code', {
      method: 'POST',
      body: { identifier, code },
    })
    user.value = res.user
    return res
  }

  async function logout() {
    await $fetch('/api/auth/logout', { method: 'POST' })
    user.value = null
  }

  return { user, fetchMe, requestCode, verifyCode, logout }
}

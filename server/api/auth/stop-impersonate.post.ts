import { ADMIN_COOKIE, AUTH_COOKIE, sessionCookieOptions, verifyAuthToken } from '../../utils/jwt'
import { isTokenActive, revokeToken } from '../../utils/userAuth'

// Ends an impersonation session started via /api/admin/impersonate: revokes the
// impersonated session token and restores the admin's stashed token as the
// active session. Validates the stashed token is still an active admin session
// before trusting it.
export default defineEventHandler(async (event) => {
  const adminToken = getCookie(event, ADMIN_COOKIE)
  if (!adminToken) throw createError({ statusCode: 400, statusMessage: 'Not impersonating' })

  let claims
  try {
    claims = await verifyAuthToken(adminToken)
  } catch {
    deleteCookie(event, ADMIN_COOKIE, { path: '/' })
    throw createError({ statusCode: 401, statusMessage: 'Admin session expired' })
  }
  if (!claims.isAdmin || !(await isTokenActive(adminToken))) {
    deleteCookie(event, ADMIN_COOKIE, { path: '/' })
    throw createError({ statusCode: 401, statusMessage: 'Admin session is no longer valid' })
  }

  // Revoke the throwaway impersonation token so it can't be reused.
  const impersonatedToken = getCookie(event, AUTH_COOKIE)
  if (impersonatedToken && impersonatedToken !== adminToken) {
    await revokeToken(impersonatedToken)
  }

  setCookie(event, AUTH_COOKIE, adminToken, sessionCookieOptions())
  deleteCookie(event, ADMIN_COOKIE, { path: '/' })

  return { ok: true }
})

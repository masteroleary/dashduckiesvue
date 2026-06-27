import { ADMIN_COOKIE, AUTH_COOKIE } from '../../utils/jwt'
import { revokeToken } from '../../utils/userAuth'

export default defineEventHandler(async (event) => {
  const token = getCookie(event, AUTH_COOKIE)
  if (token) {
    await revokeToken(token)
    deleteCookie(event, AUTH_COOKIE, { path: '/' })
  }
  // If logging out mid-impersonation, also tear down the stashed admin session.
  const adminToken = getCookie(event, ADMIN_COOKIE)
  if (adminToken) {
    await revokeToken(adminToken)
    deleteCookie(event, ADMIN_COOKIE, { path: '/' })
  }
  return { ok: true }
})

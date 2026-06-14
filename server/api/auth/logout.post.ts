import { AUTH_COOKIE } from '../../utils/jwt'
import { revokeToken } from '../../utils/userAuth'

export default defineEventHandler(async (event) => {
  const token = getCookie(event, AUTH_COOKIE)
  if (token) {
    await revokeToken(token)
    deleteCookie(event, AUTH_COOKIE, { path: '/' })
  }
  return { ok: true }
})

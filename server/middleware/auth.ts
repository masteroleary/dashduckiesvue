import { AUTH_COOKIE, verifyAuthToken } from '../utils/jwt'
import { isTokenActive } from '../utils/userAuth'

// Runs on every request. If a valid, non-revoked session cookie is present,
// attach the user to event.context so SSR pages and API routes can read it.
// Anonymous requests carry no cookie, so they incur no DB query.
export default defineEventHandler(async (event) => {
  const token = getCookie(event, AUTH_COOKIE)
  if (!token) return

  try {
    const claims = await verifyAuthToken(token)
    if (!(await isTokenActive(token))) return // revoked via logout
    event.context.user = {
      id: claims.sub,
      email: claims.email ?? null,
      phone: claims.phone ?? null,
      name: claims.name ?? null,
      isAdmin: claims.isAdmin,
      isMember: claims.isMember,
    }
  } catch {
    // invalid/expired token → remain anonymous
  }
})

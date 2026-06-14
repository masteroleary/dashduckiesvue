import { AUTH_COOKIE } from '../../utils/jwt'
import { checkCode, normalizeIdentifier } from '../../utils/verification'
import { enforceVerifyLimit } from '../../utils/rateLimit'
import {
  claimAnonymousSubmissions,
  findOrCreateUser,
  issueToken,
  publicUser,
} from '../../utils/userAuth'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const identifier = String(body?.identifier || '').trim()
  const code = String(body?.code || '').trim()
  const claimToken = body?.claimToken ? String(body.claimToken) : undefined

  if (!identifier || !code) {
    throw createError({ statusCode: 400, statusMessage: 'identifier and code are required' })
  }
  enforceVerifyLimit(event, normalizeIdentifier(identifier))

  const valid = await checkCode(identifier, code)
  if (!valid) {
    throw createError({ statusCode: 401, statusMessage: 'Invalid or expired code' })
  }

  const user = await findOrCreateUser(normalizeIdentifier(identifier))
  if (claimToken) {
    await claimAnonymousSubmissions(claimToken, user.id)
  }
  const token = await issueToken(user)

  const hours = Number.parseInt(process.env.JWT_EXPIRATION_HOURS || '720', 10)
  setCookie(event, AUTH_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: hours * 3600,
  })

  return { ok: true, user: publicUser(user) }
})

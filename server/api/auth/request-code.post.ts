import { requestCode, normalizeIdentifier } from '../../utils/verification'
import { enforceRequestCodeLimit } from '../../utils/rateLimit'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const identifier = String(body?.identifier || '').trim()
  if (!identifier) {
    throw createError({ statusCode: 400, statusMessage: 'identifier (email or phone) is required' })
  }
  enforceRequestCodeLimit(event, normalizeIdentifier(identifier))

  try {
    // The response is the same whether or not a code was actually sent, so the
    // form can't be used to find out which accounts skip the real send.
    await requestCode(identifier)
    return { ok: true }
  } catch (err: any) {
    console.error('request-code failed:', err?.message || err)
    throw createError({ statusCode: 502, statusMessage: 'Failed to send verification code' })
  }
})

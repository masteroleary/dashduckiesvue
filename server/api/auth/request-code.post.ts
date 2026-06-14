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
    const { dev } = await requestCode(identifier)
    return { ok: true, dev }
  } catch (err: any) {
    console.error('request-code failed:', err?.message || err)
    throw createError({ statusCode: 502, statusMessage: 'Failed to send verification code' })
  }
})

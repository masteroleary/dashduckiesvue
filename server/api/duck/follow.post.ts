import { EMAIL_RE, ensureMemberFromEmail, subscribeEmail } from '../../utils/newsletter'
import { claimAnonymousSubmissions } from '../../utils/userAuth'

// Low-friction "follow your duck" after an anonymous post: attach an email
// (optional, no verification code) so they get updates, claim their anonymous
// submission to that account, and hand them a thank-you discount code.
export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const email = String(body?.email || '').trim().toLowerCase()
  const claimToken = body?.claimToken ? String(body.claimToken) : undefined
  if (!EMAIL_RE.test(email)) {
    throw createError({ statusCode: 400, statusMessage: 'Please enter a valid email address.' })
  }

  const user = await ensureMemberFromEmail(email)
  if (claimToken) {
    await claimAnonymousSubmissions(claimToken, user.id)
  }
  const discountCode = await subscribeEmail(email)

  return { ok: true, discountCode }
})

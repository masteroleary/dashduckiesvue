import { EMAIL_RE, ensureMemberFromEmail, subscribeEmail } from '../../utils/newsletter'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const email = String(body?.email || '').trim().toLowerCase()
  if (!EMAIL_RE.test(email)) {
    throw createError({ statusCode: 400, statusMessage: 'Please enter a valid email address.' })
  }

  const discountCode = await subscribeEmail(email)
  // Keep the legacy behavior: a newsletter signup also creates a member user.
  await ensureMemberFromEmail(email)

  return {
    success: true,
    message: 'Thank you for subscribing! Check your email for the discount code.',
    discountCode,
  }
})

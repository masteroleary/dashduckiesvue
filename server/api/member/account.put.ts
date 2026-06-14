import { and, eq, isNull, ne } from 'drizzle-orm'
import { requireUser } from '../../utils/session'
import { useDb } from '../../db'
import { users } from '../../db/schema'
import { accountDto } from '../../utils/account'

const s = (v: unknown) => {
  const t = String(v ?? '').trim()
  return t.length ? t : null
}

export default defineEventHandler(async (event) => {
  const session = requireUser(event)
  const body = await readBody(event)
  const db = useDb()

  const [user] = await db.select().from(users).where(eq(users.id, session.id)).limit(1)
  if (!user) throw createError({ statusCode: 401, statusMessage: 'User not found' })

  const email = body?.email ? String(body.email).trim().toLowerCase() : null
  const phone = s(body?.phoneNumber)

  if (email && email !== user.email) {
    const [taken] = await db
      .select({ id: users.id })
      .from(users)
      .where(and(eq(users.email, email), ne(users.id, user.id), isNull(users.deletedAt)))
      .limit(1)
    if (taken) {
      throw createError({ statusCode: 409, statusMessage: 'This email is already registered to another account.' })
    }
  }
  if (phone && phone !== user.phoneNumber) {
    const [taken] = await db
      .select({ id: users.id })
      .from(users)
      .where(and(eq(users.phoneNumber, phone), ne(users.id, user.id), isNull(users.deletedAt)))
      .limit(1)
    if (taken) {
      throw createError({ statusCode: 409, statusMessage: 'This phone number is already registered to another account.' })
    }
  }

  const [updated] = await db
    .update(users)
    .set({
      nameFirst: s(body?.nameFirst),
      nameLast: s(body?.nameLast),
      email,
      phoneNumber: phone,
      addressStreet1: s(body?.addressStreet1),
      addressStreet2: s(body?.addressStreet2),
      addressCity: s(body?.addressCity),
      addressState: s(body?.addressState),
      addressStateAbbr: s(body?.addressStateAbbr),
      addressZip: s(body?.addressZip),
      addressCountryAbbr: s(body?.addressCountryAbbr),
    })
    .where(eq(users.id, user.id))
    .returning()

  return accountDto(updated)
})

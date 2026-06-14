import { and, eq, isNull } from 'drizzle-orm'
import { useDb } from '../db'
import { authTokens, users } from '../db/schema'
import { signAuthToken } from './jwt'
import { isEmail } from './verification'

type UserRow = typeof users.$inferSelect

// Shape returned to the client — no internal/sensitive fields.
export function publicUser(u: UserRow) {
  return {
    id: u.id,
    email: u.email,
    phone: u.phoneNumber,
    nameFirst: u.nameFirst,
    nameLast: u.nameLast,
    profileImageUrl: u.profileImageUrl,
    isAdmin: u.isAdmin,
    isMember: u.isMember,
  }
}

/** Find an active user by email/phone, or create one (auto-membership), and stamp last login. */
export async function findOrCreateUser(identifier: string): Promise<UserRow> {
  const db = useDb()
  const email = isEmail(identifier) ? identifier : null
  const phone = isEmail(identifier) ? null : identifier

  const whereActive = email
    ? and(eq(users.email, email), isNull(users.deletedAt))
    : and(eq(users.phoneNumber, phone as string), isNull(users.deletedAt))

  const [existing] = await db.select().from(users).where(whereActive).limit(1)
  if (existing) {
    await db.update(users).set({ lastLoginAt: new Date() }).where(eq(users.id, existing.id))
    return existing
  }

  const [created] = await db
    .insert(users)
    .values({ email, phoneNumber: phone, isMember: true, lastLoginAt: new Date() })
    .returning()
  return created
}

/** Sign a JWT for the user and persist it in auth_tokens (for revocation on logout). */
export async function issueToken(user: UserRow): Promise<string> {
  const name = [user.nameFirst, user.nameLast].filter(Boolean).join(' ') || null
  const token = await signAuthToken({
    sub: user.id,
    email: user.email,
    phone: user.phoneNumber,
    name,
    isAdmin: user.isAdmin,
    isMember: user.isMember,
  })
  const hours = Number.parseInt(process.env.JWT_EXPIRATION_HOURS || '720', 10)
  const db = useDb()
  await db.insert(authTokens).values({
    userId: user.id,
    token,
    expiresAt: new Date(Date.now() + hours * 3600 * 1000),
  })
  return token
}

/** Returns true if the token is present (i.e. not revoked) in auth_tokens. */
export async function isTokenActive(token: string): Promise<boolean> {
  const db = useDb()
  const [row] = await db
    .select({ id: authTokens.id })
    .from(authTokens)
    .where(eq(authTokens.token, token))
    .limit(1)
  return Boolean(row)
}

export async function revokeToken(token: string): Promise<void> {
  const db = useDb()
  await db.delete(authTokens).where(eq(authTokens.token, token))
}

import { SignJWT, jwtVerify } from 'jose'

// Name of the HTTP-only cookie that carries the session JWT.
// Shared across SSR pages and the /app SPA because it's one origin.
export const AUTH_COOKIE = 'dd_session'

// While an admin impersonates a member, their own session token is stashed
// here so it can be restored when they return to their admin account.
export const ADMIN_COOKIE = 'dd_admin_session'

// Shared cookie options for the session cookies (active + stashed admin).
export function sessionCookieOptions() {
  const hours = Number.parseInt(process.env.JWT_EXPIRATION_HOURS || '720', 10)
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax' as const,
    path: '/',
    maxAge: hours * 3600,
  }
}

const ISSUER = 'DashDuckies'
const AUDIENCE = 'DashDuckies.Client'
const encoder = new TextEncoder()

function secretKey() {
  const s = process.env.JWT_SECRET
  if (!s) throw new Error('JWT_SECRET is not set')
  return encoder.encode(s)
}

export interface AuthClaims {
  sub: string // user id
  email?: string | null
  phone?: string | null
  name?: string | null
  isAdmin: boolean
  isMember: boolean
}

export async function signAuthToken(claims: AuthClaims): Promise<string> {
  const hours = Number.parseInt(process.env.JWT_EXPIRATION_HOURS || '720', 10)
  return await new SignJWT({
    email: claims.email ?? null,
    phone: claims.phone ?? null,
    name: claims.name ?? null,
    isAdmin: claims.isAdmin,
    isMember: claims.isMember,
  })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuer(ISSUER)
    .setAudience(AUDIENCE)
    .setSubject(claims.sub)
    .setIssuedAt()
    .setExpirationTime(`${hours}h`)
    .sign(secretKey())
}

export async function verifyAuthToken(token: string): Promise<AuthClaims & { exp: number }> {
  const { payload } = await jwtVerify(token, secretKey(), {
    issuer: ISSUER,
    audience: AUDIENCE,
  })
  return {
    sub: String(payload.sub),
    email: (payload.email as string | null) ?? null,
    phone: (payload.phone as string | null) ?? null,
    name: (payload.name as string | null) ?? null,
    isAdmin: Boolean(payload.isAdmin),
    isMember: Boolean(payload.isMember),
    exp: Number(payload.exp),
  }
}

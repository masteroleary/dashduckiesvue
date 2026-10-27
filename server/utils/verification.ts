import { randomInt } from 'node:crypto'
import { and, desc, eq, gt } from 'drizzle-orm'
import sgMail from '@sendgrid/mail'
import twilio from 'twilio'
import { useDb } from '../db'
import { verificationCodes } from '../db/schema'

const DEV_EMAILS = (process.env.DEVELOPER_EMAILS || '')
  .split(',')
  .map((s) => s.trim().toLowerCase())
  .filter(Boolean)
const DEV_PHONES = (process.env.DEVELOPER_PHONES || '')
  .split(',')
  .map((s) => s.trim())
  .filter(Boolean)

const CODE_TTL_MS = 10 * 60 * 1000 // 10 minutes

export function isEmail(identifier: string): boolean {
  return identifier.includes('@')
}

// Normalize a phone number to E.164 (defaults to US +1). Both Twilio and the
// dev-bypass list require E.164, so users can type "3216151531",
// "(321) 615-1531", "1-321-615-1531", etc. and still match.
export function normalizePhone(input: string): string {
  const hasPlus = input.trim().startsWith('+')
  const digits = input.replace(/\D/g, '')
  if (hasPlus) return `+${digits}`
  if (digits.length === 10) return `+1${digits}` // US/Canada 10-digit
  if (digits.length === 11 && digits.startsWith('1')) return `+${digits}`
  return digits ? `+${digits}` : input.trim()
}

export function normalizeIdentifier(identifier: string): string {
  const t = identifier.trim()
  return isEmail(t) ? t.toLowerCase() : normalizePhone(t)
}

// The bypass is hard-disabled outside development. Relying on the DEVELOPER_*
// lists simply being absent in production was one deploy mistake away from
// letting anyone who knows a listed phone number or email sign in as that
// person — so the environment check is the guard, and the lists only narrow it.
const DEV_BYPASS_ENABLED = process.env.NODE_ENV !== 'production'

export function isDevBypass(identifier: string): boolean {
  if (!DEV_BYPASS_ENABLED) return false
  const id = normalizeIdentifier(identifier)
  return isEmail(id) ? DEV_EMAILS.includes(id) : DEV_PHONES.includes(id)
}

function sixDigitCode(): string {
  // CSPRNG so codes aren't predictable.
  return String(randomInt(100000, 1000000))
}

let twilioClient: ReturnType<typeof twilio> | null = null
function getTwilio() {
  if (!twilioClient) {
    // Prefer an API key (SK… SID + secret), which can be revoked on its own;
    // fall back to the account's auth token when no key is configured.
    const accountSid = process.env.TWILIO_ACCOUNT_SID
    const keySid = process.env.TWILIO_API_KEY_SID
    const keySecret = process.env.TWILIO_API_KEY_SECRET
    twilioClient = keySid && keySecret
      ? twilio(keySid, keySecret, { accountSid })
      : twilio(accountSid, process.env.TWILIO_AUTH_TOKEN)
  }
  return twilioClient
}

async function sendEmailCode(email: string, code: string) {
  sgMail.setApiKey(process.env.SENDGRID_API_KEY || '')
  await sgMail.send({
    to: email,
    from: {
      email: process.env.SENDGRID_FROM_EMAIL || 'info@dashduckies.com',
      name: process.env.SENDGRID_FROM_NAME || 'Dash Duckies',
    },
    subject: 'Your Dash Duckies verification code',
    text: `Your verification code is ${code}. It expires in 10 minutes.`,
    html: `<p>Your Dash Duckies verification code is <strong>${code}</strong>.</p><p>It expires in 10 minutes.</p>`,
  })
}

// Store a code (dev + email paths) so we can verify it ourselves.
async function storeCode(identifier: string, code: string) {
  const db = useDb()
  // Invalidate earlier unused codes for this identifier (shrinks brute-force surface).
  await db
    .update(verificationCodes)
    .set({ isUsed: true })
    .where(and(eq(verificationCodes.emailOrPhone, identifier), eq(verificationCodes.isUsed, false)))
  await db.insert(verificationCodes).values({
    emailOrPhone: identifier,
    code,
    expiresAt: new Date(Date.now() + CODE_TTL_MS),
  })
}

/**
 * Send a verification code to an email or phone.
 * - dev-bypass identifiers (development only): store code "000000", send nothing.
 *   Deliberately indistinguishable from a real send to the caller.
 * - email: generate code, store, send via SendGrid.
 * - phone: delegate to Twilio Verify (Twilio generates + sends the code).
 */
export async function requestCode(identifierRaw: string): Promise<void> {
  const id = normalizeIdentifier(identifierRaw)

  if (isDevBypass(id)) {
    await storeCode(id, '000000')
    return
  }

  if (isEmail(id)) {
    const code = sixDigitCode()
    await storeCode(id, code)
    await sendEmailCode(id, code)
  } else {
    await getTwilio()
      .verify.v2.services(process.env.TWILIO_VERIFY_SERVICE_SID!)
      .verifications.create({ to: id, channel: 'sms' })
  }
}

/**
 * Check a submitted code. Returns true if valid.
 * - dev + email: validate against our verification_codes table (and mark used).
 * - phone (real): validate via Twilio Verify check.
 */
export async function checkCode(identifierRaw: string, code: string): Promise<boolean> {
  const id = normalizeIdentifier(identifierRaw)

  if (!isDevBypass(id) && !isEmail(id)) {
    const check = await getTwilio()
      .verify.v2.services(process.env.TWILIO_VERIFY_SERVICE_SID!)
      .verificationChecks.create({ to: id, code })
    return check.status === 'approved'
  }

  const db = useDb()
  const [row] = await db
    .select()
    .from(verificationCodes)
    .where(
      and(
        eq(verificationCodes.emailOrPhone, id),
        eq(verificationCodes.code, code),
        eq(verificationCodes.isUsed, false),
        gt(verificationCodes.expiresAt, new Date()),
      ),
    )
    .orderBy(desc(verificationCodes.createdAt))
    .limit(1)

  if (!row) return false
  await db.update(verificationCodes).set({ isUsed: true }).where(eq(verificationCodes.id, row.id))
  return true
}

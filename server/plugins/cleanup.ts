import { lt } from 'drizzle-orm'
import { useDb } from '../db'
import { authTokens, verificationCodes } from '../db/schema'

// Periodically purge expired auth tokens and verification codes so those tables
// don't grow unbounded (and the per-request token lookup stays small).
export default defineNitroPlugin(() => {
  async function purge() {
    try {
      const db = useDb()
      const now = new Date()
      await db.delete(authTokens).where(lt(authTokens.expiresAt, now))
      await db.delete(verificationCodes).where(lt(verificationCodes.expiresAt, now))
    } catch (e: any) {
      console.error('[cleanup] failed:', e?.message || e)
    }
  }
  purge()
  const timer = setInterval(purge, 60 * 60 * 1000) // hourly
  timer.unref?.()
})

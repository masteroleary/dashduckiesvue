import { and, eq, isNull } from 'drizzle-orm'
import { useDb } from '../../db'
import { duckSightings, ducks } from '../../db/schema'
import { processAndUpload } from '../../utils/images'
import { geocodeAddress } from '../../utils/geocode'
import { enforceDuckSubmissionLimit } from '../../utils/rateLimit'
import { readMultipart, validateImage } from '../../utils/upload'
import { notifyNewSighting } from '../../utils/notify'

const CLAIM_GRACE_MS = 7 * 24 * 60 * 60 * 1000

// Register an existing (sticker) duck found by its QT code. Anonymous allowed.
export default defineEventHandler(async (event) => {
  enforceDuckSubmissionLimit(event)

  const { fields, file } = await readMultipart(event)
  validateImage(file)
  const imageBuf = file?.data ?? null

  const qtCode = Number.parseInt(fields.qtCode || '', 10)
  const name = (fields.name || '').trim()
  const description = (fields.description || '').trim() || null
  const address = (fields.address || '').trim()
  if (!qtCode || !name || !address) {
    throw createError({ statusCode: 400, statusMessage: 'qtCode, name and address are required' })
  }

  const db = useDb()
  const [duck] = await db
    .select()
    .from(ducks)
    .where(and(eq(ducks.qtCode, qtCode), isNull(ducks.deletedAt)))
    .limit(1)
  if (!duck) throw createError({ statusCode: 404, statusMessage: 'No duck found for that code' })
  if (duck.registeredByUserId) {
    throw createError({ statusCode: 409, statusMessage: 'This duck is already registered' })
  }

  // Anonymous claim grace handling
  if (duck.claimToken) {
    const issued = duck.claimTokenIssuedAt ? new Date(duck.claimTokenIssuedAt).getTime() : 0
    if (Date.now() - issued > CLAIM_GRACE_MS) {
      await db.delete(duckSightings).where(eq(duckSightings.claimToken, duck.claimToken))
      await db.update(ducks).set({ claimToken: null, claimTokenIssuedAt: null }).where(eq(ducks.id, duck.id))
    } else {
      throw createError({ statusCode: 409, statusMessage: 'This duck is currently being claimed by someone else' })
    }
  }

  const user = event.context.user as { id: string; email?: string | null; phone?: string | null } | undefined
  const claimToken = user ? null : globalThis.crypto.randomUUID()

  let imageUrl: string | null = null
  let gps: { lat: number; lng: number } | null = null
  if (imageBuf) {
    const r = await processAndUpload(imageBuf, 'duck-images', String(qtCode))
    imageUrl = r.url
    gps = r.gps
  }
  const coords = gps ?? (await geocodeAddress(address))

  await db
    .update(ducks)
    .set({
      name,
      description,
      imageUrl: imageUrl ?? duck.imageUrl,
      registeredByUserId: user?.id ?? null,
      claimToken,
      claimTokenIssuedAt: claimToken ? new Date() : null,
    })
    .where(eq(ducks.id, duck.id))

  await db.insert(duckSightings).values({
    duckId: duck.id,
    userId: user?.id ?? null,
    claimToken,
    address,
    latitude: coords.lat,
    longitude: coords.lng,
    imageUrl,
  })

  notifyNewSighting(
    { name, qtCode },
    { address },
    user ? { email: user.email ?? null, phone: user.phone ?? null } : null,
  )

  return { duckId: duck.id, claimToken }
})

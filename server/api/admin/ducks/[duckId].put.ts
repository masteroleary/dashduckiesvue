import { eq } from 'drizzle-orm'
import { requireAdmin } from '../../../utils/session'
import { useDb } from '../../../db'
import { ducks } from '../../../db/schema'
import { processAndUpload } from '../../../utils/images'
import { readMultipart, validateImage } from '../../../utils/upload'

export default defineEventHandler(async (event) => {
  requireAdmin(event)
  const duckId = getRouterParam(event, 'duckId') as string

  const { fields, file } = await readMultipart(event)
  validateImage(file)
  const imageBuf = file?.data ?? null

  const db = useDb()
  const [duck] = await db.select().from(ducks).where(eq(ducks.id, duckId)).limit(1)
  if (!duck) throw createError({ statusCode: 404, statusMessage: 'Duck not found' })

  const set: Record<string, unknown> = {
    name: fields.name ?? duck.name,
    description: fields.description ?? duck.description,
  }
  if (imageBuf) {
    const r = await processAndUpload(imageBuf, 'duck-images', String(duck.qtCode))
    set.imageUrl = r.url
  }
  await db.update(ducks).set(set).where(eq(ducks.id, duckId))
  return { message: 'Duck updated successfully' }
})

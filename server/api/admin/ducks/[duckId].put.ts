import { eq } from 'drizzle-orm'
import { requireAdmin } from '../../../utils/session'
import { useDb } from '../../../db'
import { ducks } from '../../../db/schema'
import { processAndUpload } from '../../../utils/images'

export default defineEventHandler(async (event) => {
  requireAdmin(event)
  const duckId = getRouterParam(event, 'duckId') as string

  const parts = (await readMultipartFormData(event)) || []
  const fields: Record<string, string> = {}
  let imageBuf: Buffer | null = null
  for (const p of parts) {
    if (p.filename) imageBuf = p.data as Buffer
    else if (p.name) fields[p.name] = p.data.toString('utf-8')
  }

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

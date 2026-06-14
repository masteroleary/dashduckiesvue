import { eq } from 'drizzle-orm'
import { requireUser } from '../../../utils/session'
import { processAndUpload } from '../../../utils/images'
import { useDb } from '../../../db'
import { users } from '../../../db/schema'

export default defineEventHandler(async (event) => {
  const user = requireUser(event)
  const parts = (await readMultipartFormData(event)) || []
  const file = parts.find((p) => p.filename)
  if (!file) throw createError({ statusCode: 400, statusMessage: 'No image provided' })
  if (file.data.length > 5 * 1024 * 1024) {
    throw createError({ statusCode: 400, statusMessage: 'Image must be under 5MB' })
  }

  const { url } = await processAndUpload(file.data as Buffer, 'profile-images', user.id)
  const db = useDb()
  await db.update(users).set({ profileImageUrl: url }).where(eq(users.id, user.id))
  return { profileImageUrl: url }
})

import { eq } from 'drizzle-orm'
import { requireUser } from '../../../utils/session'
import { processAndUpload } from '../../../utils/images'
import { readMultipart, validateImage } from '../../../utils/upload'
import { useDb } from '../../../db'
import { users } from '../../../db/schema'

export default defineEventHandler(async (event) => {
  const user = requireUser(event)
  const { file } = await readMultipart(event)
  if (!file) throw createError({ statusCode: 400, statusMessage: 'No image provided' })
  validateImage(file)

  const { url } = await processAndUpload(file.data as Buffer, 'profile-images', user.id)
  const db = useDb()
  await db.update(users).set({ profileImageUrl: url }).where(eq(users.id, user.id))
  return { profileImageUrl: url }
})

import { eq } from 'drizzle-orm'
import { useDb } from '../../db'
import { forumThreads } from '../../db/schema'
import { processAndUpload } from '../../utils/images'
import { readMultipart, validateImage } from '../../utils/upload'

// Create a new Jeep Talk thread. Anonymous allowed; photo optional.
export default defineEventHandler(async (event) => {
  const { fields, file } = await readMultipart(event)
  validateImage(file)

  const title = (fields.title || '').trim()
  if (!title) throw createError({ statusCode: 400, statusMessage: 'A headline is required' })
  const body = (fields.body || '').trim()
  const author = (fields.author || '').trim() || 'Anonymous Ducker'
  const user = event.context.user as { id: string } | undefined

  const db = useDb()
  const [thread] = await db
    .insert(forumThreads)
    .values({
      title: title.slice(0, 200),
      body: body ? body.slice(0, 5000) : null,
      authorName: author.slice(0, 60),
      userId: user?.id ?? null,
    })
    .returning()

  let imageUrl: string | null = null
  if (file?.data) {
    const r = await processAndUpload(file.data, 'forum-images', thread.id)
    imageUrl = r.url
    await db.update(forumThreads).set({ imageUrl }).where(eq(forumThreads.id, thread.id))
  }

  return {
    id: thread.id,
    title: thread.title,
    body: thread.body,
    author: thread.authorName,
    imageUrl,
    likes: 0,
    createdAt: thread.createdAt,
    comments: [],
  }
})

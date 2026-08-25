import { and, desc, inArray, isNull } from 'drizzle-orm'
import { useDb } from '../../db'
import { forumComments, forumThreads } from '../../db/schema'

// List Jeep Talk threads (newest first) with their comments.
export default defineEventHandler(async () => {
  const db = useDb()
  const threads = await db
    .select()
    .from(forumThreads)
    .where(isNull(forumThreads.deletedAt))
    .orderBy(desc(forumThreads.createdAt))
    .limit(100)

  if (!threads.length) return []

  const comments = await db
    .select()
    .from(forumComments)
    .where(
      and(
        inArray(
          forumComments.threadId,
          threads.map((t) => t.id),
        ),
        isNull(forumComments.deletedAt),
      ),
    )
    .orderBy(forumComments.createdAt)

  const byThread = new Map<string, { id: string; author: string; text: string; createdAt: Date }[]>()
  for (const c of comments) {
    const arr = byThread.get(c.threadId) ?? []
    arr.push({ id: c.id, author: c.authorName, text: c.text, createdAt: c.createdAt })
    byThread.set(c.threadId, arr)
  }

  return threads.map((t) => ({
    id: t.id,
    title: t.title,
    body: t.body,
    author: t.authorName,
    imageUrl: t.imageUrl,
    likes: t.likes,
    createdAt: t.createdAt,
    comments: byThread.get(t.id) ?? [],
  }))
})

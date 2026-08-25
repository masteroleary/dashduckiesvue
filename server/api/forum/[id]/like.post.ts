import { eq, sql } from 'drizzle-orm'
import { useDb } from '../../../db'
import { forumThreads } from '../../../db/schema'

// Like / unlike a thread. Anonymous — a simple count, no per-user record.
// The client tracks which threads it has liked (localStorage) and sends the
// intended direction so the count can't run away.
export default defineEventHandler(async (event) => {
  const threadId = getRouterParam(event, 'id')
  if (!threadId) throw createError({ statusCode: 400, statusMessage: 'Thread id required' })
  const body = await readBody(event).catch(() => ({}))
  const like = body?.like !== false // default to a like

  const db = useDb()
  const [row] = await db
    .update(forumThreads)
    .set({
      likes: like
        ? sql`${forumThreads.likes} + 1`
        : sql`greatest(${forumThreads.likes} - 1, 0)`,
    })
    .where(eq(forumThreads.id, threadId))
    .returning({ likes: forumThreads.likes })
  if (!row) throw createError({ statusCode: 404, statusMessage: 'Thread not found' })
  return { likes: row.likes }
})

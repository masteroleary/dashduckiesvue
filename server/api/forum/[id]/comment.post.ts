import { and, eq, isNull } from 'drizzle-orm'
import { useDb } from '../../../db'
import { forumComments, forumThreads } from '../../../db/schema'
import { requireUser } from '../../../utils/session'

// Add a comment to a thread. Anonymous allowed.
export default defineEventHandler(async (event) => {
  // Members-only: posting to the community requires an account.
  requireUser(event)
  const threadId = getRouterParam(event, 'id')
  const b = await readBody(event)
  const text = (b?.text ?? '').toString().trim()
  const author = (b?.author ?? '').toString().trim() || 'Anonymous Ducker'
  if (!threadId || !text) throw createError({ statusCode: 400, statusMessage: 'A comment is required' })

  const db = useDb()
  const [thread] = await db
    .select({ id: forumThreads.id })
    .from(forumThreads)
    .where(and(eq(forumThreads.id, threadId), isNull(forumThreads.deletedAt)))
    .limit(1)
  if (!thread) throw createError({ statusCode: 404, statusMessage: 'Thread not found' })

  const user = event.context.user as { id: string } | undefined
  const [c] = await db
    .insert(forumComments)
    .values({ threadId, authorName: author.slice(0, 60), text: text.slice(0, 1000), userId: user?.id ?? null })
    .returning()

  return { id: c.id, author: c.authorName, text: c.text, createdAt: c.createdAt }
})

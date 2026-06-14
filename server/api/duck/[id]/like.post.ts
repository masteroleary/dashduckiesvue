import { and, eq } from 'drizzle-orm'
import { requireUser } from '../../../utils/session'
import { getLikeCount } from '../../../utils/ducks'
import { useDb } from '../../../db'
import { duckLikes } from '../../../db/schema'

// Toggle the current user's like on a duck.
export default defineEventHandler(async (event) => {
  const user = requireUser(event)
  const id = getRouterParam(event, 'id') as string
  const db = useDb()

  const [existing] = await db
    .select({ id: duckLikes.id })
    .from(duckLikes)
    .where(and(eq(duckLikes.duckId, id), eq(duckLikes.userId, user.id)))
    .limit(1)

  let isLiked: boolean
  if (existing) {
    await db.delete(duckLikes).where(eq(duckLikes.id, existing.id))
    isLiked = false
  } else {
    await db.insert(duckLikes).values({ duckId: id, userId: user.id })
    isLiked = true
  }

  return { isLiked, likeCount: await getLikeCount(id) }
})

import { and, desc, eq, isNull } from 'drizzle-orm'
import { requireUser } from '../../utils/session'
import { userHasSighting } from '../../utils/member'
import { useDb } from '../../db'
import { duckSightings, ducks } from '../../db/schema'

export default defineEventHandler(async (event) => {
  const user = requireUser(event)
  const id = getRouterParam(event, 'id') as string
  const db = useDb()

  const [duck] = await db
    .select()
    .from(ducks)
    .where(and(eq(ducks.id, id), isNull(ducks.deletedAt)))
    .limit(1)
  if (!duck || !(await userHasSighting(user.id, id))) {
    throw createError({ statusCode: 404, statusMessage: 'Duck not found' })
  }

  const sightings = await db
    .select({ sightingDate: duckSightings.sightingDate, address: duckSightings.address })
    .from(duckSightings)
    .where(eq(duckSightings.duckId, id))
    .orderBy(desc(duckSightings.sightingDate))

  const latest = sightings[0]
  return {
    id: duck.id,
    name: duck.name,
    description: duck.description,
    imageUrl: duck.imageUrl,
    qtCode: duck.qtCode,
    createdDate: latest?.sightingDate ?? duck.createdAt,
    currentAddress: latest?.address ?? null,
    sightings,
  }
})

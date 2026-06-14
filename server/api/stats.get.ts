import { and, count, isNull, ne, isNotNull } from 'drizzle-orm'
import { useDb } from '../db'
import { duckSightings, ducks, users } from '../db/schema'

// Homepage stats bar: ducks in the wild, sightings reported, happy duckers.
export default defineEventHandler(async () => {
  const db = useDb()
  const [ducksRow] = await db
    .select({ value: count() })
    .from(ducks)
    .where(and(isNotNull(ducks.imageUrl), ne(ducks.imageUrl, ''), isNull(ducks.deletedAt)))
  const [sightingsRow] = await db.select({ value: count() }).from(duckSightings)
  const [usersRow] = await db
    .select({ value: count() })
    .from(users)
    .where(isNull(users.deletedAt))

  return {
    ducks: ducksRow.value,
    sightings: sightingsRow.value,
    duckers: usersRow.value,
  }
})

import {
  getActiveDuckById,
  getActiveDuckByQtCode,
  getLikeCount,
  getSightingCount,
  getSightingHistory,
  getSightingsWithCoords,
  publicDuck,
} from '../../utils/ducks'

// QuackerTracker scan lookup. `identifier` is either an integer QT code or a duck UUID.
export default defineEventHandler(async (event) => {
  const identifier = String(getRouterParam(event, 'identifier') || '').trim()

  const duck = /^\d+$/.test(identifier)
    ? await getActiveDuckByQtCode(Number.parseInt(identifier, 10))
    : await getActiveDuckById(identifier)

  if (!duck) {
    return { state: 'notFound' as const }
  }

  const sightingCount = await getSightingCount(duck.id)
  const isRegistered =
    duck.registeredByUserId != null || duck.claimToken != null || sightingCount > 0

  if (!isRegistered) {
    return { state: 'notRegistered' as const, duck: publicDuck(duck) }
  }

  const [sightings, history, likeCount] = await Promise.all([
    getSightingsWithCoords(duck.id),
    getSightingHistory(duck.id, duck.imageUrl),
    getLikeCount(duck.id),
  ])

  return {
    state: 'registered' as const,
    duck: publicDuck(duck),
    sightingCount,
    likeCount,
    sightings,
    history,
  }
})

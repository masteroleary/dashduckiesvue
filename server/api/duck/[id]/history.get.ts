import { getActiveDuckById, getSightingHistory } from '../../../utils/ducks'

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id') as string
  const duck = await getActiveDuckById(id)
  if (!duck) throw createError({ statusCode: 404, statusMessage: 'Duck not found' })
  return await getSightingHistory(id, duck.imageUrl)
})

import { getSightingsWithCoords } from '../../../utils/ducks'

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id') as string
  return await getSightingsWithCoords(id)
})

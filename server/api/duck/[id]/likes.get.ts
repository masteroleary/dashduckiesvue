import { getLikeCount } from '../../../utils/ducks'

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id') as string
  return { count: await getLikeCount(id) }
})

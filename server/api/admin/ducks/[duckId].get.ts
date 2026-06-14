import { requireAdmin } from '../../../utils/session'
import { getAdminDuckDetail } from '../../../utils/admin'

export default defineEventHandler(async (event) => {
  requireAdmin(event)
  const duckId = getRouterParam(event, 'duckId') as string
  const duck = await getAdminDuckDetail(duckId)
  if (!duck) throw createError({ statusCode: 404, statusMessage: 'Duck not found' })
  return duck
})

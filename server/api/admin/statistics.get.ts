import { requireAdmin } from '../../utils/session'
import { getStatistics } from '../../utils/admin'

export default defineEventHandler(async (event) => {
  requireAdmin(event)
  return await getStatistics()
})

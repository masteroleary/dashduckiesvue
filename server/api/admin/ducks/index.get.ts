import { requireAdmin } from '../../../utils/session'
import { getAdminDucks } from '../../../utils/admin'

export default defineEventHandler(async (event) => {
  requireAdmin(event)
  const q = getQuery(event).q
  return await getAdminDucks(typeof q === 'string' ? q : undefined)
})

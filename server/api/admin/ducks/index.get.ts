import { requireAdmin } from '../../../utils/session'
import { getAdminDucks } from '../../../utils/admin'

export default defineEventHandler(async (event) => {
  requireAdmin(event)
  return await getAdminDucks()
})

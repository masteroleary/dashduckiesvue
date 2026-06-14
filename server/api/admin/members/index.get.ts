import { requireAdmin } from '../../../utils/session'
import { getMembers } from '../../../utils/admin'

export default defineEventHandler(async (event) => {
  requireAdmin(event)
  return await getMembers()
})

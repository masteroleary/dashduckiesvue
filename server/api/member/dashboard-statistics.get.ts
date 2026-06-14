import { requireUser } from '../../utils/session'
import { getDashboardStats } from '../../utils/member'

export default defineEventHandler(async (event) => {
  const user = requireUser(event)
  return await getDashboardStats(user.id)
})

import { requireUser } from '../../utils/session'
import { getRecentSightings } from '../../utils/member'

export default defineEventHandler(async (event) => {
  requireUser(event)
  return await getRecentSightings()
})

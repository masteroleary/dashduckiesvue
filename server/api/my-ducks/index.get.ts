import { requireUser } from '../../utils/session'
import { getMyDucks } from '../../utils/member'

export default defineEventHandler(async (event) => {
  const user = requireUser(event)
  return await getMyDucks(user.id)
})

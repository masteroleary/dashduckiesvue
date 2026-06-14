import { requireAdmin } from '../../../utils/session'
import { deleteMember } from '../../../utils/admin'

export default defineEventHandler(async (event) => {
  const admin = requireAdmin(event)
  const userId = getRouterParam(event, 'userId') as string
  if (userId === admin.id) {
    throw createError({ statusCode: 400, statusMessage: 'You cannot delete your own account' })
  }
  const { deletedDucks } = await deleteMember(userId)
  return { message: 'User deleted successfully', deletedDucks }
})

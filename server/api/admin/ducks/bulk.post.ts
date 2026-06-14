import { requireAdmin } from '../../../utils/session'
import { bulkCreateDucks } from '../../../utils/admin'

export default defineEventHandler(async (event) => {
  requireAdmin(event)
  const body = await readBody(event)
  const items = Array.isArray(body) ? body : Array.isArray(body?.ducks) ? body.ducks : []
  if (!items.length) {
    throw createError({ statusCode: 400, statusMessage: 'Provide a list of ducks (max 100)' })
  }
  return await bulkCreateDucks(items)
})

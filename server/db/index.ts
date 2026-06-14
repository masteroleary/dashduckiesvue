import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import * as schema from './schema'

// Lazy singleton so we don't open a connection until a server route needs the DB.
let _db: ReturnType<typeof drizzle> | null = null

export function useDb() {
  if (!_db) {
    const url = process.env.DATABASE_URL
    if (!url) {
      throw new Error('DATABASE_URL is not set')
    }
    const client = postgres(url, { prepare: false })
    _db = drizzle(client, { schema })
  }
  return _db
}

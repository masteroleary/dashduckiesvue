// One-time data migration: legacy SQL Server -> Railway Postgres.
//
// Usage (loads .env for connection strings):
//   npm run db:migrate-legacy                      # DRY RUN (reads source, writes nothing)
//   npm run db:migrate-legacy -- --commit          # import (idempotent: on-conflict-do-nothing)
//   npm run db:migrate-legacy -- --commit --wipe   # clear target tables first, then import
//
// Source connection (one of):
//   OLD_SQLSERVER_URL=<full connection string>     # preferred
//   OLD_SQLSERVER_HOST / _DB / _USER / _PASSWORD   # fallback
// Target: DATABASE_URL (Postgres)
//
// Notes:
// - Skips auth_tokens (old JWTs are invalid under the new JWT_SECRET) and
//   verification_codes (ephemeral, 10-min expiry).
// - Preserves GUID ids (users/ducks) and int ids (sightings/subscriptions);
//   regenerates uuids for duck_likes. Resets serial sequences after import.
// - Transforms: PascalCase -> snake_case, UTCDeletedOn(MinValue) -> deleted_at NULL,
//   RegistrationType enum int -> text, emails lowercased.

import sql from 'mssql'
import postgres from 'postgres'

const args = process.argv.slice(2)
const COMMIT = args.includes('--commit')
const WIPE = args.includes('--wipe')

function sqlServerConfig() {
  if (process.env.OLD_SQLSERVER_URL) return process.env.OLD_SQLSERVER_URL
  const host = process.env.OLD_SQLSERVER_HOST
  if (!host) {
    throw new Error('Set OLD_SQLSERVER_URL or OLD_SQLSERVER_HOST/_DB/_USER/_PASSWORD in .env')
  }
  return {
    server: host,
    database: process.env.OLD_SQLSERVER_DB,
    user: process.env.OLD_SQLSERVER_USER,
    password: process.env.OLD_SQLSERVER_PASSWORD,
    options: { encrypt: true, trustServerCertificate: true },
    connectionTimeout: 20000,
    requestTimeout: 120000,
  }
}

// case-insensitive column read with fallbacks
function pick(row, ...names) {
  const keys = Object.keys(row)
  for (const n of names) {
    const k = keys.find((key) => key.toLowerCase() === n.toLowerCase())
    if (k !== undefined && row[k] !== undefined) return row[k]
  }
  return null
}
function toDate(v) {
  if (v == null) return null
  const d = v instanceof Date ? v : new Date(v)
  return Number.isNaN(d.getTime()) ? null : d
}
// UTCDeletedOn = DateTime.MinValue (year 1) means "active" -> null
function toDeletedAt(v) {
  const d = toDate(v)
  if (!d) return null
  return d.getUTCFullYear() < 1900 ? null : d
}
const REG_TYPES = ['StickerValid', 'Promotion', 'PurchasedDuck', 'PurchasedSticker']
function mapRegType(v) {
  if (typeof v === 'number') return REG_TYPES[v] ?? 'StickerValid'
  if (typeof v === 'string' && REG_TYPES.includes(v)) return v
  return 'StickerValid'
}
function str(v) {
  if (v == null) return null
  const s = String(v).trim()
  return s.length ? s : null
}
function num(v) {
  if (v == null) return null
  const n = Number(v)
  return Number.isNaN(n) ? null : n
}
function bool(v) {
  return v === true || v === 1 || v === '1' || v === 'true'
}

async function main() {
  console.log('\n=== Legacy SQL Server -> Postgres migration ===')
  console.log(COMMIT ? (WIPE ? 'MODE: COMMIT + WIPE' : 'MODE: COMMIT') : 'MODE: DRY RUN (no writes)')

  const pgUrl = process.env.DATABASE_URL
  if (!pgUrl) throw new Error('DATABASE_URL (Postgres) is not set')
  const pg = postgres(pgUrl, { connect_timeout: 20 })

  let pool
  try {
    pool = await sql.connect(sqlServerConfig())
  } catch (e) {
    console.error('\n❌ Could not connect to the legacy SQL Server:', e.message)
    console.error('   Provide a reachable OLD_SQLSERVER_URL (or _HOST/_DB/_USER/_PASSWORD) and retry.')
    await pg.end()
    process.exit(1)
  }

  // discover real table names (resilient to EF naming)
  const tableNames = (
    await pool.request().query("SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_TYPE='BASE TABLE'")
  ).recordset.map((r) => r.TABLE_NAME)
  const findTable = (...cands) => {
    for (const name of cands) {
      const m = tableNames.find((t) => t.toLowerCase() === name.toLowerCase())
      if (m) return m
    }
    return null
  }
  const T = {
    users: findTable('Users', 'User'),
    ducks: findTable('Ducks', 'Duck'),
    sightings: findTable('DuckSightings', 'DuckSighting', 'Sightings'),
    likes: findTable('DuckLikes', 'DuckLike', 'Likes'),
    subs: findTable('EmailSubscriptions', 'EmailSubscription'),
  }
  console.log('matched source tables:', T)

  const read = async (table) =>
    table ? (await pool.request().query(`SELECT * FROM [${table}]`)).recordset : []

  const srcUsers = await read(T.users)
  const srcDucks = await read(T.ducks)
  const srcSightings = await read(T.sightings)
  const srcLikes = await read(T.likes)
  const srcSubs = await read(T.subs)

  console.log('\nsource row counts:')
  console.log('  users        ', srcUsers.length)
  console.log('  ducks        ', srcDucks.length)
  console.log('  sightings    ', srcSightings.length)
  console.log('  likes        ', srcLikes.length)
  console.log('  subscriptions', srcSubs.length)

  const users = srcUsers
    .map((r) => ({
      id: pick(r, 'Id'),
      email: str(pick(r, 'Email'))?.toLowerCase() ?? null,
      phone_number: str(pick(r, 'PhoneNumber')),
      name_first: str(pick(r, 'NameFirst')),
      name_last: str(pick(r, 'NameLast')),
      profile_image_url: str(pick(r, 'ProfileImageUrl')),
      address_street1: str(pick(r, 'AddressStreet1')),
      address_street2: str(pick(r, 'AddressStreet2')),
      address_city: str(pick(r, 'AddressCityOrLocality', 'AddressCity', 'City')),
      address_state: str(pick(r, 'AddressStateOrRegionName', 'AddressState', 'State')),
      address_state_abbr: str(pick(r, 'AddressStateOrRegionAbbr', 'AddressStateAbbr')),
      address_zip: str(pick(r, 'AddressZip', 'Zip')),
      address_country_abbr: str(pick(r, 'AddressCountryAbbr')),
      is_admin: bool(pick(r, 'IsAdmin')),
      is_member: bool(pick(r, 'IsMember')),
      created_at: toDate(pick(r, 'UTCCreatedAt', 'CreatedAt')) ?? new Date(),
      last_login_at: toDate(pick(r, 'UTCLastLoginAt', 'LastLoginAt')),
      deleted_at: toDeletedAt(pick(r, 'UTCDeletedOn', 'DeletedAt', 'DeletedOn')),
    }))
    .filter((u) => u.id)

  const ducks = srcDucks
    .map((r) => ({
      id: pick(r, 'Id'),
      qt_code: num(pick(r, 'QTCode', 'QtCode')),
      name: str(pick(r, 'Name')),
      description: str(pick(r, 'Description')),
      image_url: str(pick(r, 'ImageUrl')),
      registration_type: mapRegType(pick(r, 'RegistrationType')),
      registered_by_user_id: pick(r, 'RegisteredByUserId'),
      claim_token: pick(r, 'ClaimToken'),
      claim_token_issued_at: toDate(pick(r, 'ClaimTokenIssuedAt')),
      created_at: toDate(pick(r, 'UTCCreated', 'UTCCreatedAt', 'CreatedAt')) ?? new Date(),
      deleted_at: toDeletedAt(pick(r, 'UTCDeletedOn', 'DeletedAt')),
    }))
    .filter((d) => d.id && d.qt_code != null)

  const sightings = srcSightings
    .map((r) => ({
      id: num(pick(r, 'Id')),
      duck_id: pick(r, 'DuckId'),
      user_id: pick(r, 'UserId'),
      claim_token: pick(r, 'ClaimToken'),
      sighting_date: toDate(pick(r, 'UTCSightingDate', 'SightingDate')) ?? new Date(),
      latitude: num(pick(r, 'Latitude')) ?? 0,
      longitude: num(pick(r, 'Longitude')) ?? 0,
      address: str(pick(r, 'Address')),
      image_url: str(pick(r, 'ImageUrl')),
    }))
    .filter((s) => s.id != null && s.duck_id)

  const likes = srcLikes
    .map((r) => ({
      duck_id: pick(r, 'DuckId'),
      user_id: pick(r, 'UserId'),
      created_at: toDate(pick(r, 'UTCCreatedAt', 'CreatedAt')) ?? new Date(),
    }))
    .filter((l) => l.duck_id && l.user_id)

  const subs = srcSubs
    .map((r) => ({
      id: num(pick(r, 'Id')),
      email: str(pick(r, 'Email')),
      discount_code: str(pick(r, 'DiscountCode')),
      subscribed_at: toDate(pick(r, 'SubscribedAt')) ?? new Date(),
      is_active: bool(pick(r, 'IsActive')),
    }))
    .filter((s) => s.id != null && s.email)

  if (!COMMIT) {
    console.log('\nDRY RUN — transformed row counts (nothing written):')
    console.log('  users        ', users.length)
    console.log('  ducks        ', ducks.length)
    console.log('  sightings    ', sightings.length)
    console.log('  likes        ', likes.length)
    console.log('  subscriptions', subs.length)
    if (users[0]) console.log('  sample user:', { id: users[0].id, email: users[0].email, is_admin: users[0].is_admin, deleted_at: users[0].deleted_at })
    if (ducks[0]) console.log('  sample duck:', { id: ducks[0].id, qt_code: ducks[0].qt_code, registration_type: ducks[0].registration_type })
    console.log('\nRe-run with --commit to write (add --wipe to clear target tables first).')
    await pool.close()
    await pg.end()
    return
  }

  await pg.begin(async (tx) => {
    if (WIPE) {
      console.log('\nWIPE: truncating target tables...')
      await tx`truncate table duck_likes, duck_sightings, ducks, email_subscriptions, auth_tokens, users restart identity cascade`
    }
    if (users.length) await tx`insert into users ${tx(users)} on conflict (id) do nothing`
    if (ducks.length) await tx`insert into ducks ${tx(ducks)} on conflict (id) do nothing`
    if (sightings.length) await tx`insert into duck_sightings ${tx(sightings)} on conflict (id) do nothing`
    if (likes.length) await tx`insert into duck_likes ${tx(likes)} on conflict (duck_id, user_id) do nothing`
    if (subs.length) await tx`insert into email_subscriptions ${tx(subs)} on conflict (id) do nothing`
    // keep serial sequences ahead of the imported ids
    await tx`select setval(pg_get_serial_sequence('duck_sightings','id'), greatest((select coalesce(max(id),0) from duck_sightings),1))`
    await tx`select setval(pg_get_serial_sequence('email_subscriptions','id'), greatest((select coalesce(max(id),0) from email_subscriptions),1))`
  })

  console.log('\n✅ COMMIT complete. Target row counts now:')
  for (const t of ['users', 'ducks', 'duck_sightings', 'duck_likes', 'email_subscriptions']) {
    const [{ count }] = await pg.unsafe(`select count(*)::int as count from ${t}`)
    console.log('  ', t.padEnd(20), count)
  }
  await pool.close()
  await pg.end()
}

main().catch((e) => {
  console.error('Migration failed:', e)
  process.exit(1)
})

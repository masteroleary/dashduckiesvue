// Demo seed: 3 users, 10 sample ducks, 30 sightings (3 per duck) across US cities.
// Idempotent for the seed ducks (qt_code 100001-100010). Run: npm run db:seed
import postgres from 'postgres'

const url = process.env.DATABASE_URL
if (!url) {
  console.error('DATABASE_URL is not set (run with: node --env-file=.env scripts/seed.mjs)')
  process.exit(1)
}
const sql = postgres(url, { connect_timeout: 20 })

const USERS = [
  { email: 'alice.explorer@example.com', first: 'Alice', last: 'Explorer' },
  { email: 'bob.traveler@example.com', first: 'Bob', last: 'Traveler' },
  { email: 'charlie.adventurer@example.com', first: 'Charlie', last: 'Adventurer' },
]

const DUCKS = [
  { qt: 100001, name: 'Erik the Brave', img: 'viking-duck.png' },
  { qt: 100002, name: 'Commander Quackers', img: 'astronaught-duck.png' },
  { qt: 100003, name: 'Chef Duckie Ramsay', img: 'chef-duck.png' },
  { qt: 100004, name: 'Windy City Wadsworth', img: 'chicago-duck.png' },
  { qt: 100005, name: 'Broadway Billie', img: 'newyork-duck.png' },
  { qt: 100006, name: 'Dr. Indiana Ducks', img: 'indiana-jones-duck.png' },
  { qt: 100007, name: 'Raptor Rubber', img: 'jurrasic-park-duck.png' },
  { qt: 100008, name: 'Señor Splashador', img: 'mexican-duck.png' },
  { qt: 100009, name: 'Tiger Paddler', img: 'golf-duck.png' },
  { qt: 100010, name: 'Midnight Ripples', img: 'emo-duck.png' },
]

const LOCATIONS = [
  { lat: 40.7829, lng: -73.9654, address: 'Central Park, New York, NY' },
  { lat: 34.1184, lng: -118.3004, address: 'Griffith Observatory, Los Angeles, CA' },
  { lat: 41.8919, lng: -87.6051, address: 'Navy Pier, Chicago, IL' },
  { lat: 37.7694, lng: -122.4862, address: 'Golden Gate Park, San Francisco, CA' },
  { lat: 32.7341, lng: -117.1491, address: 'Balboa Park, San Diego, CA' },
  { lat: 47.6097, lng: -122.3331, address: 'Pike Place Market, Seattle, WA' },
]

const DAY = 24 * 60 * 60 * 1000

try {
  await sql.begin(async (tx) => {
    // Users (idempotent on unique email)
    const userIds = []
    for (const u of USERS) {
      const [row] = await tx`
        insert into users (email, name_first, name_last, is_member)
        values (${u.email}, ${u.first}, ${u.last}, true)
        on conflict (email) do update set name_first = excluded.name_first
        returning id`
      userIds.push(row.id)
    }

    // Wipe previous seed ducks + their sightings so re-runs are clean
    await tx`delete from duck_sightings where duck_id in (select id from ducks where qt_code between 100001 and 100010)`
    await tx`delete from ducks where qt_code between 100001 and 100010`

    const base = Date.now() - 180 * DAY
    let sightingCount = 0
    for (let i = 0; i < DUCKS.length; i++) {
      const d = DUCKS[i]
      const [duck] = await tx`
        insert into ducks (qt_code, name, image_url, registration_type)
        values (${d.qt}, ${d.name}, ${'/sampleducks/' + d.img}, 'Promotion')
        returning id`
      for (let j = 0; j < 3; j++) {
        const loc = LOCATIONS[(i * 3 + j) % LOCATIONS.length]
        const when = new Date(base + (i * 15 + j * 5) * DAY)
        await tx`
          insert into duck_sightings (duck_id, user_id, sighting_date, latitude, longitude, address)
          values (${duck.id}, ${userIds[j % userIds.length]}, ${when}, ${loc.lat}, ${loc.lng}, ${loc.address})`
        sightingCount++
      }
    }
    console.log(`Seeded ${USERS.length} users, ${DUCKS.length} ducks, ${sightingCount} sightings.`)
  })
} catch (e) {
  console.error('Seed failed:', e.message)
  process.exitCode = 1
} finally {
  await sql.end()
}

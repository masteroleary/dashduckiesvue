// Drizzle schema for Postgres — ported from the legacy Blazor/EF Core app.
//
// Conventions vs the old SQL Server schema:
//   - GUID primary keys      -> uuid (default gen_random_uuid())
//   - DateTime (UTC)         -> timestamptz
//   - Soft delete            -> nullable `deleted_at` (NULL = active), replacing the
//                               old "UTCDeletedOn = DateTime.MinValue means active" sentinel
//   - TS fields are camelCase; DB columns are snake_case.

import { relations, sql } from 'drizzle-orm'
import {
  pgTable,
  pgEnum,
  uuid,
  text,
  integer,
  boolean,
  doublePrecision,
  serial,
  timestamp,
  index,
  uniqueIndex,
} from 'drizzle-orm/pg-core'

// How a duck entered the system (sticker scan, promo, purchased duck/sticker).
export const registrationTypeEnum = pgEnum('registration_type', [
  'StickerValid',
  'Promotion',
  'PurchasedDuck',
  'PurchasedSticker',
])

// --- users -----------------------------------------------------------------
export const users = pgTable(
  'users',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    email: text('email'),
    phoneNumber: text('phone_number'),
    nameFirst: text('name_first'),
    nameLast: text('name_last'),
    profileImageUrl: text('profile_image_url'),
    addressStreet1: text('address_street1'),
    addressStreet2: text('address_street2'),
    addressCity: text('address_city'),
    addressState: text('address_state'),
    addressStateAbbr: text('address_state_abbr'),
    addressZip: text('address_zip'),
    addressCountryAbbr: text('address_country_abbr'),
    isAdmin: boolean('is_admin').notNull().default(false),
    isMember: boolean('is_member').notNull().default(false),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    lastLoginAt: timestamp('last_login_at', { withTimezone: true }),
    deletedAt: timestamp('deleted_at', { withTimezone: true }),
  },
  (t) => [
    // Partial unique: only active (non-deleted) users contend for an email/phone,
    // so a soft-deleted account doesn't block re-use of its email/phone.
    uniqueIndex('users_email_idx').on(t.email).where(sql`${t.deletedAt} is null`),
    uniqueIndex('users_phone_number_idx').on(t.phoneNumber).where(sql`${t.deletedAt} is null`),
  ],
)

// --- ducks -----------------------------------------------------------------
export const ducks = pgTable(
  'ducks',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    qtCode: integer('qt_code').notNull(), // physical code printed on the sticker
    name: text('name'),
    description: text('description'),
    imageUrl: text('image_url'),
    registrationType: registrationTypeEnum('registration_type').notNull().default('StickerValid'),
    registeredByUserId: uuid('registered_by_user_id').references(() => users.id),
    // Anonymous-claim grace period (7 days) — claimed on first login with this token.
    claimToken: uuid('claim_token'),
    claimTokenIssuedAt: timestamp('claim_token_issued_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    deletedAt: timestamp('deleted_at', { withTimezone: true }),
  },
  (t) => [
    uniqueIndex('ducks_qt_code_idx').on(t.qtCode),
    index('ducks_claim_token_idx').on(t.claimToken),
  ],
)

// --- duck_sightings --------------------------------------------------------
export const duckSightings = pgTable(
  'duck_sightings',
  {
    id: serial('id').primaryKey(),
    duckId: uuid('duck_id')
      .notNull()
      .references(() => ducks.id),
    userId: uuid('user_id').references(() => users.id), // null = anonymous sighting
    claimToken: uuid('claim_token'),
    sightingDate: timestamp('sighting_date', { withTimezone: true }).notNull().defaultNow(),
    latitude: doublePrecision('latitude'),
    longitude: doublePrecision('longitude'),
    address: text('address'),
    imageUrl: text('image_url'),
  },
  (t) => [
    index('duck_sightings_duck_id_idx').on(t.duckId),
    index('duck_sightings_claim_token_idx').on(t.claimToken),
  ],
)

// --- duck_likes ------------------------------------------------------------
export const duckLikes = pgTable(
  'duck_likes',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    duckId: uuid('duck_id')
      .notNull()
      .references(() => ducks.id, { onDelete: 'cascade' }),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [uniqueIndex('duck_likes_duck_user_idx').on(t.duckId, t.userId)],
)

// --- verification_codes ----------------------------------------------------
export const verificationCodes = pgTable(
  'verification_codes',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    emailOrPhone: text('email_or_phone').notNull(),
    code: text('code').notNull(),
    expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
    isUsed: boolean('is_used').notNull().default(false),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index('verification_codes_lookup_idx').on(t.emailOrPhone, t.code)],
)

// --- auth_tokens (JWT revocation store) ------------------------------------
export const authTokens = pgTable(
  'auth_tokens',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    token: text('token').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
  },
  (t) => [
    index('auth_tokens_user_id_idx').on(t.userId),
    index('auth_tokens_token_idx').on(t.token),
  ],
)

// --- email_subscriptions (newsletter) --------------------------------------
export const emailSubscriptions = pgTable('email_subscriptions', {
  id: serial('id').primaryKey(),
  email: text('email').notNull(),
  discountCode: text('discount_code'),
  subscribedAt: timestamp('subscribed_at', { withTimezone: true }).notNull().defaultNow(),
  isActive: boolean('is_active').notNull().default(true),
})

// --- relations (for Drizzle's relational query API) ------------------------
export const usersRelations = relations(users, ({ many }) => ({
  authTokens: many(authTokens),
  sightings: many(duckSightings),
  likes: many(duckLikes),
}))

export const ducksRelations = relations(ducks, ({ one, many }) => ({
  registeredBy: one(users, {
    fields: [ducks.registeredByUserId],
    references: [users.id],
  }),
  sightings: many(duckSightings),
  likes: many(duckLikes),
}))

export const duckSightingsRelations = relations(duckSightings, ({ one }) => ({
  duck: one(ducks, { fields: [duckSightings.duckId], references: [ducks.id] }),
  user: one(users, { fields: [duckSightings.userId], references: [users.id] }),
}))

export const duckLikesRelations = relations(duckLikes, ({ one }) => ({
  duck: one(ducks, { fields: [duckLikes.duckId], references: [ducks.id] }),
  user: one(users, { fields: [duckLikes.userId], references: [users.id] }),
}))

export const authTokensRelations = relations(authTokens, ({ one }) => ({
  user: one(users, { fields: [authTokens.userId], references: [users.id] }),
}))

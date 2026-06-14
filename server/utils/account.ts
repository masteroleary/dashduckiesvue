import type { users } from '../db/schema'

type UserRow = typeof users.$inferSelect

// Editable account projection returned to the member.
export function accountDto(u: UserRow) {
  return {
    nameFirst: u.nameFirst ?? '',
    nameLast: u.nameLast ?? '',
    email: u.email ?? '',
    phoneNumber: u.phoneNumber ?? '',
    profileImageUrl: u.profileImageUrl ?? '',
    addressStreet1: u.addressStreet1 ?? '',
    addressStreet2: u.addressStreet2 ?? '',
    addressCity: u.addressCity ?? '',
    addressState: u.addressState ?? '',
    addressStateAbbr: u.addressStateAbbr ?? '',
    addressZip: u.addressZip ?? '',
    addressCountryAbbr: u.addressCountryAbbr ?? '',
  }
}

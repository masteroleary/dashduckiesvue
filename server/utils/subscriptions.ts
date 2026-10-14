// Box schedule. Boxes go out on the same day each month for everyone, which is
// simpler to run than per-member anniversary dates, and makes "your cutoff date"
// one date we can always state plainly.
export const SHIP_DAY_OF_MONTH = 15
export const CUTOFF_DAYS_BEFORE_SHIP = 7

function atUtcMidnight(y: number, m: number, d: number) {
  return new Date(Date.UTC(y, m, d, 0, 0, 0, 0))
}

// The next ship date on or after `from`. Skipping pushes it on by one month.
export function nextShipDate(from: Date, skipNext = false): Date {
  const y = from.getUTCFullYear()
  const m = from.getUTCMonth()
  let ship = atUtcMidnight(y, m, SHIP_DAY_OF_MONTH)
  if (from.getTime() > ship.getTime()) ship = atUtcMidnight(y, m + 1, SHIP_DAY_OF_MONTH)
  if (skipNext) ship = atUtcMidnight(ship.getUTCFullYear(), ship.getUTCMonth() + 1, SHIP_DAY_OF_MONTH)
  return ship
}

// Changes must be in before this. After it the box is packed and goes out.
export function cutoffDate(ship: Date): Date {
  return new Date(ship.getTime() - CUTOFF_DAYS_BEFORE_SHIP * 24 * 60 * 60 * 1000)
}

export interface ScheduleView {
  nextShipDate: string
  cutoffDate: string
  /** False once the cutoff has passed — that box is already committed. */
  canChangeNextBox: boolean
  daysUntilCutoff: number
}

export function scheduleFor(skipNext: boolean, now = new Date()): ScheduleView {
  const ship = nextShipDate(now, skipNext)
  const cutoff = cutoffDate(ship)
  const msLeft = cutoff.getTime() - now.getTime()
  return {
    nextShipDate: ship.toISOString(),
    cutoffDate: cutoff.toISOString(),
    canChangeNextBox: msLeft > 0,
    daysUntilCutoff: Math.max(0, Math.ceil(msLeft / (24 * 60 * 60 * 1000))),
  }
}

export const PLAN_LABELS: Record<string, string> = {
  monthly: 'Monthly',
  six_month: '6 months',
  twelve_month: '12 months',
}

import sgMail from '@sendgrid/mail'

// Fire-and-forget admin notifications (ported from AdminNotificationService).
// They never block or fail the request; errors are logged only.

function parseList(v: string | undefined): string[] {
  return (v || '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)
}

function adminEmails(): string[] {
  return parseList(process.env.ADMIN_NOTIFICATION_EMAILS)
}

// Duck problem reports go to the public inbox rather than the admin list, so
// they land where they're actioned. Override per environment if that changes.
function reportEmails(): string[] {
  const configured = parseList(process.env.REPORT_NOTIFICATION_EMAILS)
  return configured.length ? configured : ['info@dashduckies.com']
}

async function sendMail(to: string[], subject: string, html: string) {
  if (!to.length || !process.env.SENDGRID_API_KEY) return
  sgMail.setApiKey(process.env.SENDGRID_API_KEY)
  await sgMail.send({
    to,
    from: {
      email: process.env.SENDGRID_FROM_EMAIL || 'info@dashduckies.com',
      name: process.env.SENDGRID_FROM_NAME || 'Dash Duckies',
    },
    subject,
    html,
  })
}

async function sendToAdmins(subject: string, html: string) {
  await sendMail(adminEmails(), subject, html)
}

export function notifyNewMember(user: { email: string | null; phoneNumber: string | null; id: string }) {
  const who = user.email || user.phoneNumber || user.id
  sendToAdmins('🦆 New Dash Duckies member', `<p>A new member just signed up: <strong>${who}</strong>.</p>`).catch(
    (e) => console.error('[notify] new member failed:', e?.message || e),
  )
}

export function notifyNewSighting(
  duck: { name: string | null; qtCode: number },
  sighting: { address: string | null },
  user: { email: string | null; phone?: string | null } | null,
) {
  const duckName = duck.name || `Duck ${duck.qtCode}`
  const who = user ? user.email || user.phone || 'a member' : 'an anonymous visitor'
  sendToAdmins(
    `🦆 New sighting of ${duckName}`,
    `<p><strong>${who}</strong> reported a sighting of <strong>${duckName}</strong> at ${sighting.address || 'an unknown location'}.</p>`,
  ).catch((e) => console.error('[notify] new sighting failed:', e?.message || e))
}

// Reports carry free text from anonymous finders, so escape before it lands in
// an HTML email.
function esc(s: string) {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

// Someone scanned an unregistered duck and flagged it. Unlike the notifications
// above this one is awaited by its caller, so a delivery failure can be reported
// back rather than leaving the finder thinking we heard them.
export function notifyDuckReport(
  duck: { id: string; name: string | null; qtCode: number },
  report: { note: string; contact: string; ip: string },
) {
  // sendMail no-ops when unconfigured; here that would tell the reporter we
  // heard them when nothing was sent.
  if (!process.env.SENDGRID_API_KEY) {
    return Promise.reject(new Error('report notifications are not configured'))
  }
  const duckName = duck.name ? esc(duck.name) : `Duck ${duck.qtCode}`
  return sendMail(
    reportEmails(),
    `🚩 Report on unregistered ${duckName} (QT ${duck.qtCode})`,
    `<p>Someone scanned <strong>${duckName}</strong> (QT code <strong>${duck.qtCode}</strong>) and reported it as unregistered.</p>` +
      `<p><strong>What they said:</strong><br>${report.note ? esc(report.note).replace(/\n/g, '<br>') : '<em>No message left.</em>'}</p>` +
      `<p><strong>Contact:</strong> ${report.contact ? esc(report.contact) : '<em>Not provided</em>'}</p>` +
      `<p><strong>From IP:</strong> ${esc(report.ip)}</p>` +
      `<p>Duck id: <code>${esc(duck.id)}</code></p>`,
  )
}

// A scanned code that matches no duck at all — no duck row to reference, just
// the code the finder typed or scanned.
export function notifyUnknownCodeReport(identifier: string, report: { note: string; contact: string; ip: string }) {
  if (!process.env.SENDGRID_API_KEY) {
    return Promise.reject(new Error('report notifications are not configured'))
  }
  return sendMail(
    reportEmails(),
    `🚩 Report on unknown QT code "${esc(identifier)}"`,
    `<p>Someone scanned <strong>${esc(identifier)}</strong>, which is not in the system, and reported it.</p>` +
      `<p><strong>What they said:</strong><br>${report.note ? esc(report.note).replace(/\n/g, '<br>') : '<em>No message left.</em>'}</p>` +
      `<p><strong>Contact:</strong> ${report.contact ? esc(report.contact) : '<em>Not provided</em>'}</p>` +
      `<p><strong>From IP:</strong> ${esc(report.ip)}</p>`,
  )
}

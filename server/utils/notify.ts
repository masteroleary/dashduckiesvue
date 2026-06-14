import sgMail from '@sendgrid/mail'

// Fire-and-forget admin notifications (ported from AdminNotificationService).
// They never block or fail the request; errors are logged only.

function adminEmails(): string[] {
  return (process.env.ADMIN_NOTIFICATION_EMAILS || '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)
}

async function sendToAdmins(subject: string, html: string) {
  const to = adminEmails()
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

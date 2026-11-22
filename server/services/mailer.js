const fs = require('fs')
const path = require('path')

const TRANSPORT = (process.env.MAIL_TRANSPORT || 'console').toLowerCase()
const FROM = process.env.MAIL_FROM || 'CORE-V <noreply@core-v.local>'
const OUTBOX = path.join(__dirname, '..', 'outbox')

function ensureOutbox() {
  if (!fs.existsSync(OUTBOX)) fs.mkdirSync(OUTBOX, { recursive: true })
}

async function sendConsole({ to, subject, text, html }) {
  ensureOutbox()
  const ts = new Date().toISOString().replace(/[:.]/g, '-')
  const file = path.join(OUTBOX, `${ts}-${to.replace(/[^a-z0-9]/gi, '_')}.txt`)
  const body = [
    `From: ${FROM}`,
    `To: ${to}`,
    `Subject: ${subject}`,
    `Date: ${new Date().toISOString()}`,
    '',
    text,
    html ? `\n--- HTML ---\n${html}` : '',
  ].join('\n')
  fs.writeFileSync(file, body)
  console.log(`[mailer:console] Email to ${to} saved to ${file}`)
  return { ok: true, transport: 'console', file }
}

async function sendBrevo({ to, subject, text, html }) {
  const apiKey = process.env.BREVO_API_KEY
  if (!apiKey) throw new Error('BREVO_API_KEY not set')
  const senderEmail = process.env.MAIL_FROM_EMAIL || FROM.match(/<(.+)>/)?.[1] || FROM
  const senderName = process.env.MAIL_FROM_NAME || 'CORE-V'
  const res = await fetch('https://api.brevo.com/v3/smtp/email', {
    method: 'POST',
    headers: { 'api-key': apiKey, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      sender: { name: senderName, email: senderEmail },
      to: [{ email: to }],
      subject,
      textContent: text,
      htmlContent: html || text.replace(/\n/g, '<br>'),
    }),
  })
  if (!res.ok) {
    const body = await res.text()
    throw new Error(`Brevo error ${res.status}: ${body}`)
  }
  const data = await res.json()
  console.log(`[mailer:brevo] Email sent to ${to}, messageId: ${data.messageId}`)
  return { ok: true, transport: 'brevo', messageId: data.messageId }
}

async function sendSmtp({ to, subject, text, html }) {
  let nodemailer
  try { nodemailer = require('nodemailer') } catch { throw new Error('nodemailer not installed') }
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT || 587),
    secure: process.env.SMTP_SECURE === 'true',
    auth: process.env.SMTP_USER ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS } : undefined,
  })
  const info = await transporter.sendMail({ from: FROM, to, subject, text, html })
  console.log(`[mailer:smtp] Email sent to ${to}, messageId: ${info.messageId}`)
  return { ok: true, transport: 'smtp', messageId: info.messageId }
}

async function sendEmail({ to, subject, text, html }) {
  try {
    if (TRANSPORT === 'brevo') return await sendBrevo({ to, subject, text, html })
    if (TRANSPORT === 'smtp') return await sendSmtp({ to, subject, text, html })
    return await sendConsole({ to, subject, text, html })
  } catch (err) {
    console.error(`[mailer] Failed to send email to ${to}:`, err.message)
    // Fall back to console so the link is never lost
    try { return await sendConsole({ to, subject, text, html }) } catch { return { ok: false, error: err.message } }
  }
}

module.exports = { sendEmail }
import crypto from 'node:crypto'
import fs from 'node:fs'

const keyId = process.env.APPSTORE_API_KEY_ID
const issuerId = process.env.APPSTORE_API_ISSUER_ID
const keyFile = process.env.KEYFILE
const bundleId = process.env.BUNDLE_ID || 'es.verkvest.aureline'
const name = process.env.APP_NAME || 'Aureline'

if (!keyId || !issuerId || !keyFile) {
  console.error('Missing App Store Connect API key environment')
  process.exit(1)
}

const key = fs.readFileSync(keyFile)
const now = Math.floor(Date.now() / 1000)
const header = Buffer.from(
  JSON.stringify({ alg: 'ES256', kid: keyId, typ: 'JWT' }),
).toString('base64url')
const payload = Buffer.from(
  JSON.stringify({
    iss: issuerId,
    iat: now,
    exp: now + 600,
    aud: 'appstoreconnect-v1',
  }),
).toString('base64url')
const signer = crypto.createSign('SHA256')
signer.update(`${header}.${payload}`)
signer.end()
const signature = signer
  .sign({ key, dsaEncoding: 'ieee-p1363' })
  .toString('base64url')
const token = `${header}.${payload}.${signature}`

async function api(path, options = {}) {
  const response = await fetch(`https://api.appstoreconnect.apple.com${path}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
  })
  const text = await response.text()
  let body = null
  if (text) {
    try {
      body = JSON.parse(text)
    } catch {
      body = text
    }
  }
  return { response, body }
}

const listed = await api(
  `/v1/bundleIds?filter[identifier]=${encodeURIComponent(bundleId)}&limit=1`,
)
if (!listed.response.ok) {
  console.error(
    `Could not look up bundle id ${bundleId}: ${listed.response.status}`,
  )
  process.exit(1)
}
if (listed.body?.data?.length) {
  console.log(`Bundle id ${bundleId} already exists`)
  process.exit(0)
}

const created = await api('/v1/bundleIds', {
  method: 'POST',
  body: JSON.stringify({
    data: {
      type: 'bundleIds',
      attributes: {
        identifier: bundleId,
        name,
        platform: 'IOS',
      },
    },
  }),
})
if (created.response.ok || created.response.status === 409) {
  console.log(`Registered bundle id ${bundleId}`)
  process.exit(0)
}
console.error(
  `Failed to register bundle id ${bundleId}: ${created.response.status}`,
)
if (created.body?.errors) {
  for (const error of created.body.errors) {
    console.error(error.detail || error.title || 'App Store Connect error')
  }
}
process.exit(1)

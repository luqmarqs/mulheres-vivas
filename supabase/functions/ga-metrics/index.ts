// Supabase Edge Function — GA4 Data API proxy
// Deploy: npx supabase functions deploy ga-metrics --no-verify-jwt
// Secrets necessários:
//   GA_PROPERTY_ID          → ID numérico da propriedade GA4 (ex: 123456789)
//   GA_SERVICE_ACCOUNT_JSON → JSON completo da service account do Google Cloud

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...CORS, 'Content-Type': 'application/json' },
  })
}

// Base64url sem padding (padrão JWT)
function b64url(buf: ArrayBuffer): string {
  let bin = ''
  new Uint8Array(buf).forEach(b => (bin += String.fromCharCode(b)))
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '')
}

function b64urlStr(str: string): string {
  return b64url(new TextEncoder().encode(str).buffer)
}

async function googleAccessToken(sa: { client_email: string; private_key: string }) {
  const now = Math.floor(Date.now() / 1000)
  const header  = b64urlStr(JSON.stringify({ alg: 'RS256', typ: 'JWT' }))
  const payload = b64urlStr(JSON.stringify({
    iss:   sa.client_email,
    scope: 'https://www.googleapis.com/auth/analytics.readonly',
    aud:   'https://oauth2.googleapis.com/token',
    iat:   now,
    exp:   now + 3600,
  }))

  const sigInput = `${header}.${payload}`
  const pemBody = sa.private_key
    .replace(/-----BEGIN PRIVATE KEY-----/g, '')
    .replace(/-----END PRIVATE KEY-----/g, '')
    .replace(/\s/g, '')

  const keyBytes = Uint8Array.from(atob(pemBody), c => c.charCodeAt(0))
  const key = await crypto.subtle.importKey(
    'pkcs8', keyBytes,
    { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
    false, ['sign'],
  )

  const sig = await crypto.subtle.sign('RSASSA-PKCS1-v1_5', key, new TextEncoder().encode(sigInput))
  const jwt = `${sigInput}.${b64url(sig)}`

  const res  = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: `grant_type=urn:ietf:params:oauth:grant-type:jwt-bearer&assertion=${jwt}`,
  })
  const body = await res.json()
  if (!body.access_token) throw new Error(`Token error: ${JSON.stringify(body)}`)
  return body.access_token as string
}

async function report(token: string, propertyId: string, payload: object) {
  const res = await fetch(
    `https://analyticsdata.googleapis.com/v1beta/properties/${propertyId}:runReport`,
    {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    },
  )
  return res.json()
}

Deno.serve(async (req) => {
  console.log('[ga-metrics] method:', req.method)
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS })

  // Auth simples: exige header Authorization
  const auth = req.headers.get('Authorization')
  if (!auth?.startsWith('Bearer ')) {
    console.error('[ga-metrics] sem token')
    return json({ error: 'Não autorizado' }, 401)
  }

  try {
    const saJson = Deno.env.get('GA_SERVICE_ACCOUNT_JSON')
    const propertyId = Deno.env.get('GA_PROPERTY_ID')

    console.log('[ga-metrics] SA definida:', !!saJson, '| Property:', propertyId)

    if (!saJson || !propertyId) {
      return json({ error: 'Secrets GA_SERVICE_ACCOUNT_JSON ou GA_PROPERTY_ID não configurados' }, 500)
    }

    const sa = JSON.parse(saJson)
    console.log('[ga-metrics] obtendo token Google…')
    const token = await googleAccessToken(sa)
    console.log('[ga-metrics] token ok, buscando relatórios…')

    const [resumo7, resumo30, porDia, porPagina, porDispositivo] = await Promise.all([
      report(token, propertyId, {
        dateRanges: [{ startDate: '7daysAgo', endDate: 'today' }],
        metrics: [
          { name: 'sessions' }, { name: 'activeUsers' },
          { name: 'screenPageViews' }, { name: 'bounceRate' },
          { name: 'averageSessionDuration' },
        ],
      }),
      report(token, propertyId, {
        dateRanges: [{ startDate: '30daysAgo', endDate: 'today' }],
        metrics: [
          { name: 'sessions' }, { name: 'activeUsers' }, { name: 'screenPageViews' },
        ],
      }),
      report(token, propertyId, {
        dateRanges: [{ startDate: '29daysAgo', endDate: 'today' }],
        dimensions: [{ name: 'date' }],
        metrics: [{ name: 'sessions' }, { name: 'activeUsers' }],
        orderBys: [{ dimension: { dimensionName: 'date' } }],
      }),
      report(token, propertyId, {
        dateRanges: [{ startDate: '30daysAgo', endDate: 'today' }],
        dimensions: [{ name: 'pagePath' }],
        metrics: [{ name: 'screenPageViews' }],
        orderBys: [{ metric: { metricName: 'screenPageViews' }, desc: true }],
        limit: 5,
      }),
      report(token, propertyId, {
        dateRanges: [{ startDate: '30daysAgo', endDate: 'today' }],
        dimensions: [{ name: 'deviceCategory' }],
        metrics: [{ name: 'sessions' }],
        orderBys: [{ metric: { metricName: 'sessions' }, desc: true }],
      }),
    ])

    console.log('[ga-metrics] ok')
    return json({ resumo7, resumo30, porDia, porPagina, porDispositivo })
  } catch (err) {
    console.error('[ga-metrics] erro:', err.message)
    return json({ error: err.message }, 500)
  }
})

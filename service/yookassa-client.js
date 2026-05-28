const crypto = require('crypto')

const API_BASE = 'https://api.yookassa.ru/v3'

function getCredentials() {
  const shopId = process.env.YOOKASSA_SHOP_ID
  const secret = process.env.YOOKASSA_API_KEY || process.env.YOOKASSA_SECRET_KEY
  if (!shopId || !secret) {
    const err = new Error('Не заданы YOOKASSA_SHOP_ID и YOOKASSA_API_KEY')
    err.statusCode = 503
    throw err
  }
  return { shopId: String(shopId).trim(), secret: String(secret).trim() }
}

function makeIdempotenceKey() {
  return crypto.randomUUID()
}

async function yookassaRequest(method, path, body) {
  const { shopId, secret } = getCredentials()
  const auth = Buffer.from(`${shopId}:${secret}`).toString('base64')

  const res = await fetch(`${API_BASE}${path}`, {
    method,
    headers: {
      Authorization: `Basic ${auth}`,
      'Content-Type': 'application/json',
      'Idempotence-Key': makeIdempotenceKey(),
    },
    body: body != null ? JSON.stringify(body) : undefined,
  })

  const raw = await res.text()
  let data = null
  if (raw) {
    try {
      data = JSON.parse(raw)
    } catch {
      data = { raw }
    }
  }

  if (!res.ok) {
    const err = new Error(data?.description || `YooKassa HTTP ${res.status}`)
    err.statusCode = res.status >= 400 && res.status < 500 ? res.status : 502
    err.yookassa = data
    throw err
  }

  return data
}

module.exports = {
  createPayment: (payload) => yookassaRequest('POST', '/payments', payload),
  getPayment: (paymentId) => yookassaRequest('GET', `/payments/${paymentId}`),
}


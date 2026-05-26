const crypto = require('crypto')

const API_BASE = 'https://api.yookassa.ru/v3'

function credentials() {
  const apiKey = process.env.YOUKASSA_API_KEY || process.env.YOOKASSA_SECRET_KEY
  let shopId = process.env.YOUKASSA_SHOP_ID || process.env.YOOKASSA_SHOP_ID
  let secret = apiKey

  // формат "shopId:secret" в одной переменной
  if (apiKey && apiKey.includes(':')) {
    const [id, key] = apiKey.split(':')
    shopId = shopId || id
    secret = key
  }

  if (!shopId || !secret) {
    const err = new Error(
      'Задайте YOUKASSA_API_KEY (секрет) и YOUKASSA_SHOP_ID (номер магазина) в .env'
    )
    err.statusCode = 503
    throw err
  }
  return { shopId: String(shopId).trim(), secret: String(secret).trim() }
}

function idempotenceKey() {
  return crypto.randomUUID()
}

/**
 * @param {string} method
 * @param {string} path
 * @param {object} [body]
 */
async function yookassaRequest(method, path, body) {
  const { shopId, secret } = credentials()
  const auth = Buffer.from(`${shopId}:${secret}`).toString('base64')
  const headers = {
    Authorization: `Basic ${auth}`,
    'Content-Type': 'application/json',
    'Idempotence-Key': idempotenceKey(),
  }

  const res = await fetch(`${API_BASE}${path}`, {
    method,
    headers,
    body: body != null ? JSON.stringify(body) : undefined,
  })

  let data = null
  const text = await res.text()
  if (text) {
    try {
      data = JSON.parse(text)
    } catch {
      data = { raw: text }
    }
  }

  if (!res.ok) {
    const err = new Error(data?.description || data?.type || `YooKassa HTTP ${res.status}`)
    err.statusCode = res.status >= 400 && res.status < 500 ? res.status : 502
    err.yookassa = data
    throw err
  }

  return data
}

module.exports = {
  yookassaRequest,
  getPayment: (paymentId) => yookassaRequest('GET', `/payments/${paymentId}`),
  createPayment: (payload) => yookassaRequest('POST', '/payments', payload),
}

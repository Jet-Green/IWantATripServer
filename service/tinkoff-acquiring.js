const crypto = require('crypto')

/**
 * Токен для методов эквайринга (Init и др.): только скалярные поля корня,
 * без Token / вложенных объектов и массивов. Алгоритм: developer.tbank.ru/eacq/intro/developer/token
 */
function buildAcquiringRequestToken(rootFields, password) {
  const pairs = []
  for (const [key, value] of Object.entries(rootFields)) {
    if (key === 'Token') continue
    if (value === undefined || value === null) continue
    if (typeof value === 'object') continue
    pairs.push([key, String(value)])
  }
  pairs.push(['Password', password])
  pairs.sort((a, b) => a[0].localeCompare(b[0]))
  const concatenated = pairs.map(([, v]) => v).join('')
  return crypto.createHash('sha256').update(concatenated, 'utf8').digest('hex')
}

/**
 * Проверка подписи входящего уведомления (тот же алгоритм, что и для исходящих запросов).
 */
function verifyNotificationToken(body, password) {
  if (!body || typeof body !== 'object') return false
  const received = body.Token
  if (!received || !password) return false
  const clone = { ...body }
  delete clone.Token
  delete clone.Password
  const expected = buildAcquiringRequestToken(clone, password)
  return String(received).toLowerCase() === String(expected).toLowerCase()
}

module.exports = { buildAcquiringRequestToken, verifyNotificationToken }

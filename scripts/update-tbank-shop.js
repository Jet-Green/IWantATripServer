#!/usr/bin/env node
/*
 * Обновление / разблокировка точки маркетплейса в Т-Банке (SM-Register).
 * Док: «Обновление информации о точках через sm-register» (api_upd_marketplace.pdf).
 *
 * Флоу:
 *   1) POST  {base}/oauth/token                     Basic partner:partner, form-urlencoded -> access_token
 *   2) PATCH {base}/sm-register/register/{shopCode}  Bearer <token>, JSON { bankAccount }
 *
 * ВАЖНО: для acqapi.tinkoff.ru требуется mTLS клиентский сертификат и IP в White List банка
 * (письмо на acq_help@tbank.ru). Без этого боевой вызов не пройдёт — сначала прогнать на test.
 *
 * disableReimbursement: false  -> ТСП разблокируется и прошлые холды помечаются на выплату.
 *
 * ENV:
 *   TBANK_SM_ENV        test | prod  (по умолчанию test)
 *   TBANK_SM_LOGIN      login для /oauth/token (выдаёт банк)
 *   TBANK_SM_PASSWORD   password для /oauth/token (выдаёт банк)
 *   TBANK_SM_PFX        путь к PKCS#12 (.pfx/.p12)            -- либо CERT+KEY ниже
 *   TBANK_SM_CERT       путь к клиентскому сертификату (PEM)
 *   TBANK_SM_KEY        путь к приватному ключу (PEM)
 *   TBANK_SM_PASSPHRASE пароль к ключу/PFX (если есть)
 *   TBANK_SM_CA         путь к CA-бандлу (напр. НУЦ Минцифры), опц.
 *   ENV_FILE            путь к .env-файлу для подгрузки (опц.)
 *   DRY_RUN=1           не отправлять PATCH, только показать запрос (= флаг --dry-run)
 *
 * Запуск:
 *   TBANK_SM_ENV=test node scripts/update-tbank-shop.js --dry-run
 *   TBANK_SM_ENV=prod TBANK_SM_LOGIN=... TBANK_SM_PASSWORD=... \
 *     TBANK_SM_PFX=./cert.pfx TBANK_SM_PASSPHRASE=... node scripts/update-tbank-shop.js
 */

const fs = require('fs')
const https = require('https')

try {
  if (process.env.ENV_FILE) require('dotenv').config({ path: process.env.ENV_FILE })
} catch (_) {}

// --- Реквизиты обновляемой точки (правится здесь) -----------------------------
const SHOP_CODE = '1347849' // ООО "ВЕАКОМ", ИНН 1837013663

const bankAccount = {
  account: '40702810209000055117',
  korAccount: '30101810900000000871', // новый корр. счёт — то, что просил Т-Банк
  bankName: 'АКБ "Датабанк" (ПАО)',
  bik: '049401871',
  details: 'Платформа "Города и Веси" оплата тура', // из текущей записи в БД
  tax: 5, // % отчислений в пользу маркетплейса, из текущей записи в БД
  disableReimbursement: false, // false -> снять блокировку с точки
  // kbk / oktmo НЕ передаём: их можно слать только парой, КБК у точки нет.
}
// -----------------------------------------------------------------------------

const BASES = {
  test: 'https://acqapi-test.tinkoff.ru',
  prod: 'https://acqapi.tinkoff.ru',
}

function parseJson(raw) {
  if (!raw) return null
  try {
    return JSON.parse(raw)
  } catch (_) {
    return null
  }
}

function buildAgent() {
  const opts = {}
  const { TBANK_SM_PFX, TBANK_SM_CERT, TBANK_SM_KEY, TBANK_SM_PASSPHRASE, TBANK_SM_CA } = process.env
  if (TBANK_SM_PFX) {
    opts.pfx = fs.readFileSync(TBANK_SM_PFX)
  } else if (TBANK_SM_CERT && TBANK_SM_KEY) {
    opts.cert = fs.readFileSync(TBANK_SM_CERT)
    opts.key = fs.readFileSync(TBANK_SM_KEY)
  }
  if (TBANK_SM_PASSPHRASE) opts.passphrase = TBANK_SM_PASSPHRASE
  if (TBANK_SM_CA) opts.ca = fs.readFileSync(TBANK_SM_CA)
  return new https.Agent(opts)
}

function hasClientCert() {
  return Boolean(process.env.TBANK_SM_PFX || (process.env.TBANK_SM_CERT && process.env.TBANK_SM_KEY))
}

function request(urlStr, { method, headers, body, agent }) {
  return new Promise((resolve, reject) => {
    const url = new URL(urlStr)
    const req = https.request(
      {
        method,
        hostname: url.hostname,
        port: url.port || 443,
        path: url.pathname + url.search,
        headers,
        agent,
        timeout: 30000,
      },
      (res) => {
        const chunks = []
        res.on('data', (c) => chunks.push(c))
        res.on('end', () => resolve({ status: res.statusCode, raw: Buffer.concat(chunks).toString('utf8') }))
      }
    )
    req.on('error', reject)
    req.on('timeout', () => req.destroy(new Error('Таймаут запроса (30с)')))
    if (body) req.write(body)
    req.end()
  })
}

async function getToken(base, agent) {
  const login = process.env.TBANK_SM_LOGIN
  const password = process.env.TBANK_SM_PASSWORD
  if (!login || !password) throw new Error('Не заданы TBANK_SM_LOGIN / TBANK_SM_PASSWORD (их выдаёт банк)')

  const form = new URLSearchParams({ grant_type: 'password', username: login, password }).toString()
  const basic = Buffer.from('partner:partner').toString('base64')

  const { status, raw } = await request(`${base}/oauth/token`, {
    method: 'POST',
    agent,
    headers: {
      Authorization: `Basic ${basic}`,
      'Content-Type': 'application/x-www-form-urlencoded',
      'Content-Length': Buffer.byteLength(form),
    },
    body: form,
  })

  const data = parseJson(raw)
  if (status !== 200 || !data || !data.access_token) {
    throw new Error(`Не удалось получить access_token (HTTP ${status}): ${raw || '<пустой ответ>'}`)
  }
  return data.access_token
}

async function updateShop(base, agent, token) {
  const body = JSON.stringify({ bankAccount })
  const { status, raw } = await request(`${base}/sm-register/register/${SHOP_CODE}`, {
    method: 'PATCH',
    agent,
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(body),
    },
    body,
  })
  return { status, data: parseJson(raw), raw }
}

async function main() {
  const dryRun = process.argv.includes('--dry-run') || process.env.DRY_RUN === '1'
  const env = (process.env.TBANK_SM_ENV || 'test').toLowerCase()
  const base = BASES[env]
  if (!base) throw new Error(`TBANK_SM_ENV должно быть test или prod, получено: ${env}`)

  console.log(`[tbank] окружение: ${env} (${base})`)
  console.log(`[tbank] точка ShopCode: ${SHOP_CODE}`)
  console.log('[tbank] тело bankAccount:')
  console.log(JSON.stringify(bankAccount, null, 2))

  if (dryRun) {
    console.log(`\n[dry-run] PATCH ${base}/sm-register/register/${SHOP_CODE}`)
    console.log('[dry-run] запрос НЕ отправлен.')
    return
  }

  if (!hasClientCert()) {
    console.warn('[tbank] ВНИМАНИЕ: не задан mTLS-сертификат (TBANK_SM_PFX или TBANK_SM_CERT+TBANK_SM_KEY).')
    console.warn('[tbank] Для acqapi.tinkoff.ru он обязателен — запрос, скорее всего, оборвётся на TLS.')
  }
  const agent = buildAgent()

  console.log('\n[tbank] получаю access_token...')
  const token = await getToken(base, agent)
  console.log('[tbank] токен получен.')

  console.log('[tbank] отправляю PATCH обновления точки...')
  const { status, data, raw } = await updateShop(base, agent, token)

  if (status >= 200 && status < 300 && data && !data.errors) {
    console.log(`[tbank] УСПЕХ (HTTP ${status}). Ответ:`)
    console.log(JSON.stringify(data, null, 2))
    return
  }

  console.error(`[tbank] ОШИБКА обновления точки (HTTP ${status}).`)
  if (data && Array.isArray(data.errors) && data.errors.length) {
    for (const e of data.errors) {
      console.error(` - field=${e.field} | ${e.defaultMessage} | rejected=${e.rejectedValue} | code=${e.code}`)
    }
  } else {
    console.error(raw || '<пустой ответ>')
  }
  process.exitCode = 1
}

main().catch((err) => {
  console.error('[tbank] Критическая ошибка:', err.message)
  process.exitCode = 1
})

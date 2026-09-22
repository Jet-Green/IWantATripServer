const fs = require('fs')
const path = require('path')
const https = require('https')
const tls = require('tls')

const { buildAcquiringRequestToken } = require('./tinkoff-acquiring')

const ACQUIRING_HOST = 'securepay.tinkoff.ru'
const ACQUIRING_BASE_PATH = '/v2'

/**
 * С 22.06.2026 securepay.tinkoff.ru отдаёт сертификат российского УЦ
 * (Russian Trusted Root CA, Минцифры). В системном хранилище Node его нет,
 * поэтому подключение падает с SELF_SIGNED_CERT_IN_CHAIN. Добавляем корневой
 * сертификат к системным — именно из-за этого оплата и перестала работать,
 * когда запрос уходил из браузера покупателя.
 * Отпечаток SHA-256: D2:6D:2D:02:31:B7:C3:9F:92:CC:73:85:12:BA:54:10:
 *                    35:19:E4:40:5D:68:B5:BD:70:3E:97:88:CA:8E:CF:31
 */
let caBundle = null
function getCa() {
    if (!caBundle) {
        const caPath = path.join(__dirname, '..', 'certs', 'russian-trusted-root-ca.pem')
        caBundle = [...tls.rootCertificates, fs.readFileSync(caPath, 'utf8')]
    }
    return caBundle
}

/**
 * POST с JSON. Встроенный fetch не умеет принимать свой список корневых
 * сертификатов, поэтому идём через модуль https.
 */
function postJson(pathname, payload) {
    const body = Buffer.from(JSON.stringify(payload), 'utf8')
    const options = {
        host: ACQUIRING_HOST,
        path: pathname,
        method: 'POST',
        ca: getCa(),
        timeout: 30000,
        headers: {
            'Content-Type': 'application/json',
            'Content-Length': body.length,
        },
    }

    return new Promise((resolve, reject) => {
        const req = https.request(options, (res) => {
            const chunks = []
            res.on('data', (chunk) => chunks.push(chunk))
            res.on('end', () => {
                const raw = Buffer.concat(chunks).toString('utf8')
                try {
                    resolve(raw ? JSON.parse(raw) : {})
                } catch {
                    reject(new Error(`Банк вернул неожиданный ответ: ${raw.slice(0, 200)}`))
                }
            })
        })
        req.on('timeout', () => req.destroy(new Error('Банк не ответил за 30 секунд')))
        req.on('error', reject)
        req.end(body)
    })
}

function terminalKey() {
    const key = process.env.TINKOFF_TERMINAL_KEY || process.env.TINKOFF_TERMINAL_ID
    if (!key) {
        const err = new Error('Не задан TINKOFF_TERMINAL_KEY')
        err.statusCode = 503
        throw err
    }
    return String(key)
}

function terminalPassword() {
    const pass = process.env.TINKOFF_TERMINAL_PASSWORD || process.env.TINKOFF_PASSWORD
    if (!pass) {
        const err = new Error('Не задан TINKOFF_TERMINAL_PASSWORD')
        err.statusCode = 503
        throw err
    }
    return String(pass)
}

/**
 * Запрос к эквайрингу Т‑Банка.
 * @param {string} method — имя метода API (Init, GetState, Cancel, SendClosingReceipt)
 * @param {object} rootFields — скалярные поля корня, по ним считается Token
 * @param {object} [nested] — вложенные объекты (Receipt, Shops): в Token не входят
 */
async function callAcquiring(method, rootFields, nested = {}) {
    const fields = { TerminalKey: terminalKey(), ...rootFields }
    const body = {
        ...fields,
        Token: buildAcquiringRequestToken(fields, terminalPassword()),
        ...nested,
    }

    const data = await postJson(`${ACQUIRING_BASE_PATH}/${method}`, body)
    if (data.Success === false) {
        const parts = [data.Message, data.Details].filter(Boolean).join('. ')
        const err = new Error(parts || `Банк отклонил запрос ${method}`)
        err.statusCode = 400
        err.tinkoffErrorCode = data.ErrorCode
        throw err
    }
    return data
}

module.exports = { callAcquiring, terminalKey }

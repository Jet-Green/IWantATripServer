const logger = require('../logger')

/**
 * Пропускает к вебхуку только запросы с адресов ЮKassa.
 *
 * Список опубликован в их документации; при изменении переопределяется
 * переменной окружения YOOKASSA_WEBHOOK_IPS (через запятую).
 * Это второй рубеж: подлинность платежа всё равно перепроверяется
 * запросом к API, но лишний трафик до базы доходить не должен.
 */
const DEFAULT_RANGES = [
    '185.71.76.0/27',
    '185.71.77.0/27',
    '77.75.153.0/25',
    '77.75.156.11',
    '77.75.156.35',
    '77.75.154.128/25',
    '2a02:5180::/32',
]

function ranges() {
    const fromEnv = String(process.env.YOOKASSA_WEBHOOK_IPS || '').trim()
    if (!fromEnv) return DEFAULT_RANGES
    return fromEnv.split(',').map((s) => s.trim()).filter(Boolean)
}

/** ::ffff:1.2.3.4 → 1.2.3.4 */
function normalize(ip) {
    const value = String(ip || '')
    return value.startsWith('::ffff:') ? value.slice(7) : value
}

function ipv4ToInt(ip) {
    const parts = ip.split('.')
    if (parts.length !== 4) return null
    let result = 0
    for (const part of parts) {
        const octet = Number(part)
        if (!Number.isInteger(octet) || octet < 0 || octet > 255) return null
        result = result * 256 + octet
    }
    return result
}

function matches(ip, range) {
    if (!range.includes('/')) return ip === range

    const [base, bitsRaw] = range.split('/')
    const bits = Number(bitsRaw)

    // IPv6 сверяем только по строковому префиксу: полноценный разбор ради
    // одной подсети избыточен, а ошибиться в нём легко.
    if (base.includes(':')) {
        const prefix = base.replace(/::$/, '')
        return ip.includes(':') && ip.startsWith(prefix)
    }

    const ipInt = ipv4ToInt(ip)
    const baseInt = ipv4ToInt(base)
    if (ipInt === null || baseInt === null || !Number.isInteger(bits)) return false

    const mask = bits === 0 ? 0 : (-1 << (32 - bits)) >>> 0
    return (ipInt & mask) === (baseInt & mask)
}

module.exports = function yookassaIpMiddleware(req, res, next) {
    const ip = normalize(req.ip)

    if (ranges().some((range) => matches(ip, range))) {
        return next()
    }

    logger.warn({ ip, logType: 'yookassa-notification' }, 'уведомление с постороннего адреса отклонено')
    // 200, чтобы не подсказывать отправителю, что фильтр вообще есть.
    return res.status(200).send()
}

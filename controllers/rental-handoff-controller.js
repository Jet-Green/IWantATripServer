const crypto = require('node:crypto')
const Handoff = require('../models/rental-handoff-model')
const User = require('../models/user-model')
const tokenService = require('../service/token-service')
const hash = value => crypto.createHash('sha256').update(value).digest('hex')
const validId = value => typeof value === 'string' && /^[a-f0-9]{24}$/.test(value)
const validToken = value => typeof value === 'string' && /^[a-f0-9]{64}$/.test(value)
function secretMatches(value) {
  const expected = process.env.RENTAL_HANDOFF_SECRET
  return typeof expected === 'string' && expected.length >= 32 && typeof value === 'string' &&
    crypto.timingSafeEqual(Buffer.from(hash(expected)), Buffer.from(hash(value)))
}
exports.issue = async (req, res, next) => {
  try {
    if (!process.env.RENTAL_HANDOFF_SECRET || process.env.RENTAL_HANDOFF_SECRET.length < 32)
      return res.status(503).json({ message: 'Переход в аренду временно недоступен' })
    const { listingId, state } = req.body || {}
    if (!validId(listingId) || !validToken(state)) return res.status(400).json({ message: 'Некорректный переход' })
    // A refresh cookie is accepted only while its server-side session still exists.
    if (!req.headers.authorization && !(await tokenService.findToken(req.cookies?.refreshToken)))
      return res.status(401).json({ message: 'Требуется вход' })
    const user = await User.findById(req.user._id).select('_id').lean()
    if (!user) return res.status(401).json({ message: 'Требуется вход' })
    const code = crypto.randomBytes(32).toString('hex')
    await Handoff.create({ codeHash: hash(code), state, listingId, userId: user._id, expiresAt: new Date(Date.now() + 60000) })
    res.set('Cache-Control', 'no-store')
    const url = new URL('https://rent.gorodaivesi.ru/auth/gorodaivesi/callback')
    url.hash = new URLSearchParams({ code, state }).toString()
    return res.json({ url: url.toString() })
  } catch (error) { next(error) }
}
exports.exchange = async (req, res, next) => {
  try {
    res.set('Cache-Control', 'no-store')
    if (!secretMatches(req.headers['x-rental-handoff-secret'])) return res.status(401).json({ message: 'Unauthorized' })
    const { code, state } = req.body || {}
    if (!validToken(code) || !validToken(state)) return res.status(400).json({ message: 'Invalid exchange' })
    // Atomic consumption; expiry is checked explicitly, independent of Mongo TTL cleanup.
    const entry = await Handoff.findOneAndDelete({ codeHash: hash(code), state, expiresAt: { $gt: new Date() } }).lean()
    if (!entry) return res.status(401).json({ message: 'Переход истёк или уже использован' })
    const user = await User.findById(entry.userId).select('_id email fullname fullinfo.phone').lean()
    if (!user) return res.status(401).json({ message: 'Пользователь не найден' })
    return res.json({ listingId: entry.listingId, user: { _id: String(user._id), email: user.email, fullName: user.fullname, phone: user.fullinfo?.phone } })
  } catch (error) { next(error) }
}

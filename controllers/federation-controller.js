const { FederationCore } = require('../service/federation-core')
const { Flow, Link } = require('../models/federation-models')
const User = require('../models/user-model')
const tokens = require('../service/token-service')
const bcrypt = require('bcryptjs')
const crypto = require('node:crypto')
const core = new FederationCore({
  Flow, Link, peerWeb: 'https://rent.gorodaivesi.ru', peerApi: 'https://api.rent.gorodaivesi.ru/api',
  getUser: id => User.findById(id),
  findMirror: remoteId => User.findOne({ federationOnly: true, federationRemoteId: remoteId }),
  findEmail: email => User.findOne({ email: { $regex: `^${email.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, $options: 'i' } }),
  createMirror: async remote => {
    try { return await User.create({ email: remote.email.toLowerCase().trim(), fullname: remote.fullName || remote.email,
      password: await bcrypt.hash(crypto.randomBytes(32).toString('hex'), 10), roles: ['user'], federationOnly: true, federationRemoteId: remote._id, date: Date.now() }) }
    catch (error) {
      if (error.code !== 11000) throw error
      const winner = await User.findOne({ federationRemoteId: remote._id })
      if (!winner) throw Object.assign(new Error('Войдите в существующий аккаунт этого сайта, чтобы связать его.'), { status: 409, code: 'ACCOUNT_LINK_REQUIRED' })
      return winner
    }
  },
  session: async user => {
    const session = tokens.generateTokens({ _id: String(user._id), email: user.email })
    if (!session.accessToken || !session.refreshToken) throw Object.assign(new Error('Вход временно недоступен'), { status: 503 })
    await tokens.saveToken(user._id, session.refreshToken)
    const publicUser = user.toObject(); delete publicUser.password
    return { user: publicUser, ...session }
  },
})
const cookieOptions = { httpOnly: true, secure: true, sameSite: 'lax', path: '/auth/federation' }
const handler = operation => async (req, res, next) => {
  res.set('Cache-Control', 'no-store')
  try {
    // unique is an index, not a validator: await its creation before first use.
    await Promise.all([Flow.init(), Link.init()])
    await operation(req, res)
  } catch (error) {
    if (error.status) return res.status(error.status).json({ message: error.message, ...(error.code ? { code: error.code } : {}) })
    next(error)
  }
}
const requireSession = async req => {
  const bearer = req.headers.authorization?.startsWith('Bearer ') ? req.headers.authorization.slice(7) : null
  const payload = bearer ? tokens.validateAccessToken(bearer) : tokens.validateRefreshToken(req.cookies?.refreshToken)
  if (!payload?._id || (!bearer && !await tokens.findToken(req.cookies?.refreshToken))) throw Object.assign(new Error('Требуется вход'), { status: 401 })
  return User.findById(payload._id)
}
const respond = (res, data) => { res.clearCookie('givFederation', cookieOptions); res.cookie('refreshToken', data.refreshToken, { maxAge: 30 * 86400000, secure: true, httpOnly: true, sameSite: 'lax' }); return res.json(data) }
exports.start = handler(async (req, res) => { const data = await core.start(req.body?.returnPath); res.cookie('givFederation', data.browser, { ...cookieOptions, maxAge: 300000 }); res.json({ url: data.url }) })
exports.issue = handler(async (req, res) => res.json(await core.issue(req.body?.state, await requireSession(req))))
exports.exchange = handler(async (req, res) => res.json(await core.exchange(req.body?.code, req.body?.state, req.headers['x-rental-handoff-secret'])))
exports.confirm = handler(async (req, res) => res.json(await core.confirm(req.body?.receipt, req.body?.remoteId, req.headers['x-rental-handoff-secret'])))
exports.complete = handler(async (req, res) => respond(res, await core.complete(req.body?.code, req.body?.state, req.cookies?.givFederation)))
exports.link = handler(async (req, res) => {
  // Browser proof is validated before credentials; password never leaves this server.
  await core.checkLink(req.body?.state, req.cookies?.givFederation)
  const email = req.body?.email, password = req.body?.password
  if (typeof email !== 'string' || typeof password !== 'string' || password.length > 256) throw Object.assign(new Error('Проверьте email и пароль'), { status: 400 })
  const user = await User.findOne({ email })
  if (!user || user.federationOnly || !await bcrypt.compare(password, user.password)) throw Object.assign(new Error('Проверьте email и пароль этого сайта'), { status: 401 })
  respond(res, await core.finish(req.body.state, req.cookies.givFederation, user))
})

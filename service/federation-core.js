const crypto = require('node:crypto')
const hash = value => crypto.createHash('sha256').update(value).digest('hex')
const token = value => typeof value === 'string' && /^[a-f0-9]{64}$/.test(value)
const id = value => typeof value === 'string' && /^[a-f0-9]{24}$/.test(value)
const fail = (status, message, code) => { throw Object.assign(new Error(message), { status, code }) }
const safePath = value => {
  if (typeof value !== 'string' || value.length > 2048 || !value.startsWith('/') || /[\\\s#]/.test(value)) return '/'
  try {
    const decoded = decodeURIComponent(value)
    if (/[\\\s]/.test(decoded) || decoded.startsWith('//')) return '/'
    const url = new URL(value, 'https://self.invalid')
    if (url.origin !== 'https://self.invalid' || url.pathname.startsWith('//')) return '/'
    return url.pathname + url.search
  } catch { return '/' }
}
class FederationCore {
  constructor(adapter) { Object.assign(this, adapter) }
  secret() {
    const secret = process.env.RENTAL_HANDOFF_SECRET
    if (!secret || secret.length < 32) fail(503, 'Вход временно недоступен')
    return secret
  }
  async start(returnPath) {
    this.secret()
    const state = crypto.randomBytes(32).toString('hex'), browser = crypto.randomBytes(32).toString('hex')
    await this.Flow.create({ kind: 'pending', state, browserHash: hash(browser), linkAttempts: 0, path: safePath(returnPath), expiresAt: new Date(Date.now() + 300000) })
    return { state, browser, url: `${this.peerWeb}/federation/authorize?state=${state}` }
  }
  async issue(state, user) {
    this.secret()
    if (!token(state) || !user || user.isBlocked) fail(401, 'Требуется вход')
    const code = crypto.randomBytes(32).toString('hex')
    await this.Flow.create({ kind: 'code', codeHash: hash(code), state, userId: String(user._id), expiresAt: new Date(Date.now() + 60000) })
    return { url: `${this.peerWeb}/federation/callback#${new URLSearchParams({ code, state })}` }
  }
  async exchange(code, state, suppliedSecret) {
    if (typeof suppliedSecret !== 'string' || !crypto.timingSafeEqual(Buffer.from(hash(this.secret())), Buffer.from(hash(suppliedSecret)))) fail(401, 'Unauthorized')
    if (!token(code) || !token(state)) fail(400, 'Некорректный переход')
    const entry = await this.Flow.findOneAndDelete({ kind: 'code', codeHash: hash(code), state, expiresAt: { $gt: new Date() } }).lean()
    if (!entry) fail(401, 'Переход истёк или уже использован')
    const user = await this.getUser(entry.userId)
    if (!user || user.isBlocked) fail(401, 'Аккаунт недоступен')
    const receipt = crypto.randomBytes(32).toString('hex')
    await this.Flow.create({ kind: 'receipt', codeHash: hash(receipt), userId: String(user._id), expiresAt: new Date(Date.now() + 300000) })
    return { user: { _id: String(user._id), email: user.email, fullName: user.fullName || user.fullname }, receipt }
  }
  async confirm(receipt, remoteId, suppliedSecret) {
    if (typeof suppliedSecret !== 'string' || !crypto.timingSafeEqual(Buffer.from(hash(this.secret())), Buffer.from(hash(suppliedSecret)))) fail(401, 'Unauthorized')
    if (!token(receipt) || !id(remoteId)) fail(400, 'Некорректная привязка')
    const entry = await this.Flow.findOne({ kind: 'receipt', codeHash: hash(receipt), expiresAt: { $gt: new Date() } }).lean()
    if (!entry) fail(401, 'Подтверждение истекло')
    await this.bind(entry.userId, remoteId)
    return { ok: true }
  }
  browserQuery(state, browser) {
    if (!token(state) || !token(browser)) fail(401, 'Переход открыт в другом браузере или истёк')
    return { kind: 'pending', state, browserHash: hash(browser), expiresAt: { $gt: new Date() } }
  }
  async complete(code, state, browser) {
    const query = this.browserQuery(state, browser)
    if (!token(code)) fail(400, 'Некорректный переход')
    // Claim before the network request: a consumed/uncertain exchange is never retried.
    const pending = await this.Flow.findOneAndUpdate({ ...query, phase: { $exists: false } }, { $set: { phase: 'exchanging' } }, { new: true }).lean()
    if (!pending) fail(401, 'Начните вход заново')
    let remote
    try {
      const response = await fetch(`${this.peerApi}/auth/federation/exchange`, { method: 'POST', redirect: 'error', signal: AbortSignal.timeout(10000), headers: { 'Content-Type': 'application/json', 'X-Rental-Handoff-Secret': this.secret() }, body: JSON.stringify({ code, state }) })
      if (!response.ok) fail(401, 'Переход истёк. Начните вход заново')
      remote = await response.json()
    } catch (error) { fail(error.status || 502, 'Не удалось завершить вход. Начните заново') }
    if (!id(remote?.user?._id) || typeof remote.user.email !== 'string' || remote.user.email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(remote.user.email) || !token(remote.receipt)) fail(401, 'Некорректный ответ сервиса')
    await this.Flow.updateOne(query, { $set: { remote, phase: 'ready' } })
    return this.finish(state, browser)
  }
  async bind(localId, remoteId) {
    try { await this.Link.create({ localId: String(localId), remoteId }) }
    catch (error) {
      if (error.code !== 11000) throw error
      const winner = await this.Link.findOne({ remoteId }).lean()
      if (!winner || winner.localId !== String(localId)) fail(409, 'Аккаунт уже связан с другой учётной записью')
    }
  }
  async resolve(remote, localProof) {
    const remoteId = remote.user._id
    const binding = await this.Link.findOne({ remoteId }).lean()
    if (binding) {
      if (localProof && String(localProof._id) !== binding.localId) fail(409, 'Аккаунт уже связан с другой учётной записью')
      return this.getUser(binding.localId)
    }
    // Recover only a mirror created by this new flow; legacy email-based links are not proof.
    let user = await this.findMirror(remoteId)
    if (localProof && user && String(localProof._id) !== String(user._id)) fail(409, 'Аккаунт уже связан с другой учётной записью')
    if (!user) user = localProof
    if (!user) {
      if (await this.findEmail(remote.user.email)) fail(409, 'Войдите в существующий аккаунт этого сайта, чтобы связать его.', 'ACCOUNT_LINK_REQUIRED')
      user = await this.createMirror(remote.user)
    }
    if (user.isBlocked) fail(401, 'Аккаунт заблокирован')
    await this.bind(user._id, remoteId)
    return user
  }
  async checkLink(state, browser) {
    const entry = await this.Flow.findOneAndUpdate({ ...this.browserQuery(state, browser), phase: 'ready', expectedLocalId: { $exists: true }, linkAttempts: { $lt: 5 } }, { $inc: { linkAttempts: 1 } }, { new: true }).lean()
    if (!entry) fail(401, 'Начните вход заново')
  }
  async finish(state, browser, localProof) {
    const query = this.browserQuery(state, browser)
    const pending = await this.Flow.findOne({ ...query, phase: 'ready' }).lean()
    if (!pending?.remote) fail(401, 'Начните вход заново')
    if (localProof && (!pending.expectedLocalId || String(localProof._id) !== pending.expectedLocalId)) fail(409, 'Подтвердите аккаунт с совпавшей почтой')
    let user
    try { user = await this.resolve(pending.remote, localProof) }
    catch (error) {
      const errorCode = error.code || error.getResponse?.()?.code
      if (errorCode === 'ACCOUNT_LINK_REQUIRED') {
        const expected = await this.findEmail(pending.remote.user.email)
        if (expected) await this.Flow.updateOne({ ...query, expectedLocalId: { $exists: false } }, { $set: { expectedLocalId: String(expected._id) } })
      }
      throw error
    }
    if (!user || user.isBlocked) fail(401, 'Аккаунт недоступен')
    const confirmed = await fetch(`${this.peerApi}/auth/federation/confirm`, { method: 'POST', redirect: 'error', signal: AbortSignal.timeout(10000), headers: { 'Content-Type': 'application/json', 'X-Rental-Handoff-Secret': this.secret() }, body: JSON.stringify({ receipt: pending.remote.receipt, remoteId: String(user._id) }) })
    if (!confirmed.ok) fail(409, 'Не удалось связать аккаунты. Начните вход заново')
    const consumed = await this.Flow.findOneAndDelete({ ...query, phase: 'ready' }).lean()
    if (!consumed) fail(401, 'Переход уже использован')
    return { ...await this.session(user), path: pending.path }
  }
}
module.exports = { FederationCore, safePath }

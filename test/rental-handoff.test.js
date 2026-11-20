const { test } = require('node:test')
const assert = require('node:assert/strict')
const fs = require('node:fs')
const vm = require('node:vm')
const crypto = require('node:crypto')
function fixture() {
  let stored
  const id = 'a'.repeat(24)
  const user = { _id: id, email: 'fixture@example.test', fullname: 'Fixture' }
  const model = {
    create: async value => { stored = value },
    findOneAndDelete: query => ({ lean: async () => {
      if (!stored || query.codeHash !== stored.codeHash || query.state !== stored.state || stored.expiresAt <= query.expiresAt.$gt) return null
      const result = stored; stored = null; return result
    } }),
  }
  const exports = {}
  vm.runInNewContext(fs.readFileSync(require.resolve('../controllers/rental-handoff-controller'), 'utf8'), {
    exports, require: name => name === 'node:crypto' ? crypto : name.includes('rental-handoff-model') ? model : name.includes('user-model') ? { findById: () => ({ select: () => ({ lean: async () => user }) }) } : { findToken: async () => null },
    process: { env: { RENTAL_HANDOFF_SECRET: 'test-secret-'.repeat(4) } }, Buffer, URL, URLSearchParams, Date,
  })
  const response = () => ({ statusCode: 200, set() {}, status(code) { this.statusCode = code; return this }, json(body) { this.body = body; return this } })
  return { exports, response, id, state: 'b'.repeat(64), expire: () => { stored.expiresAt = new Date(0) } }
}
test('one-time exchange is state-bound, secret-bound and returns stable identity only', async () => {
  const f = fixture(), res = f.response()
  await f.exports.issue({ body: { listingId: f.id, state: f.state }, headers: { authorization: 'Bearer fixture' }, user: { _id: f.id } }, res, assert.fail)
  const url = new URL(res.body.url)
  assert.equal(url.origin, 'https://rent.gorodaivesi.ru'); assert.equal(url.search, '')
  const code = new URLSearchParams(url.hash.slice(1)).get('code')
  const request = { body: { code, state: f.state }, headers: { 'x-rental-handoff-secret': 'test-secret-'.repeat(4) } }
  const bad = f.response(); await f.exports.exchange({ ...request, headers: {} }, bad, assert.fail); assert.equal(bad.statusCode, 401)
  const wrong = f.response(); await f.exports.exchange({ ...request, body: { code, state: 'c'.repeat(64) } }, wrong, assert.fail); assert.equal(wrong.statusCode, 401)
  const good = f.response(); await f.exports.exchange(request, good, assert.fail); assert.equal(good.body.user._id, f.id); assert.equal(good.body.listingId, f.id)
  assert.deepEqual(Object.keys(good.body.user).sort(), ['_id', 'email', 'fullName', 'phone'])
  const replay = f.response(); await f.exports.exchange(request, replay, assert.fail); assert.equal(replay.statusCode, 401)
})
test('expired code rejected even before Mongo TTL cleanup; invalid destination rejected', async () => {
  const f = fixture(), res = f.response()
  await f.exports.issue({ body: { listingId: 'https://evil.test', state: f.state }, headers: {} }, res, assert.fail); assert.equal(res.statusCode, 400)
  const issued = f.response(); await f.exports.issue({ body: { listingId: f.id, state: f.state }, headers: { authorization: 'fixture' }, user: { _id: f.id } }, issued, assert.fail)
  const code = new URLSearchParams(new URL(issued.body.url).hash.slice(1)).get('code'); f.expire()
  const expired = f.response(); await f.exports.exchange({ body: { code, state: f.state }, headers: { 'x-rental-handoff-secret': 'test-secret-'.repeat(4) } }, expired, assert.fail); assert.equal(expired.statusCode, 401)
})

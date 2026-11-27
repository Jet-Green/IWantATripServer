const { test } = require('node:test')
const assert = require('node:assert/strict')
const { FederationCore, safePath } = require('../service/federation-core')
function model(unique = []) {
  const rows = []
  const match = (row, query) => Object.entries(query).every(([key, value]) => {
    if (value && typeof value === 'object' && !(value instanceof Date)) return Object.entries(value).every(([op, bound]) => op === '$exists' ? (row[key] !== undefined) === bound : op === '$gt' ? row[key] > bound : op === '$lt' ? row[key] < bound : false)
    return row[key] === value
  })
  const result = get => ({ lean: async () => { const row = get(); return row ? structuredClone(row) : null } })
  return { rows,
    async create(row) { if (unique.some(key => row[key] !== undefined && rows.some(r => r[key] === row[key]))) throw Object.assign(Error('duplicate'), { code: 11000 }); rows.push(structuredClone(row)); return row },
    findOne: query => result(() => rows.find(row => match(row, query))),
    findOneAndDelete: query => result(() => { const index = rows.findIndex(row => match(row, query)); return index < 0 ? null : rows.splice(index, 1)[0] }),
    findOneAndUpdate: (query, update) => result(() => { const row = rows.find(row => match(row, query)); if (row) { Object.assign(row, update.$set || {}); for (const [key, value] of Object.entries(update.$inc || {})) row[key] = (row[key] || 0) + value } return row }),
    async updateOne(query, update) { const row = rows.find(row => match(row, query)); if (row) Object.assign(row, update.$set || {}) },
  }
}
function system() {
  const usersA = [{ _id: 'a'.repeat(24), email: 'native@example.test', fullName: 'Native', roles: ['admin'] }], usersB = []
  function side(users, name, peer) {
    return new FederationCore({ Flow: model(['codeHash']), Link: model(['localId', 'remoteId']), peerWeb: `https://${peer}.test`, peerApi: `https://${peer}.test`,
      getUser: async id => users.find(user => user._id === id), findEmail: async email => users.find(user => user.email === email),
      findMirror: async remoteId => users.find(user => user.federationOnly && user.remoteId === remoteId),
      createMirror: async remote => { const user = { _id: name.repeat(24), email: remote.email, roles: ['user'], federationOnly: true, remoteId: remote._id }; users.push(user); return user },
      session: async user => ({ user, accessToken: 'local-only' }),
    })
  }
  const a = side(usersA, 'a', 'b'), b = side(usersB, 'b', 'a')
  const previous = global.fetch, secret = process.env.RENTAL_HANDOFF_SECRET
  process.env.RENTAL_HANDOFF_SECRET = 'fixture-secret-'.repeat(4)
  let calls = 0
  global.fetch = async (url, options) => {
    calls++; const core = url.startsWith('https://a.test') ? a : b, data = JSON.parse(options.body)
    try {
      const body = url.endsWith('/exchange') ? await core.exchange(data.code, data.state, options.headers['X-Rental-Handoff-Secret']) : await core.confirm(data.receipt, data.remoteId, options.headers['X-Rental-Handoff-Secret'])
      return { ok: true, json: async () => body }
    } catch (error) { return { ok: false, status: error.status } }
  }
  return { a, b, usersA, usersB, calls: () => calls, close() { global.fetch = previous; if (secret === undefined) delete process.env.RENTAL_HANDOFF_SECRET; else process.env.RENTAL_HANDOFF_SECRET = secret } }
}
async function begin(source, target, user, path = '/cabinet') {
  const pending = await target.start(path), issued = await source.issue(pending.state, user)
  const code = new URLSearchParams(new URL(issued.url).hash.slice(1)).get('code')
  return { ...pending, code }
}
test('forward and reverse preserve original IDs; both links fixed before local session; roles stay local', async () => {
  const f = system(); try {
    const p = await begin(f.a, f.b, f.usersA[0], '/rental-item/abc?unitsNeeded=2')
    const data = await f.b.complete(p.code, p.state, p.browser)
    assert.equal(data.path, '/rental-item/abc?unitsNeeded=2'); assert.deepEqual(data.user.roles, ['user'])
    assert.equal(f.a.Link.rows[0].remoteId, data.user._id)
    const reverse = await begin(f.b, f.a, data.user)
    const back = await f.a.complete(reverse.code, reverse.state, reverse.browser)
    assert.equal(back.user._id, f.usersA[0]._id); assert.deepEqual(back.user.roles, ['admin']); assert.equal(f.usersA.length, 1)
  } finally { f.close() }
})
test('wrong browser, repeat completion, and parallel completion cannot mint extra sessions', async () => {
  const f = system(); try {
    const p = await begin(f.a, f.b, f.usersA[0])
    await assert.rejects(f.b.complete(p.code, p.state, 'f'.repeat(64))); assert.equal(f.calls(), 0)
    const results = await Promise.allSettled([f.b.complete(p.code, p.state, p.browser), f.b.complete(p.code, p.state, p.browser)])
    assert.equal(results.filter(r => r.status === 'fulfilled').length, 1)
    await assert.rejects(f.b.complete(p.code, p.state, p.browser)); assert.equal(f.calls(), 2)
  } finally { f.close() }
})
test('email collision requires exact target password proof and allows at most five local attempts', async () => {
  const f = system(); try {
    const local = { _id: 'c'.repeat(24), email: f.usersA[0].email, roles: ['business'] }; f.usersB.push(local)
    const p = await begin(f.a, f.b, f.usersA[0])
    await assert.rejects(f.b.complete(p.code, p.state, p.browser), e => e.code === 'ACCOUNT_LINK_REQUIRED')
    await assert.rejects(f.b.finish(p.state, p.browser, { _id: 'd'.repeat(24) }))
    await f.b.checkLink(p.state, p.browser)
    const linked = await f.b.finish(p.state, p.browser, local); assert.equal(linked.user._id, local._id); assert.deepEqual(linked.user.roles, ['business'])
    const p2 = await begin(f.a, f.b, f.usersA[0]); f.b.Flow.rows.find(row => row.state === p2.state).expectedLocalId = local._id; f.b.Flow.rows.find(row => row.state === p2.state).phase = 'ready'
    for (let i = 0; i < 5; i++) await f.b.checkLink(p2.state, p2.browser)
    await assert.rejects(f.b.checkLink(p2.state, p2.browser))
  } finally { f.close() }
})
test('unknown exchange outcome is claimed once and never automatically retried', async () => {
  const f = system(); try {
    const p = await begin(f.a, f.b, f.usersA[0]); let calls = 0
    global.fetch = async () => { calls++; throw Error('unknown') }
    await assert.rejects(f.b.complete(p.code, p.state, p.browser)); await assert.rejects(f.b.complete(p.code, p.state, p.browser)); assert.equal(calls, 1)
  } finally { f.close() }
})
test('fresh flow recovers a mirror after partial failure before reciprocal confirmation', async () => {
  const f = system(); try {
    const p = await begin(f.a, f.b, f.usersA[0]), fetch = global.fetch
    global.fetch = async (url, options) => url.endsWith('/confirm') ? Promise.reject(Error('timeout')) : fetch(url, options)
    await assert.rejects(f.b.complete(p.code, p.state, p.browser)); assert.equal(f.usersB.length, 1)
    global.fetch = fetch
    const retry = await begin(f.a, f.b, f.usersA[0]); const data = await f.b.complete(retry.code, retry.state, retry.browser)
    assert.equal(data.user._id, f.usersB[0]._id); assert.equal(f.usersB.length, 1)
  } finally { f.close() }
})
test('receipt and code expire and require backend secret; return paths remain on local host', async () => {
  const f = system(); try {
    const p = await begin(f.a, f.b, f.usersA[0]); await assert.rejects(f.a.exchange(p.code, p.state, 'wrong'))
    f.a.Flow.rows[0].expiresAt = new Date(0); await assert.rejects(f.a.exchange(p.code, p.state, process.env.RENTAL_HANDOFF_SECRET))
    for (const value of ['//evil.test', '/\\evil.test', '/%2f%2fevil.test', '/%0aevil.test', 'https://evil.test', '/a/..//evil.test']) assert.equal(safePath(value), '/')
    assert.equal(safePath('/cabinet?tab=booking'), '/cabinet?tab=booking')
  } finally { f.close() }
})

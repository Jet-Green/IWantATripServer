const { test } = require('node:test')
const assert = require('node:assert/strict')
const vm = require('node:vm')
const fs = require('node:fs')
function fixture() {
  const calls = []
  const mirror = { _id: 'a'.repeat(24), email: 'fixture@example.test', federationOnly: true }
  const model = {
    findOneAndUpdate(query, update) { calls.push({ query, update }); return { populate() { return { exec: async () => mirror } } } },
    findOne() { return { then: cb => Promise.resolve(mirror).then(cb), populate() { return { populate() { return { exec: async () => mirror } } } } } },
  }
  const api = { BadRequest: message => Error(message) }, module = { exports: {} }
  vm.runInNewContext(fs.readFileSync(require.resolve('../service/user-service'), 'utf8'), {
    module, require: name => name === '../models/user-model' ? model : name.includes('api-error') ? api : {},
    process: { env: {} }, Date, Object,
  })
  return { service: module.exports, calls }
}
test('profile update cannot write federation authority, VK credentials or Mongo operators', async () => {
  const f = fixture()
  await f.service.update({ email: 'fixture@example.test', userLocation: { city: 'Fixture' }, federationOnly: false,
    federationRemoteId: 'bad', password: 'bad', vkId: 123, roles: ['admin'], _id: 'bad',
    $set: { federationOnly: false }, $unset: { federationRemoteId: true }, 'federationRemoteId.x': 'bad' })
  assert.deepEqual(JSON.parse(JSON.stringify(f.calls)), [{ query: { email: 'fixture@example.test' }, update: { $set: { userLocation: { city: 'Fixture' } } } }])
  await assert.rejects(f.service.update({ email: { $ne: null }, userLocation: {} }))
})
test('federation-only mirror cannot obtain a native password or implicit native login', async () => {
  const f = fixture()
  await assert.rejects(f.service.login('fixture@example.test', 'secret'), /не найден/)
  await assert.rejects(f.service.sendResetLink('fixture@example.test'), /не найден/)
})

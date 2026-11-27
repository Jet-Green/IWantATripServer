const { Schema, model } = require('mongoose')
const flow = new Schema({
  kind: String, state: String, browserHash: String, codeHash: String, userId: String,
  path: String, phase: String, expectedLocalId: String, linkAttempts: Number, remote: Schema.Types.Mixed,
  expiresAt: { type: Date, required: true, expires: 0 },
})
flow.index({ kind: 1, state: 1 })
flow.index({ codeHash: 1 }, { unique: true, sparse: true })
const link = new Schema({ localId: { type: String, required: true, unique: true }, remoteId: { type: String, required: true, unique: true } }, { timestamps: true })
module.exports = { Flow: model('FederationFlow', flow), Link: model('FederationLink', link) }

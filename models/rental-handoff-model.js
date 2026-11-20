const { Schema, model } = require('mongoose')
const schema = new Schema({
  codeHash: { type: String, required: true, unique: true },
  state: { type: String, required: true },
  listingId: { type: String, required: true },
  userId: { type: Schema.Types.ObjectId, required: true },
  expiresAt: { type: Date, required: true, expires: 0 },
})
module.exports = model('RentalHandoff', schema)

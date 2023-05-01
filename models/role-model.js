const { Schema, model } = require('mongoose');

// user, mamnger, admin
const RoleSchema = new Schema({
    value: { type: String, default: "user", unique: true },
})

module.exports = model('Role', RoleSchema);
const { Schema, model } = require('mongoose');

const UserSchema = new Schema({
    email: { type: String, unique: true, required: true },
    password: { type: String, required: true },
    fullname: { type: String, required: true },
    fullinfo: {
        type: Object,
        default: {}
    },
    trips: { type: Array },
    guideElements: { type: Array }
})

module.exports = model('User', UserSchema);
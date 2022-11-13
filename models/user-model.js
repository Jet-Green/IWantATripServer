const { Schema, model } = require('mongoose');

const UserSchema = new Schema({
    email: { type: String, unique: true, required: true },
    password: { type: String, required: true },
    fullinfo: {
        type: Object
    },
    fullname: {
        type: String, required: true
    },
    trips: { type: Array },
    guideElements: { type: Array }
})

module.exports = model('User', UserSchema);
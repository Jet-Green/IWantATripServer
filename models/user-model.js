const { Schema, model } = require('mongoose');

const UserSchema = new Schema({
    email: { type: String, unique: true, required: true },
    password: { type: String, required: true },
    fullinfo: {},
    fullname: {
        type: String, required: true
    },
    trips: ['hgfyufdgshuifghiagfdhifgadihfd', 'gfajhguyfdjhkfgahjfdgafdgjkh'],
    guideElements: ['dfsjfdskjldfsjlkjdksfjkfgds', 'sdjklfjskglkjlfgjklfdgjklfg']
})

module.exports = model('User', UserSchema);
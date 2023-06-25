const { Schema, model } = require('mongoose')

const AppStateSchema = new Schema({
    mainPageMessage: [{ type: String, default: '' }],
    tripType: [String ],
})

module.exports = model('AppState', AppStateSchema);

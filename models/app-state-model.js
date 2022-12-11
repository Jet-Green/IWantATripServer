const { Schema, model } = require('mongoose')

const AppStateSchema = new Schema({
    mainPageMessage: [{ type: String, default: '' }],
})

module.exports = model('AppState', AppStateSchema);

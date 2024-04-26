const { Schema, model } = require('mongoose');

const IdeaSchema = new Schema({
    topic: String,
    offer: String,
    date: String,
    tripRoute: String,
    maxPeople: String,
    description: String,
    author: { type: Schema.Types.ObjectId, ref: 'User' }
})

module.exports = model('Idea', IdeaSchema);
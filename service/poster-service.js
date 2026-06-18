const mongoose = require('mongoose')
const { Schema } = require('mongoose')

const conn = mongoose.createConnection(process.env.POSTERS_DB_URL);
conn.on('error', (err) => {
    console.error('[poster-service] MongoDB connection error:', err.message);
});

const PostersModel = conn.model('Poster', new Schema({
    image: { type: String },
    title: { type: String },
    eventLocation: { type: Object },
    site: { type: String },
    organizer: { type: String },
    phone: { type: String },
    email: { type: String },
    date: { type: Number },
    workingTime: { type: String },
    eventType: { type: String },
    isModerated: { type: Boolean, default: false },
}));

module.exports = {
    async getAll() {
        return await PostersModel.find({});
    }
}
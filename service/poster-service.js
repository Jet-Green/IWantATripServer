const mongoose = require('mongoose')
const {Schema} = require('mongoose')

const conn = mongoose.createConnection(process.env.POSTERS_DB_URL);
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

module.exports = conn;

module.exports = {
    async getAll() {
        try {
            console.log(await PostersModel.find({}))
            return PostersModel.find({})
        } catch (error) {
            handleError(error);
        }
    }
}
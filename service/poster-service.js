const mongoose = require('mongoose')

const connection = mongoose.createConnection(process.env.POSTERS_DB_URL);
const PostersModel = connection.model('Poster', PosterSchema);

module.exports = {
    async getAll() {
        console.log(await PostersModel.find({}))
        return PostersModel.find({})

    }
}
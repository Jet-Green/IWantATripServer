const nodemailer = require('nodemailer')

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: 'qbit.mailing@gmail.com',
        pass: 'tepsqmfkghmfqfyg'
    }
}, { from: 'Григорий Дзюин <qbit.mailing@gmail.com>' })

module.exports = transporter
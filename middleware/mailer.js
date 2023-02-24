const nodemailer = require('nodemailer')
const Handlebars = require('handlebars')

const _ = require('lodash')

const fs = require('fs')
const path = require('path')

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: 'qbit.mailing@gmail.com',
        pass: 'tepsqmfkghmfqfyg'
    }
}, { from: 'Григорий Дзюин <qbit.mailing@gmail.com>' })

module.exports = {
    async sendMail(data, templateName, emails = []) {
        let emailTemplateSource = fs.readFileSync(path.join('templates', templateName)).toString()

        const template = Handlebars.compile(emailTemplateSource)

        const htmlToSend = template(data)

        let details = {
            from: 'qbit.mailing@gmail.com',
            to: _.uniq(['grishadzyin@gmail.com', 'grachevrv@yandex.ru', ...emails]),
            subject: 'Создана поездка',
            html: htmlToSend,
        }

        let r = await transporter.sendMail(details)
    }
}